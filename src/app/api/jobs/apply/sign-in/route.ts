import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, jobId } = await request.json()

    if (!email || !jobId) {
      return NextResponse.json({ success: false, message: "Email and jobId are required" }, { status: 400 })
    }

    // Connect to database
    const { db, client } = await connectToDatabase()

    // Start a session for transaction
    const session = client.startSession()

    try {
      // Start transaction
      session.startTransaction()

      // Find the job
      const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

      if (!job) {
        await session.abortTransaction()
        return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
      }

      // Check if user already exists in users collection
      const existingUser = await db.collection("users").findOne({ email })

      // If user doesn't exist in users collection, check candidates collection
      let existingCandidate = null
      if (!existingUser) {
        existingCandidate = await db.collection("candidates").findOne({ email })
      }

      // If user doesn't exist in users or candidates collection, check students collection
      let existingStudent = null
      if (!existingUser) {
        existingStudent = await db.collection("students").findOne({ email })
      }

      // If user doesn't exist in any collection, return not found
      if (!existingUser && !existingCandidate && !existingStudent) {
        await session.abortTransaction()
        return NextResponse.json({
          success: true,
          exists: false,
          message: "No existing user found with this email",
        })
      }

      // Get candidate details
      let candidate = existingCandidate
      let candidateId: ObjectId | null = null

      if (!candidate) {
        // Create a new candidate record if user exists but no candidate record
        if (existingUser) {
          const fullName = [existingUser.salutation, existingUser.firstName, existingUser.middleName, existingUser.lastName]
            .filter(Boolean)
            .join(' ');
          const newCandidate = {
            name: fullName,
            firstName: existingUser.firstName || "",
            middleName: existingUser.middleName || "",
            lastName: existingUser.lastName || "",
            salutation: existingUser.salutation || "",
            email: existingUser.email,
            phone: existingUser.phone || "",
            status: "Applied",
            role: job.jobTitle,
            location: job.jobLocation || "",
            experience: job.experienceRange || "",
            appliedDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: existingUser._id,
          }

          const candidateResult = await db.collection("candidates").insertOne(newCandidate, { session })
          candidateId = candidateResult.insertedId
          candidate = { ...newCandidate, _id: candidateResult.insertedId } as any
        }
        // If student exists but no candidate record, DO NOT create a new candidate entry
        else if (existingStudent) {
          // For students users, do not create/update candidates entry
          // Instead, use studentId for job application and skip candidate creation
          candidateId = null;
        }
      } else {
        candidateId = candidate._id
      }

      // If user is a students user and not a candidate, use studentId for job application
      const applicationCandidateId = candidateId;
      let applicationStudentId = null;
      if (!candidateId && existingStudent) {
        applicationStudentId = existingStudent._id;
      }

      // Ensure at least one ID is present before proceeding
      if (!applicationCandidateId && !applicationStudentId) {
        await session.abortTransaction()
        return NextResponse.json({ success: false, message: "Failed to create or find candidate" }, { status: 500 })
      }

      // Check if already applied to this job
      const existingApplication = await db.collection("job_applications").findOne({
        jobId: new ObjectId(jobId),
        ...(applicationCandidateId ? { candidateId: applicationCandidateId } : {}),
        ...(applicationStudentId ? { studentId: applicationStudentId } : {}),
      })

      if (existingApplication) {
        await session.abortTransaction()
        return NextResponse.json({
          success: true,
          exists: true,
          message: "You have already applied to this job",
        })
      }

      // Create job application record
      const application = {
        jobId: new ObjectId(jobId),
        ...(applicationCandidateId ? { candidateId: applicationCandidateId } : {}),
        ...(applicationStudentId ? { studentId: applicationStudentId } : {}),
        status: "Applied",
        appliedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add full student info if student user
        ...(existingStudent ? {
          studentName: [existingStudent.salutation, existingStudent.firstName, existingStudent.middleName, existingStudent.lastName].filter(Boolean).join(' '),
          studentEmail: existingStudent.email || existingStudent.email1,
          applicationCollection: "students",
          history: [{
            status: "applied",
            date: new Date(),
            note: "Application submitted"
          }],
        } : {}),
        // Add full candidate info if candidate user
        ...(candidate && !existingStudent ? {
          candidateName: [candidate.salutation, candidate.firstName, candidate.middleName, candidate.lastName].filter(Boolean).join(' '),
          candidateEmail: candidate.email,
          applicationCollection: "candidates",
          history: [{
            status: "applied",
            date: new Date(),
            note: "Application submitted"
          }],
        } : {}),
      }

      const applicationResult = await db.collection("job_applications").insertOne(application, { session })

      // Update the job's applicant count
      await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } }, { session })

      // Commit the transaction
      await session.commitTransaction()

      // Send confirmation email to candidate/student
      try {
        const fullNameForEmail = (candidate && candidate.name) ||
          (existingStudent && [existingStudent.salutation, existingStudent.firstName, existingStudent.middleName, existingStudent.lastName].filter(Boolean).join(' ')) ||
          "Applicant";
        await sendEmail({
          to: email,
          subject: `Application Received: ${job.jobTitle} at ${job.companyName}`,
          text: `
            Dear ${fullNameForEmail},

            Thank you for applying for the ${job.jobTitle} position at ${job.companyName}.

            We have received your application and will review it shortly. If your qualifications match our requirements, we will contact you for the next steps.

            Best regards,
            ${job.companyName} Recruitment Team
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Application Received</h2>
              <p>Dear ${fullNameForEmail},</p>
              <p>Thank you for applying for the <strong>${job.jobTitle}</strong> position at <strong>${job.companyName}</strong>.</p>
              <p>We have received your application and will review it shortly. If your qualifications match our requirements, we will contact you for the next steps.</p>
              <p>Best regards,<br>${job.companyName} Recruitment Team</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError)
        // Continue with the process even if email fails
      }

      return NextResponse.json(
        {
          success: true,
          exists: true,
          message: "Application submitted successfully",
          candidateId: applicationCandidateId ? applicationCandidateId.toString() : undefined,
          studentId: applicationStudentId ? applicationStudentId.toString() : undefined,
          source: applicationStudentId ? "student" : applicationCandidateId ? "candidate" : "user",
        },
        { status: 201 },
      )
    } catch (error: any) {
      // Abort transaction on error
      await session.abortTransaction()
      throw error
    } finally {
      // End session
      await session.endSession()
    }
  } catch (error: any) {
    console.error("Error during job application:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Job application failed: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
