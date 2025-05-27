import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const applicationId = params.id

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

    // Find application by ID and ensure it belongs to the current user (check multiple field names)
    const application = await db.collection("job_applications").findOne({
      _id: new ObjectId(applicationId),
      $or: [
        { candidateId: new ObjectId(userId) },
        { studentId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Get job details
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(application.jobId) })

    // Add job details to application
    const applicationWithJobDetails = {
      ...application,
      job: job
        ? {
            jobTitle: job.jobTitle || "Unknown Job",
            companyName: job.companyName || "Unknown Company",
            jobLocation: job.jobLocation || "Unknown Location",
            jobType: job.jobType || "Unknown Type",
            experienceRange: job.experienceRange,
            salaryRange: job.salaryRange,
            skills: job.skills,
          }
        : {
            jobTitle: "Unknown Job",
            companyName: "Unknown Company",
            jobLocation: "Unknown Location",
            jobType: "Unknown Type",
          },
      userCollection, // Include for debugging
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, application: applicationWithJobDetails },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching application details:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch application details" }, { status: 500 })
  }
}
