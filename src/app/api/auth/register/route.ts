import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, generateOTP } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    // Check if request is multipart/form-data
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data
      const formData = await request.formData()

      // Extract basic fields
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const firstName = formData.get("firstName") as string
      const lastName = formData.get("lastName") as string
      const salutation = formData.get("salutation") as string

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

      // Connect to database
      const { db } = await connectToDatabase()

      // Check if user already exists
      const existingUser = await db.collection("students").findOne({ email })
      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 })
      }

      // Process file uploads if any
      const fileUploads: Record<string, any> = {}

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
        // Handle resume upload
        const resumeFile = formData.get("resume") as File | null
        const resumeResult = await processFileUpload("resume", resumeFile, "student-documents/resumes", "raw")
        if (resumeResult) fileUploads.resume = resumeResult

        // Handle photograph upload
        const photographFile = formData.get("photograph") as File | null
        const photographResult = await processFileUpload(
          "photograph",
          photographFile,
          "student-documents/photographs",
          "image",
        )
        if (photographResult) fileUploads.photograph = photographResult

        // Handle video resume upload
        const videoResumeFile = formData.get("videoResume") as File | null
        const videoResult = await processFileUpload("videoResume", videoResumeFile, "student-documents/videos", "video")
        if (videoResult) fileUploads.videoResume = videoResult

        // Handle audio biodata upload
        const audioBiodataFile = formData.get("audioBiodata") as File | null
        const audioResult = await processFileUpload(
          "audioBiodata",
          audioBiodataFile,
          "student-documents/audio",
          "video", // Cloudinary uses 'video' for audio files
        )
        if (audioResult) fileUploads.audioBiodata = audioResult
      } catch (uploadError: any) {
        console.error("Error during file upload:", uploadError)
        return NextResponse.json(
          {
            success: false,
            message:
              uploadError.message || "File upload failed. Please try again with smaller files or different formats.",
          },
          { status: 400 },
        )
      }

      // Parse JSON fields
      const education = formData.get("education") ? JSON.parse(formData.get("education") as string) : []
      const experience = formData.get("experience") ? JSON.parse(formData.get("experience") as string) : []
      const skills = formData.get("skills") ? JSON.parse(formData.get("skills") as string) : []

      // Parse the previously missing fields
      const certifications = formData.get("certifications") ? JSON.parse(formData.get("certifications") as string) : []
      const shiftPreference = formData.get("shiftPreference")
        ? JSON.parse(formData.get("shiftPreference") as string)
        : []
      const preferenceCities = formData.get("preferenceCities")
        ? JSON.parse(formData.get("preferenceCities") as string)
        : []

      // FIXED: Parse assets separately to ensure it's a separate object
      const assets = formData.get("assets")
        ? JSON.parse(formData.get("assets") as string)
        : {
            bike: false,
            wifi: false,
            laptop: false,
            panCard: false,
            aadhar: false,
            bankAccount: false,
            idProof: false,
          }

      // Get totalExperience directly from formData
      const totalExperience = formData.get("totalExperience") as string

      // Log the totalExperience value for debugging
      console.log("Total Experience from form:", totalExperience)

      // Generate OTP for email verification
      const otp = generateOTP()
      const otpExpiry = new Date()
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user document with all fields
      const newUser = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        salutation,
        middleName: (formData.get("middleName") as string) || "",
        phone: (formData.get("phone") as string) || "",
        alternativePhone: (formData.get("alternativePhone") as string) || "",
        dob: (formData.get("dob") as string) || "",
        gender: (formData.get("gender") as string) || "",
        currentCity: (formData.get("currentCity") as string) || "",
        currentState: (formData.get("currentState") as string) || "",
        pincode: (formData.get("pincode") as string) || "",
        profileOutline: (formData.get("profileOutline") as string) || "",
        education,
        certifications,
        experience,
        totalExperience: totalExperience || "0", // Default to "0" if empty
        professionalSummary: (formData.get("professionalSummary") as string) || "",
        currentSalary: (formData.get("currentSalary") as string) || "",
        expectedSalary: (formData.get("expectedSalary") as string) || "",
        noticePeriod: (formData.get("noticePeriod") as string) || "",
        shiftPreference,
        preferenceCities,
        // FIXED: Ensure assets and documents are separate objects
        assets, // This is the assets object
        documents: fileUploads, // This is the documents object
        skills,
        portfolioLink: (formData.get("portfolioLink") as string) || "",
        socialMediaLink: (formData.get("socialMediaLink") as string) || "",
        verified: false,
        otp,
        otpExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileCompleted: false,
        userType: "student", // Add user type to distinguish from employees
      }

      // Insert user into database
      const result = await db.collection("students").insertOne(newUser)

      // Send verification email with OTP
      try {
        await sendEmail({
          to: email,
          subject: "Verify Your Email - Oddiant Techlabs",
          text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hello ${firstName},</p>
              <p>Thank you for registering with Oddiant Techlabs. Please use the following verification code to complete your registration:</p>
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
          userId: result.insertedId.toString(),
        },
        { status: 201 },
      )
    } else {
      // Handle JSON request
      const body = await request.json()

      // Validate required fields
      if (!body.email || !body.password || !body.firstName || !body.lastName) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

      // Connect to database
      const { db } = await connectToDatabase()

      // Check if user already exists
      const existingUser = await db.collection("students").findOne({ email: body.email })
      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 })
      }

      // Generate OTP for email verification
      const otp = generateOTP()
      const otpExpiry = new Date()
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5) // OTP valid for 5 minutes

      // Hash password
      const hashedPassword = await hashPassword(body.password)

      // FIXED: Ensure totalExperience is properly handled
      const totalExperience = body.totalExperience || "0"

      // FIXED: Ensure assets and documents are separate objects
      const assets = body.assets || {
        bike: false,
        wifi: false,
        laptop: false,
        panCard: false,
        aadhar: false,
        bankAccount: false,
        idProof: false,
      }

      const documents = body.documents || {}

      // Make sure all fields are included
      const newUser = {
        ...body,
        password: hashedPassword,
        totalExperience, // Use the fixed totalExperience value
        assets, // Ensure assets is a separate object
        documents, // Ensure documents is a separate object
        certifications: body.certifications || [],
        currentSalary: body.currentSalary || "",
        expectedSalary: body.expectedSalary || "",
        noticePeriod: body.noticePeriod || "",
        shiftPreference: body.shiftPreference || [],
        preferenceCities: body.preferenceCities || [],
        verified: false,
        otp,
        otpExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileCompleted: false,
        userType: "student", // Add user type to distinguish from employees
      }

      // Insert user into database
      const result = await db.collection("students").insertOne(newUser)

      // Send verification email with OTP
      try {
        await sendEmail({
          to: body.email,
          subject: "Verify Your Email - Oddiant Techlabs",
          text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hello ${body.firstName},</p>
              <p>Thank you for registering with Oddiant Techlabs. Please use the following verification code to complete your registration:</p>
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
          userId: result.insertedId.toString(),
        },
        { status: 201 },
      )
    }
  } catch (error: any) {
    console.error("Error in registration:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed. Please try again." },
      { status: 500 },
    )
  }
}
