import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { firstName, lastName, middleName, phone, designation, alternativeEmail, email } = body

    // Connect to database
    const { db } = await connectToDatabase()

    // Basic validation
    if (!firstName || !lastName) {
      return NextResponse.json({ message: "First name and last name are required" }, { status: 400 })
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
      }

      // Check if email is already in use by another employee
      const existingEmployee = await db.collection("employees").findOne({
        email: email,
        _id: { $ne: new ObjectId(userId) },
      })

      if (existingEmployee) {
        return NextResponse.json({ message: "Email is already in use by another account" }, { status: 400 })
      }
    }

    // Alternative email validation if provided
    if (alternativeEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(alternativeEmail)) {
        return NextResponse.json({ message: "Invalid alternative email format" }, { status: 400 })
      }

      // Check if primary and alternative emails are the same
      if (email && email.toLowerCase() === alternativeEmail.toLowerCase()) {
        return NextResponse.json({ message: "Primary and alternative emails cannot be the same" }, { status: 400 })
      }
    }

    // Prepare update fields
    const updateFields: any = {
      firstName,
      lastName,
      middleName: middleName || "", // Allow empty string for optional middle name
      phone,
      designation,
      alternativeEmail,
      updatedAt: new Date(),
    }

    // Only update email if provided
    if (email) {
      updateFields.email = email
    }

    // Update employee profile
    await db.collection("employees").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: updateFields,
      },
    )

    return NextResponse.json({ success: true, message: "Profile updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
