import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const resultId = params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Find result
    const result = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Get test details
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(result.testId),
    })

    // Calculate total questions from test sections
    let totalQuestions = 0
    if (test && test.sections) {
      totalQuestions = test.sections.reduce((total: number, section: any) => {
        return total + (section.questions ? section.questions.length : 0)
      }, 0)
    }

    console.log("Found result:", result.candidateName, result.candidateEmail)
    console.log("Test questions count:", totalQuestions)

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        result: {
          ...result,
          _id: result._id.toString(),
          testId: result.testId.toString(),
        },
        test: test
          ? {
              ...test,
              _id: test._id.toString(),
              totalQuestions: totalQuestions,
            }
          : null,
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching result:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch result" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const resultId = params.id
    const body = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Find the result
    const existingResult = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    if (!existingResult) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Update the result with manual evaluation
    const updateData: any = {}

    // Handle manual evaluation updates
    if (body.manualEvaluation) {
      updateData.manualEvaluation = body.manualEvaluation
      updateData.evaluatedBy = userId
      updateData.evaluatedAt = new Date()
    }

    // Handle score updates
    if (body.score !== undefined) {
      updateData.score = body.score
    }

    // Handle status updates
    if (body.status) {
      updateData.status = body.status
    }

    // Handle results declaration
    if (body.resultsDeclared !== undefined) {
      updateData.resultsDeclared = body.resultsDeclared
      updateData.resultsDeclaredAt = new Date()
      updateData.resultsDeclaredBy = userId
    }

    // Handle answer updates (for manual evaluation)
    if (body.answers) {
      updateData.answers = body.answers
    }

    updateData.updatedAt = new Date()

    // Update the result
    const updateResult = await db
      .collection("assessment_results")
      .updateOne({ _id: new ObjectId(resultId) }, { $set: updateData })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Fetch the updated result
    const updatedResult = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    console.log("Updated result:", updatedResult?.candidateName, updatedResult?.candidateEmail)

    return NextResponse.json(
      {
        success: true,
        message: "Result updated successfully",
        result: {
          ...updatedResult,
          _id: updatedResult?._id.toString(),
          testId: updatedResult?.testId.toString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating result:", error)
    return NextResponse.json({ success: false, message: "Failed to update result" }, { status: 500 })
  }
}
