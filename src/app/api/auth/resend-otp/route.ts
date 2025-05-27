import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

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
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if user is already verified
    if (user.verified) {
      return NextResponse.json({ success: false, message: "Email already verified" }, { status: 400 })
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpiry = new Date()
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

    // Update user with new OTP in the correct collection
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

    // Send verification email with OTP
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Oddiant Techlabs",
      text: `Your new verification code is: ${otp}. This code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Hello ${user.firstName},</p>
          <p>You requested a new verification code. Please use the following code to complete your registration:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br>Oddiant Techlabs Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "OTP resent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in resending OTP:", error)
    return NextResponse.json({ success: false, message: "Failed to resend OTP. Please try again." }, { status: 500 })
  }
}
