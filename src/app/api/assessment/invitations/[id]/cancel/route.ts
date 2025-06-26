import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const invitationId = params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Find invitation
    const invitation = await db.collection("assessment_invitations").findOne({
      _id: new ObjectId(invitationId),
      createdBy: new ObjectId(userId),
    })

    if (!invitation) {
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 })
    }

    // Check if invitation can be cancelled
    if (invitation.status === "Completed") {
      return NextResponse.json({ success: false, message: "Cannot cancel completed invitation" }, { status: 400 })
    }

    if (invitation.status === "Cancelled") {
      return NextResponse.json({ success: false, message: "Invitation is already cancelled" }, { status: 400 })
    }

    // Update invitation status to cancelled
    await db.collection("assessment_invitations").updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          status: "Cancelled",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true, message: "Invitation cancelled successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error cancelling invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to cancel invitation" }, { status: 500 })
  }
}
