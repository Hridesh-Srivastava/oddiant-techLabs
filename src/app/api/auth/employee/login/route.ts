import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Special handling for super admin - MOVED FROM auth/login
    if (email === process.env.EMAIL_TO) {
      let admin = await db.collection("admins").findOne({ email })

      if (!admin) {
        const hashedPassword = await bcrypt.hash("Hridesh123!", 10)
        const adminData = {
          email,
          password: hashedPassword,
          role: "admin",
          name: "Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        const result = await db.collection("admins").insertOne(adminData)
        admin = await db.collection("admins").findOne({ _id: result.insertedId })
        
        // Additional null check for TypeScript
        if (!admin) {
          return NextResponse.json({ success: false, message: "Failed to create admin account" }, { status: 500 })
        }
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password)

      if (!isPasswordValid) {
        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
      }

      // Generate token with userType
      const token = generateToken(admin._id.toString(), "admin")

      // Create response with cookie
      const response = NextResponse.json(
        {
          success: true,
          role: "admin",
          redirectUrl: "/admin/employees",
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
    }

    // Find employee by primary email or alternative email
    const employee = await db.collection("employees").findOne({
      $or: [{ email: email }, { alternativeEmail: email }],
    })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    // Check if employee is verified
    if (!employee.verified) {
      if (employee.rejected) {
        return NextResponse.json(
          {
            success: false,
            message: "Your account has been rejected. Please check your email for details or appeal the decision.",
            rejected: true,
            employeeId: employee._id.toString(),
          },
          { status: 403 },
        )
      }

      if (employee.emailVerified) {
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
          email: employee.email,
        },
        { status: 403 },
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, employee.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken(employee._id.toString())

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: employee._id.toString(),
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          userType: "employee",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in employee login:", error)
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 })
  }
}