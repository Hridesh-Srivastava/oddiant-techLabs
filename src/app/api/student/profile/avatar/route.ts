import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

async function uploadToCloudinary(buffer: Buffer, options: any) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })

    uploadStream.write(buffer)
    uploadStream.end()
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const avatarFile = formData.get("avatar") as File

    if (!avatarFile) {
      return NextResponse.json({ success: false, message: "No avatar file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await avatarFile.arrayBuffer())

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "student_avatars",
    })

    // Connect to database
    const { db } = await connectToDatabase()

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Update user document with new avatar URL in the correct collection
    const result = await db.collection(userCollection).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          avatar: uploadResult.url,
          "documents.photograph": {
            url: uploadResult.url,
            uploadDate: new Date(),
            name: avatarFile.name,
          },
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update avatar" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: uploadResult.url,
      userCollection, // Include for debugging
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ success: false, message: "Failed to upload avatar" }, { status: 500 })
  }
}
