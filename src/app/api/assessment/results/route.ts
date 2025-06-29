import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

// 1. Load Gemini API key and URL from env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

async function evaluateWrittenAnswerWithGemini(questionText: string, userAnswer: string) {
  if (!GEMINI_API_KEY || !GEMINI_API_URL) return { aiScore: 0, aiFeedback: "AI evaluation unavailable." };
  const prompt = `You are an exam evaluator. Evaluate the following answer for the question. Give a score (0-100) and a short, polite, constructive feedback (no JSON, no harsh language, just plain text).\nQuestion: ${questionText}\nAnswer: ${userAnswer}\nCriteria: relevance, completeness, clarity, grammar.\nRespond in this format: 'Score: <number>\nFeedback: <your feedback here>'`;
  try {
    const res = await fetch(GEMINI_API_URL + `?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Parse 'Score: <number>\nFeedback: <text>'
    const scoreMatch = text.match(/Score:\s*(\d+)/i);
    const feedbackMatch = text.match(/Feedback:\s*([\s\S]*)/i);
    const aiScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const aiFeedback = feedbackMatch ? feedbackMatch[1].trim() : text.trim();
    return { aiScore, aiFeedback };
  } catch (e) {
    return { aiScore: 0, aiFeedback: "AI evaluation failed." };
  }
}

// Add robust MCQ answer comparison helper
function isMCQAnswerCorrect(userAnswer: any, correctAnswer: any, options?: string[]) {
  const normalize = (val: any): string | string[] =>
    typeof val === 'string' ? val.trim().toLowerCase() : Array.isArray(val) ? val.map((v: any) => String(v).trim().toLowerCase()).sort() : String(val).trim().toLowerCase();
  const ua = normalize(userAnswer);
  const ca = normalize(correctAnswer);
  if (Array.isArray(ua) && Array.isArray(ca)) {
    return JSON.stringify(ua) === JSON.stringify(ca);
  }
  if (ua === ca) return true;
  if (options && typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    const userIdx = options.findIndex((opt: string) => normalize(opt) === ua);
    const correctIdx = options.findIndex((opt: string) => normalize(opt) === ca);
    if (userIdx !== -1 && userIdx === correctIdx) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get query parameters
    const url = new URL(request.url)
    const test = url.searchParams.get("test")
    const status = url.searchParams.get("status")
    const score = url.searchParams.get("score")
    const date = url.searchParams.get("date")
    const limit = url.searchParams.get("limit") ? Number.parseInt(url.searchParams.get("limit") as string) : undefined
    const sort = url.searchParams.get("sort") || "completionDate"

    // Build query
    const query: any = { createdBy: new ObjectId(userId) }

    if (test) {
      query.testId = new ObjectId(test)
    }

    if (status) {
      query.status = status
    }

    if (score) {
      // Parse score filter
      if (score === "> 90%") {
        query.score = { $gt: 90 }
      } else if (score === "80-90%") {
        query.score = { $gte: 80, $lte: 90 }
      } else if (score === "70-80%") {
        query.score = { $gte: 70, $lt: 80 }
      } else if (score === "< 70%") {
        query.score = { $lt: 70 }
      }
    }

    if (date) {
      // Parse date filter
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (date === "Today") {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        query.completionDate = { $gte: today, $lt: tomorrow }
      } else if (date === "This week") {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        query.completionDate = { $gte: startOfWeek, $lt: endOfWeek }
      } else if (date === "This month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        query.completionDate = { $gte: startOfMonth, $lte: endOfMonth }
      } else if (date === "Older") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        query.completionDate = { $lt: startOfMonth }
      }
    }

    // Get results from database
    let resultsQuery = db.collection("assessment_results").find(query)

    // Apply sorting
    resultsQuery = resultsQuery.sort({ [sort]: -1 })

    // Apply limit if specified
    if (limit) {
      resultsQuery = resultsQuery.limit(limit)
    }

    const results = await resultsQuery.toArray()

    // Calculate stats
    let averageScore = 0
    let passRate = 0

    if (results.length > 0) {
      // Calculate average score
      const totalScore = results.reduce((sum, result) => sum + result.score, 0)
      averageScore = Math.round(totalScore / results.length)

      // Calculate pass rate
      const passedCount = results.filter((result) => result.status === "Passed").length
      passRate = Math.round((passedCount / results.length) * 100)
    }

    // Get completion rate (completed tests / assigned tests)
    const completedTests = await db.collection("assessment_invitations").countDocuments({
      createdBy: new ObjectId(userId),
      status: "Completed",
    })

    const totalInvitations = await db.collection("assessment_invitations").countDocuments({
      createdBy: new ObjectId(userId),
    })

    const completionRate = totalInvitations > 0 ? Math.round((completedTests / totalInvitations) * 100) : 0

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      {
        success: true,
        results,
        stats: {
          averageScore,
          passRate,
          completionRate,
        },
      },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get result data from request body
    const resultData = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Get the invitation to determine the creator
    const invitation = await db.collection("assessment_invitations").findOne({
      _id: new ObjectId(resultData.invitationId),
    })

    if (!invitation) {
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 })
    }

    // AI evaluation for written answers
    if (Array.isArray(resultData.answers)) {
      for (const ans of resultData.answers) {
        if (ans.questionType === 'Written Answer' && typeof ans.answer === 'string' && ans.answer.trim().length > 0) {
          const { aiScore, aiFeedback } = await evaluateWrittenAnswerWithGemini(ans.questionText, ans.answer);
          ans.aiScore = aiScore;
          ans.aiFeedback = aiFeedback;
          // Assign points based on AI score (>=60 full, else proportional)
          if (typeof aiScore === 'number') {
            ans.points = Math.round((aiScore / 100) * ans.maxPoints);
            ans.isCorrect = ans.points > 0;
          } else {
            ans.points = 0;
            ans.isCorrect = false;
          }
        }
        // MCQ robust evaluation
        if (ans.questionType === 'Multiple Choice') {
          if (typeof ans.correctAnswer === 'number' && Array.isArray(ans.options)) {
            const userIdx = Number(ans.answer);
            const correctIdx = Number(ans.correctAnswer);
            if (!isNaN(userIdx) && userIdx === correctIdx) {
              ans.points = ans.maxPoints;
              ans.isCorrect = true;
            } else {
              ans.points = 0;
              ans.isCorrect = false;
            }
          } else {
            if (isMCQAnswerCorrect(ans.answer, ans.correctAnswer, ans.options)) {
              ans.points = ans.maxPoints;
              ans.isCorrect = true;
            } else {
              ans.points = 0;
              ans.isCorrect = false;
            }
          }
        }
        // Coding partial points
        if (ans.questionType === 'Coding' && Array.isArray(ans.codingTestResults)) {
          const total = ans.codingTestResults.length;
          const passed = ans.codingTestResults.filter((tc: any) => tc.passed).length;
          ans.points = total > 0 ? Math.round((passed / total) * ans.maxPoints) : 0;
        }
      }
    }

    // After evaluating all answers, recalculate totalPoints, earnedPoints, correctAnswers, score, and status
    if (Array.isArray(resultData.answers)) {
      let totalPoints = 0;
      let earnedPoints = 0;
      let correctAnswers = 0;
      for (const ans of resultData.answers) {
        totalPoints += ans.maxPoints || 0;
        earnedPoints += ans.points || 0;
        if (ans.isCorrect) correctAnswers++;
      }
      resultData.totalPoints = totalPoints;
      resultData.earnedPoints = earnedPoints;
      resultData.correctAnswers = correctAnswers;
      resultData.score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      resultData.status = (resultData.score >= (resultData.passingScore || 70)) ? 'Passed' : 'Failed';
    }

    // Create new result
    const newResult = {
      ...resultData,
      createdBy: invitation.createdBy,
      createdAt: new Date(),
      completionDate: new Date(),
      resultsDeclared: false, // Default to false - results not declared yet
    }

    // Insert result into database
    const result = await db.collection("assessment_results").insertOne(newResult)

    // Update invitation status
    await db.collection("assessment_invitations").updateOne(
      { _id: new ObjectId(resultData.invitationId) },
      {
        $set: {
          status: "Completed",
          completedAt: new Date(),
        },
      },
    )

    // Update candidate record if it exists
    const candidateEmail = resultData.candidateEmail
    if (candidateEmail) {
      const candidate = await db.collection("assessment_candidates").findOne({
        email: candidateEmail,
        createdBy: invitation.createdBy,
      })

      if (candidate) {
        // Update existing candidate
        await db.collection("assessment_candidates").updateOne(
          { _id: candidate._id },
          {
            $inc: { testsCompleted: 1 },
            $set: {
              status: "Completed", // Just mark as completed, not pass/fail until declared
              lastCompletedAt: new Date(),
              updatedAt: new Date(),
            },
          },
        )
      } else {
        // Create new candidate record
        await db.collection("assessment_candidates").insertOne({
          name: resultData.candidateName || candidateEmail.split("@")[0],
          email: candidateEmail,
          testsAssigned: 1,
          testsCompleted: 1,
          averageScore: resultData.score,
          status: "Completed", // Just mark as completed, not pass/fail until declared
          createdBy: invitation.createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    // Do NOT send result email here - it will be sent when results are declared

    return NextResponse.json({ success: true, resultId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating result:", error)
    return NextResponse.json({ success: false, message: "Failed to create result" }, { status: 500 })
  }
}
