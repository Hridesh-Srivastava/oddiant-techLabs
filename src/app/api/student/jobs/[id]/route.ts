import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params as they're now Promise-based in Next.js 15
    const params = await context.params
    
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ success: false, message: "Job ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

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

    // Fetch job details
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // Check if user has applied for this job
    const application = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { studentId: new ObjectId(userId) },
        { candidateId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    // Add application status to job details
    const jobWithApplicationStatus = {
      ...job,
      hasApplied: !!application,
      applicationId: application?._id || null,
      applicationStatus: application?.status || null,
      appliedAt: application?.appliedAt || application?.appliedDate || null,
      userCollection, // Include for debugging
    }

    return NextResponse.json(
      {
        success: true,
        job: jobWithApplicationStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching job details:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch job details" }, { status: 500 })
  }
}