import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userCollection } = body

    if (!userId || !userCollection) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and collection are required",
        },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection(userCollection).findOne({
      _id: new ObjectId(userId),
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update OTP in database
    await db.collection(userCollection).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordSetupOTP: otp,
          passwordSetupOTPExpiry: otpExpiry,
          passwordSetupAttemptedAt: new Date(),
        },
        $unset: {
          otpVerified: "",
        },
      },
    )

    // Send OTP email
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Setup - New OTP Verification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New OTP for Password Setup</h2>
            <p>Hello ${user.firstName || "User"},</p>
            <p>Here's your new OTP for password setup:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">Your OTP Code:</h3>
              <h1 style="margin: 10px 0; color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">This is an automated email from Oddiant Techlabs.</p>
          </div>
        `,
        text: `New OTP for Password Setup: ${otp}. This OTP will expire in 10 minutes.`,
      })

      return NextResponse.json(
        {
          success: true,
          message: "New OTP sent successfully. Please check your email.",
        },
        { status: 200 },
      )
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send OTP email. Please try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error resending OTP:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to resend OTP. Please try again.",
      },
      { status: 500 },
    )
  }
}
