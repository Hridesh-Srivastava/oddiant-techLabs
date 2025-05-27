import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userCollection, password, confirmPassword } = body

    if (!userId || !userCollection || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Verify user exists and OTP was verified
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

    // Check if OTP was verified (only for candidates collection)
    if (userCollection === "candidates" && !user.otpVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your OTP first",
        },
        { status: 400 },
      )
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password already exists for this account",
        },
        { status: 400 },
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user with password
    await db.collection(userCollection).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          passwordSetAt: new Date(),
        },
        $unset: {
          otpVerified: "",
          otpVerifiedAt: "",
        },
      },
    )

    return NextResponse.json(
      {
        success: true,
        message: "Password set successfully. You can now login.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error setting up password:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to set up password. Please try again.",
      },
      { status: 500 },
    )
  }
}
