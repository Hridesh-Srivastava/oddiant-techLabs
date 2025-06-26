import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Get comments for a specific job application
export async function GET(request: NextRequest, context: { params: Promise<{ id: string; candidateId: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: jobId, candidateId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find the specific job application - handle all possible candidate ID fields
    const application = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { candidateId: new ObjectId(candidateId) },
        { studentId: new ObjectId(candidateId) },
        { applicantId: new ObjectId(candidateId) },
      ],
    })

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 })
    }

    // Return the comments for this SPECIFIC job application only
    return NextResponse.json({
      success: true,
      comments: application.comments || [],
      lastComment: application.lastComment || null,
      jobId: jobId,
      candidateId: candidateId,
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch comments" }, { status: 500 })
  }
}

// Add a new comment to a specific job application
export async function POST(request: NextRequest, context: { params: Promise<{ id: string; candidateId: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: jobId, candidateId } = await context.params
    const { comment } = await request.json()

    if (!comment || !comment.trim()) {
      return NextResponse.json({ message: "Comment is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get employee details for the comment
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })
    const employeeName = employee
      ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email
      : "Unknown Employee"

    // Create a new comment object
    const newComment = {
      _id: new ObjectId(),
      text: comment.trim(),
      createdAt: new Date(),
      createdBy: userId,
      createdByName: employeeName,
      jobId: jobId, // Add jobId to comment for tracking
      candidateId: candidateId, // Add candidateId to comment for tracking
    }

    // Update ONLY the specific job application with the new comment
    const result = await db.collection("job_applications").updateOne(
      {
        jobId: new ObjectId(jobId),
        $or: [
          { candidateId: new ObjectId(candidateId) },
          { studentId: new ObjectId(candidateId) },
          { applicantId: new ObjectId(candidateId) },
        ],
      },
      {
        $push: { comments: newComment } as any,
        $set: {
          lastComment: comment.trim(),
          lastCommentDate: new Date(),
          lastCommentBy: userId,
          lastCommentByName: employeeName,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Failed to add comment - Application not found" }, { status: 404 })
    }

    console.log(
      `Comment added successfully to job ${jobId} for candidate ${candidateId} - Comment: "${comment.trim()}"`,
    )

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
      jobId: jobId,
      candidateId: candidateId,
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ success: false, message: "Failed to add comment" }, { status: 500 })
  }
}
