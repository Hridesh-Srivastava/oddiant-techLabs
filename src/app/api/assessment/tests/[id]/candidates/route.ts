import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const param = await params
const  testId = param.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Verify test ownership
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
      createdBy: new ObjectId(userId),
    })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const score = url.searchParams.get("score")

    // Get invitations for this specific test
    const invitations = await db
      .collection("assessment_invitations")
      .find({
        testId: new ObjectId(testId),
        createdBy: new ObjectId(userId),
      })
      .toArray()

    // Create a map of email to candidate data
    const candidateMap = new Map()

    // Process invitations to build candidate data
    for (const invitation of invitations) {
      const email = invitation.email

      if (!candidateMap.has(email)) {
        // Initialize candidate data
        candidateMap.set(email, {
          email,
          name: invitation.candidateName || email.split("@")[0],
          testsAssigned: 0,
          testsCompleted: 0,
          totalScore: 0,
          averageScore: 0,
          score: "N/A",
          status: "Invited",
          createdAt: invitation.createdAt,
          completionDate: null,
          formattedCompletionDate: "N/A",
          resultsDeclared: false,
        })
      }

      const candidateData = candidateMap.get(email)
      candidateData.testsAssigned++

      if (invitation.status === "Completed") {
        candidateData.testsCompleted++
        if (invitation.completedAt) {
          candidateData.completionDate = invitation.completedAt
          candidateData.formattedComp
          candidateData.completionDate = invitation.completedAt
          candidateData.formattedCompletionDate = invitation.completedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }
    }

    // Get results for this specific test
    const results = await db
      .collection("assessment_results")
      .find({
        testId: new ObjectId(testId),
        createdBy: new ObjectId(userId),
      })
      .toArray()

    // Update candidate data with results
    for (const result of results) {
      const email = result.candidateEmail
      if (candidateMap.has(email)) {
        const candidateData = candidateMap.get(email)
        candidateData.totalScore += result.score || 0
        candidateData.averageScore =
          candidateData.testsCompleted > 0 ? Math.round(candidateData.totalScore / candidateData.testsCompleted) : 0
        candidateData.score = result.score ? `${result.score}%` : "N/A"
        candidateData.resultsDeclared = result.resultsDeclared || false

        if (result.completionDate) {
          candidateData.completionDate = new Date(result.completionDate)
          candidateData.formattedCompletionDate = new Date(result.completionDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }

        // Update status based on most recent completion
        if (result.resultsDeclared) {
          candidateData.status = result.status // Passed or Failed
        } else if (result.score !== undefined) {
          candidateData.status = "Completed" // Completed but not declared
        }
      } else {
        // If candidate not found in invitations, add from result
        const completionDate = result.completionDate ? new Date(result.completionDate) : new Date()
        const formattedCompletionDate = completionDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })

        candidateMap.set(email, {
          email,
          name: result.candidateName || email.split("@")[0],
          testsAssigned: 1,
          testsCompleted: 1,
          totalScore: result.score || 0,
          averageScore: result.score || 0,
          score: result.score ? `${result.score}%` : "N/A",
          status: result.resultsDeclared ? result.status : "Completed",
          createdAt: result.createdAt || new Date(),
          completionDate,
          formattedCompletionDate,
          resultsDeclared: result.resultsDeclared || false,
        })
      }
    }

    // After processing invitations and results, get all emails in candidateMap
    const candidateEmails = Array.from(candidateMap.keys());

    // Fetch students with matching emails
    const students = await db
      .collection("students")
      .find({ email: { $in: candidateEmails } })
      .toArray();

    // Merge students into candidateMap if not already present
    for (const student of students) {
      if (!candidateMap.has(student.email)) {
        candidateMap.set(student.email, {
          email: student.email,
          name: student.firstName || student.name || student.email.split("@")[0],
          testsAssigned: 0,
          testsCompleted: 0,
          totalScore: 0,
          averageScore: 0,
          score: "N/A",
          status: "Student",
          createdAt: student.createdAt || new Date(),
          completionDate: null,
          formattedCompletionDate: "N/A",
          resultsDeclared: false,
        });
      }
    }

    // Convert map to array and add IDs
    let candidates = Array.from(candidateMap.values()).map((candidate, index) => ({
      ...candidate,
      _id: `candidate-${index}`,
    }))

    // Apply filters from query
    if (status) {
      candidates = candidates.filter((candidate) => candidate.status === status)
    }

    if (score) {
      candidates = candidates.filter((candidate) => {
        const avgScore = candidate.averageScore
        if (score === "> 90%" && avgScore > 90) return true
        if (score === "80-90%" && avgScore >= 80 && avgScore <= 90) return true
        if (score === "70-80%" && avgScore >= 70 && avgScore < 80) return true
        if (score === "< 70%" && avgScore < 70) return true
        return false
      })
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        candidates,
        testName: test.name,
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching test candidates:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidates" }, { status: 500 })
  }
}
