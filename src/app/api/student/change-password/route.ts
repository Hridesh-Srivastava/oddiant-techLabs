import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 },
      )
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find student by ID
    const student = await db.collection("students").findOne({ _id: new ObjectId(userId) })

    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, student.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    const result = await db.collection("students").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ success: false, message: "Failed to change password" }, { status: 500 })
  }
}
