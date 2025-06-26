import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: linkId } = await context.params

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Delete link
    const result = await db.collection("assessment_links").deleteOne({
      _id: new ObjectId(linkId),
      createdBy: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Link not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Link deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting link:", error)
    return NextResponse.json({ success: false, message: "Failed to delete link" }, { status: 500 })
  }
}
