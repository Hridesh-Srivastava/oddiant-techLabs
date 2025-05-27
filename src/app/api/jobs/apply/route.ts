import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Personal Information
      salutation,
      fullName,
      firstName,
      middleName,
      lastName,
      email,
      phone,
      alternativePhone,
      dateOfBirth,
      gender,
      currentCity,
      currentState,
      pincode,
      profileOutline,

      // Education
      education,
      certifications,

      // Experience
      totalExperience,
      workExperience,
      currentSalary, // ✅ Added - moved from individual work experience
      expectedSalary, // ✅ Added - moved from individual work experience
      noticePeriod, // ✅ Added - moved from individual work experience
      shiftPreference,
      preferredCities,

      // Assets & Documents
      availableAssets,
      identityDocuments,

      // Additional
      skills,
      portfolioLink,
      socialMediaLink,

      // Documents
      resumeUrl,
      videoResumeUrl,
      audioBiodataUrl,
      photographUrl,

      // Original fields
      linkedIn,
      coverLetter,
      additionalInfo,

      // Job ID
      jobId,
    } = body

    console.log("Application submission data received:", {
      fullName,
      email,
      resumeUrl: resumeUrl ? "URL provided" : "Missing",
      jobId,
      currentSalary,
      expectedSalary,
      noticePeriod,
      totalFields: Object.keys(body).length,
    })

    // Validate required fields
    const missingFields = []
    if (!fullName) missingFields.push("fullName")
    if (!email) missingFields.push("email")
    if (!resumeUrl) missingFields.push("resumeUrl")
    if (!jobId) missingFields.push("jobId")

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Start a session for transaction
    const session = db.client.startSession()

    try {
      // Start transaction
      session.startTransaction()

      // Find the job
      const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

      if (!job) {
        await session.abortTransaction()
        return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
      }

      // Check if user already exists
      let userId = null
      const existingUser = await db.collection("users").findOne({ email })

      if (existingUser) {
        userId = existingUser._id
      }

      // Create candidate record with all fields
      const candidate = {
        // Personal Information
        salutation: salutation || "",
        name: fullName,
        firstName: firstName || "",
        middleName: middleName || "",
        lastName: lastName || "",
        email,
        phone: phone || "",
        alternativePhone: alternativePhone || "",
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
        currentCity: currentCity || "",
        currentState: currentState || "",
        pincode: pincode || "",
        profileOutline: profileOutline || "",

        // Education
        education: education || [],
        certifications: certifications || [],

        // Experience
        totalExperience: totalExperience || "",
        workExperience: workExperience || [],
        currentSalary: currentSalary || "", // ✅ Added - top level field
        expectedSalary: expectedSalary || "", // ✅ Added - top level field
        noticePeriod: noticePeriod || "", // ✅ Added - top level field
        shiftPreference: shiftPreference || [],
        preferredCities: preferredCities || [],

        // Assets & Documents
        availableAssets: availableAssets || [],
        identityDocuments: identityDocuments || [],

        // Additional
        skills: skills || [],
        portfolioLink: portfolioLink || "",
        socialMediaLink: socialMediaLink || "",

        // Documents
        resumeUrl,
        videoResumeUrl: videoResumeUrl || "",
        audioBiodataUrl: audioBiodataUrl || "",
        photographUrl: photographUrl || "",

        // Original fields
        linkedIn: linkedIn || "",
        coverLetter: coverLetter || "",
        additionalInfo: additionalInfo || "",

        // Standard fields
        status: "Applied",
        role: job.jobTitle,
        location: job.jobLocation || "",
        experience: job.experienceRange || "",
        appliedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId ? new ObjectId(userId) : null,
      }

      const candidateResult = await db.collection("candidates").insertOne(candidate, { session })
      const candidateId = candidateResult.insertedId

      console.log("Candidate created with ID:", candidateId.toString())

      // Create job application record
      const application = {
        jobId: new ObjectId(jobId),
        candidateId: candidateId,
        coverLetter: coverLetter || "",
        additionalInfo: additionalInfo || "",
        status: "Applied",
        appliedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const applicationResult = await db.collection("job_applications").insertOne(application, { session })
      console.log("Job application created with ID:", applicationResult.insertedId.toString())

      // Update the job's applicant count
      await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } }, { session })

      // Store the application ID in a temporary collection for linking during registration
      await db.collection("pending_applications").insertOne(
        {
          email,
          candidateId,
          jobId: new ObjectId(jobId),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        },
        { session },
      )

      // Commit the transaction
      await session.commitTransaction()

      // Send confirmation email to candidate
      try {
        await sendEmail({
          to: email,
          subject: `Application Received: ${job.jobTitle} at ${job.companyName}`,
          text: `
            Dear ${fullName},

            Thank you for applying for the ${job.jobTitle} position at ${job.companyName}.

            We have received your application and will review it shortly. If your qualifications match our requirements, we will contact you for the next steps.

            Best regards,
            ${job.companyName} Recruitment Team
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Application Received</h2>
              <p>Dear ${fullName},</p>
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

      // Send notification to employer
      try {
        const employer = await db.collection("employees").findOne({ _id: job.createdBy })
        if (employer) {
          await sendEmail({
            to: employer.email,
            subject: `New Application: ${job.jobTitle}`,
            text: `
              Hello ${employer.firstName},

              A new application has been received for the ${job.jobTitle} position.

              Candidate: ${fullName}
              Email: ${email}
              
              You can review this application in your dashboard.

              Best regards,
              Recruitment System
            `,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333;">New Application Received</h2>
                <p>Hello ${employer.firstName},</p>
                <p>A new application has been received for the <strong>${job.jobTitle}</strong> position.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Candidate:</strong> ${fullName}</p>
                  <p><strong>Email:</strong> ${email}</p>
                </div>
                <p>You can review this application in your dashboard.</p>
                <p>Best regards,<br>Recruitment System</p>
              </div>
            `,
          })
        }
      } catch (emailError) {
        console.error("Error sending employer notification:", emailError)
        // Continue with the process even if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "Application submitted successfully",
          candidateId: candidateId.toString(),
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
    console.error("Error submitting application:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to submit application: ${error.message || "Unknown error"}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
