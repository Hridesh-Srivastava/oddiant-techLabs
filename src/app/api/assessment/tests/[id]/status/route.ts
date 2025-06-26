import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: testId } = await context.params

    // Get status from request body
    const { status } = await request.json()

    if (!status || !["Draft", "Active", "Archived"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be Draft, Active, or Archived" },
        { status: 400 },
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Update test status
    const result = await db.collection("assessment_tests").updateOne(
      { _id: new ObjectId(testId), createdBy: new ObjectId(userId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Test not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: `Test status updated to ${status}` }, { status: 200 })
  } catch (error) {
    console.error("Error updating test status:", error)
    return NextResponse.json({ success: false, message: "Failed to update test status" }, { status: 500 })
  }
}
