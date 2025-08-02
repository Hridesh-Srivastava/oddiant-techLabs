import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if user exists in either students or candidates collection
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch recent jobs (within 30 days) and limit to 50
    const recentJobs = await db
      .collection("jobs")
      .find({
        status: { $in: ["open", "active"] },
        createdAt: { $gte: thirtyDaysAgo }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // For each job, check if the current user has applied
    const jobsWithApplicationStatus = await Promise.all(
      recentJobs.map(async (job) => {
        // Check if user has applied to this job from either collection
        const application = await db.collection("job_applications").findOne({
          jobId: job._id,
          $or: [
            { studentId: new ObjectId(userId) },
            { candidateId: new ObjectId(userId) },
            { applicantId: new ObjectId(userId) },
          ],
        })

        return {
          ...job,
          hasApplied: !!application,
          applicationId: application?._id || null,
          applicationStatus: application?.status || null,
          appliedAt: application?.appliedAt || application?.appliedDate || null,
        }
      }),
    )

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        jobs: jobsWithApplicationStatus,
        totalJobs: jobsWithApplicationStatus.length,
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching recent jobs:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch recent jobs" }, { status: 500 })
  }
} 