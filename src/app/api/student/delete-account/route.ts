import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

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

    // Delete user's applications (check for both candidateId and studentId fields)
    await db.collection("job_applications").deleteMany({
      $or: [
        { candidateId: new ObjectId(userId) },
        { studentId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    // Delete user account from the correct collection
    const result = await db.collection(userCollection).deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to delete account" }, { status: 500 })
    }

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    return NextResponse.json({ success: true, message: "Account deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ success: false, message: "Failed to delete account" }, { status: 500 })
  }
}
