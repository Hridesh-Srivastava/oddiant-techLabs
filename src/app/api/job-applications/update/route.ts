import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { candidateId, jobId, status, comment } = await request.json()

    if (!candidateId || !jobId || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to verify
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Find job to verify it belongs to this employee
    const job = await db.collection("jobs").findOne({
      _id: new ObjectId(jobId),
      employerId: new ObjectId(userId),
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found or unauthorized access" }, { status: 404 })
    }

    // Find application
    const application = await db.collection("job_applications").findOne({
      candidateId: new ObjectId(candidateId),
      jobId: new ObjectId(jobId),
    })

    if (!application) {
      // Create application if it doesn't exist
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
    } else {
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
          } as any,
        },
      )
    }

    return NextResponse.json({ success: true, message: "Application status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json({ success: false, message: "Failed to update application status" }, { status: 500 })
  }
}
