import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required" },
        { status: 400 },
      )
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long" },
        { status: 400 },
      )
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
      return NextResponse.json({ success: false, message: "Invalid email or OTP" }, { status: 400 })
    }

    // Check if OTP exists and is valid
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 })
    }

    // Check if OTP is expired
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password and clear OTP in the correct collection
    const result = await db.collection(userCollection).updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          otp: "",
          otpExpiry: "",
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password reset successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 })
  }
}
