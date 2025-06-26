import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params as they're now Promise-based in Next.js 15
    const params = await context.params
    
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id
    const { status } = await request.json()

    if (!status || !["open", "hold", "closed"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Update job status
    const result = await db.collection("jobs").updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Job status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating job status:", error)
    return NextResponse.json({ success: false, message: "Failed to update job status" }, { status: 500 })
  }
}