import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, resetToken, newPassword, userType = "student" } = body

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    let user = null
    let collection = ""

    if (userType === "employee") {
      // For employees, only check employees collection
      user = await db.collection("employees").findOne({
        email,
        resetToken,
        resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
      })
      collection = "employees"
    } else {
      // For students, check both students and candidates collections
      user = await db.collection("students").findOne({
        $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
        resetToken,
        resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
      })
      collection = "students"

      if (!user) {
        user = await db.collection("candidates").findOne({
          $or: [{ email: email.toLowerCase() }, { alternativeEmail: email.toLowerCase() }],
          resetToken,
          resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
        })
        collection = "candidates"
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired reset token" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user with new password and remove reset token in the correct collection
    await db.collection(collection).updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      },
    )

    return NextResponse.json({ success: true, message: "Password reset successful" }, { status: 200 })
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json(
      { success: false, message: "Failed to reset password. Please try again." },
      { status: 500 },
    )
  }
}
