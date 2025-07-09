import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    // Check if job exists
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    if (job.status !== "active" && job.status !== "open") {
      return NextResponse.json({ success: false, message: "Job is not active" }, { status: 400 })
    }

    // Check if user has already applied
    const existingApplication = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { studentId: new ObjectId(userId) },
        { candidateId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    if (existingApplication) {
      return NextResponse.json({ success: false, message: "You have already applied for this job" }, { status: 400 })
    }

    // Get application data from request body
    const applicationData = await request.json()

    // Create application document with appropriate user reference
    const application = {
      jobId: new ObjectId(jobId),
      // Use the appropriate field based on user collection
      ...(userCollection === "students" ? { studentId: new ObjectId(userId) } : { candidateId: new ObjectId(userId) }),
      // Also add a generic applicantId for easier querying
      applicantId: new ObjectId(userId),
      applicantCollection: userCollection, // Track which collection the user is from

      // Application details
      coverLetter: applicationData.coverLetter || "",
      additionalInfo: applicationData.additionalInfo || "",

      // Application metadata
      status: "applied",
      appliedAt: new Date(),
      appliedDate: new Date(), // For backward compatibility
      createdAt: new Date(),
      updatedAt: new Date(),

      // User details for easy access
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantEmail: user.email,
      applicantPhone: user.phone || "",
      studentName: [user.salutation, user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '), // Full name with salutation and middle name
      studentEmail: user.email,

      // Job details for reference
      employerId: job.employerId || null,
    }

    // Insert application
    const result = await db.collection("job_applications").insertOne(application)

    if (!result.insertedId) {
      return NextResponse.json({ success: false, message: "Failed to submit application" }, { status: 500 })
    }

    // Update job application count (optional)
    await db.collection("jobs").updateOne(
      { _id: new ObjectId(jobId) },
      {
        $inc: { applicants: 1 },
        $set: { updatedAt: new Date() },
      },
    )

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