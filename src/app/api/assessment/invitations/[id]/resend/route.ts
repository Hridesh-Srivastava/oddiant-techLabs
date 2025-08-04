import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: invitationId } = await context.params

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

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

    // Check if invitation is still valid for resending
    if (invitation.status === "Completed") {
      return NextResponse.json({ success: false, message: "Cannot resend completed invitation" }, { status: 400 })
    }

    // Get employer details
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

    // Get test details
    const test = await db.collection("assessment_tests").findOne({ _id: invitation.testId })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Update invitation with new expiry date
    const newExpiryDate = new Date()
    newExpiryDate.setDate(newExpiryDate.getDate() + 7)

    await db.collection("assessment_invitations").updateOne(
      { _id: new ObjectId(invitationId) },
      {
        $set: {
          expiresAt: newExpiryDate,
          status: "Pending",
          updatedAt: new Date(),
        },
      },
    )

    // Resend invitation email
    await sendEmail({
      to: invitation.email,
      subject: `Assessment Invitation (Resent): ${test.name} from ${employee.companyName}`,
      text: `
        Hello,

        This is a reminder that you have been invited to take the ${test.name} assessment by ${employee.companyName}.

        To start your assessment, please click on the link below:
        ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/system-check?token=${invitation.token}

        This invitation will expire on ${newExpiryDate.toLocaleDateString()}.

        Best regards,
        ${employee.firstName} ${employee.lastName}
        ${employee.companyName}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Assessment Invitation (Resent)</h2>
          <p>Hello,</p>
          <p>This is a reminder that you have been invited to take the <strong>${test.name}</strong> assessment by <strong>${employee.companyName}</strong>.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/system-check?token=${invitation.token}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Start Assessment
            </a>
          </div>
          <p>This invitation will expire on ${newExpiryDate.toLocaleDateString()}.</p>
          <p>Best regards,<br>${employee.firstName} ${employee.lastName}<br>${employee.companyName}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "Invitation resent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error resending invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to resend invitation" }, { status: 500 })
  }
}
