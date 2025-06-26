import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: interviewId } = await context.params
    const { rating, strengths, weaknesses, recommendation } = await request.json()

    if (!rating || !strengths || !weaknesses || !recommendation) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find interview to verify it exists
    const interview = await db.collection("interviews").findOne({ _id: new ObjectId(interviewId) })

    if (!interview) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    // Find employee to get submitter information
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    const submitterName = `${employee.firstName} ${employee.lastName}`

    // Add feedback to interview
    const result = await db.collection("interviews").updateOne(
      { _id: new ObjectId(interviewId) },
      {
        $push: {
          feedback: {
            rating: Number.parseInt(rating),
            strengths,
            weaknesses,
            recommendation,
            submittedBy: submitterName,
            submittedAt: new Date(),
          },
        } as any,
        $set: {
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    // If interview status is "Scheduled", update it to "Completed"
    if (interview.status === "Scheduled") {
      await db.collection("interviews").updateOne(
        { _id: new ObjectId(interviewId) },
        {
          $set: {
            status: "Completed",
          },
        },
      )
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ success: false, message: "Failed to submit feedback" }, { status: 500 })
  }
}
