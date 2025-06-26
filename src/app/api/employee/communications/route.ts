import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    // Debug log to check the userId
    console.log("User ID from request:", userId)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { candidateId, type, subject, content, sentAt } = body

    if (!candidateId || !type || !content) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find candidate to get contact information
    let candidate
    try {
      candidate = await db.collection("candidates").findOne({
        _id: new ObjectId(candidateId),
      })
    } catch (error) {
      console.error("Error finding candidate:", error)
      return NextResponse.json({ success: false, message: "Invalid candidate ID format" }, { status: 400 })
    }

    if (!candidate) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    // Find employee to get sender information - try with both string ID and ObjectId
    let employee = null
    try {
      // First try with ObjectId
      employee = await db.collection("employees").findOne({
        _id: new ObjectId(userId),
      })

      // If not found, try with string ID (using type assertion to bypass TypeScript)
      if (!employee) {
        employee = await db.collection("employees").findOne({
          _id: userId as any,
        })
      }

      // If still not found, try with userId as a string field
      if (!employee) {
        employee = await db.collection("employees").findOne({
          userId: userId,
        })
      }

      console.log("Employee search result:", employee ? "Found" : "Not found")
    } catch (error) {
      console.error("Error finding employee:", error)
    }

    if (!employee) {
      // As a fallback, create a default employee object to prevent failure
      console.warn("Employee not found in database, using fallback data")
      employee = {
        firstName: "Support",
        lastName: "Team",
        email: process.env.EMAIL_USER || "support@oddianttechlabs.com",
      }
    }

    // Log the communication
    let communicationResult
    try {
      communicationResult = await db.collection("communications").insertOne({
        candidateId: new ObjectId(candidateId),
        employeeId: userId, // Store as string to match how it's retrieved
        type,
        subject: subject || "",
        content,
        sentAt: sentAt || new Date(),
        status: "pending", // Start with pending status
      })

      console.log("Communication logged with ID:", communicationResult.insertedId)
    } catch (error) {
      console.error("Error logging communication:", error)
      // Continue even if logging fails
    }

    // Send the actual communication
    if (type === "email") {
      if (!candidate.email) {
        return NextResponse.json({ success: false, message: "Candidate email not found" }, { status: 400 })
      }

      try {
        const emailResult = await sendEmail({
          to: candidate.email,
          subject: subject || "Message from Oddiant Techlabs",
          text: content,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6d28d9;">Message from ${employee.firstName} ${employee.lastName}</h2>
            <p style="white-space: pre-line; line-height: 1.5;">${content}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 14px;">
              This email was sent from Oddiant Techlabs Recruitment Portal.
            </p>
          </div>`,
        })

        console.log("Email sent with message ID:", emailResult.messageId)

        // Update communication status to sent
        if (communicationResult?.insertedId) {
          await db
            .collection("communications")
            .updateOne({ _id: communicationResult.insertedId }, { $set: { status: "sent" } })
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)

        // Update communication status to failed
        if (communicationResult?.insertedId) {
          await db
            .collection("communications")
            .updateOne(
              { _id: communicationResult.insertedId },
              { $set: { status: "failed", error: (emailError as any).message || "Unknown error" } },
            )
        }

        return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 })
      }
    } else if (type === "sms") {
      if (!candidate.phone) {
        return NextResponse.json({ success: false, message: "Candidate phone number not found" }, { status: 400 })
      }

      try {
        console.log("Attempting to send SMS to:", candidate.phone)

        // Send SMS using our utility
        const smsResult = await sendSMS({
          to: candidate.phone,
          body: `Message from ${employee.firstName} ${employee.lastName} at Oddiant Techlabs: ${content}`,
        })

        console.log("SMS sent with SID:", smsResult.sid)

        // Update communication status to sent
        if (communicationResult?.insertedId) {
          await db
            .collection("communications")
            .updateOne({ _id: communicationResult.insertedId }, { $set: { status: "sent" } })
        }
      } catch (smsError) {
        console.error("Error sending SMS:", smsError)

        // Update communication status to failed
        if (communicationResult?.insertedId) {
          await db
            .collection("communications")
            .updateOne(
              { _id: communicationResult.insertedId },
              { $set: { status: "failed", error: (smsError as any).message || "Unknown error" } },
            )
        }

        return NextResponse.json(
          {
            success: false,
            message: smsError instanceof Error ? smsError.message : "Failed to send SMS",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `${type === "email" ? "Email" : "SMS"} sent successfully`,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`Error sending communication:`, error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send communication",
      },
      { status: 500 },
    )
  }
}
