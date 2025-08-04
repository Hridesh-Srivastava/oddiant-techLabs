import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin employers route called")

    // Get user ID and type from request
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)

    console.log("Auth check - User ID:", userId, "User Type:", userType)

    // Strict authentication: Only allow if logged in as admin
    if (!userId) {
      console.log("No user ID found - unauthorized")
      return NextResponse.json({ success: false, message: "Unauthorized - No user ID" }, { status: 401 })
    }
    if (userType !== "admin") {
      console.log("User type is not admin:", userType)
      return NextResponse.json({ success: false, message: "Forbidden - Not admin" }, { status: 403 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    console.log("Fetching employers...")

    // Get all employees
    const employees = await db.collection("employees").find({}).sort({ createdAt: -1 }).toArray()

    console.log(`Found ${employees.length} employees`)

    // Remove sensitive information and ensure proper typing
    const sanitizedEmployees = employees.map((employee) => {
      const { password, ...employeeData } = employee
      return {
        ...employeeData,
        _id: employee._id.toString(),
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        companyName: employee.companyName || "",
        companyLocation: employee.companyLocation || "",
        designation: employee.designation || "",
        verified: Boolean(employee.verified),
        rejected: Boolean(employee.rejected),
      }
    })

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, employees: sanitizedEmployees, isEmailAccess: false },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching employers:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employers" }, { status: 500 })
  }
}
