import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const interviewId = resolvedParams.id

    // Validate ObjectId format
    if (!ObjectId.isValid(interviewId)) {
      return NextResponse.json({ success: false, message: "Invalid interview ID" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    console.log("Fetching public interview details for ID:", interviewId)

    // Find interview (public access - no auth required)
    const interview = await db.collection("interviews").findOne({
      _id: new ObjectId(interviewId),
    })

    if (!interview) {
      console.log("Interview not found for ID:", interviewId)
      return NextResponse.json({ success: false, message: "Interview not found" }, { status: 404 })
    }

    console.log("Found interview:", interview._id)

    // Get candidate details
    let candidate = null
    try {
      if (interview.candidateId) {
        candidate = await db.collection("candidates").findOne({ _id: new ObjectId(interview.candidateId) })

        if (!candidate) {
          candidate = await db.collection("students").findOne({ _id: new ObjectId(interview.candidateId) })
        }
      }
    } catch (error) {
      console.error("Error fetching candidate:", error)
    }

    // Get employer details for contact info
    let employee = null
    try {
      if (interview.employeeId) {
        employee = await db.collection("employees").findOne({ _id: new ObjectId(interview.employeeId) })
      }
    } catch (error) {
      console.error("Error fetching employer:", error)
    }

    // Format candidate information
    const candidateInfo = candidate
      ? {
          _id: candidate._id,
          name:
            candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown Candidate",
          email: candidate.email || "",
          phone: candidate.phone || "",
        }
      : {
          _id: interview.candidateId,
          name: "Unknown Candidate",
          email: "",
          phone: "",
        }

    // Format the public response (limited information)
    const publicInterview = {
      _id: interview._id,
      candidateId: interview.candidateId,
      candidate: candidateInfo,
      position: interview.position,
      date: interview.date,
      time: interview.time,
      duration: interview.duration || 60,
      meetingLink: interview.meetingLink || "",
      notes: interview.notes || "",
      status: interview.status || "scheduled",
      location: interview.location || "Remote",
      companyName: interview.companyName || (employee ? employee.companyName : ""),
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "",
      employeeEmail: employee ? employee.email : "",
    }

    console.log("Returning public interview data")

    // Add cache control headers
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, interview: publicInterview },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching public interview:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch interview" }, { status: 500 })
  }
}
