import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get invitations from database
    const invitations = await db
      .collection("assessment_invitations")
      .find({ createdBy: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, invitations },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get invitation data from request body
    const { testId, emails } = await request.json()

    if (!testId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, message: "Test ID and at least one email are required" },
        { status: 400 },
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find test
    const test = await db.collection("assessment_tests").findOne({ _id: new ObjectId(testId) })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Find employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Process each email
    const results = await Promise.all(
      emails.map(async (email: string) => {
        try {
          // Generate a unique token for this invitation
          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

          // Set expiry date (7 days from now)
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 7)

          // Create invitation record
          const invitation = {
            email,
            testId: new ObjectId(testId),
            testName: test.name,
            employeeId: new ObjectId(userId),
            companyName: employee.companyName,
            token,
            status: "Pending",
            createdAt: new Date(),
            expiresAt: expiryDate,
            createdBy: new ObjectId(userId),
            // Only invite to this specific test, not all active tests
            specificTestOnly: true,
          }

          // Look up student by email
          const student = await db.collection("students").findOne({ email });
          if (student) {
            Object.assign(invitation, { studentId: student._id });
          }
          // Look up candidate by email
          const candidate = await db.collection("candidates").findOne({ email });
          if (candidate) {
            Object.assign(invitation, { candidateId: candidate._id });
          }

          await db.collection("assessment_invitations").insertOne(invitation)

          // Send invitation email
          await sendEmail({
            to: email,
            subject: `Assessment Invitation: ${test.name} from ${employee.companyName}`,
            text: `
              Hello,

              You have been invited to take the ${test.name} assessment by ${employee.companyName}.

              To start your assessment, please click on the link below:
              ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/system-check?token=${token}

              This invitation will expire on ${expiryDate.toLocaleDateString()}.

              Best regards,
              ${employee.firstName} ${employee.lastName}
              ${employee.companyName}
            `,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333;">Assessment Invitation</h2>
                <p>Hello,</p>
                <p>You have been invited to take the <strong>${test.name}</strong> assessment by <strong>${employee.companyName}</strong>.</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/system-check?token=${token}" 
                     style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Start Assessment
                  </a>
                </div>
                <p>This invitation will expire on ${expiryDate.toLocaleDateString()}.</p>
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

    // Update test candidatesCount
    await db
      .collection("assessment_tests")
      .updateOne({ _id: new ObjectId(testId) }, { $inc: { candidatesCount: successful } })

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
