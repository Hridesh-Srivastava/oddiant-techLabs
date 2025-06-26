import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { generateAssessmentResultExcel, createFallbackAssessmentExcel } from "@/lib/assessment-excel"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== Starting Assessment Excel Download Process ===")

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: resultId } = await context.params
    console.log("Download requested for result ID:", resultId)

    // Validate ObjectId format
    if (!ObjectId.isValid(resultId)) {
      console.log("Invalid result ID format:", resultId)
      return NextResponse.json({ success: false, message: "Invalid result ID format" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()
    console.log("Database connected successfully")

    // Find result with detailed logging
    console.log("Searching for result with ID:", resultId)
    const result = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    if (!result) {
      console.log("Result not found in database for ID:", resultId)
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    console.log("Result found:", {
      id: result._id,
      candidateEmail: result.candidateEmail,
      testId: result.testId,
      score: result.score,
      answersCount: result.answers?.length || 0,
    })

    // Get test details with better error handling
    console.log("Searching for test with ID:", result.testId)
    let test = null

    if (result.testId) {
      if (ObjectId.isValid(result.testId)) {
        test = await db.collection("assessment_tests").findOne({
          _id: new ObjectId(result.testId),
        })
      } else {
        console.log("Invalid test ID format in result:", result.testId)
      }
    }

    if (!test) {
      console.log("Test not found, creating fallback Excel with basic result data")

      try {
        const fallbackBuffer = await createFallbackAssessmentExcel(result as any)
        const filename = `assessment-result-${result.candidateName || "candidate"}-fallback-${new Date().toISOString().split("T")[0]}.xlsx`

        return new NextResponse(fallbackBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": fallbackBuffer.length.toString(),
          },
        })
      } catch (fallbackError) {
        console.error("Fallback Assessment Excel generation failed:", fallbackError)
        return NextResponse.json({ success: false, message: "Failed to generate result file" }, { status: 500 })
      }
    }

    console.log("Test found:", {
      id: test._id,
      name: test.name,
      duration: test.duration,
      passingScore: test.passingScore,
      totalQuestions: test.totalQuestions,
    })

    // Get questions for this test with robust approach
    console.log("Fetching questions for test ID:", result.testId)
    const questions = await db
      .collection("assessment_questions")
      .find({
        testId: new ObjectId(result.testId),
      })
      .toArray()

    console.log(`Found ${questions.length} questions in database for the test`)

    // Also get question count from test collection as backup
    const questionCountFromTest = test.totalQuestions || 0
    console.log(`Test collection shows ${questionCountFromTest} total questions`)

    // Use the maximum of both sources for most accurate count
    const actualQuestionCount = Math.max(questions.length, questionCountFromTest, result.answers?.length || 0)
    console.log(`Using ${actualQuestionCount} as actual question count`)

    // Generate Assessment Excel file
    console.log("Starting Assessment Excel generation...")
    const excelBuffer = await generateAssessmentResultExcel(result as any, test as any, questions)
    console.log("Assessment Excel generation completed, buffer size:", excelBuffer.length)

    // Create filename
    const filename = `assessment-result-${result.candidateName || "candidate"}-${test.name.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.xlsx`
    console.log("Generated filename:", filename)

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("=== Assessment Excel Download Error ===")
    console.error("Error details:", error)
    console.error("Stack trace:", (error as Error).stack)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to download assessment result",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
