import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Strict authentication: Only allow if logged in as admin
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized - No user ID" }, { status: 401 })
    }
    if (userType !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden - Not admin" }, { status: 403 })
    }

    const { id: employeeId } = await params
    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    // Find employee by ID
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) })
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }
    // Remove sensitive information
    const { password, ...employeeData } = employee
    // Ensure proper typing
    const sanitizedEmployee = {
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
    return NextResponse.json(
      {
        success: true,
        employee: sanitizedEmployee,
        isEmailAccess: false,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching employee for admin access:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employee" }, { status: 500 })
  }
}
