import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("Verify employee route called")

    // Get user ID and type from request
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)

    console.log("Auth check - User ID:", userId, "User Type:", userType)

    // Check if this is email access (no authentication)
    const referer = request.headers.get("referer") || ""
    const isEmailAccess = referer.includes("/admin/verify-employee/") || !userId

    if (isEmailAccess) {
      console.log("Email access detected for verification action, allowing temporary admin access")

      // For email access, verify admin exists and allow access
      const { db } = await connectToDatabase()
      const adminEmail = process.env.EMAIL_TO
      let admin = await db.collection("admins").findOne({ email: adminEmail })

      if (!admin) {
        const hashedPassword = await bcrypt.hash("Hridesh123!", 10)
        const result = await db.collection("admins").insertOne({
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          name: "Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        admin = await db.collection("admins").findOne({ _id: result.insertedId })
      }
    } else {
      // Normal authentication check for logged-in users
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized - No user ID" }, { status: 401 })
      }

      // Verify user is admin
      if (userType !== "admin") {
        return NextResponse.json({ success: false, message: "Forbidden - Not admin" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { employeeId, action, rejectionReason, rejectionComments } = body

    if (!employeeId || !action) {
      return NextResponse.json({ success: false, message: "Employee ID and action are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee by ID
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Update employee as verified
      await db.collection("employees").updateOne(
        { _id: new ObjectId(employeeId) },
        {
          $set: {
            verified: true,
            verifiedAt: new Date(),
            updatedAt: new Date(),
            status: "verified",
          },
          $unset: { rejected: "", rejectedAt: "", rejectionReason: "", rejectionComments: "" },
        },
      )

      // Send approval email to employee
      try {
        await sendEmail({
          to: employee.email,
          subject: "Your Account Has Been Approved - Oddiant Techlabs",
          text: `Dear ${employee.firstName},

Your account has been approved by our team. You can now sign in to access your dashboard.

Sign in at: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/login

Thank you for joining Oddiant Techlabs!

Best regards,
The Oddiant Techlabs Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Your Account Has Been Approved</h2>
              <p>Dear ${employee.firstName},</p>
              <p>We're pleased to inform you that your account has been approved by our team. You can now sign in to access your dashboard.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/login" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Sign In Now
                </a>
              </div>
              <p>Thank you for joining Oddiant Techlabs!</p>
              <p>Best regards,<br>The Oddiant Techlabs Team</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending approval email:", emailError)
      }

      return NextResponse.json({ success: true, message: "Employee approved successfully" }, { status: 200 })
    } else if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json({ success: false, message: "Rejection reason is required" }, { status: 400 })
      }

      // Generate secure, random, expiring appeal token
      const appealToken = crypto.randomBytes(32).toString("hex")
      const appealTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      // Update employee as rejected and store token
      await db.collection("employees").updateOne(
        { _id: new ObjectId(employeeId) },
        {
          $set: {
            rejected: true,
            rejectedAt: new Date(),
            rejectionReason,
            rejectionComments: rejectionComments || "",
            updatedAt: new Date(),
            status: "rejected",
            appealToken,
            appealTokenExpiry,
            appealTokenUsed: false,
          },
          $unset: { verified: "", verifiedAt: "" },
        },
      )

      // Get readable rejection reason
      const rejectionReasonMap: Record<string, string> = {
        incomplete_information: "Incomplete Information",
        document_error: "Document Error or Invalid Documents",
        company_verification_failed: "Company Verification Failed",
        duplicate_account: "Duplicate Account",
        suspicious_activity: "Suspicious Activity",
        not_eligible: "Not Eligible for the Platform",
        other: "Other",
      }

      const readableReason = rejectionReasonMap[rejectionReason as string] || rejectionReason

      // Send rejection email to employee
      try {
        await sendEmail({
          to: employee.email,
          subject: "Regarding Your Account Application - Oddiant Techlabs",
          text: `Dear ${employee.firstName},

Thank you for your interest in Oddiant Techlabs. After reviewing your application, we regret to inform you that we are unable to approve your account at this time.

Reason: ${readableReason}
${rejectionComments ? `Additional Comments: ${rejectionComments}` : ""}

If you would like to appeal this decision, you can update your information and resubmit your application by clicking the link below:

${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/appeal/${employeeId}?token=${appealToken}

This appeal link will expire in 7 days.

If you have any questions, please contact our support team at support@oddiant.com.

Best regards,
The Oddiant Techlabs Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Regarding Your Account Application</h2>
              <p>Dear ${employee.firstName},</p>
              <p>Thank you for your interest in Oddiant Techlabs. After reviewing your application, we regret to inform you that we are unable to approve your account at this time.</p>
              <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Reason:</strong> ${readableReason}</p>
                ${rejectionComments ? `<p><strong>Additional Comments:</strong> ${rejectionComments}</p>` : ""}
              </div>
              <p>If you would like to appeal this decision, you can update your information and resubmit your application by clicking the button below:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/appeal/${employeeId}?token=${appealToken}" 
                   style="background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Appeal and Update Information
                </a>
              </div>
              <p style="color: #b91c1c; font-weight: bold;">This appeal link will expire in 7 days.</p>
              <p>If you have any questions, please contact our support team at <a href="mailto:support@oddiant.com">support@oddiant.com</a>.</p>
              <p>Best regards,<br>The Oddiant Techlabs Team</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError)
      }

      return NextResponse.json({ success: true, message: "Employee rejected successfully" }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in employee verification:", error)
    return NextResponse.json({ success: false, message: "Verification failed. Please try again." }, { status: 500 })
  }
}
