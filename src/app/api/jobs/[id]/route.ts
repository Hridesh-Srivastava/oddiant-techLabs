import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const { searchParams } = new URL(request.url)
    const invitationToken = searchParams.get("invitation")

    // Connect to database
    const { db } = await connectToDatabase()

    // Find job by ID - IMPORTANT: Removed the status filter to fix the sharing issue
    const job = await db.collection("jobs").findOne({
      _id: new ObjectId(jobId),
    })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // If there's an invitation token, validate and mark as viewed
    if (invitationToken) {
      try {
        const invitation = await db.collection("invitations").findOne({
          token: invitationToken,
          jobId: new ObjectId(jobId),
          status: { $in: ["pending", "sent"] },
        })

        if (invitation) {
          // Mark invitation as viewed
          await db.collection("invitations").updateOne(
            { _id: invitation._id },
            {
              $set: {
                status: "viewed",
                viewedAt: new Date(),
              },
            },
          )

          // Add invitation context to the response
          job.invitationContext = {
            candidateName: invitation.candidateName,
            invitedBy: invitation.companyName,
            isInvited: true,
          }
        }
      } catch (invitationError) {
        console.error("Error processing invitation:", invitationError)
        // Continue without invitation context if there's an error
      }
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, job },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Validate the job ID format
    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json({ success: false, message: "Invalid job ID format" }, { status: 400 })
    }

    // Delete job from database (actual deletion instead of status update)
    const result = await db.collection("jobs").deleteOne({ _id: new ObjectId(jobId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Job deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json({ success: false, message: "Failed to delete job" }, { status: 500 })
  }
}
