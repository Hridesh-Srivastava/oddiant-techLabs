import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: candidateId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Get candidate details to verify access
    const candidate = await db.collection("assessment_candidates").findOne({
      _id: new ObjectId(candidateId),
      createdBy: new ObjectId(userId),
    })

    if (!candidate) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    // Get all invitations for this candidate
    const invitations = await db
      .collection("assessment_invitations")
      .find({
        candidateId: new ObjectId(candidateId),
        createdBy: new ObjectId(userId),
      })
      .toArray()

    // Get all verification records for these invitations
    const invitationIds = invitations.map((inv) => inv._id)
    const verifications = await db
      .collection("assessment_verifications")
      .find({
        invitationId: { $in: invitationIds },
      })
      .toArray()

    return NextResponse.json({
      success: true,
      verifications: verifications.map((verification) => ({
        ...verification,
        _id: verification._id.toString(),
        invitationId: verification.invitationId.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching candidate verifications:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidate verifications" }, { status: 500 })
  }
}
