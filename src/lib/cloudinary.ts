import { v2 as cloudinary } from "cloudinary"
import { randomUUID } from "crypto"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dnvsxhwrs",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Function to safely upload to Cloudinary with better error handling
export async function uploadToCloudinary(
  file: Buffer,
  options: { folder: string; resource_type?: "video" | "image" | "auto" | "raw" },
): Promise<{ url: string; public_id: string; format?: string; resource_type?: string }> {
  try {
    // Generate a random filename to avoid ENAMETOOLONG errors
    const randomFileName = randomUUID()

    // Set upload options with timeout and the random filename
    const uploadOptions = {
      folder: options.folder,
      public_id: randomFileName,
      resource_type: (options.resource_type || "auto") as "video" | "image" | "auto" | "raw",
      timeout: 60000, // 60 second timeout
    }

    // Upload to Cloudinary using the upload_stream method instead of direct base64
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else if (result) {
          console.log("Cloudinary upload successful:", result.public_id)
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
          })
        }
      })

      // Write the buffer to the upload stream
      uploadStream.write(file)
      uploadStream.end()
    })
  } catch (error: any) {
    console.error("Error in uploadToCloudinary:", error)
    throw new Error(error.message || "Failed to upload file")
  }
}

export async function deleteFromCloudinary(publicId: string, resourceType = "image") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })

    return result
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
    throw new Error("Failed to delete file from Cloudinary")
  }
}
