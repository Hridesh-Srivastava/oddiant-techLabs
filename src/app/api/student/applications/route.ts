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

    // Find all job applications for this user (check multiple field names)
    const applications = await db
      .collection("job_applications")
      .find({
        $or: [
          { candidateId: new ObjectId(userId) },
          { studentId: new ObjectId(userId) },
          { applicantId: new ObjectId(userId) },
        ],
      })
      .sort({ appliedDate: -1 })
      .toArray()

    // Get job details for each application
    const applicationsWithJobDetails = await Promise.all(
      applications.map(async (application) => {
        try {
          const job = await db.collection("jobs").findOne({ _id: new ObjectId(application.jobId) })

          return {
            ...application,
            job: job
              ? {
                  jobTitle: job.jobTitle || "Unknown Job",
                  companyName: job.companyName || "Unknown Company",
                  jobLocation: job.jobLocation || "Unknown Location",
                  jobType: job.jobType || "Unknown Type",
                }
              : {
                  jobTitle: "Unknown Job",
                  companyName: "Unknown Company",
                  jobLocation: "Unknown Location",
                  jobType: "Unknown Type",
                },
            userCollection, // Include for debugging
          }
        } catch (error) {
          console.error(`Error fetching job details for application ${application._id}:`, error)
          return {
            ...application,
            job: {
              jobTitle: "Unknown Job",
              companyName: "Unknown Company",
              jobLocation: "Unknown Location",
              jobType: "Unknown Type",
            },
            userCollection,
          }
        }
      }),
    )

    // Log the applications data for debugging
    console.log(`Found ${applicationsWithJobDetails.length} applications for user ${userId} from ${userCollection}`)

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, applications: applicationsWithJobDetails, userCollection },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching user applications:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch applications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { jobId, coverLetter } = await request.json()

    if (!jobId) {
      return NextResponse.json({ success: false, message: "Job ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if job exists
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
    }

    // Check both students and candidates collections
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userCollection = "students"

    if (!user) {
      user = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      userCollection = "candidates"
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 })
    }

    // Check if user has already applied to this job (check multiple field names)
    const existingApplication = await db.collection("job_applications").findOne({
      jobId: new ObjectId(jobId),
      $or: [
        { candidateId: new ObjectId(userId) },
        { studentId: new ObjectId(userId) },
        { applicantId: new ObjectId(userId) },
      ],
    })

    if (existingApplication) {
      return NextResponse.json({ success: false, message: "You have already applied to this job" }, { status: 400 })
    }

    // Create new application with appropriate user reference
    const newApplication = {
      // Use the appropriate field based on user collection
      ...(userCollection === "students" ? { studentId: new ObjectId(userId) } : { candidateId: new ObjectId(userId) }),
      // Also add a generic applicantId for easier querying
      applicantId: new ObjectId(userId),
      applicantCollection: userCollection, // Track which collection the user is from

      jobId: new ObjectId(jobId),
      status: "applied",
      appliedDate: new Date(),
      coverLetter: coverLetter || "",
      history: [
        {
          status: "applied",
          date: new Date(),
          note: "Application submitted",
        },
      ],
      // Include basic user info for easier querying
      studentName: [user.salutation, user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || "Unknown",
      studentEmail: user.email || "",
      // Include employer ID for isolation
      employerId: job.employerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("job_applications").insertOne(newApplication)

    // Update job with applicant count
    await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { applicants: 1 } })

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: result.insertedId,
        userCollection,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ success: false, message: "Failed to submit application" }, { status: 500 })
  }
}
