import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

// Interface for candidate data with name fields
interface CandidateData {
  _id?: string | ObjectId
  name?: string
  firstName?: string
  middleName?: string
  lastName?: string
  salutation?: string
  title?: string
  email?: string
  avatar?: string
  photograph?: string
  photographUrl?: string
  documents?: {
    photograph?: {
      url?: string
    } | string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// IST helper functions
function getISTDate(): Date {
  const now = new Date()
  // Convert to IST by adding 5.5 hours to UTC
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return istTime
}

function getISTDateString(): string {
  const istDate = getISTDate()
  const year = istDate.getUTCFullYear()
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0")
  const day = String(istDate.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function createISTDateFromString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  const istDate = new Date()
  istDate.setUTCFullYear(year)
  istDate.setUTCMonth(month - 1)
  istDate.setUTCDate(day)
  istDate.setUTCHours(5, 30, 0, 0) // Set to IST midnight (5:30 UTC)
  return istDate
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    console.log("=== FETCHING INTERVIEWS (IST) ===")

    // Get today's date in IST
    const todayIST = getISTDateString()
    console.log("Today's IST date:", todayIST)

    // Get all interviews for this employee
    const interviews = await db
      .collection("interviews")
      .find({
        $and: [
          {
            $or: [
              { scheduledBy: new ObjectId(userId) },
              { employeeId: new ObjectId(userId) },
              { createdBy: new ObjectId(userId) },
              { companyId: employee._id.toString() },
              { companyName: employee.companyName },
            ],
          },
          { status: { $nin: ["cancelled", "expired", "deleted"] } },
        ],
      })
      .sort({ date: 1, time: 1 })
      .toArray()

    console.log(`Found ${interviews.length} interviews`)

    // Format interviews with candidate details and IST categorization
    const formattedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        let candidateName = "Unknown Candidate"
        let candidateEmail = ""
        let candidateAvatar = ""

        try {
          if (interview.candidateId) {
            let candidate = await db.collection("candidates").findOne({
              _id: new ObjectId(interview.candidateId),
            })

            if (!candidate) {
              candidate = await db.collection("students").findOne({
                _id: new ObjectId(interview.candidateId),
              })
            }

            if (candidate) {
              // Helper function to format full name properly
              const formatFullName = (candidateData: CandidateData): string => {
                const salutation = candidateData.salutation || candidateData.title || ""
                const firstName = candidateData.firstName || ""
                const middleName = candidateData.middleName || ""
                const lastName = candidateData.lastName || ""
                
                // If name field exists and is not empty, use it as fallback
                if (candidateData.name && candidateData.name.trim()) {
                  // Check if name already contains proper formatting
                  if (!firstName && !lastName) {
                    return candidateData.name.trim()
                  }
                }
                
                // Construct full name from individual components
                const nameParts = [salutation, firstName, middleName, lastName]
                  .filter(part => part && part.trim())
                  .map(part => part.trim())
                
                return nameParts.length > 0 ? nameParts.join(" ") : "Unknown Candidate"
              }

              // Helper function to get avatar URL from different possible fields
              const getAvatarUrl = (candidateData: CandidateData): string => {
                // Check various possible avatar fields
                if (candidateData.avatar) {
                  return candidateData.avatar
                }
                
                // For students collection, check documents.photograph
                if (candidateData.documents?.photograph) {
                  const photograph = candidateData.documents.photograph
                  if (typeof photograph === 'string') {
                    return photograph
                  } else if (photograph && typeof photograph === 'object' && 'url' in photograph) {
                    return photograph.url || ""
                  }
                }
                
                // Check direct photograph field
                if (candidateData.photograph) {
                  return candidateData.photograph
                }
                
                // Check photographUrl field 
                if (candidateData.photographUrl) {
                  return candidateData.photographUrl
                }
                
                return ""
              }

              candidateName = formatFullName(candidate)
              candidateEmail = candidate.email || ""
              candidateAvatar = getAvatarUrl(candidate)
            }
          }
        } catch (error) {
          console.error("Error fetching candidate details:", error)
        }

        // Convert stored date to IST and extract date string
        const storedDate = new Date(interview.date)
        // Convert to IST by adding 5.5 hours
        const istDate = new Date(storedDate.getTime() + 5.5 * 60 * 60 * 1000)
        const interviewDateString =
          istDate.getUTCFullYear() +
          "-" +
          String(istDate.getUTCMonth() + 1).padStart(2, "0") +
          "-" +
          String(istDate.getUTCDate()).padStart(2, "0")

        // Simple string comparison for today (IST)
        const isToday = interviewDateString === todayIST

        // For upcoming, check if date is after today
        const istDateObj = getISTDate()
        const tomorrow = new Date(istDateObj)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
        const tomorrowString =
          tomorrow.getUTCFullYear() +
          "-" +
          String(tomorrow.getUTCMonth() + 1).padStart(2, "0") +
          "-" +
          String(tomorrow.getUTCDate()).padStart(2, "0")

        const isUpcoming = interviewDateString >= tomorrowString

        console.log(`Interview ${interview._id} (IST):`, {
          position: interview.position,
          storedDate: interview.date,
          istDateString: interviewDateString,
          todayIST,
          tomorrowString,
          isToday,
          isUpcoming,
        })

        return {
          _id: interview._id,
          candidateId: interview.candidateId,
          candidate: {
            name: candidateName,
            email: candidateEmail,
            avatar: candidateAvatar,
          },
          position: interview.position,
          date: interview.date,
          time: interview.time,
          status: interview.status,
          jobId: interview.jobId,
          meetingLink: interview.meetingLink,
          notes: interview.notes,
          duration: interview.duration,
          scheduledBy: interview.scheduledBy,
          employeeId: interview.employeeId,
          companyId: interview.companyId,
          isToday,
          isUpcoming,
        }
      }),
    )

    const todayCount = formattedInterviews.filter((i) => i.isToday).length
    const upcomingCount = formattedInterviews.filter((i) => i.isUpcoming).length

    console.log("=== IST CATEGORIZATION RESULTS ===")
    console.log("Today's interviews:", todayCount)
    console.log("Upcoming interviews:", upcomingCount)
    console.log("Current IST time:", getISTDate().toISOString())

    return NextResponse.json({ success: true, interviews: formattedInterviews }, { status: 200 })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch interviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, jobId, position, date, time, duration, interviewers, meetingLink, notes } = body

    if (!candidateId || !position || !date || !time) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    console.log("=== CREATING INTERVIEW (IST) ===")
    console.log("Input date:", date)

    // Create IST date for storage
    const interviewDate = createISTDateFromString(date)

    console.log("IST date created:", {
      inputDate: date,
      istDate: interviewDate.toISOString(),
      istLocal: interviewDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    })

    const { db } = await connectToDatabase()
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Find candidate
    let candidate = null
    try {
      candidate = await db.collection("candidates").findOne({ _id: new ObjectId(candidateId) })
      if (!candidate) {
        candidate = await db.collection("students").findOne({ _id: new ObjectId(candidateId) })
      }
    } catch (error) {
      console.error("Error finding candidate:", error)
    }

    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 })
    }

    // Create interview object with IST date
    const newInterview = {
      candidateId: new ObjectId(candidateId),
      jobId: jobId ? new ObjectId(jobId) : null,
      position,
      date: interviewDate, // IST date
      time,
      duration: Number.parseInt(duration, 10) || 60,
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      meetingLink,
      notes,
      scheduledBy: new ObjectId(userId),
      employeeId: new ObjectId(userId),
      companyId: employee._id.toString(),
      companyName: employee.companyName,
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(userId),
    }

    console.log("=== STORING INTERVIEW (IST) ===")
    console.log("Final IST date:", newInterview.date.toISOString())
    console.log("Final IST local:", newInterview.date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))

    const result = await db.collection("interviews").insertOne(newInterview)
    console.log("Interview created with ID:", result.insertedId)

    // Update job's interview count if jobId is provided
    if (jobId) {
      await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $inc: { interviews: 1 } })
    }

    // Update candidate status
    if (candidate) {
      await db.collection("candidates").updateOne({ _id: new ObjectId(candidateId) }, { $set: { status: "Interview" } })
      await db.collection("students").updateOne({ _id: new ObjectId(candidateId) }, { $set: { status: "Interview" } })

      if (jobId) {
        await db.collection("job_applications").updateOne(
          {
            candidateId: new ObjectId(candidateId),
            jobId: new ObjectId(jobId),
          },
          {
            $set: {
              status: "Interview",
              updatedAt: new Date(),
            },
            $push: {
              history: {
                status: "Interview",
                date: new Date(),
                note: "Interview scheduled",
              },
            } as any,
          },
        )
      }
    }

    // FIXED: Send interview portal link instead of direct Google Meet link
    try {
      const candidateEmail = candidate.email
      const candidateName =
        candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Candidate"

      if (candidateEmail) {
        // FIXED: Send public interview page link instead of direct meeting link
        const publicInterviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/interview/${result.insertedId}/join`

        await sendEmail({
          to: candidateEmail,
          subject: `Interview Scheduled: ${position} at ${employee.companyName}`,
          text: `
            Dear ${candidateName},

            Your interview for the ${position} position at ${employee.companyName} has been scheduled.

            Date: ${date}
            Time: ${time} (IST)
            
            To join your interview, please visit: ${publicInterviewUrl}

            ${notes ? `Additional Notes: ${notes}` : ""}

            Please let us know if you have any questions or need to reschedule.

            Best regards,
            ${employee.firstName} ${employee.lastName}
            ${employee.companyName}
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Interview Scheduled</h1>
                <p style="color: #666; font-size: 16px;">Your interview has been successfully scheduled!</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h2 style="color: #333; margin-top: 0;">${position}</h2>
                <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> ${employee.companyName}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Time:</strong> ${time} (IST)</p>
                <p style="color: #666; margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
              </div>

              ${notes ? `<div style="margin-bottom: 25px;"><h3 style="color: #333;">Additional Notes:</h3><p style="color: #666; line-height: 1.6;">${notes}</p></div>` : ""}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${publicInterviewUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Join Interview
                </a>
              </div>

              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  This interview was scheduled by ${employee.firstName} ${employee.lastName} from ${employee.companyName}.
                </p>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
                  Please save this link to join your interview at the scheduled time.
                </p>
              </div>
            </div>
          `,
        })
      }
    } catch (emailError) {
      console.error("Error sending interview notification email:", emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Interview scheduled successfully",
        interviewId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error scheduling interview:", error)
    return NextResponse.json({ success: false, message: "Failed to schedule interview" }, { status: 500 })
  }
}
