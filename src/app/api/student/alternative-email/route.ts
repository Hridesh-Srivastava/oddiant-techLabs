import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { alternativeEmail } = await request.json()

    if (!alternativeEmail) {
      return NextResponse.json({ success: false, message: "Alternative email is required" }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(alternativeEmail)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if alternativeEmail is the same as primary email
    if (user.email === alternativeEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Alternative email cannot be the same as your primary email",
        },
        { status: 400 },
      )
    }

    // Check if alternativeEmail is already used by another account in both collections
    const existingInStudents = await db.collection("students").findOne({
      $or: [{ email: alternativeEmail }, { alternativeEmail: alternativeEmail }],
      _id: { $ne: new ObjectId(userId) },
    })

    const existingInCandidates = await db.collection("candidates").findOne({
      $or: [{ email: alternativeEmail }, { alternativeEmail: alternativeEmail }],
      _id: { $ne: new ObjectId(userId) },
    })

    if (existingInStudents || existingInCandidates) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already associated with another account",
        },
        { status: 400 },
      )
    }

    // Update user with alternative email in the correct collection
    const result = await db
      .collection(userCollection)
      .updateOne({ _id: new ObjectId(userId) }, { $set: { alternativeEmail, updatedAt: new Date() } })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update alternative email" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Alternative email added successfully",
        alternativeEmail,
        userCollection, // Include for debugging
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error adding alternative email:", error)
    return NextResponse.json({ success: false, message: "Failed to add alternative email" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Remove alternative email from the correct collection
    const result = await db.collection(userCollection).updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: { alternativeEmail: "" },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to remove alternative email" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Alternative email removed successfully",
        userCollection, // Include for debugging
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error removing alternative email:", error)
    return NextResponse.json({ success: false, message: "Failed to remove alternative email" }, { status: 500 })
  }
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
