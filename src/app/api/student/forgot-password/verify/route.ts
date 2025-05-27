import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({
      $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
    })

    if (!user) {
      user = await db.collection("candidates").findOne({
        $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
      })
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

    return NextResponse.json({ success: true, message: "OTP verified successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ success: false, message: "Failed to verify OTP" }, { status: 500 })
  }
}
