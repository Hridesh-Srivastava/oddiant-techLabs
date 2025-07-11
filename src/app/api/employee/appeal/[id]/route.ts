import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 })
    }

    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid Employee ID format" }, { status: 400 })
    }

    // Get token from query
    const url = new URL(request.url)
    const token = url.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ success: false, message: "Missing appeal token" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee by ID
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(id) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Validate token
    if (
      !employee.appealToken ||
      employee.appealToken !== token ||
      !employee.appealTokenExpiry ||
      new Date(employee.appealTokenExpiry) < new Date() ||
      employee.appealTokenUsed
    ) {
      return NextResponse.json({ success: false, message: "Invalid, expired, or used appeal token" }, { status: 403 })
    }

    // Remove sensitive information if present
    const { password, ...employeeData } = employee

    return NextResponse.json({ success: true, employee: employeeData }, { status: 200 })
  } catch (error) {
    console.error("Error fetching employee for appeal:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch employee data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid Employee ID format" }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(id) })
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }
    if (!employee.rejected) {
      return NextResponse.json({ success: false, message: "Appeal link can only be resent for rejected employees." }, { status: 400 })
    }
    // Generate new token and expiry
    const appealToken = crypto.randomBytes(32).toString("hex")
    const appealTokenExpiry = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes for testing
    await db.collection("employees").updateOne(
      { _id: new ObjectId(id) },
      { $set: { appealToken, appealTokenExpiry, appealTokenUsed: false } }
    )
    // Send new appeal email
    await sendEmail({
      to: employee.email,
      subject: "Your Oddiant Techlabs Appeal Link",
      text: `Dear ${employee.firstName},\n\nYou requested a new appeal link. Please use the link below to update your information and appeal your rejection.\n\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/appeal/${id}?token=${appealToken}\n\nThis appeal link will expire in 7 days.\n\nIf you did not request this, you can ignore this email.\n\nBest regards,\nThe Oddiant Techlabs Team`,
      html: `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;\"><h2 style=\"color: #333;\">Your Oddiant Techlabs Appeal Link</h2><p>Dear ${employee.firstName},</p><p>You requested a new appeal link. Please use the button below to update your information and appeal your rejection.</p><div style=\"text-align: center; margin: 25px 0;\"><a href=\"${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/employee/appeal/${id}?token=${appealToken}\" style=\"background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Appeal and Update Information</a></div><p style=\"color: #b91c1c; font-weight: bold;\">This appeal link will expire in 7 days.</p><p>If you did not request this, you can ignore this email.</p><p>Best regards,<br>The Oddiant Techlabs Team</p></div>`
    })
    return NextResponse.json({ success: true, message: "A new appeal link has been sent to your email." }, { status: 200 })
  } catch (error) {
    console.error("Error resending appeal link:", error)
    return NextResponse.json({ success: false, message: "Failed to resend appeal link." }, { status: 500 })
  }
}
