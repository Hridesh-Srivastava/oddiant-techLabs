import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log("=== API DEBUG: assessment/results/[id]/route.ts GET handler called ===");
  console.log("CWD:", process.cwd());
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: resultId } = await context.params

    // Connect to database
    const { db } = await connectToDatabase()

    // Find result
    const result = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Try to get candidate name from candidates or students collection
    let candidateName = result.candidateName || ""
    const isLikelyEmailPrefix = candidateName && typeof candidateName === "string" && !candidateName.includes(" ") && result.candidateEmail && candidateName === result.candidateEmail.split("@")[0];
    if ((!candidateName || candidateName === result.candidateEmail || isLikelyEmailPrefix) && (result.candidateId || result.studentId || result.candidateEmail)) {
      let candidateDoc = null;
      console.log("DEBUG: result.studentId =", result.studentId, typeof result.studentId);
      console.log("DEBUG: result.candidateId =", result.candidateId, typeof result.candidateId);
      console.log("DEBUG: result.candidateEmail =", result.candidateEmail, typeof result.candidateEmail);
      if (result.candidateId) {
        candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(result.candidateId) });
        console.log("DEBUG: candidateDoc after candidateId/candidates lookup =", candidateDoc);
      }
      if (!candidateDoc && result.candidateId) {
        candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(result.candidateId) });
        console.log("DEBUG: candidateDoc after candidateId/students lookup =", candidateDoc);
      }
      if (!candidateDoc && result.studentId) {
        candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(result.studentId) });
        console.log("DEBUG: candidateDoc after studentId/students lookup =", candidateDoc);
      }
      if (!candidateDoc && result.studentId) {
        candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(result.studentId) });
        console.log("DEBUG: candidateDoc after studentId/candidates lookup =", candidateDoc);
      }
      if (!candidateDoc && result.candidateEmail) {
        candidateDoc = await db.collection("candidates").findOne({ email: result.candidateEmail });
        console.log("DEBUG: candidateDoc after candidateEmail/candidates lookup =", candidateDoc);
      }
      if (!candidateDoc && result.candidateEmail) {
        candidateDoc = await db.collection("students").findOne({ email: result.candidateEmail });
        console.log("DEBUG: candidateDoc after candidateEmail/students lookup =", candidateDoc);
      }
      if (candidateDoc) {
        // DEBUG: Log candidateDoc and all name fields
        console.log("candidateDoc for name resolution:", JSON.stringify({
          salutation: candidateDoc.salutation,
          firstName: candidateDoc.firstName,
          middleName: candidateDoc.middleName,
          lastName: candidateDoc.lastName,
          name: candidateDoc.name,
          email: candidateDoc.email,
          _id: candidateDoc._id
        }, null, 2));
        // Build full name: salutation + firstName + middleName + lastName
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
          candidateName = result.candidateEmail;
        }
      } else {
        candidateName = result.candidateEmail;
      }
    }

    // Get test details
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(result.testId),
    })

    // Calculate total questions from test sections
    let totalQuestions = 0
    if (test && test.sections) {
      totalQuestions = test.sections.reduce((total: number, section: any) => {
        return total + (section.questions ? section.questions.length : 0)
      }, 0)
    }

    console.log("Found result:", result.candidateName, result.candidateEmail)
    console.log("Test questions count:", totalQuestions)

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        result: {
          ...result,
          _id: result._id.toString(),
          testId: result.testId.toString(),
          candidateName, // <-- always use the resolved candidateName
        },
        test: test
          ? {
              ...test,
              _id: test._id.toString(),
              totalQuestions: totalQuestions,
            }
          : null,
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching result:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch result" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: resultId } = await context.params
    const body = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Find the result
    const existingResult = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    if (!existingResult) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Update the result with manual evaluation
    const updateData: any = {}

    // Handle manual evaluation updates
    if (body.manualEvaluation) {
      updateData.manualEvaluation = body.manualEvaluation
      updateData.evaluatedBy = userId
      updateData.evaluatedAt = new Date()
    }

    // Handle score updates
    if (body.score !== undefined) {
      updateData.score = body.score
    }

    // Always fetch the test and set status based on score and passingScore
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(existingResult.testId),
    })
    const passingScore = test?.passingScore ?? 70
    if (updateData.score !== undefined) {
      updateData.status = updateData.score >= passingScore ? "Passed" : "Failed"
    }

    // Handle results declaration
    if (body.resultsDeclared !== undefined) {
      updateData.resultsDeclared = body.resultsDeclared
      updateData.resultsDeclaredAt = new Date()
      updateData.resultsDeclaredBy = userId
    }

    // Handle answer updates (for manual evaluation)
    if (body.answers) {
      updateData.answers = body.answers
    }

    updateData.updatedAt = new Date()

    // Update the result
    const updateResult = await db
      .collection("assessment_results")
      .updateOne({ _id: new ObjectId(resultId) }, { $set: updateData })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Fetch the updated result
    const updatedResult = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
    })

    console.log("Updated result:", updatedResult?.candidateName, updatedResult?.candidateEmail)

    return NextResponse.json(
      {
        success: true,
        message: "Result updated successfully",
        result: {
          ...updatedResult,
          _id: updatedResult?._id.toString(),
          testId: updatedResult?.testId.toString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating result:", error)
    return NextResponse.json({ success: false, message: "Failed to update result" }, { status: 500 })
  }
}
