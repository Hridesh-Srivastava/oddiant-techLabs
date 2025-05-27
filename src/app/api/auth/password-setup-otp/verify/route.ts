import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userCollection, otp } = body

    if (!userId || !userCollection || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Find user and verify OTP
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

    // Check if OTP exists and is not expired
    if (!user.passwordSetupOTP || !user.passwordSetupOTPExpiry) {
      return NextResponse.json(
        {
          success: false,
          message: "No OTP found. Please request a new one.",
        },
        { status: 400 },
      )
    }

    if (new Date() > new Date(user.passwordSetupOTPExpiry)) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired. Please request a new one.",
        },
        { status: 400 },
      )
    }

    if (user.passwordSetupOTP !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP. Please try again.",
        },
        { status: 400 },
      )
    }

    // OTP verified successfully - mark as verified
    await db.collection(userCollection).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          otpVerified: true,
          otpVerifiedAt: new Date(),
        },
        $unset: {
          passwordSetupOTP: "",
          passwordSetupOTPExpiry: "",
        },
      },
    )

    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully. You can now set your password.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      },
      { status: 500 },
    )
  }
}
