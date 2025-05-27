import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { candidateId, jobId, candidateEmail, candidateName } = await request.json()

    if (!candidateId || !jobId || !candidateEmail || !candidateName) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Verify user is an employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Verify job belongs to this employee (maintaining isolation)
    const job = await db.collection("jobs").findOne({
      _id: new ObjectId(jobId),
      employerId: new ObjectId(userId), // Ensure data isolation
    })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found or unauthorized access" }, { status: 404 })
    }

    // Check if job is open
    if (job.status !== "open") {
      return NextResponse.json(
        { success: false, message: "Cannot send invitations for jobs that are not open" },
        { status: 400 },
      )
    }

    // Verify candidate exists in either candidates or students collection
    let candidate = await db.collection("candidates").findOne({ _id: new ObjectId(candidateId) })
    let candidateCollection = "candidates"

    if (!candidate) {
      candidate = await db.collection("students").findOne({ _id: new ObjectId(candidateId) })
      candidateCollection = "students"
    }

    if (!candidate) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    // Check if invitation already exists
    const existingInvitation = await db.collection("invitations").findOne({
      candidateId: new ObjectId(candidateId),
      jobId: new ObjectId(jobId),
      employeeId: new ObjectId(userId),
    })

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, message: "Invitation already sent to this candidate for this job" },
        { status: 400 },
      )
    }

    // Check if candidate has already applied to this job
    const existingApplication = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { candidateId: new ObjectId(candidateId) },
        { studentId: new ObjectId(candidateId) },
        { applicantId: new ObjectId(candidateId) },
      ],
    })

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: "Candidate has already applied to this job" },
        { status: 400 },
      )
    }

    // Generate invitation token
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create invitation record
    const invitation = {
      candidateId: new ObjectId(candidateId),
      jobId: new ObjectId(jobId),
      employeeId: new ObjectId(userId),
      email: candidateEmail,
      candidateName: candidateName,
      position: job.jobTitle,
      location: job.jobLocation,
      companyName: job.companyName || employee.companyName || "Company",
      token: invitationToken,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
    }

    await db.collection("invitations").insertOne(invitation)

    // Create job application URL with invitation token
    const jobApplicationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/jobs/${jobId}?invitation=${invitationToken}`

    // Send invitation email
    try {
      await sendEmail({
        to: candidateEmail,
        subject: `Job Invitation: ${job.jobTitle} at ${invitation.companyName}`,
        text: `
          Dear ${candidateName},

          You have been invited to apply for the ${job.jobTitle} position at ${invitation.companyName}.

          Job Details:
          - Position: ${job.jobTitle}
          - Location: ${job.jobLocation}
          - Experience: ${job.experienceRange}
          - Company: ${invitation.companyName}

          To apply for this position, please click the link below:
          ${jobApplicationUrl}

          This invitation is valid for 30 days.

          Best regards,
          ${employee.firstName} ${employee.lastName}
          ${invitation.companyName}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Job Invitation</h1>
              <p style="color: #666; font-size: 16px;">You've been invited to apply for an exciting opportunity!</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #333; margin-top: 0;">${job.jobTitle}</h2>
              <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> ${invitation.companyName}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${job.jobLocation}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Experience:</strong> ${job.experienceRange}</p>
              ${job.salaryRange ? `<p style="color: #666; margin: 5px 0;"><strong>Salary:</strong> ${job.salaryRange}</p>` : ""}
            </div>

            <div style="margin-bottom: 25px;">
              <h3 style="color: #333;">Job Description:</h3>
              <p style="color: #666; line-height: 1.6;">${job.jobDescription.substring(0, 200)}${job.jobDescription.length > 200 ? "..." : ""}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${jobApplicationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Apply Now
              </a>
            </div>

            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This invitation was sent by ${employee.firstName} ${employee.lastName} from ${invitation.companyName}.
              </p>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
                This invitation is valid for 30 days from the date of sending.
              </p>
            </div>
          </div>
        `,
      })

      // Update invitation status to sent
      await db
        .collection("invitations")
        .updateOne({ _id: invitation._id }, { $set: { status: "sent", sentAt: new Date() } })

      return NextResponse.json(
        {
          success: true,
          message: "Invitation sent successfully",
          invitationId: invitation._id,
        },
        { status: 200 },
      )
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError)

      // Update invitation status to failed
      await db
        .collection("invitations")
        .updateOne({ _id: invitation._id }, { $set: { status: "failed", error: emailError.message } })

      return NextResponse.json({ success: false, message: "Failed to send invitation email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending job invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to send invitation" }, { status: 500 })
  }
}
