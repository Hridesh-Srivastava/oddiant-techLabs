import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Debug: Log the auth_token cookie
    const rawToken = request.cookies.get("auth_token")?.value;
    console.log("[DEBUG] auth_token cookie:", rawToken);

    // Authenticate student
    const token = request.cookies.get("auth_token")?.value;
    console.log("[DEBUG] Extracted token:", token);
    const authResult = token ? verifyToken(token) : null;
    console.log("[DEBUG] verifyToken result:", authResult);
    if (!authResult || !authResult.userId) {
      console.log("[DEBUG] Unauthorized: No valid userId");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Parse filters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty")

    // Connect to DB
    const { db } = await connectToDatabase()

    // Build query
    const query: any = { status: "Active" }
    if (category && category !== "all") query["category"] = category
    if (difficulty && difficulty !== "all") query["difficulty"] = difficulty

    // Fetch tests
    const tests = await db.collection("assessment_tests").find(query).sort({ createdAt: -1 }).toArray()
    console.log("[DEBUG] Number of tests fetched:", tests.length);

    // Map to frontend structure
    const transformedTests = tests.map((test) => ({
      id: test._id?.toString() || "",
      title: test.name || test.title || "Untitled Test",
      description: test.description || "",
      duration: test.duration || 60,
      questions: Array.isArray(test.sections)
        ? test.sections.reduce((acc, sec) => acc + (Array.isArray(sec.questions) ? sec.questions.length : 0), 0)
        : 0,
      difficulty: test.difficulty || "intermediate",
      category: test.category || "general",
      status: test.status || "Active",
      createdAt: test.createdAt ? (typeof test.createdAt === "string" ? test.createdAt : test.createdAt.toISOString()) : new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      tests: transformedTests,
    })
  } catch (error) {
    console.error("Error fetching tests for students:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
