import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin employees route called")

    // Get user ID and type from request
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)

    console.log("Auth check - User ID:", userId, "User Type:", userType)

    // Check if this is email access (no authentication)
    const referer = request.headers.get("referer") || ""
    const isEmailAccess = referer.includes("/admin/verify-employee/") || !userId

    if (isEmailAccess) {
      console.log("Email access detected, allowing temporary admin access")

      // For email access, verify admin exists and allow access
      const { db } = await connectToDatabase()
      const adminEmail = process.env.EMAIL_TO
      let admin = await db.collection("admins").findOne({ email: adminEmail })

      if (!admin) {
        const hashedPassword = await bcrypt.hash("Hridesh123!", 10)
        const result = await db.collection("admins").insertOne({
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          name: "Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        admin = await db.collection("admins").findOne({ _id: result.insertedId })
      }
    } else {
      // Normal authentication check for logged-in users
      if (!userId) {
        console.log("No user ID found - unauthorized")
        return NextResponse.json({ success: false, message: "Unauthorized - No user ID" }, { status: 401 })
      }

      // Verify user is admin
      if (userType !== "admin") {
        console.log("User type is not admin:", userType)
        return NextResponse.json({ success: false, message: "Forbidden - Not admin" }, { status: 403 })
      }
    }

    // Connect to database
    const { db } = await connectToDatabase()

    console.log("Fetching employees...")

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
      { success: true, employees: sanitizedEmployees, isEmailAccess },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employees" }, { status: 500 })
  }
}
