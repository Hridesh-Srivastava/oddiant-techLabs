import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: interviewId } = await context.params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Update interview status
    const result = await db.collection("interviews").updateOne(
      { _id: new ObjectId(interviewId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Interview status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating interview status:", error)
    return NextResponse.json({ success: false, message: "Failed to update interview status" }, { status: 500 })
  }
}
