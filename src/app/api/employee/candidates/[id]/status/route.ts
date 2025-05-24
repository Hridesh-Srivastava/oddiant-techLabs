import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidateId = params.id
    const { status, jobId, comment } = await request.json()

    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to verify
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Update candidate status in candidates collection
    const candidateResult = await db.collection("candidates").updateOne(
      { _id: new ObjectId(candidateId) },
      {
        $set: {
          status: status,
          lastComment: comment || undefined,
          updatedAt: new Date(),
        },
      },
    )

    // If candidate not found in candidates collection, try students collection
    if (candidateResult.matchedCount === 0) {
      const studentResult = await db.collection("students").updateOne(
        { _id: new ObjectId(candidateId) },
        {
          $set: {
            status: status,
            lastComment: comment || undefined,
            updatedAt: new Date(),
          },
        },
      )

      if (studentResult.matchedCount === 0) {
        return NextResponse.json({ message: "Candidate not found" }, { status: 404 })
      }
    }

    // If jobId is provided, also update the job application
    if (jobId) {
      // Check if job application exists
      const application = await db.collection("job_applications").findOne({
        candidateId: new ObjectId(candidateId),
        jobId: new ObjectId(jobId),
      })

      if (application) {
        // Update existing application
        await db.collection("job_applications").updateOne(
          { _id: application._id },
          {
            $set: {
              status: status,
              lastComment: comment || application.lastComment,
              updatedAt: new Date(),
            },
            $push: {
              history: {
                status: status,
                date: new Date(),
                note: comment || `Status updated to ${status}`,
              },
            },
          },
        )
      } else {
        // Create new application if it doesn't exist
        const newApplication = {
          candidateId: new ObjectId(candidateId),
          jobId: new ObjectId(jobId),
          status: status,
          appliedDate: new Date(),
          history: [
            {
              status: status,
              date: new Date(),
              note: comment || `Status set to ${status}`,
            },
          ],
          lastComment: comment || null,
          employerId: new ObjectId(userId),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("job_applications").insertOne(newApplication)

        // Update job applicants count
        await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } })
      }
    }

    return NextResponse.json({ success: true, message: "Candidate status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating candidate status:", error)
    return NextResponse.json({ success: false, message: "Failed to update candidate status" }, { status: 500 })
  }
}
