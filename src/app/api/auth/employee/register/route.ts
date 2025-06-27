import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    // List of disallowed email domains
    const disallowedDomains = [
      "gmail.com",
      "outlook.com",
      "hotmail.com",
      "live.com",
      "yahoo.com",
      "icloud.com",
      "zoho.com",
      "gmx.com",
      "mail.com",
      "yandex.com",
      "aol.com",
    ]

    // Function to validate email domain
    const validateEmailDomain = (email: string) => {
      // Extract domain from email
      const domain = email.split("@")[1].toLowerCase()

      // Check if domain is in the disallowed list
      if (disallowedDomains.includes(domain)) {
        return false
      }
      return true
    }
    // Check if request is multipart/form-data
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data
      const formData = await request.formData()

      // Extract basic fields
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const firstName = formData.get("firstName") as string
      const middleName = (formData.get("middleName") as string) || ""
      const lastName = formData.get("lastName") as string
      const phone = formData.get("phone") as string
      const designation = formData.get("designation") as string
      const linkedinProfile = formData.get("linkedinProfile") as string
      const companyName = formData.get("companyName") as string
      const companyLocation = formData.get("companyLocation") as string
      const companyIndustry = formData.get("companyIndustry") as string
      const teamSize = formData.get("teamSize") as string
      const aboutCompany = formData.get("aboutCompany") as string
      const companyWebsite = formData.get("companyWebsite") as string

      // Parse social media links
      const socialMediaLinks = formData.get("socialMediaLinks")
        ? JSON.parse(formData.get("socialMediaLinks") as string)
        : []

      const companyLinkedin = formData.get("companyLinkedin") as string

      // Extract new KYC fields
      const kycNumber = formData.get("kycNumber") as string
      const documentType = formData.get("documentType") as string

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !phone || !designation || !companyName) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

      // Validate KYC fields
      if (!kycNumber || !documentType) {
        return NextResponse.json(
          { success: false, message: "KYC number and document type are required" },
          { status: 400 },
        )
      }

      // Validate email domain for company email
      if (!validateEmailDomain(email)) {
        return NextResponse.json(
          { success: false, message: "Personal email domains are not allowed. Please use your company email address." },
          { status: 400 },
        )
      }

      // Connect to database
      const { db } = await connectToDatabase()

      // Check if employee already exists
      const existingEmployee = await db.collection("employees").findOne({ email })
      if (existingEmployee) {
        return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 })
      }

      // Process KYC document uploads
      const kycDocuments: Record<string, any> = {}

      // Function to safely process file upload
      const processFileUpload = async (fileField: string, file: File | null, folder: string, resourceType: "video" | "image" | "auto" | "raw" = "auto") => {
        if (!file || file.size === 0) {
          return null
        }

        try {
          console.log(`Processing ${fileField}:`, file.name, file.type, file.size)

          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${fileField} exceeds the 5MB size limit`)
          }

          // Read file as buffer
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Upload to Cloudinary with the new method
          const result = await uploadToCloudinary(buffer, {
            folder,
            resource_type: resourceType,
          })

          return {
            url: result.url,
            public_id: result.public_id,
            filename: file.name,
          }
        } catch (error: any) {
          console.error(`Error uploading ${fileField}:`, error)
          throw new Error(`Failed to upload ${fileField}: ${error.message}`)
        }
      }

      try {
        // Handle KYC document uploads
        const kycFile = formData.get("kycDocument") as File | null
        const kycResult = await processFileUpload("KYC document", kycFile, "employee-documents/kyc", "auto")
        if (kycResult) {
          kycDocuments.kyc = {
            ...kycResult,
            documentType,
            kycNumber,
          }
        }
      } catch (uploadError: any) {
        console.error("Error during KYC document upload:", uploadError)
        return NextResponse.json(
          {
            success: false,
            message:
              uploadError.message ||
              "KYC document upload failed. Please try again with smaller files or different formats.",
          },
          { status: 400 },
        )
      }

      // Generate OTP for email verification
      const otp = generateOTP()
      const otpExpiry = new Date()
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create employee document
      const newEmployee = {
        email,
        password: hashedPassword,
        firstName,
        middleName,
        lastName,
        phone,
        designation,
        linkedinProfile,
        companyName,
        companyLocation,
        companyIndustry,
        teamSize,
        aboutCompany,
        companyWebsite,
        socialMediaLinks,
        companyLinkedin,
        documents: kycDocuments,
        kycDetails: {
          documentType,
          kycNumber,
        },
        verified: false,
        otp,
        otpExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileCompleted: false,
        userType: "employee", // Add user type to distinguish from students
      }

      // Insert employee into database
      const result = await db.collection("employees").insertOne(newEmployee)

      // Send verification email with OTP
      try {
        await sendEmail({
          to: email,
          subject: "Verify Your Email - Oddiant Techlabs Employee Portal",
          text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hello ${firstName},</p>
              <p>Thank you for registering with Oddiant Techlabs Employee Portal. Please use the following verification code to complete your registration:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                ${otp}
              </div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you did not request this verification, please ignore this email.</p>
              <p>Best regards,<br>Oddiant Techlabs Team</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        // Continue with registration even if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "Registration successful. Please verify your email.",
          employeeId: result.insertedId.toString(),
        },
        { status: 201 },
      )
    } else {
      // Handle JSON request
      const body = await request.json()

      // Validate required fields
      if (
        !body.email ||
        !body.password ||
        !body.firstName ||
        !body.lastName ||
        !body.phone ||
        !body.designation ||
        !body.companyName ||
        !body.kycNumber ||
        !body.documentType
      ) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

      // Validate email domain for company email
      if (!validateEmailDomain(body.email)) {
        return NextResponse.json(
          { success: false, message: "Personal email domains are not allowed. Please use your company email address." },
          { status: 400 },
        )
      }

      // Connect to database
      const { db } = await connectToDatabase()

      // Check if employee already exists
      const existingEmployee = await db.collection("employees").findOne({ email: body.email })
      if (existingEmployee) {
        return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 })
      }

      // Generate OTP for email verification
      const otp = generateOTP()
      const otpExpiry = new Date()
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

      // Hash password
      const hashedPassword = await hashPassword(body.password)

      // Create employee document with KYC details
      const newEmployee = {
        ...body,
        password: hashedPassword,
        kycDetails: {
          documentType: body.documentType,
          kycNumber: body.kycNumber,
        },
        verified: false,
        otp,
        otpExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileCompleted: false,
        userType: "employee", // Add user type to distinguish from students
      }

      // Insert employee into database
      const result = await db.collection("employees").insertOne(newEmployee)

      // Send verification email with OTP
      try {
        await sendEmail({
          to: body.email,
          subject: "Verify Your Email - Oddiant Techlabs Employee Portal",
          text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hello ${body.firstName},</p>
              <p>Thank you for registering with Oddiant Techlabs Employee Portal. Please use the following verification code to complete your registration:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                ${otp}
              </div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you did not request this verification, please ignore this email.</p>
              <p>Best regards,<br>Oddiant Techlabs Team</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        // Continue with registration even if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "Registration successful. Please verify your email.",
          employeeId: result.insertedId.toString(),
        },
        { status: 201 },
      )
    }
  } catch (error: any) {
    console.error("Error in employee registration:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed. Please try again." },
      { status: 500 },
    )
  }
}
