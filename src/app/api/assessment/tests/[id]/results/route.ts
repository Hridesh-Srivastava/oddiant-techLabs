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

    const param = await params
const  testId = param.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Verify test ownership
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
      createdBy: new ObjectId(userId),
    })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const score = url.searchParams.get("score")
    const date = url.searchParams.get("date")
    const limit = url.searchParams.get("limit") ? Number.parseInt(url.searchParams.get("limit") as string) : undefined
    const sort = url.searchParams.get("sort") || "completionDate"

    // Build query for this specific test
    const query: any = {
      testId: new ObjectId(testId),
      createdBy: new ObjectId(userId),
    }

    if (status) {
      query.status = status
    }

    if (score) {
      // Parse score filter
      if (score === "> 90%") {
        query.score = { $gt: 90 }
      } else if (score === "80-90%") {
        query.score = { $gte: 80, $lte: 90 }
      } else if (score === "70-80%") {
        query.score = { $gte: 70, $lt: 80 }
      } else if (score === "< 70%") {
        query.score = { $lt: 70 }
      }
    }

    if (date) {
      // Parse date filter
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (date === "Today") {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        query.completionDate = { $gte: today, $lt: tomorrow }
      } else if (date === "This week") {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        query.completionDate = { $gte: startOfWeek, $lt: endOfWeek }
      } else if (date === "This month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        query.completionDate = { $gte: startOfMonth, $lte: endOfMonth }
      } else if (date === "Older") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        query.completionDate = { $lt: startOfMonth }
      }
    }

    // Get results from database
    let resultsQuery = db.collection("assessment_results").find(query)

    // Apply sorting
    resultsQuery = resultsQuery.sort({ [sort]: -1 })

    // Apply limit if specified
    if (limit) {
      resultsQuery = resultsQuery.limit(limit)
    }

    const results = await resultsQuery.toArray()

    // Ensure all results have proper date formatting
    const formattedResults = results.map((result) => {
      // Ensure completionDate is a proper Date object
      if (result.completionDate && !(result.completionDate instanceof Date)) {
        result.completionDate = new Date(result.completionDate)
      }

      // Format the date for display
      if (result.completionDate) {
        result.formattedCompletionDate = result.completionDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      } else {
        result.formattedCompletionDate = "N/A"
      }

      return result
    })

    // Calculate stats for this specific test
    let averageScore = 0
    let passRate = 0

    if (results.length > 0) {
      // Calculate average score
      const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0)
      averageScore = Math.round(totalScore / results.length)

      // Calculate pass rate
      const passedCount = results.filter((result) => result.status === "Passed").length
      passRate = Math.round((passedCount / results.length) * 100)
    }

    // Get completion rate for this test
    const completedTests = await db.collection("assessment_invitations").countDocuments({
      testId: new ObjectId(testId),
      createdBy: new ObjectId(userId),
      status: "Completed",
    })

    const totalInvitations = await db.collection("assessment_invitations").countDocuments({
      testId: new ObjectId(testId),
      createdBy: new ObjectId(userId),
    })

    const completionRate = totalInvitations > 0 ? Math.round((completedTests / totalInvitations) * 100) : 0

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        results: formattedResults,
        testName: test.name,
        stats: {
          averageScore,
          passRate,
          completionRate,
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching test results:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch results" }, { status: 500 })
  }
}
