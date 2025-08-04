import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "6")
    const search = searchParams.get("search") || ""
    const location = searchParams.get("location") || ""
    const jobType = searchParams.get("jobType") || ""
    const recentOnly = searchParams.get("recentOnly") === "true"

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(100, Math.max(1, limit)) // Max 100 items per page
    const skip = (validPage - 1) * validLimit

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Build filter query
    const filterQuery: any = {
      status: { $in: ["open", "active"] },
    }

    // Add search filter
    if (search) {
      // Check if search term looks like an ObjectId (24 character hex string)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search)
      
      if (isObjectId) {
        // If it's a valid ObjectId, search by exact _id match
        try {
          filterQuery.$or = [
            { jobTitle: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
            { skills: { $regex: search, $options: "i" } },
            { _id: new ObjectId(search) }, // Exact ObjectId match
          ]
        } catch (error) {
          // If ObjectId creation fails, fall back to regex search
          filterQuery.$or = [
            { jobTitle: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
            { skills: { $regex: search, $options: "i" } },
          ]
        }
      } else {
        // If it's not an ObjectId, search by text fields only
        filterQuery.$or = [
          { jobTitle: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { skills: { $regex: search, $options: "i" } },
        ]
      }
    }

    // Add location filter
    if (location) {
      filterQuery.jobLocation = { $regex: location, $options: "i" }
    }

    // Add job type filter
    if (jobType) {
      filterQuery.jobType = { $regex: jobType, $options: "i" }
    }

    // Add recent jobs filter (last 7 days)
    if (recentOnly) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      // Simple approach: just check if createdAt is greater than or equal to 7 days ago
      const dateFilter = { createdAt: { $gte: sevenDaysAgo } }
      
      // If there's already a search filter, use $and to combine them
      if (filterQuery.$or) {
        filterQuery.$and = [
          { $or: filterQuery.$or },
          dateFilter
        ]
        delete filterQuery.$or
      } else {
        // No search filter, just use the date filter
        filterQuery.createdAt = dateFilter.createdAt
      }
      
      // Debug: Log the date filter (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log("Recent jobs filter:", {
          sevenDaysAgo: sevenDaysAgo.toISOString(),
          finalFilterQuery: filterQuery
        })
      }
    }

    // Get total count for pagination
    const totalJobs = await db.collection("jobs").countDocuments(filterQuery)
    
    // Debug: Log search parameters and results (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log("Search debug:", {
        search,
        isObjectId: search ? /^[0-9a-fA-F]{24}$/.test(search) : false,
        filterQuery,
        totalJobs,
        recentOnly
      })
      
      // Debug: Check what jobs exist in the database
      if (recentOnly) {
        const allJobs = await db.collection("jobs").find({}).sort({ createdAt: -1 }).limit(5).toArray()
        console.log("Recent jobs debug - All jobs (last 5):", allJobs.map(job => ({
          _id: job._id,
          jobTitle: job.jobTitle,
          createdAt: job.createdAt,
          createdAtType: typeof job.createdAt
        })))
      }
    }

    // Get paginated jobs
    const jobs = await db
      .collection("jobs")
      .find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .toArray()

    // For each job, calculate days left and check if user has already applied
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        // Calculate days left (30 days from creation by default)
        const creationDate = job.createdAt ? new Date(job.createdAt) : new Date()
        const expiryDate = new Date(creationDate)
        expiryDate.setDate(expiryDate.getDate() + 30)
        const today = new Date()
        const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

        // Check if user has already applied (check multiple field names for compatibility)
        const application = await db.collection("job_applications").findOne({
          jobId: new ObjectId(job._id.toString()),
          $or: [
            { candidateId: new ObjectId(userId) },
            { studentId: new ObjectId(userId) },
            { applicantId: new ObjectId(userId) },
          ],
        })

        return {
          ...job,
          daysLeft,
          hasApplied: !!application,
          applicationId: application?._id || null,
          applicationStatus: application?.status || null,
          appliedAt: application?.appliedAt || application?.appliedDate || null,
        }
      }),
    )

    // Calculate pagination info
    const totalPages = Math.ceil(totalJobs / validLimit)
    const hasNextPage = validPage < totalPages
    const hasPrevPage = validPage > 1

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        jobs: jobsWithDetails,
        pagination: {
          currentPage: validPage,
          totalPages,
          totalJobs,
          hasNextPage,
          hasPrevPage,
          limit: validLimit,
        },
        userCollection, // Include for debugging
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching available jobs:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch available jobs" }, { status: 500 })
  }
}
