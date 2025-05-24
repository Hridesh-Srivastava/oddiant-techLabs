import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const studentId = params.id
    const { comment, jobId } = await request.json()

    if (!comment) {
      return NextResponse.json({ message: "Comment is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to verify
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Update student with comment
    const result = await db.collection("students").updateOne(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          lastComment: comment,
          updatedAt: new Date(),
        },
        $push: {
          comments: {
            text: comment,
            createdAt: new Date(),
            createdBy: new ObjectId(userId),
            jobId: jobId ? new ObjectId(jobId) : null,
          },
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    // If jobId is provided, also update the job application
    if (jobId) {
      // Check if job application exists
      const application = await db.collection("job_applications").findOne({
        candidateId: new ObjectId(studentId),
        jobId: new ObjectId(jobId),
      })

      if (application) {
        // Update existing application
        await db.collection("job_applications").updateOne(
          { _id: application._id },
          {
            $set: {
              lastComment: comment,
              updatedAt: new Date(),
            },
            $push: {
              comments: {
                text: comment,
                createdAt: new Date(),
                createdBy: new ObjectId(userId),
              },
            },
          },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Comment added successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ success: false, message: "Failed to add comment" }, { status: 500 })
  }
}
