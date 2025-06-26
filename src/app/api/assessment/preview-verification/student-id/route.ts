import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, studentId, isPreview } = body

    if (!token || !studentId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection("assessment-preview-verifications")

    // Update student ID
    await collection.updateOne(
      { token },
      {
        $set: {
          studentId,
          studentIdUpdatedAt: new Date(),
          updatedAt: new Date(),
          isPreview: isPreview === true,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: "Student ID saved successfully",
    })
  } catch (error) {
    console.error("Error saving student ID:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save student ID",
      },
      { status: 500 },
    )
  }
}
