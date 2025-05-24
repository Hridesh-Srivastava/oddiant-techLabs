import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType = "student" } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const collection = userType === "employee" ? "employees" : "students"

    // Check for login with primary or alternative email for students
    let user = null
    if (userType === "student") {
      user = await db.collection(collection).findOne({
        $or: [{ email: email }, { alternativeEmail: email }],
      })
    } else {
      // For employees, only check primary email
      user = await db.collection(collection).findOne({ email })
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
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
