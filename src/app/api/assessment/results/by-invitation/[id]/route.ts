import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: invitationId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find result by invitation ID
    const result = await db.collection("assessment_results").findOne({
      invitationId: invitationId,
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, result },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching result by invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch result" }, { status: 500 })
  }
}
