import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ success: false, message: "Invalid emails array" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Fetch students with matching emails
    const students = await db
      .collection("students")
      .find({ email: { $in: emails } })
      .toArray()

    return NextResponse.json(
      {
        success: true,
        students,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching students by emails:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch students" }, { status: 500 })
  }
} 