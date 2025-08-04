import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: employeeId } = await context.params

    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Employer ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee by ID
    let employee
    try {
      employee = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) })
    } catch (error) {
      console.error("Error finding employer by ID:", error)
      return NextResponse.json({ success: false, message: "Invalid employer ID format" }, { status: 400 })
    }

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

    // Remove sensitive information
    const { password, ...employeeData } = employee

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, employee: employeeData },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching employer:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employer" }, { status: 500 })
  }
}
