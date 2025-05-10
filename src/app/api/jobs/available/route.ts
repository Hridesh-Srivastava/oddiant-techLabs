import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get all active job postings
    const jobs = await db
      .collection("jobs")
      .find({ status: { $in: ["open", "active"] } })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate days left for each job
    const jobsWithDaysLeft = jobs.map((job) => {
      // Calculate days left (30 days from creation by default)
      const creationDate = job.createdAt ? new Date(job.createdAt) : new Date()
      const expiryDate = job.expiryDate
        ? new Date(job.expiryDate)
        : new Date(creationDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const today = new Date()
      const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        ...job,
        daysLeft,
      }
    })

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, jobs: jobsWithDaysLeft },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching available jobs:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch jobs" }, { status: 500 })
  }
}
