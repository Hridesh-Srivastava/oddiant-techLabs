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

    // Connect to database
    const { db } = await connectToDatabase()

    // Find student to verify
    const student = await db.collection("students").findOne({ _id: new ObjectId(userId) })

    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 })
    }

    // Find all job applications for this student
    const applications = await db
      .collection("job_applications")
      .find({ candidateId: new ObjectId(userId) })
      .sort({ appliedDate: -1 })
      .toArray()

    // Get job details for each application
    const applicationsWithJobDetails = await Promise.all(
      applications.map(async (application) => {
        const job = await db.collection("jobs").findOne({ _id: new ObjectId(application.jobId) })

        return {
          ...application,
          job: {
            jobTitle: job?.jobTitle || "Unknown Job",
            companyName: job?.companyName || "Unknown Company",
            jobLocation: job?.jobLocation || "Unknown Location",
            jobType: job?.jobType || "Unknown Type",
          },
        }
      }),
    )

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, applications: applicationsWithJobDetails },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching student applications:", error)
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

    // Check if student has already applied to this job
    const existingApplication = await db.collection("job_applications").findOne({
      candidateId: new ObjectId(userId),
      jobId: new ObjectId(jobId),
    })

    if (existingApplication) {
      return NextResponse.json({ success: false, message: "You have already applied to this job" }, { status: 400 })
    }

    // Create new application
    const newApplication = {
      candidateId: new ObjectId(userId),
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("job_applications").insertOne(newApplication)

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ success: false, message: "Failed to submit application" }, { status: 500 })
  }
}
