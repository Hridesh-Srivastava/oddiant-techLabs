import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection("assessment-preview-verifications")

    // Find verification data
    const verificationData = await collection.findOne({ token })

    if (!verificationData) {
      return NextResponse.json({
        success: true,
        message: "No verification data found",
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      data: verificationData,
    })
  } catch (error) {
    console.error("Error fetching verification data:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch verification data",
      },
      { status: 500 },
    )
  }
}
