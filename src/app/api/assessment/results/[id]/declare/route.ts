import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id: resultId } = await context.params

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find result by ID
    const result = await db.collection("assessment_results").findOne({
      _id: new ObjectId(resultId),
      createdBy: new ObjectId(userId),
    })

    if (!result) {
      return NextResponse.json({ success: false, message: "Result not found" }, { status: 404 })
    }

    // Check if result is already declared
    if (result.resultsDeclared) {
      return NextResponse.json({ success: false, message: "Result has already been declared" }, { status: 400 })
    }

    // Get employer details
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

    // Get test details
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(result.testId),
    })

    if (!test) {
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    // Update result to mark it as declared
    await db.collection("assessment_results").updateOne(
      { _id: new ObjectId(resultId) },
      {
        $set: {
          resultsDeclared: true,
          resultsDeclaredAt: new Date(),
        },
      },
    )

    // Update candidate status based on result
    await db.collection("assessment_candidates").updateOne(
      {
        email: result.candidateEmail,
        createdBy: new ObjectId(userId),
      },
      {
        $set: {
          status: result.status, // Passed or Failed
          updatedAt: new Date(),
        },
      },
    )

    // Robust candidate name resolution before sending email
    let candidateName = result.candidateName || ""
    const isLikelyEmailPrefix = candidateName && typeof candidateName === "string" && !candidateName.includes(" ") && result.candidateEmail && candidateName === result.candidateEmail.split("@")[0];
    if ((!candidateName || candidateName === result.candidateEmail || isLikelyEmailPrefix) && (result.candidateId || result.studentId || result.candidateEmail)) {
      let candidateDoc = null;
      if (result.candidateId) {
        candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(result.candidateId) });
      }
      if (!candidateDoc && result.candidateId) {
        candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(result.candidateId) });
      }
      if (!candidateDoc && result.studentId) {
        candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(result.studentId) });
      }
      if (!candidateDoc && result.studentId) {
        candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(result.studentId) });
      }
      if (!candidateDoc && result.candidateEmail) {
        candidateDoc = await db.collection("candidates").findOne({ email: result.candidateEmail });
      }
      if (!candidateDoc && result.candidateEmail) {
        candidateDoc = await db.collection("students").findOne({ email: result.candidateEmail });
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
          candidateName = result.candidateEmail;
        }
      } else {
        candidateName = result.candidateEmail;
      }
    }
    result.candidateName = candidateName;

    // Send email to the candidate
    try {
      await sendEmail({
        to: result.candidateEmail,
        subject: `Your Assessment Results: ${test.name}`,
        text: `
          Hello ${result.candidateName},

          Your results for the ${test.name} assessment have been declared.

          Your Results:
          - Score: ${result.score}%
          - Status: ${result.status}
          - Duration: ${result.duration} minutes

          ${
            result.status === "Passed"
              ? "Congratulations on passing the assessment!"
              : "Thank you for your participation. You can try again if allowed by the assessment administrator."
          }

          Best regards,
          ${employee.firstName} ${employee.lastName}
          ${employee.companyName}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Assessment Results Declared</h2>
            <p>Hello ${result.candidateName},</p>
            <p>Your results for the <strong>${test.name}</strong> assessment have been declared.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Results:</h3>
              <p><strong>Score:</strong> ${result.score}%</p>
              <p><strong>Status:</strong> <span style="color: ${result.status === "Passed" ? "#4CAF50" : "#F44336"};">${result.status}</span></p>
              <p><strong>Duration:</strong> ${result.duration} minutes</p>
            </div>
            
            <p>${
              result.status === "Passed"
                ? "Congratulations on passing the assessment!"
                : "Thank you for your participation. You can try again if allowed by the assessment administrator."
            }</p>
            
            <p>Best regards,<br>${employee.firstName} ${employee.lastName}<br>${employee.companyName}</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("Error sending result email:", emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true, message: "Result declared and email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error declaring individual result:", error)
    return NextResponse.json({ success: false, message: "Failed to declare individual result" }, { status: 500 })
  }
}
