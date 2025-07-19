import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get job data from request body
    const jobData = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to verify
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Create new job with employee ID
    const newJob = {
      ...jobData,
      employerId: new ObjectId(userId), // Add employer ID for isolation
      companyName: employee.companyName || "Unknown Company",
      applicants: 0,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert job into database
    const result = await db.collection("jobs").insertOne(newJob)

    return NextResponse.json(
      {
        success: true,
        message: "Job created successfully",
        jobId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json({ success: false, message: "Failed to create job" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const location = searchParams.get("location") || ""
    const jobType = searchParams.get("jobType") || ""

    // Check if user is an employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (employee) {
      // If employee, return jobs created by this employee
      const query: any = { employerId: new ObjectId(userId) }

      // Add search filter
      if (search) {
        query.$or = [
          { jobTitle: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { jobLocation: { $regex: search, $options: "i" } },
          { skills: { $in: [new RegExp(search, "i")] } }
        ]
      }

      const jobs = await db
        .collection("jobs")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()

      // Add cache control headers to prevent caching
      const headers = new Headers()
      headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
      headers.append("Pragma", "no-cache")
      headers.append("Expires", "0")

      return NextResponse.json(
        { success: true, jobs },
        {
          status: 200,
          headers: headers,
        },
      )
    }

    // Check if user exists in either students or candidates collection
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Build query for students/candidates
    const query: any = {
      status: { $in: ["open", "active"] },
    }

    // Add search filter
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { jobLocation: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } }
      ]
    }

    // Add location filter
    if (location) {
      query.jobLocation = { $regex: location, $options: "i" }
    }

    // Add job type filter
    if (jobType) {
      query.jobType = { $regex: jobType, $options: "i" }
    }

    // Fetch all active jobs for students/candidates
    const jobs = await db
      .collection("jobs")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // For each job, check if the current user has applied
    const jobsWithApplicationStatus = await Promise.all(
      jobs.map(async (job) => {
        // Check if user has applied to this job from either collection
        const application = await db.collection("job_applications").findOne({
          jobId: job._id,
          $or: [
            { studentId: new ObjectId(userId) },
            { candidateId: new ObjectId(userId) },
            { applicantId: new ObjectId(userId) },
          ],
        })

        return {
          ...job,
          hasApplied: !!application,
          applicationId: application?._id || null,
          applicationStatus: application?.status || null,
          appliedAt: application?.appliedAt || application?.appliedDate || null,
        }
      }),
    )

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        jobs: jobsWithApplicationStatus,
        userCollection, // Include this for debugging
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch jobs" }, { status: 500 })
  }
}
