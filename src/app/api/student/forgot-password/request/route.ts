import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({
      $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
    })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({
        $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
      })
      userCollection = "candidates"
    }

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return NextResponse.json(
        { success: true, message: "If your email exists, an OTP has been sent" },
        { status: 200 },
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with OTP in the correct collection
    await db.collection(userCollection).updateOne(
      { _id: user._id },
      {
        $set: {
          otp,
          otpExpiry,
          updatedAt: new Date(),
        },
      },
    )

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Password Reset OTP - Oddiant Techlabs",
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This OTP will expire in 10 minutes.</p>
          <p>If you did not request this password reset, please ignore this email or contact support.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "OTP sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error requesting password reset:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}
