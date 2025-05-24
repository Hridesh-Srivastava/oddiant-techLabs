import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const interviewId = await params.id

    // Validate ObjectId format
    if (!ObjectId.isValid(interviewId)) {
      return NextResponse.json({ success: false, message: "Invalid interview ID" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to get company information
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    console.log("Fetching interview details for ID:", interviewId, "Employee:", userId)

    // Find interview with proper data isolation
    const interview = await db.collection("interviews").findOne({
      $and: [
        { _id: new ObjectId(interviewId) },
        {
          $or: [
            { scheduledBy: new ObjectId(userId) },
            { employeeId: new ObjectId(userId) },
            { createdBy: new ObjectId(userId) },
            { companyId: employee._id.toString() },
            { companyName: employee.companyName },
          ],
        },
      ],
    })

    if (!interview) {
      console.log("Interview not found for ID:", interviewId)
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    console.log("Found interview:", interview._id)

    // Get candidate details
    let candidate = null
    try {
      if (interview.candidateId) {
        candidate = await db.collection("candidates").findOne({ _id: new ObjectId(interview.candidateId) })

        if (!candidate) {
          candidate = await db.collection("students").findOne({ _id: new ObjectId(interview.candidateId) })
        }
      }
    } catch (error) {
      console.error("Error fetching candidate:", error)
    }

    // Get job details if jobId exists
    let job = null
    try {
      if (interview.jobId) {
        job = await db.collection("jobs").findOne({ _id: new ObjectId(interview.jobId) })
      }
    } catch (error) {
      console.error("Error fetching job:", error)
    }

    // Format candidate information
    const candidateInfo = candidate
      ? {
          _id: candidate._id,
          name:
            candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown Candidate",
          email: candidate.email || "",
          phone: candidate.phone || "",
          role: candidate.role || interview.position || "",
          status: candidate.status || "Applied",
          avatar: candidate.avatar || null,
        }
      : {
          _id: interview.candidateId,
          name: "Unknown Candidate",
          email: "",
          phone: "",
          role: interview.position || "",
          status: "Applied",
          avatar: null,
        }

    // Format the response
    const formattedInterview = {
      _id: interview._id,
      candidateId: interview.candidateId,
      candidate: candidateInfo,
      job: job
        ? {
            _id: job._id,
            jobTitle: job.jobTitle,
          }
        : null,
      position: interview.position,
      date: interview.date,
      time: interview.time,
      duration: interview.duration || 60,
      interviewers: interview.interviewers || [],
      meetingLink: interview.meetingLink || "",
      notes: interview.notes || "",
      status: interview.status || "scheduled",
      location: interview.location || "Remote",
      feedback: interview.feedback || [],
      scheduledBy: interview.scheduledBy,
      employeeId: interview.employeeId,
      companyId: interview.companyId,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }

    console.log("Returning formatted interview data")

    return NextResponse.json({ success: true, interview: formattedInterview }, { status: 200 })
  } catch (error) {
    console.error("Error fetching interview:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch interview" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const interviewId = params.id
    const body = await request.json()

    // Validate ObjectId format
    if (!ObjectId.isValid(interviewId)) {
      return NextResponse.json({ success: false, message: "Invalid interview ID" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Find the interview with proper data isolation
    const interview = await db.collection("interviews").findOne({
      $and: [
        { _id: new ObjectId(interviewId) },
        {
          $or: [
            { scheduledBy: new ObjectId(userId) },
            { employeeId: new ObjectId(userId) },
            { createdBy: new ObjectId(userId) },
            { companyId: employee._id.toString() },
            { companyName: employee.companyName },
          ],
        },
      ],
    })

    if (!interview) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    // Find candidate
    let candidate = null
    try {
      if (interview.candidateId) {
        candidate = await db.collection("candidates").findOne({ _id: new ObjectId(interview.candidateId) })

        if (!candidate) {
          candidate = await db.collection("students").findOne({ _id: new ObjectId(interview.candidateId) })
        }
      }
    } catch (error) {
      console.error("Error fetching candidate:", error)
    }

    // Update interview
    const updateData = {
      ...body,
      date: body.date ? new Date(body.date) : interview.date,
      updatedAt: new Date(),
    }

    const result = await db.collection("interviews").updateOne({ _id: new ObjectId(interviewId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    // Send email notification if rescheduled
    if (body.status === "rescheduled" && candidate) {
      try {
        const candidateName =
          candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Candidate"

        await sendEmail({
          to: candidate.email,
          subject: `Interview Rescheduled: ${interview.position} at ${employee.companyName}`,
          text: `
            Dear ${candidateName},

            Your interview for the ${interview.position} position at ${employee.companyName} has been rescheduled.

            New Date: ${new Date(body.date).toLocaleDateString()}
            New Time: ${body.time}
            ${body.meetingLink ? `Meeting Link: ${body.meetingLink}` : ""}

            ${body.notes ? `Additional Notes: ${body.notes}` : ""}

            Please let us know if you have any questions.

            Best regards,
            ${employee.firstName} ${employee.lastName}
            ${employee.companyName}
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Interview Rescheduled</h2>
              <p>Dear ${candidateName},</p>
              <p>Your interview for the <strong>${interview.position}</strong> position at <strong>${employee.companyName}</strong> has been rescheduled.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>New Date:</strong> ${new Date(body.date).toLocaleDateString()}</p>
                <p><strong>New Time:</strong> ${body.time}</p>
                ${body.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${body.meetingLink}">${body.meetingLink}</a></p>` : ""}
              </div>
              ${body.notes ? `<p><strong>Additional Notes:</strong> ${body.notes}</p>` : ""}
              <p>Please let us know if you have any questions.</p>
              <p>Best regards,<br>${employee.firstName} ${employee.lastName}<br>${employee.companyName}</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending interview rescheduling email:", emailError)
      }
    }

    return NextResponse.json({ success: true, message: "Interview updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating interview:", error)
    return NextResponse.json({ success: false, message: "Failed to update interview" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const interviewId = params.id

    // Validate ObjectId format
    if (!ObjectId.isValid(interviewId)) {
      return NextResponse.json({ success: false, message: "Invalid interview ID" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Delete interview with proper data isolation
    const result = await db.collection("interviews").deleteOne({
      $and: [
        { _id: new ObjectId(interviewId) },
        {
          $or: [
            { scheduledBy: new ObjectId(userId) },
            { employeeId: new ObjectId(userId) },
            { createdBy: new ObjectId(userId) },
            { companyId: employee._id.toString() },
            { companyName: employee.companyName },
          ],
        },
      ],
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Interview deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting interview:", error)
    return NextResponse.json({ success: false, message: "Failed to delete interview" }, { status: 500 })
  }
}
