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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { emails, jobId, location } = body

    if (!emails || !emails.length || !jobId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to get company info
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Find job details
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Process each email
    const results = await Promise.all(
      emails.map(async (email: string) => {
        try {
          // Generate a unique token for this invitation
          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

          // Create invitation record
          const invitation = {
            email,
            jobId: new ObjectId(jobId),
            position: job.jobTitle,
            location,
            companyName: employee.companyName,
            employeeId: new ObjectId(userId),
            token,
            status: "pending",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          }

          await db.collection("invitations").insertOne(invitation)

          // Send invitation email
          await sendEmail({
            to: email,
            subject: `Action Needed - Job Opportunity: ${job.jobTitle} at ${employee.companyName}`,
            text: `
              Hello,

              You have been invited to apply for the ${job.jobTitle} position at ${employee.companyName}.

              To complete your application, please click on the link below:
              ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login?token=${token}

              This invitation will expire in 7 days.

              Best regards,
              ${employee.firstName} ${employee.lastName}
              ${employee.companyName}
            `,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333;">Job Opportunity</h2>
                <p>Hello Candidate,</p>
                <p>You have been invited to apply for the <strong>${job.jobTitle}</strong> position at <strong>${employee.companyName}</strong> by ${employee.firstName} ${employee.lastName} of ${employee.companyName}.</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/jobs/${jobId}" 
                     style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Complete Your Application
                  </a>
                </div>
                <p>This invitation will expire in 7 days.</p>
                <p>Best regards,<br>${employee.firstName} ${employee.lastName}<br>${employee.companyName}</p>
              </div>
            `,
          })

          return { email, success: true }
        } catch (error) {
          console.error(`Error processing invitation for ${email}:`, error)
          return { email, success: false, error: (error as Error).message }
        }
      }),
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json(
      {
        success: true,
        message: `Successfully sent ${successful} invitations${failed > 0 ? `, ${failed} failed` : ""}`,
        results,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error sending invitations:", error)
    return NextResponse.json({ success: false, message: "Failed to send invitations" }, { status: 500 })
  }
}
