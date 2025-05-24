import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const authResult = await auth()
    if (!authResult || !authResult.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { primaryEmail } = await request.json()

    // Basic validation
    if (!primaryEmail) {
      return NextResponse.json({ success: false, message: "Primary email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(primaryEmail)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if email is already in use by another student
    const existingStudent = await db.collection("students").findOne({
      email: primaryEmail,
      _id: { $ne: new ObjectId(authResult.user._id) },
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: "Email is already in use by another account" },
        { status: 400 },
      )
    }

    // Update the student's primary email
    const result = await db
      .collection("students")
      .updateOne({ _id: new ObjectId(authResult.user._id) }, { $set: { email: primaryEmail, updatedAt: new Date() } })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update primary email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Primary email updated successfully",
    })
  } catch (error) {
    console.error("Error updating primary email:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while updating primary email" },
      { status: 500 },
    )
  }
}
