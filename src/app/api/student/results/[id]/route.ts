import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request, context: any) {
  try {
    // Verify authentication
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    const authResult = token ? verifyToken(token) : null;
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const studentId = authResult.userId
    const resultId = context.params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Fetch specific result
    const result = await db.collection("test_results").findOne({
      _id: new ObjectId(resultId),
      studentId: studentId,
      resultStatus: "published",
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Fetch detailed answers if available
    const detailedAnswers = await db
      .collection("test_answers")
      .find({
        resultId: resultId,
        studentId: studentId,
      })
      .toArray()

    // Calculate category-wise performance
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {}
    if (detailedAnswers.length > 0) {
      detailedAnswers.forEach((answer) => {
        const category = answer.category || "general"
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { correct: 0, total: 0 }
        }
        categoryBreakdown[category].total++
        if (answer.isCorrect) {
          categoryBreakdown[category].correct++
        }
      })
    }

    // Generate performance recommendations
    const recommendations = []
    const score = result.score || 0

    if (score < 50) {
      recommendations.push("Focus on fundamental concepts and practice more")
      recommendations.push("Consider reviewing the study materials again")
    } else if (score < 75) {
      recommendations.push("Good progress! Work on areas where you scored lower")
      recommendations.push("Practice more challenging questions")
    } else {
      recommendations.push("Excellent performance! Keep up the good work")
      recommendations.push("Consider taking advanced level assessments")
    }

    const transformedResult = {
      id: result._id.toString(),
      testId: result.testId,
      testTitle: result.testTitle || "Unknown Test",
      description: result.description || "",
      status: result.status,
      score: result.score || 0,
      totalQuestions: result.totalQuestions || 0,
      correctAnswers: result.correctAnswers || 0,
      duration: result.duration || 0,
      timeTaken: result.timeTaken || 0,
      completedAt: result.completedAt,
      difficulty: result.difficulty || "intermediate",
      category: result.category || "general",
      grade: result.grade || "",
      resultStatus: result.resultStatus || "published",
      detailedAnswers: detailedAnswers.map((answer) => ({
        questionId: answer.questionId,
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        category: answer.category || "general",
        explanation: answer.explanation || "",
      })),
      categoryBreakdown,
      recommendations,
    }

    return NextResponse.json({
      success: true,
      result: transformedResult,
    })
  } catch (error) {
    console.error("Error fetching detailed result:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
