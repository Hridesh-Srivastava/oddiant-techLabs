import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const interviewId = resolvedParams.id
    const body = await request.json()

    // Validate ObjectId format
    if (!ObjectId.isValid(interviewId)) {
      return NextResponse.json({ success: false, message: "Invalid interview ID" }, { status: 400 })
    }

    const { feedback, submittedBy } = body

    if (!feedback || !feedback.trim()) {
      return NextResponse.json({ success: false, message: "Feedback is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find interview
    const interview = await db.collection("interviews").findOne({
      _id: new ObjectId(interviewId),
    })

    if (!interview) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    // Add feedback to interview
    const feedbackEntry = {
      feedback: feedback.trim(),
      submittedBy: submittedBy || "candidate",
      submittedAt: new Date(),
      _id: new ObjectId(),
    }

    const result = await db.collection("interviews").updateOne(
      { _id: new ObjectId(interviewId) },
      {
        $push: { feedback: feedbackEntry } as any,
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to submit feedback" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        feedbackId: feedbackEntry._id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ success: false, message: "Failed to submit feedback" }, { status: 500 })
  }
}
