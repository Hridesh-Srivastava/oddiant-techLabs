import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id } = await context.params

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    let candidateId = id
    console.log("Original candidate ID:", candidateId)

    // Handle candidate-X format by extracting the actual ID
    if (candidateId.startsWith("candidate-")) {
      candidateId = candidateId.replace("candidate-", "")
      console.log("Extracted candidate ID:", candidateId)
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Try multiple approaches to find the candidate
    let candidate = null

    // Approach 1: Try as ObjectId if it's a valid ObjectId
    if (ObjectId.isValid(candidateId)) {
      console.log("Trying ObjectId lookup...")
      candidate = await db.collection("assessment_candidates").findOne({
        _id: new ObjectId(candidateId),
        createdBy: new ObjectId(userId),
      })
      console.log("ObjectId lookup result:", candidate ? "Found" : "Not found")
    }

    // Approach 2: Try as string ID
    if (!candidate) {
      console.log("Trying string ID lookup...")
      candidate = await db.collection("assessment_candidates").findOne({
        candidateId: candidateId,
        createdBy: new ObjectId(userId),
      })
      console.log("String ID lookup result:", candidate ? "Found" : "Not found")
    }

    // Approach 3: Try as numeric index (for candidate-1, candidate-2, etc.)
    if (!candidate) {
      console.log("Trying numeric index lookup...")
      const numericId = Number.parseInt(candidateId)
      if (!isNaN(numericId)) {
        // Get all candidates for this user and find by index
        const allCandidates = await db
          .collection("assessment_candidates")
          .find({ createdBy: new ObjectId(userId) })
          .sort({ createdAt: 1 })
          .toArray()

        console.log(`Found ${allCandidates.length} total candidates`)

        if (numericId > 0 && numericId <= allCandidates.length) {
          candidate = allCandidates[numericId - 1] // Array is 0-indexed, but candidate-1 should be first
          console.log("Numeric index lookup result:", candidate ? "Found" : "Not found")
        }
      }
    }

    if (!candidate) {
      console.log("No candidate found with any approach")
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    console.log("Found candidate:", candidate.name, candidate.email)

    // Robust full name resolution (copied from list API)
    let candidateName = candidate.name || ""
    const isLikelyEmailPrefix = candidateName && typeof candidateName === "string" && !candidateName.includes(" ") && candidate.email && candidateName === candidate.email.split("@")[0];
    if ((!candidateName || candidateName === candidate.email || isLikelyEmailPrefix) && candidate.email) {
      let candidateDoc = null;
      candidateDoc = await db.collection("students").findOne({ email: candidate.email });
      if (!candidateDoc) {
        candidateDoc = await db.collection("candidates").findOne({ email: candidate.email });
      }
      if (!candidateDoc && candidate._id) {
        candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(candidate._id) });
      }
      if (!candidateDoc && candidate._id) {
        candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(candidate._id) });
      }
      if (candidateDoc) {
        let fullName = ""
        if (candidateDoc.salutation && typeof candidateDoc.salutation === "string" && candidateDoc.salutation.trim() !== "") {
          fullName += candidateDoc.salutation.trim() + " ";
        }
        if (candidateDoc.firstName && typeof candidateDoc.firstName === "string" && candidateDoc.firstName.trim() !== "") {
          fullName += candidateDoc.firstName.trim() + " ";
        }
        if (candidateDoc.middleName && typeof candidateDoc.middleName === "string" && candidateDoc.middleName.trim() !== "") {
          fullName += candidateDoc.middleName.trim() + " ";
        }
        if (candidateDoc.lastName && typeof candidateDoc.lastName === "string" && candidateDoc.lastName.trim() !== "") {
          fullName += candidateDoc.lastName.trim();
        }
        fullName = fullName.trim();
        if (fullName !== "") {
          candidateName = fullName;
        } else if (candidateDoc.name && typeof candidateDoc.name === "string" && candidateDoc.name.trim() !== "") {
          candidateName = candidateDoc.name.trim();
        } else {
          candidateName = candidate.email;
        }
      } else {
        candidateName = candidate.email;
      }
    }

    // Get invitation count for this candidate
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

    console.log("Candidate stats:", {
      invitations: invitationCount,
      completed: completedResults.length,
      average: averageScore,
    })

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        candidate: {
          ...candidate,
          name: candidateName,
          _id: candidate._id.toString(),
          testsAssigned: invitationCount,
          testsCompleted: completedResults.length,
          averageScore: averageScore,
        },
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidate" }, { status: 500 })
  }
}
