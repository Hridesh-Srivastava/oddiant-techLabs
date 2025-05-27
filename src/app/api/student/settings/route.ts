import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db
      .collection("students")
      .findOne({ _id: new ObjectId(userId) }, { projection: { settings: 1, alternativeEmail: 1, email: 1 } })
    let userCollection = "students"

    if (!user) {
      user = await db
        .collection("candidates")
        .findOne({ _id: new ObjectId(userId) }, { projection: { settings: 1, alternativeEmail: 1, email: 1 } })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Return settings or default settings if not set
    const settings = user.settings || {
      profileVisibility: true,
      notifications: {
        email: true,
        jobRecommendations: true,
        applicationUpdates: true,
      },
      preferredJobTypes: [],
      preferredLocations: [],
      shiftPreference: "flexible",
    }

    // Include alternativeEmail in the response
    return NextResponse.json(
      {
        success: true,
        settings,
        alternativeEmail: user.alternativeEmail || "",
        primaryEmail: user.email,
        userCollection, // Include for debugging
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { settings, alternativeEmail } = await request.json()

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

    // If alternativeEmail is provided, validate it
    if (alternativeEmail !== undefined) {
      // Check if alternativeEmail is valid
      if (alternativeEmail && !isValidEmail(alternativeEmail)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email format for alternative email",
          },
          { status: 400 },
        )
      }

      // Check if alternativeEmail is the same as primary email
      if (alternativeEmail && user.email === alternativeEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Alternative email cannot be the same as your primary email",
          },
          { status: 400 },
        )
      }

      // Check if alternativeEmail is already used by another account in both collections
      if (alternativeEmail) {
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
      }
    }

    // Prepare update object
    const updateObj: any = {
      settings,
      updatedAt: new Date(),
    }

    // Only include alternativeEmail in update if it's provided
    if (alternativeEmail !== undefined) {
      // If alternativeEmail is empty string, remove it using $unset
      if (!alternativeEmail) {
        await db.collection(userCollection).updateOne(
          { _id: new ObjectId(userId) },
          {
            $unset: { alternativeEmail: "" },
            $set: { settings, updatedAt: new Date() },
          },
        )
      } else {
        // Otherwise, set it
        updateObj.alternativeEmail = alternativeEmail
        await db.collection(userCollection).updateOne({ _id: new ObjectId(userId) }, { $set: updateObj })
      }
    } else {
      // If alternativeEmail is not provided, just update settings
      await db.collection(userCollection).updateOne({ _id: new ObjectId(userId) }, { $set: updateObj })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Settings updated successfully",
        settings,
        alternativeEmail: alternativeEmail === "" ? null : alternativeEmail,
        userCollection, // Include for debugging
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ success: false, message: "Failed to update settings" }, { status: 500 })
  }
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
