import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before using
    const resolvedParams = await params
    const testId = resolvedParams.id

    if (!testId) {
      return NextResponse.json({ success: false, message: "Test ID is required" }, { status: 400 })
    }

    if (!ObjectId.isValid(testId)) {
      return NextResponse.json({ success: false, message: "Invalid test ID format" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find test by ID
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
      createdBy: new ObjectId(userId),
    })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Get invitations for this test
    const invitations = await db
      .collection("assessment_invitations")
      .find({
        testId: new ObjectId(testId),
        createdBy: new ObjectId(userId),
      })
      .toArray()

    // Count unique candidates
    const uniqueEmails = new Set(invitations.map((inv) => inv.email))
    const candidatesCount = uniqueEmails.size

    // Calculate completion rate
    const completedInvitations = invitations.filter((inv) => inv.status === "Completed")
    const completionRate =
      invitations.length > 0 ? Math.round((completedInvitations.length / invitations.length) * 100) : 0

    // Get results for this test
    const results = await db
      .collection("assessment_results")
      .find({
        testId: new ObjectId(testId),
        createdBy: new ObjectId(userId),
      })
      .toArray()

    // Calculate average score
    let averageScore = 0
    if (results.length > 0) {
      const totalScore = results.reduce((sum, result) => sum + result.score, 0)
      averageScore = Math.round(totalScore / results.length)
    }

    // Calculate pass rate
    let passRate = 0
    if (results.length > 0) {
      const passedCount = results.filter((result) => result.status === "Passed").length
      passRate = Math.round((passedCount / results.length) * 100)
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        stats: {
          candidatesCount,
          completionRate,
          averageScore,
          passRate,
        },
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching test stats:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch test stats" }, { status: 500 })
  }
}
