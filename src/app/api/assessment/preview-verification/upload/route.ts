import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called")

    const formData = await request.formData()
    const image = formData.get("image") as File
    const token = formData.get("token") as string
    const type = formData.get("type") as string
    const isPreview = formData.get("isPreview") === "true"

    console.log("Form data received:", {
      imageSize: image?.size,
      token,
      type,
      isPreview,
    })

    if (!image || !token || !type) {
      console.error("Missing required fields:", { image: !!image, token: !!token, type: !!type })
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    if (!["face", "id_card"].includes(type)) {
      console.error("Invalid image type:", type)
      return NextResponse.json({ success: false, message: "Invalid image type" }, { status: 400 })
    }

    if (image.size === 0) {
      console.error("Empty image file")
      return NextResponse.json({ success: false, message: "Image file is empty" }, { status: 400 })
    }

    if (image.size > 10 * 1024 * 1024) {
      // 10MB limit
      console.error("File too large:", image.size)
      return NextResponse.json({ success: false, message: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Convert file to buffer
    console.log("Converting file to buffer...")
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      console.error("Empty buffer after conversion")
      return NextResponse.json({ success: false, message: "Failed to process image data" }, { status: 400 })
    }

    console.log("Buffer created, size:", buffer.length)

    // Upload to Cloudinary with retry logic
    let cloudinaryResult
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        console.log(`Uploading to Cloudinary (attempt ${retryCount + 1})...`)

        cloudinaryResult = await uploadToCloudinary(buffer, {
          folder: isPreview ? "assessment-preview-verifications" : "assessment-verifications",
          resource_type: "image",
          format: "jpg",
          quality: "auto:good",
        } as any)

        console.log("Cloudinary upload successful:", cloudinaryResult.public_id)
        break
      } catch (error) {
        retryCount++
        console.error(`Cloudinary upload attempt ${retryCount} failed:`, error)

        if (retryCount >= maxRetries) {
          throw new Error(
            `Cloudinary upload failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }
    }

    if (!cloudinaryResult) {
      throw new Error("Failed to upload to Cloudinary")
    }

    // Connect to database
    console.log("Connecting to database...")
    const { db } = await connectToDatabase()
    const collection = db.collection("assessment-preview-verifications")

    // Create or update verification record
    const verificationData = {
      token,
      isPreview,
      [`${type}Image`]: {
        url: cloudinaryResult.url,
        publicId: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
      },
      [`${type}UploadedAt`]: new Date(),
      updatedAt: new Date(),
    }

    console.log("Saving to database...")

    // Upsert the verification record
    const result = await collection.updateOne(
      { token },
      {
        $set: verificationData,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log("Database operation result:", result)

    return NextResponse.json({
      success: true,
      message: `${type === "face" ? "Face" : "ID Card"} uploaded successfully`,
      imageUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.public_id,
    })
  } catch (error) {
    console.error("Error uploading verification image:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload image",
        error: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}
