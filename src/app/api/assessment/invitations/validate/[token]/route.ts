import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { token } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find invitation by token
    const invitation = await db.collection("assessment_invitations").findOne({ token })

    if (!invitation) {
      // Try to find invitation in assessment_links collection
      const link = await db.collection("assessment_links").findOne({ token })

      if (!link) {
        return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 })
      }

      // Get test details for the link
      const test = await db.collection("assessment_tests").findOne({ _id: link.testId })

      if (!test) {
        return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
      }

      // Create a temporary invitation object
      const tempInvitation = {
        _id: link._id,
        email: "guest@example.com", // Default email for link-based access
        testId: link.testId,
        testName: test.name,
        companyName: "Your Company", // Default company name
        token: link.token,
        status: "Pending",
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        createdBy: link.createdBy,
      }

      // Add cache control headers to prevent caching
      const headers = new Headers()
      headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
      headers.append("Pragma", "no-cache")
      headers.append("Expires", "0")

      return NextResponse.json(
        { success: true, invitation: tempInvitation },
        {
          status: 200,
          headers: headers,
        },
      )
    }

    // Check if invitation has expired
    const now = new Date()
    const expiryDate = new Date(invitation.expiresAt)

    if (now > expiryDate && invitation.status !== "Completed") {
      // Update invitation status to expired
      await db.collection("assessment_invitations").updateOne(
        { token },
        {
          $set: {
            status: "Expired",
          },
        },
      )

      return NextResponse.json({ success: true, invitation: { ...invitation, status: "Expired" } }, { status: 200 })
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, invitation },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error validating invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to validate invitation" }, { status: 500 })
  }
}
