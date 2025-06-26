import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const candidateEmail = decodeURIComponent(params.email)
    console.log("Fetching verifications for email:", candidateEmail)

    // Connect to database
    const { db } = await connectToDatabase()

    // Get all invitations for this candidate email to find invitation IDs
    const invitations = await db
      .collection("assessment_invitations")
      .find({
        email: candidateEmail,
        createdBy: new ObjectId(userId),
      })
      .toArray()

    console.log(`Found ${invitations.length} invitations for email ${candidateEmail}`)

    if (invitations.length === 0) {
      return NextResponse.json({
        success: true,
        verifications: [],
      })
    }

    // Get all verification records for these invitations
    const invitationIds = invitations.map((inv) => inv._id)
    console.log("Looking for verifications with invitation IDs:", invitationIds)

    const verifications = await db
      .collection("assessment_verifications")
      .find({
        invitationId: { $in: invitationIds },
      })
      .toArray()

    console.log(`Found ${verifications.length} verifications`)

    // Log each verification for debugging
    verifications.forEach((verification, index) => {
      console.log(`Verification ${index + 1}:`, {
        id: verification._id,
        invitationId: verification.invitationId,
        hasIdCard: !!verification.idCardImageUrl,
        hasFace: !!verification.faceImageUrl,
        idCardUrl: verification.idCardImageUrl,
        faceUrl: verification.faceImageUrl,
      })
    })

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        verifications: verifications.map((verification) => ({
          ...verification,
          _id: verification._id.toString(),
          invitationId: verification.invitationId.toString(),
          // Map the field names correctly - API saves as id_cardImageUrl but frontend expects idCardImageUrl
          idCardImageUrl: verification.idCardImageUrl || verification.id_cardImageUrl,
          idCardPublicId: verification.idCardPublicId || verification.id_cardPublicId,
          // Face field is already correct
          faceImageUrl: verification.faceImageUrl,
          facePublicId: verification.facePublicId,
        })),
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching verifications by email:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch verifications" }, { status: 500 })
  }
}
