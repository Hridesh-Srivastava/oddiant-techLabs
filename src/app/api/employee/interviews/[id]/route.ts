import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

// IST helper functions
function createISTDateFromString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  const istDate = new Date()
  istDate.setUTCFullYear(year)
  istDate.setUTCMonth(month - 1)
  istDate.setUTCDate(day)
  istDate.setUTCHours(5, 30, 0, 0) // Set to IST midnight (5:30 UTC)
  return istDate
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const interviewId = resolvedParams.id

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const interviewId = resolvedParams.id
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

    // FIXED: Proper IST date handling for reschedule
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    }

    // If date is being updated, convert to proper IST format
    if (body.date) {
      console.log("=== RESCHEDULE DATE UPDATE (IST) ===")
      console.log("Original date:", body.date)

      // Create proper IST date for the new date
      const newISTDate = createISTDateFromString(body.date)
      updateData.date = newISTDate

      console.log("New IST date:", newISTDate.toISOString())
      console.log("New IST local:", newISTDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
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

        // FIXED: Send public interview page link instead of Google Meet link
        const publicInterviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/interview/${interviewId}/join`

        await sendEmail({
          to: candidate.email,
          subject: `Interview Rescheduled: ${interview.position} at ${employee.companyName}`,
          text: `
            Dear ${candidateName},

            Your interview for the ${interview.position} position at ${employee.companyName} has been rescheduled.

            New Date: ${body.date}
            New Time: ${body.time} (IST)
            
            To join your interview, please visit: ${publicInterviewUrl}

            ${body.notes ? `Additional Notes: ${body.notes}` : ""}

            Please let us know if you have any questions.

            Best regards,
            ${employee.firstName} ${employee.lastName}
            ${employee.companyName}
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Interview Rescheduled</h1>
                <p style="color: #666; font-size: 16px;">Your interview has been updated with new timing!</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h2 style="color: #333; margin-top: 0;">${interview.position}</h2>
                <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> ${employee.companyName}</p>
                <p style="color: #666; margin: 5px 0;"><strong>New Date:</strong> ${body.date}</p>
                <p style="color: #666; margin: 5px 0;"><strong>New Time:</strong> ${body.time} (IST)</p>
              </div>

              ${body.notes ? `<div style="margin-bottom: 25px;"><h3 style="color: #333;">Additional Notes:</h3><p style="color: #666; line-height: 1.6;">${body.notes}</p></div>` : ""}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${publicInterviewUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Join Interview
                </a>
              </div>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  This interview was rescheduled by ${employee.firstName} ${employee.lastName} from ${employee.companyName}.
                </p>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
                  Please save this link to join your interview at the scheduled time.
                </p>
              </div>
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const interviewId = resolvedParams.id

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
