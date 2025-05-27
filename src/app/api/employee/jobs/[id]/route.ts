import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Find job by ID - Important: Don't filter by employerId here to ensure all job details are visible
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Calculate real-time stats
    // Count applicants from both students and candidates collections
    const applicantsCount = await db.collection("job_applications").countDocuments({
      jobId: new ObjectId(jobId),
      $or: [{ studentId: { $exists: true } }, { candidateId: { $exists: true } }, { applicantId: { $exists: true } }],
    })

    // Count interviews
    const interviewsCount = await db.collection("interviews").countDocuments({ jobId: new ObjectId(jobId) })

    // Calculate days left (30 days from creation by default)
    const creationDate = job.createdAt ? new Date(job.createdAt) : new Date()
    const expiryDate = new Date(creationDate)
    expiryDate.setDate(expiryDate.getDate() + 30)
    const today = new Date()
    const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

    // Add stats to job object
    const jobWithStats = {
      ...job,
      applicants: applicantsCount,
      interviews: interviewsCount,
      daysLeft: daysLeft,
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, job: jobWithStats },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Get job data from request body
    const jobData = await request.json()

    console.log(`Updating job ${jobId} for user ${userId}`)
    console.log("Job data:", jobData)

    // FIXED: Use employerId instead of employeeId to match the field name used in job creation
    const result = await db.collection("jobs").updateOne(
      {
        _id: new ObjectId(jobId),
        employerId: new ObjectId(userId), // Changed from employeeId to employerId
      },
      {
        $set: {
          ...jobData,
          updatedAt: new Date(),
        },
      },
    )

    console.log("Update result:", result)

    if (result.matchedCount === 0) {
      // Let's check if the job exists at all
      const jobExists = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

      if (!jobExists) {
        return NextResponse.json({ message: "Job not found" }, { status: 404 })
      } else {
        // Job exists but doesn't belong to this user
        return NextResponse.json({ message: "You don't have permission to update this job" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, message: "Job updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating job:", error)
    return NextResponse.json({ success: false, message: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Validate the job ID format
    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json({ success: false, message: "Invalid job ID format" }, { status: 400 })
    }

    // FIXED: Use employerId instead of employeeId and maintain proper ownership check
    const result = await db.collection("jobs").deleteOne({
      _id: new ObjectId(jobId),
      employerId: new ObjectId(userId), // Changed from employeeId to employerId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Job not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: "Job deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json({ success: false, message: "Failed to delete job" }, { status: 500 })
  }
}
