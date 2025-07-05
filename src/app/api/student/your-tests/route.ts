import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    console.log("[DEBUG] Extracted token:", token);
    const authResult = token ? verifyToken(token) : null;
    console.log("[DEBUG] verifyToken result:", authResult);
    if (!authResult || !authResult.userId) {
      console.log("[DEBUG] Unauthorized: No valid userId");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const studentId = authResult.userId
    const studentObjectId = new ObjectId(studentId)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    // Connect to database
    const { db } = await connectToDatabase()

    // Build query for student's results (support both studentId and candidateId as ObjectId)
    const query: any = {
      $or: [
        { studentId: studentObjectId },
        { candidateId: studentObjectId },
      ],
    }

    // Add filters if provided
    if (status && status !== "all") {
      query.status = status
    }
    if (category && category !== "all") {
      // Filter by type only, case-insensitive
      query["type"] = { $regex: `^${category}$`, $options: "i" };
    }

    // Fetch student's test results from assessment_results collection
    const testResults = await db.collection("assessment_results").find(query).sort({ createdAt: -1 }).toArray()

    // Get test details for each result
    const testsWithDetails = await Promise.all(
      testResults.map(async (result) => {
        const test = await db.collection("assessment_tests").findOne({
          _id: new ObjectId(result.testId),
        })

        // Calculate progress for in-progress tests (if needed)
        let progress = 0
        if (result.status === "in-progress" && result.answeredQuestions && test?.questions) {
          progress = Math.round((result.answeredQuestions.length / test.questions.length) * 100)
        }

        return {
          id: result._id.toString(),
          testId: result.testId?.toString() || "",
          testTitle: test?.name || test?.title || test?.testTitle || "Unknown Test",
          description: test?.description || "",
          status: result.status, // preserve original case for badge
          score: result.score || null,
          totalQuestions: Array.isArray(test?.sections) ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0) : (test?.questions?.length || test?.totalQuestions || 0),
          correctAnswers: result.correctAnswers || null,
          duration: test?.duration || 60,
          timeTaken: result.timeTaken || null,
          completedAt: result.completionDate || result.completedAt || null,
          startedAt: result.startedAt,
          difficulty: test?.difficulty || "intermediate",
          category: test?.category || "general",
          type: test?.type || "", // Add this line to sync type from backend
          grade: result.grade || null,
          progress: progress,
          token: result.token || null, // Ensure token is included in the response
        }
      }),
    )

    return NextResponse.json({
      success: true,
      tests: testsWithDetails,
    })
  } catch (error) {
    console.error("Error fetching student tests:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
