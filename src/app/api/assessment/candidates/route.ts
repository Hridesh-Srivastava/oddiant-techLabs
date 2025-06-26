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

    // Get all candidates for this user
    const candidates = await db
      .collection("assessment_candidates")
      .find({ createdBy: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${candidates.length} candidates for user ${userId}`)

    // For each candidate, get their stats
    const candidatesWithStats = await Promise.all(
      candidates.map(async (candidate) => {
        // Get invitation count
        const invitationCount = await db.collection("assessment_invitations").countDocuments({
          email: candidate.email,
          createdBy: new ObjectId(userId),
        })

        // Get completed results count
        const completedResults = await db
          .collection("assessment_results")
          .find({
            candidateEmail: candidate.email,
          })
          .toArray()

        // Calculate average score
        let averageScore = 0
        if (completedResults.length > 0) {
          const totalScore = completedResults.reduce((sum, result) => sum + (result.score || 0), 0)
          averageScore = Math.round(totalScore / completedResults.length)
        }

        return {
          ...candidate,
          _id: candidate._id.toString(),
          testsAssigned: invitationCount,
          testsCompleted: completedResults.length,
          averageScore: averageScore,
        }
      }),
    )

    // Add cache control headers
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        candidates: candidatesWithStats,
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if candidate already exists
    const existingCandidate = await db.collection("assessment_candidates").findOne({
      email: email,
      createdBy: new ObjectId(userId),
    })

    if (existingCandidate) {
      return NextResponse.json({ success: false, message: "Candidate with this email already exists" }, { status: 400 })
    }

    // Create new candidate
    const newCandidate = {
      name,
      email,
      phone: phone || "",
      status: "Active",
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("assessment_candidates").insertOne(newCandidate)

    return NextResponse.json(
      {
        success: true,
        message: "Candidate created successfully",
        candidate: {
          ...newCandidate,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json({ success: false, message: "Failed to create candidate" }, { status: 500 })
  }
}
