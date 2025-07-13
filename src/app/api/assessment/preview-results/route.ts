import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

async function evaluateWrittenAnswerWithGemini(questionText: string, userAnswer: string): Promise<{ aiScore: number, aiFeedback: string }> {
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
    const scoreMatch = text.match(/Score:\s*(\d+)/i);
    const feedbackMatch = text.match(/Feedback:\s*([\s\S]*)/i);
    const aiScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const aiFeedback = feedbackMatch ? feedbackMatch[1].trim() : text.trim();
    return { aiScore, aiFeedback };
  } catch (e) {
    return { aiScore: 0, aiFeedback: "AI evaluation failed." };
  }
}

function isMCQAnswerCorrect(userAnswer: any, correctAnswer: any, options?: any[]): boolean {
  const normalize = (val: any): string | string[] =>
    typeof val === 'string' ? val.trim().toLowerCase() : Array.isArray(val) ? val.map((v: any) => String(v).trim().toLowerCase()).sort() : String(val).trim().toLowerCase();
  const ua = normalize(userAnswer);
  const ca = normalize(correctAnswer);
  if (Array.isArray(ua) && Array.isArray(ca)) {
    return JSON.stringify(ua) === JSON.stringify(ca);
  }
  if (ua === ca) return true;
  if (options && typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    const userIdx = options.findIndex((opt: any) => normalize(opt) === ua);
    const correctIdx = options.findIndex((opt: any) => normalize(opt) === ca);
    if (userIdx !== -1 && userIdx === correctIdx) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const data = await request.json()
    const { db } = await connectToDatabase()
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }
    // Fetch test definition
    const test = await db.collection("assessment_tests").findOne({ _id: new ObjectId(data.testId) })
    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }
    // Evaluate answers
    let totalPoints = 0
    let earnedPoints = 0
    let correctAnswers = 0
    const evaluatedAnswers = []
    const answeredIds = new Set((data.answers || []).map((a: any) => a.questionId));
    for (const section of test.sections || []) {
      for (const q of section.questions || []) {
        // Find user's answer for this question
        const ans = (data.answers || []).find((a: any) => a.questionId === q.id || a.questionId?.split("-").pop() === q.id) || {};
        const maxPoints = q.points || 0;
        let points = 0;
        let isCorrect = false;
        let aiScore = null;
        let aiFeedback = null;
        let answer = ans.answer ?? "";
        // MCQ
        if (q.type === "Multiple Choice") {
          const correctAnswer = q.correctAnswer;
          const options = q.options || [];
          if (
            answer === undefined ||
            answer === null ||
            (typeof answer === "string" && answer.trim() === "") ||
            (Array.isArray(answer) && answer.length === 0)
          ) {
            points = 0;
            isCorrect = false;
          } else if (isMCQAnswerCorrect(answer, correctAnswer, options)) {
            points = maxPoints;
            isCorrect = true;
          } else {
            points = 0;
            isCorrect = false;
          }
          evaluatedAnswers.push({
            questionId: q.id,
            questionText: q.text,
            questionType: q.type,
            answer,
            options,
            isCorrect,
            points,
            maxPoints,
            correctAnswer,
            aiScore: null,
            aiFeedback: null,
            codingTestResults: null,
          });
          totalPoints += maxPoints;
          earnedPoints += points;
          if (isCorrect) correctAnswers++;
          continue;
        }
        // Coding
        if (q.type === "Coding") {
          const codingTestResults = Array.isArray(ans.codingTestResults) ? ans.codingTestResults.map((tc: any) => ({
            input: tc.input ?? "",
            expectedOutput: tc.expectedOutput ?? "",
            actualOutput: tc.actualOutput ?? "",
            passed: !!tc.passed,
          })) : [];
          const total = codingTestResults.length;
          const passed = codingTestResults.filter((tc: any) => tc.passed).length;
          points = total > 0 ? Math.round((passed / total) * maxPoints) : 0;
          isCorrect = points > 0;
          evaluatedAnswers.push({
            questionId: q.id,
            questionText: q.text,
            questionType: q.type,
            answer,
            options: q.options || [],
            isCorrect,
            points,
            maxPoints,
            correctAnswer: q.correctAnswer || null,
            aiScore: null,
            aiFeedback: null,
            codingTestResults,
          });
          totalPoints += maxPoints;
          earnedPoints += points;
          if (isCorrect) correctAnswers++;
          continue;
        }
        // Written
        if (q.type === "Written Answer") {
          if (typeof answer === "string" && answer.trim().length > 0) {
            const gemini = await evaluateWrittenAnswerWithGemini(q.text, answer);
            aiScore = gemini.aiScore;
            aiFeedback = gemini.aiFeedback;
            if (typeof aiScore === 'number') {
              if (aiScore >= 15) {
                points = Math.round((aiScore / 100) * maxPoints);
              } else {
                points = 0;
              }
              isCorrect = points > 0;
            } else {
              points = 0;
              isCorrect = false;
            }
          } else {
            points = 0;
            isCorrect = false;
            aiScore = 0;
            aiFeedback = "No answer provided.";
          }
          evaluatedAnswers.push({
            questionId: q.id,
            questionText: q.text,
            questionType: q.type,
            answer,
            options: q.options || [],
            isCorrect,
            points,
            maxPoints,
            correctAnswer: q.correctAnswer || null,
            aiScore,
            aiFeedback,
            codingTestResults: null,
          });
          totalPoints += maxPoints;
          earnedPoints += points;
          if (isCorrect) correctAnswers++;
          continue;
        }
        // For any other type, push a blank answer object
        evaluatedAnswers.push({
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          answer,
          options: q.options || [],
          isCorrect: false,
          points: 0,
          maxPoints,
          correctAnswer: q.correctAnswer || null,
          aiScore: null,
          aiFeedback: null,
          codingTestResults: null,
        });
        totalPoints += maxPoints;
      }
    }
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const status = score >= (test.passingScore || 70) ? "Passed" : "Failed"
    // Prepare preview result data
    const previewResultData = {
      testId: data.testId,
      testName: data.testName,
      employeeId: new ObjectId(userId),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeEmail: employee.email,
      score,
      status,
      duration: data.duration,
      answers: evaluatedAnswers,
      tabSwitchCount: data.tabSwitchCount,
      resultsDeclared: false,
      totalPoints,
      earnedPoints,
      correctAnswers,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // Insert preview result
    const result = await db.collection("assessment_preview_results").insertOne(previewResultData)
    if (!result.acknowledged) {
      throw new Error("Failed to save preview result")
    }
    return NextResponse.json({
      success: true,
      message: "Preview test result saved successfully",
      resultId: result.insertedId,
      score,
      status,
    })
  } catch (error) {
    console.error("Error saving preview result:", error)
    return NextResponse.json({ success: false, message: "Failed to save preview result" }, { status: 500 })
  }
}
