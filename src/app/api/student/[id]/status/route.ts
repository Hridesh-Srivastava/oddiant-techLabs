import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params as they're now Promise-based in Next.js 15
    const params = await context.params

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const studentId = params.id
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

    // Check both students and candidates collections for the target user
    let targetUser = await db.collection("students").findOne({ _id: new ObjectId(studentId) })
    let targetUserCollection = "students"

    if (!targetUser) {
      targetUser = await db.collection("candidates").findOne({ _id: new ObjectId(studentId) })
      targetUserCollection = "candidates"
    }

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Update user status in the correct collection
    const result = await db.collection(targetUserCollection).updateOne(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          status: status,
          lastComment: comment || undefined,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // If jobId is provided, also update the job application
    if (jobId) {
      // Check if job application exists (check multiple field names)
      const application = await db.collection("job_applications").findOne({
        jobId: new ObjectId(jobId),
        $or: [
          { candidateId: new ObjectId(studentId) },
          { studentId: new ObjectId(studentId) },
          { applicantId: new ObjectId(studentId) },
        ],
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
            } as any,
          },
        )
      } else {
        // Create new application if it doesn't exist
        const newApplication = {
          // Use the appropriate field based on user collection
          ...(targetUserCollection === "students"
            ? { studentId: new ObjectId(studentId) }
            : { candidateId: new ObjectId(studentId) }),
          // Also add a generic applicantId for easier querying
          applicantId: new ObjectId(studentId),
          applicantCollection: targetUserCollection,

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

          // Include basic user info for easier querying
          studentName: [targetUser.salutation, targetUser.firstName, targetUser.middleName, targetUser.lastName].filter(Boolean).join(' ') || "Unknown",
          studentEmail: targetUser.email || "",
        }

        await db.collection("job_applications").insertOne(newApplication)

        // Update job applicants count
        await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "User status updated successfully",
        targetUserCollection, // Include for debugging
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ success: false, message: "Failed to update user status" }, { status: 500 })
  }
}
