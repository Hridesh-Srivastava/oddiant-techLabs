import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: testId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find test by ID
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
      status: "Active", // Only active tests can be taken
    })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found or not active" }, { status: 404 })
    }

    // Remove sensitive data like correct answers for non-admin users
    const sanitizedTest = {
      ...test,
      sections: test.sections.map((section: any) => ({
        ...section,
        questions: section.questions.map((question: any) => {
          // For public access, remove correct answers
          const { correctAnswer, ...rest } = question
          return rest
        }),
      })),
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, test: sanitizedTest },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching test:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch test" }, { status: 500 })
  }
}
