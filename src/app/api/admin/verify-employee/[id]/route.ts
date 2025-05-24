import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    // For email link access, create temporary admin session
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
        isEmailAccess: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching employee for email access:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employee" }, { status: 500 })
  }
}
