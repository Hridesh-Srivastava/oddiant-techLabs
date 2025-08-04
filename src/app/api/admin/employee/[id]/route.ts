import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("Admin employer detail route called")

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

    // Await the params object before accessing its properties
    const { id: employeeId } = await params

    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Employer ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const employee = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

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
    console.error("Error fetching employer:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID and type from request
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)

    if (!userId || userType !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params object before accessing its properties
    const { id: employeeId } = await params

    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Employer ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Delete employee
    const result = await db.collection("employees").deleteOne({ _id: new ObjectId(employeeId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Employer deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting employer:", error)
    return NextResponse.json({ success: false, message: "Failed to delete employer" }, { status: 500 })
  }
}
