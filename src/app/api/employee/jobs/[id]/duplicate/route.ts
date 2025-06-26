import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: jobId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find the original job
    const originalJob = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!originalJob) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // Create a duplicate job with a new ID
    const { _id, createdAt, ...jobData } = originalJob

    const newJob = {
      ...jobData,
      jobTitle: `${originalJob.jobTitle} (Copy)`,
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("jobs").insertOne(newJob)

    return NextResponse.json(
      {
        success: true,
        message: "Job duplicated successfully",
        jobId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error duplicating job:", error)
    return NextResponse.json({ success: false, message: "Failed to duplicate job" }, { status: 500 })
  }
}
