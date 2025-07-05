import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth_token")?.value;
    console.log("[DEBUG] Extracted token:", token);
    const authResult = token ? verifyToken(token) : null;
    console.log("[DEBUG] verifyToken result:", authResult);
    if (!authResult || !authResult.userId) {
      console.log("[DEBUG] Unauthorized: No valid userId");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const studentId = authResult.userId
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    // Connect to database
    const { db } = await connectToDatabase()

    const studentObjectId = new ObjectId(studentId)
    // Build query for student results
    const query: any = {
      $or: [
        { studentId: studentObjectId },
        { candidateId: studentObjectId }
      ],
      resultsDeclared: true
    }

    // Add category filter if provided (use type, case-insensitive, like other sections)
    if (category && category !== "all") {
      query["type"] = { $regex: `^${category}$`, $options: "i" };
    }

    // Fetch results from assessment_results collection
    const results = await db.collection("assessment_results").find(query).sort({ completedAt: -1 }).toArray()

    // Transform results to match frontend interface, fetching test details for type, duration, questions
    const transformedResults = await Promise.all(results.map(async (result) => {
      const test = await db.collection("assessment_tests").findOne({ _id: new ObjectId(result.testId) });
      return {
        id: result._id.toString(),
        testId: result.testId?.toString() || "",
        testTitle: result.testTitle || result.testName || test?.name || test?.title || "Unknown Test",
        description: result.description || test?.description || "",
        status: result.status,
        score: result.score || 0,
        totalQuestions: Array.isArray(test?.sections) ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0) : (test?.questions?.length || test?.totalQuestions || 0),
        correctAnswers: result.correctAnswers || 0,
        duration: test?.duration || result.duration || 0,
        timeTaken: result.timeTaken || 0,
        completedAt: result.completedAt || result.completionDate,
        difficulty: test?.difficulty || result.difficulty || "intermediate",
        category: test?.category || result.category || "general",
        type: test?.type || result.type || "",
        grade: result.grade || "",
        resultStatus: result.resultsDeclared ? "published" : "pending",
      }
    }))

    return NextResponse.json({
      success: true,
      results: transformedResults,
    })
  } catch (error) {
    console.error("Error fetching student results:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
