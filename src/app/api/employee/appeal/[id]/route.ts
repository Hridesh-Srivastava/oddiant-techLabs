import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 })
    }

    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid Employee ID format" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee by ID
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(id) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Remove sensitive information if present
    const { password, ...employeeData } = employee

    return NextResponse.json({ success: true, employee: employeeData }, { status: 200 })
  } catch (error) {
    console.error("Error fetching employee for appeal:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employee data" }, { status: 500 })
  }
}
