import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateToken, setAuthCookie } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp, userType = "student" } = body

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    let user = null
    let collection = ""

    if (userType === "employee") {
      // For employees, only check employees collection
      user = await db.collection("employees").findOne({ email })
      collection = "employees"
    } else {
      // For students, check both students and candidates collections
      user = await db.collection("students").findOne({
        $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
      })
      collection = "students"

      if (!user) {
        user = await db.collection("candidates").findOne({
          $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
        })
        collection = "candidates"
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if user is already verified
    if (user.verified) {
      return NextResponse.json({ success: false, message: "Email already verified" }, { status: 400 })
    }

    // Check if OTP is valid
    if (user.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 })
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 })
    }

    if (userType === "employee") {
      // For employees, mark as email verified but not fully verified yet
      await db.collection(collection).updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerified: true,
            updatedAt: new Date(),
          },
          $unset: { otp: "", otpExpiry: "" },
        },
      )

      // Send notification email to admin
      try {
        // Prepare employee data for email
        const { password, ...employeeData } = user

        await sendEmail({
          subject: `New Employee Registration: ${user.firstName} ${user.lastName}`,
          text: `A new employee has registered and verified their email:
          
Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
Email: ${user.email}
Company: ${user.companyName}
Designation: ${user.designation}

Please review and approve this account by visiting:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/verify-employee/${user._id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">New Employee Registration</h2>
              <p>A new employee has registered and verified their email:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Name:</strong> ${user.firstName} ${user.middleName || ""} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Company:</strong> ${user.companyName}</p>
                <p><strong>Designation:</strong> ${user.designation}</p>
                <p><strong>Location:</strong> ${user.companyLocation || "Not specified"}</p>
              </div>
              <p>Please review and approve this account by clicking the button below:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/verify-employee/${user._id}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Review Employee
                </a>
              </div>
              <p>Or copy and paste this URL into your browser:</p>
              <p>${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/verify-employee/${user._id}</p>
              <p>Best regards,<br>Oddiant Techlabs System</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending admin notification email:", emailError)
        // Continue with the process even if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully. Your account is pending approval.",
          pendingApproval: true,
        },
        { status: 200 },
      )
    } else {
      // For students and candidates, mark as fully verified immediately
      await db.collection(collection).updateOne(
        { _id: user._id },
        {
          $set: {
            verified: true,
            updatedAt: new Date(),
          },
          $unset: { otp: "", otpExpiry: "" },
        },
      )

      // Generate JWT token with userType
      const token = generateToken(user._id.toString(), "student") // Both students and candidates use "student" userType for dashboard access

      // Set auth cookie
      setAuthCookie(token)

      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully",
          userCollection: collection, // Include for debugging
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error in email verification:", error)
    return NextResponse.json({ success: false, message: "Verification failed. Please try again." }, { status: 500 })
  }
}
