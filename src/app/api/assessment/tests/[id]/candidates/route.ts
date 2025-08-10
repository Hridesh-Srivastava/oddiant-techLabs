import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Helper function to construct full name from name components
function constructFullName(student: any, fallbackName?: string): string {
  // If we have proper name components, construct the full name
  if (student.salutation || student.firstName || student.middleName || student.lastName) {
    const nameParts = [
      student.salutation,
      student.firstName,
      student.middleName,
      student.lastName
    ].filter(Boolean); // Remove empty/undefined values
    
    if (nameParts.length > 0) {
      return nameParts.join(" ");
    }
  }
  
  // Fallback to existing name fields
  if (student.name) return student.name;
  if (student.firstName) return student.firstName;
  if (student.candidateName) return student.candidateName;
  
  // Final fallback to email prefix
  if (student.email) return student.email.split("@")[0];
  
  // Last resort fallback
  return fallbackName || "Unknown";
}

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
    const search = (url.searchParams.get("search") || "").trim()
    const page = parseInt(url.searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 200)

    // Get invitations for this specific test
    // Support both ObjectId and string stored testId for invitations
    const invitationQuery: any = { createdBy: new ObjectId(userId) }
    const invTestOr = [ { testId: new ObjectId(testId) }, { testId: testId } ]
    // Inject test condition
    invitationQuery.$or = invTestOr
    // Optional search conditions (email or candidateName)
    if (search) {
      const regex = { $regex: search, $options: "i" }
      const searchOr = [ { email: regex }, { candidateName: regex } ]
      invitationQuery.$and = [ { $or: invTestOr }, { $or: searchOr } ]
      delete invitationQuery.$or
    }
    if (search) {
      const regex = { $regex: search, $options: "i" }
      invitationQuery.$or = [
        { email: regex },
        { candidateName: regex },
      ]
    }
    const invitations = await db
      .collection("assessment_invitations")
      .find(invitationQuery)
      .sort({ invitedAt: -1, createdAt: -1 })
      .toArray()

    // Create a map of email to candidate data
    const candidateMap = new Map()

    // Process invitations to build candidate data
    for (const invitation of invitations) {
      const email = invitation.email

      if (!candidateMap.has(email)) {
        // Determine candidate status from the most recent invitation
        let candidateStatus = "Invited"
        if (invitation.status === "Completed") {
          candidateStatus = "Completed"
        } else if (invitation.status === "Expired") {
          candidateStatus = "Expired"
        } else if (invitation.status === "Cancelled") {
          candidateStatus = "Cancelled"
        }

        // Initialize candidate data
        candidateMap.set(email, {
          email,
          name: constructFullName(invitation, invitation.candidateName || email.split("@")[0]),
          testsAssigned: 0,
          testsCompleted: 0,
          totalScore: 0,
          averageScore: 0,
          score: "N/A",
          status: candidateStatus,
          createdAt: invitation.createdAt,
          completionDate: null,
          formattedCompletionDate: "N/A",
          resultsDeclared: false,
          invitationId: invitation._id?.toString(),
        })
      }

      const candidateData = candidateMap.get(email)
      // Keep the latest invitation id if available
      candidateData.invitationId = invitation._id?.toString() || candidateData.invitationId
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
    const resultQuery: any = { createdBy: new ObjectId(userId) }
    const resTestOr = [ { testId: new ObjectId(testId) }, { testId: testId } ]
    if (search) {
      const regex = { $regex: search, $options: "i" }
      const searchOr = [ { candidateEmail: regex }, { candidateName: regex } ]
      resultQuery.$and = [ { $or: resTestOr }, { $or: searchOr } ]
    } else {
      resultQuery.$or = resTestOr
    }
    if (search) {
      const regex = { $regex: search, $options: "i" }
      resultQuery.$or = [
        { candidateEmail: regex },
        { candidateName: regex },
      ]
    }
    // Get results for this specific test, most recent first (support string or ObjectId testId)
    const results = await db
      .collection("assessment_results")
      .find(resultQuery)
      .sort({ completionDate: -1, createdAt: -1 })
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
        // Use actual result id so frontend declare action can work
        candidateData._id = result._id?.toString()

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

        // Update status only if this result is the most recent for that candidate
        // Since we sorted by completionDate desc, first result encountered is latest
        if (!candidateData._latestResultSeen) {
          if (result.resultsDeclared) {
            candidateData.status = result.status // Passed or Failed
          } else if (result.score !== undefined) {
            candidateData.status = "Completed" // Completed but not declared
          }
          candidateData._latestResultSeen = true
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
          name: constructFullName(result, result.candidateName || email.split("@")[0]),
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
          _id: result._id?.toString(),
          _latestResultSeen: true,
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

    // Update existing candidates with proper names from student data
    for (const student of students) {
      if (candidateMap.has(student.email)) {
        const candidateData = candidateMap.get(student.email);
        // Update the name with proper full name construction
        candidateData.name = constructFullName(student, candidateData.name);
      }
    }

    // Merge students into candidateMap if not already present
    for (const student of students) {
      if (!candidateMap.has(student.email)) {
        candidateMap.set(student.email, {
          email: student.email,
          name: constructFullName(student),
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

    // Convert map to array and add fallback IDs
    let candidates = Array.from(candidateMap.values()).map((candidate, index) => ({
      ...candidate,
      _id: candidate._id || `candidate-${index}`,
    }))
    // Clean internal markers
    candidates = candidates.map((c: any) => {
      const { _latestResultSeen, ...rest } = c
      return rest
    })

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

    // Apply search filter at the end as a safety net (for student-enriched names)
    if (search) {
      const s = search.toLowerCase()
      candidates = candidates.filter((c: any) =>
        (c.name && String(c.name).toLowerCase().includes(s)) || (c.email && String(c.email).toLowerCase().includes(s)),
      )
    }

    // Attach assessment_candidates document IDs by matching emails (single query)
    if (candidates.length > 0) {
      const emails = candidates.map((c: any) => c.email).filter(Boolean)
      if (emails.length > 0) {
        const candidateDocs = await db
          .collection("assessment_candidates")
          .find({ createdBy: new ObjectId(userId), email: { $in: emails } })
          .project({ _id: 1, email: 1 })
          .toArray()
        const emailToAssessmentId = new Map(candidateDocs.map((d: any) => [d.email, d._id.toString()]))
        candidates = candidates.map((c: any) => ({
          ...c,
          assessmentCandidateId: emailToAssessmentId.get(c.email) || null,
        }))
      }
    }

    // Total before pagination
    const total = candidates.length

    // Pagination (slice on the aggregated array)
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25
    const start = (safePage - 1) * safeLimit
    const pagedCandidates = candidates.slice(start, start + safeLimit)

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        candidates: pagedCandidates,
        testName: test.name,
        lastUpdated: new Date().toISOString(),
        total,
        page: safePage,
        limit: safeLimit,
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
