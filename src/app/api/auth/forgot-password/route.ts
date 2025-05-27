import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userType = "student" } = body

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    let user = null
    let collection = ""

    if (userType === "employee") {
      // For employees, only check employees collection
      user = await db.collection("employees").findOne({ email })
      collection = "employees"
    } else {
      // For students, check both students and candidates collections
      user = await db.collection("students").findOne({
        $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
      })
      collection = "students"

      if (!user) {
        user = await db.collection("candidates").findOne({
          $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
        })
        collection = "candidates"
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 })
    }

    // Generate reset token (OTP)
    const resetToken = generateOTP()
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15) // Token valid for 15 minutes

    // Update user with reset token in the correct collection
    await db.collection(collection).updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date(),
        },
      },
    )

    // Send password reset email
    await sendEmail({
      to: email,
      subject: "Password Reset - Oddiant Techlabs",
      text: `Your password reset code is: ${resetToken}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your Oddiant Techlabs account. Please use the following code to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${resetToken}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br>Oddiant Techlabs Team</p>
        </div>
      `,
    })

    return NextResponse.json(
      { success: true, message: "Password reset instructions sent to your email" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process request. Please try again." },
      { status: 500 },
    )
  }
}
