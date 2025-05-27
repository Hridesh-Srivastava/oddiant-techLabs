import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateToken, generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType = "student" } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    let user = null
    let userCollection = null

    if (userType === "employee") {
      // For employees, only check primary email in employees collection
      user = await db.collection("employees").findOne({ email })
      userCollection = "employees"
    } else {
      // For students, check both students and candidates collections
      // First check students collection with primary or alternative email
      user = await db.collection("students").findOne({
        $or: [{ email: email }, { alternativeEmail: email }],
      })
      userCollection = "students"

      // If not found in students collection, check candidates collection
      if (!user) {
        user = await db.collection("candidates").findOne({
          $or: [{ email: email }, { alternativeEmail: email }],
        })
        userCollection = "candidates"
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Check if user has a password field
    if (!user.password) {
      // Only allow password setup for candidates collection
      if (userCollection !== "candidates") {
        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
      }

      // Generate OTP for email verification
      const otp = generateOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP in database
      await db.collection("candidates").updateOne(
        { _id: user._id },
        {
          $set: {
            passwordSetupOTP: otp,
            passwordSetupOTPExpiry: otpExpiry,
            passwordSetupAttemptedAt: new Date(),
          },
        },
      )

      // Send OTP email
      try {
        await sendEmail({
          to: user.email,
          subject: "Password Setup - OTP Verification",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Setup Required</h2>
              <p>Hello ${user.firstName || "User"},</p>
              <p>We found your account but it doesn't have a password set up yet. To access your dashboard, please complete the password setup process.</p>
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
          text: `Password Setup Required. Your OTP: ${otp}. This OTP will expire in 10 minutes.`,
        })
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError)
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send verification email. Please try again.",
          },
          { status: 500 },
        )
      }

      // User exists but no password set - redirect to password setup
      return NextResponse.json(
        {
          success: false,
          needsPasswordSetup: true,
          message:
            "This email is registered but password is not set. Please check your email for OTP to complete password setup.",
          email: user.email,
          userId: user._id.toString(),
          userCollection: userCollection,
        },
        { status: 200 },
      )
    }

    if (userType === "employee" && !user.verified) {
      if (user.rejected) {
        return NextResponse.json(
          {
            success: false,
            message: "Your account has been rejected. Please check your email for details or appeal the decision.",
            rejected: true,
            employeeId: user._id.toString(),
          },
          { status: 403 },
        )
      }

      if (user.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "Your account is pending approval. You will receive an email once approved.",
            pendingApproval: true,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in.",
          unverified: true,
          email: user.email,
        },
        { status: 403 },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Generate token with userType
    const token = generateToken(user._id.toString(), userType)

    // Create response with cookie and redirect URL
    const redirectUrl = userType === "employee" ? "/employee/dashboard" : "/student/dashboard"
    const response = NextResponse.json(
      {
        success: true,
        role: userType,
        redirectUrl: redirectUrl,
      },
      { status: 200 },
    )

    // Set cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Error in login:", error)
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 })
  }
}
