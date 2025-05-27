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

    // Verify user is an employee
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    // Fetch jobs created by this employee only (maintaining isolation)
    const jobs = await db
      .collection("jobs")
      .find({
        employerId: new ObjectId(userId), // Ensure data isolation
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate days left for each job and add real-time stats
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        // Calculate days left (30 days from creation by default)
        const creationDate = job.createdAt ? new Date(job.createdAt) : new Date()
        const expiryDate = new Date(creationDate)
        expiryDate.setDate(expiryDate.getDate() + 30)
        const today = new Date()
        const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

        // Get real-time applicant count
        const applicantsCount = await db.collection("job_applications").countDocuments({
          jobId: new ObjectId(job._id.toString()),
        })

        return {
          ...job,
          daysLeft,
          applicants: applicantsCount,
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
        jobs: jobsWithDetails,
        totalJobs: jobsWithDetails.length,
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching jobs for invitation:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch jobs" }, { status: 500 })
  }
}
