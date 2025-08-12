import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: Request, context: any) {
  try {
    // Verify authentication
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    const authResult = token ? verifyToken(token) : null;
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const studentId = authResult.userId
    const params = await context.params
    const resultId = params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Fetch specific result from assessment_results
    const result = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
      $or: [
        { studentId: new ObjectId(studentId) },
        { candidateId: new ObjectId(studentId) }
      ],
      resultsDeclared: true,
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Fetch the corresponding test for meta info
    const test = await db.collection("assessment_tests").findOne({ _id: new ObjectId(result.testId) });

    // Build detailed questions/answers array
    let questions = [];
    if (Array.isArray(test?.sections)) {
      questions = test.sections.flatMap((section) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (section.questions || []).map((q: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userAnswerObj = (result.answers || []).find((a: any) => a.questionId === q.id);
          return {
            id: q.id,
            question: q.text,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            userAnswer: userAnswerObj?.answer ?? "",
            isCorrect: userAnswerObj?.isCorrect ?? false,
            explanation: q.explanation || "",
            points: q.points || 0,
            timeSpent: userAnswerObj?.timeSpent || 0,
            // Add codingTestResults for coding questions
            ...(q.type === 'Coding' && userAnswerObj?.codingTestResults ? { codingTestResults: userAnswerObj.codingTestResults } : {}),
            // Include final submitted code and language if available
            ...(q.type === 'Coding' && userAnswerObj?.code ? { code: userAnswerObj.code, language: userAnswerObj.language } : {}),
            // Include submission history if available
            ...(q.type === 'Coding' && Array.isArray(userAnswerObj?.codeSubmissions) && userAnswerObj.codeSubmissions.length > 0
              ? { codeSubmissions: userAnswerObj.codeSubmissions }
              : {}),
          };
        })
      );
    }

    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: { correct: number; total: number } } = {};
    for (const q of questions) {
      const cat = q.type || "general";
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { correct: 0, total: 0 };
      categoryBreakdown[cat].total++;
      if (q.isCorrect) categoryBreakdown[cat].correct++;
    }

    // Recommendations (reuse existing logic)
    const recommendations = [];
    const score = result.score || 0;
    if (score < 50) {
      recommendations.push("Focus on fundamental concepts and practice more");
      recommendations.push("Consider reviewing the study materials again");
    } else if (score < 75) {
      recommendations.push("Good progress! Work on areas where you scored lower");
      recommendations.push("Practice more challenging questions");
    } else {
      recommendations.push("Excellent performance! Keep up the good work");
      recommendations.push("Consider taking advanced level assessments");
    }

    const transformedResult = {
      id: result._id.toString(),
      testId: result.testId?.toString() || "",
      testTitle: result.testTitle || result.testName || test?.name || test?.title || "Unknown Test",
      description: result.description || test?.description || "",
      status: result.status,
      score: result.score || 0,
      totalQuestions: Array.isArray(test?.sections) ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0) : (test?.questions?.length || test?.totalQuestions || 0),
      correctAnswers: result.correctAnswers || 0,
      incorrectAnswers: (Array.isArray(test?.sections) ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0) : (test?.questions?.length || test?.totalQuestions || 0)) - (result.correctAnswers || 0),
      duration: test?.duration || result.duration || 0,
      timeTaken: result.timeTaken || 0,
      completedAt: result.completedAt || result.completionDate,
      startedAt: result.startedAt || "",
      difficulty: test?.difficulty || result.difficulty || "intermediate",
      category: test?.category || result.category || "general",
      type: test?.type || result.type || "",
      grade: result.grade || "",
      passingScore: test?.passingScore || 70,
      resultStatus: result.resultsDeclared ? "published" : "pending",
      publishedAt: result.resultsDeclaredAt || result.completedAt || result.completionDate,
      questions,
      categoryBreakdown,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      result: transformedResult,
    })
  } catch (error) {
    console.error("Error fetching detailed result:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
