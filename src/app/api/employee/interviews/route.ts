import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to get company information
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    console.log("Fetching interviews for employee:", userId)

    // Get current date and time for filtering
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // First, automatically delete or mark expired interviews that are past
    const expiredResult = await db.collection("interviews").deleteMany({
      date: { $lt: today },
      status: { $in: ["scheduled", "confirmed"] },
    })

    console.log(`Deleted ${expiredResult.deletedCount} past interviews`)

    // Also delete very old expired interviews (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const oldExpiredResult = await db.collection("interviews").deleteMany({
      date: { $lt: sevenDaysAgo },
      status: "expired",
    })

    console.log(`Deleted ${oldExpiredResult.deletedCount} old expired interviews`)

    // Get only current and future interviews for this employee
    const interviews = await db
      .collection("interviews")
      .find({
        $and: [
          // Date filter - only today and future dates
          { date: { $gte: today } },
          // Employee/Company filter for data isolation
          {
            $or: [
              { scheduledBy: new ObjectId(userId) },
              { employeeId: new ObjectId(userId) },
              { createdBy: new ObjectId(userId) },
              { companyId: employee._id.toString() },
              { companyName: employee.companyName },
            ],
          },
          // Status filter - exclude cancelled and expired
          { status: { $nin: ["cancelled", "expired", "deleted"] } },
        ],
      })
      .sort({ date: 1, time: 1 }) // Sort by date and time ascending
      .toArray()

    console.log(`Found ${interviews.length} current/future interviews for employee ${userId}`)

    // Format interviews with candidate details
    const formattedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        let candidateName = "Unknown Candidate"
        let candidateEmail = ""

        try {
          if (interview.candidateId) {
            // Try to get candidate from both collections
            let candidate = await db.collection("candidates").findOne({
              _id: new ObjectId(interview.candidateId),
            })

            if (!candidate) {
              candidate = await db.collection("students").findOne({
                _id: new ObjectId(interview.candidateId),
              })
            }

            if (candidate) {
              candidateName =
                candidate.name ||
                `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
                "Unknown Candidate"
              candidateEmail = candidate.email || ""
            }
          }
        } catch (error) {
          console.error("Error fetching candidate details:", error)
        }

        return {
          _id: interview._id,
          candidateId: interview.candidateId,
          candidate: {
            name: candidateName,
            email: candidateEmail,
          },
          position: interview.position,
          date: interview.date,
          time: interview.time,
          status: interview.status,
          jobId: interview.jobId,
          meetingLink: interview.meetingLink,
          notes: interview.notes,
          duration: interview.duration,
          scheduledBy: interview.scheduledBy,
          employeeId: interview.employeeId,
          companyId: interview.companyId,
        }
      }),
    )

    console.log(`Returning ${formattedInterviews.length} formatted interviews`)

    return NextResponse.json({ success: true, interviews: formattedInterviews }, { status: 200 })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch interviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { candidateId, jobId, position, date, time, duration, interviewers, meetingLink, notes } = body

    if (!candidateId || !position || !date || !time) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Validate that the interview date is not in the past
    const interviewDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (interviewDate < today) {
      return NextResponse.json(
        { success: false, message: "Cannot schedule interview for a past date" },
        { status: 400 },
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to get company information
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Find candidate (check both collections)
    let candidate = null
    try {
      candidate = await db.collection("candidates").findOne({ _id: new ObjectId(candidateId) })
      if (!candidate) {
        candidate = await db.collection("students").findOne({ _id: new ObjectId(candidateId) })
      }
    } catch (error) {
      console.error("Error finding candidate:", error)
    }

    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 })
    }

    // Create new interview with proper data isolation
    const newInterview = {
      candidateId: new ObjectId(candidateId),
      jobId: jobId ? new ObjectId(jobId) : null,
      position,
      date: new Date(date),
      time,
      duration: Number.parseInt(duration, 10) || 60,
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      meetingLink,
      notes,
      // Data isolation fields
      scheduledBy: new ObjectId(userId),
      employeeId: new ObjectId(userId),
      companyId: employee._id.toString(),
      companyName: employee.companyName,
      // Status and timestamps
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(userId),
    }

    console.log("Creating interview with data:", newInterview)

    const result = await db.collection("interviews").insertOne(newInterview)

    console.log("Interview created with ID:", result.insertedId)

    // Update job's interview count if jobId is provided
    if (jobId) {
      await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { interviews: 1 } })
    }

    // Update candidate status
    if (candidate) {
      await db.collection("candidates").updateOne({ _id: new ObjectId(candidateId) }, { $set: { status: "Interview" } })

      await db.collection("students").updateOne({ _id: new ObjectId(candidateId) }, { $set: { status: "Interview" } })

      // Update job application status if applicable
      if (jobId) {
        await db.collection("job_applications").updateOne(
          {
            candidateId: new ObjectId(candidateId),
            jobId: new ObjectId(jobId),
          },
          {
            $set: {
              status: "Interview",
              updatedAt: new Date(),
            },
            $push: {
              history: {
                status: "Interview",
                date: new Date(),
                note: "Interview scheduled",
              },
            },
          },
        )
      }
    }

    // Send email notification to candidate
    try {
      const candidateEmail = candidate.email
      const candidateName =
        candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Candidate"

      if (candidateEmail) {
        await sendEmail({
          to: candidateEmail,
          subject: `Interview Scheduled: ${position} at ${employee.companyName}`,
          text: `
            Dear ${candidateName},

            Your interview for the ${position} position at ${employee.companyName} has been scheduled.

            Date: ${new Date(date).toLocaleDateString()}
            Time: ${time}
            ${meetingLink ? `Meeting Link: ${meetingLink}` : ""}

            ${notes ? `Additional Notes: ${notes}` : ""}

            Please let us know if you have any questions or need to reschedule.

            Best regards,
            ${employee.firstName} ${employee.lastName}
            ${employee.companyName}
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Interview Scheduled</h2>
              <p>Dear ${candidateName},</p>
              <p>Your interview for the <strong>${position}</strong> position at <strong>${employee.companyName}</strong> has been scheduled.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${time}</p>
                ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
              </div>
              ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ""}
              <p>Please let us know if you have any questions or need to reschedule.</p>
              <p>Best regards,<br>${employee.firstName} ${employee.lastName}<br>${employee.companyName}</p>
            </div>
          `,
        })
      }
    } catch (emailError) {
      console.error("Error sending interview notification email:", emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Interview scheduled successfully",
        interviewId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error scheduling interview:", error)
    return NextResponse.json({ success: false, message: "Failed to schedule interview" }, { status: 500 })
  }
}
