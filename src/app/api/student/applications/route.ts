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
    const status = searchParams.get("status") || ""
    const jobTitle = searchParams.get("jobTitle") || ""
    const company = searchParams.get("company") || ""
    const jobId = searchParams.get("jobId") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""
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

    // Build base filter query for user's applications
    const baseFilterQuery = {
      $or: [
        { candidateId: new ObjectId(userId) },
        { studentId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    }

    // Get all applications for this user first (we'll filter by job details later)
    const allUserApplications = await db
      .collection("job_applications")
      .find(baseFilterQuery)
      .sort({ appliedDate: -1 })
      .toArray()

    // Get job details for each application and apply filters
    const applicationsWithJobDetails = await Promise.all(
      allUserApplications.map(async (application) => {
        try {
          const job = await db.collection("jobs").findOne({ _id: new ObjectId(application.jobId) })

          return {
            ...application,
            job: job
              ? {
                  _id: job._id,
                  jobTitle: job.jobTitle || "Unknown Job",
                  companyName: job.companyName || "Unknown Company",
                  jobLocation: job.jobLocation || "Unknown Location",
                  jobType: job.jobType || "Unknown Type",
                }
              : {
                  _id: null,
                  jobTitle: "Unknown Job",
                  companyName: "Unknown Company",
                  jobLocation: "Unknown Location",
                  jobType: "Unknown Type",
                },
            userCollection,
          }
        } catch (error) {
          console.error(`Error fetching job details for application ${application._id}:`, error)
          return {
            ...application,
            job: {
              _id: null,
              jobTitle: "Unknown Job",
              companyName: "Unknown Company",
              jobLocation: "Unknown Location",
              jobType: "Unknown Type",
            },
            userCollection,
          }
        }
      }),
    )

    // Apply filters to the applications with job details
    let filteredApplications = applicationsWithJobDetails

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredApplications = filteredApplications.filter((app: any) => {
        return (
          app.job.jobTitle.toLowerCase().includes(searchLower) ||
          app.job.companyName.toLowerCase().includes(searchLower) ||
          app.jobId.toString().toLowerCase().includes(searchLower) ||
          app._id.toString().toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply location filter
    if (location) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.job.jobLocation.toLowerCase().includes(location.toLowerCase())
      )
    }

    // Apply status filter
    if (status) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.status.toLowerCase() === status.toLowerCase()
      )
    }

    // Apply job title filter
    if (jobTitle) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.job.jobTitle.toLowerCase().includes(jobTitle.toLowerCase())
      )
    }

    // Apply company filter
    if (company) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.job.companyName.toLowerCase().includes(company.toLowerCase())
      )
    }

    // Apply job ID filter
    if (jobId) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.jobId.toString().toLowerCase().includes(jobId.toLowerCase())
      )
    }

    // Apply date range filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filteredApplications = filteredApplications.filter((app: any) => {
        const appliedDate = new Date(app.appliedDate)
        return appliedDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filteredApplications = filteredApplications.filter((app: any) => {
        const appliedDate = new Date(app.appliedDate)
        return appliedDate <= toDate
      })
    }

    // Apply recent applications filter (last 7 days)
    if (recentOnly) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      filteredApplications = filteredApplications.filter((app: any) => {
        const appliedDate = new Date(app.appliedDate)
        return appliedDate >= sevenDaysAgo
      })
    }

    // Get total count for pagination
    const totalApplications = filteredApplications.length

    // Apply pagination
    const paginatedApplications = filteredApplications.slice(skip, skip + validLimit)

    // Calculate pagination info
    const totalPages = Math.ceil(totalApplications / validLimit)
    const hasNextPage = validPage < totalPages
    const hasPrevPage = validPage > 1

    // Log the applications data for debugging
    console.log(`Found ${paginatedApplications.length} applications for user ${userId} from ${userCollection} (${totalApplications} total, page ${validPage}/${totalPages})`)

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { 
        success: true, 
        applications: paginatedApplications, 
        pagination: {
          currentPage: validPage,
          totalPages,
          totalApplications,
          hasNextPage,
          hasPrevPage,
          limit: validLimit,
        },
        userCollection 
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching user applications:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch applications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { jobId, coverLetter } = await request.json()

    if (!jobId) {
      return NextResponse.json({ success: false, message: "Job ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if job exists
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 })
    }

    // Check if user has already applied to this job (check multiple field names)
    const existingApplication = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { candidateId: new ObjectId(userId) },
        { studentId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    if (existingApplication) {
      return NextResponse.json({ success: false, message: "You have already applied to this job" }, { status: 400 })
    }

    // Create new application with appropriate user reference
    const newApplication = {
      // Use the appropriate field based on user collection
      ...(userCollection === "students" ? { studentId: new ObjectId(userId) } : { candidateId: new ObjectId(userId) }),
      // Also add a generic applicantId for easier querying
      applicantId: new ObjectId(userId),
      applicantCollection: userCollection, // Track which collection the user is from

      jobId: new ObjectId(jobId),
      status: "applied",
      appliedDate: new Date(),
      coverLetter: coverLetter || "",
      history: [
        {
          status: "applied",
          date: new Date(),
          note: "Application submitted",
        },
      ],
      // Include basic user info for easier querying
      studentName: [user.salutation, user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || "Unknown",
      studentEmail: user.email || "",
      // Include employer ID for isolation
      employerId: job.employerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("job_applications").insertOne(newApplication)

    // Update job with applicant count
    await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } })

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: result.insertedId,
        userCollection,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ success: false, message: "Failed to submit application" }, { status: 500 })
  }
}
