import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== Starting Bulk Results Declaration ===")

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: testId } = await context.params
    console.log("Declaring results for test ID:", testId)

    // Validate ObjectId format
    if (!ObjectId.isValid(testId)) {
      console.log("Invalid test ID format:", testId)
      return NextResponse.json({ success: false, message: "Invalid test ID format" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()
    console.log("Database connected successfully")

    // Get test details for email
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
    })

    if (!test) {
      console.log("Test not found")
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    console.log("Test found:", test.name)

    // Get employer details for email
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      console.log("Employer not found")
      return NextResponse.json({ success: false, message: "Employer not found" }, { status: 404 })
    }

    console.log("Employer found:", employee.firstName, employee.lastName)

    let declaredCount = 0
    let emailsSent = 0

    // Fully robust: keep processing batches until all undeclared results are handled
    const BATCH_SIZE = 20;
    while (true) {
      console.log('Batch start: fetching undeclared results...');
      const undeclaredResults = await db.collection("assessment_results")
        .find({
          $and: [
            { $or: [ { testId: testId }, { testId: new ObjectId(testId) } ] },
            { $or: [ { resultsDeclared: false }, { resultsDeclared: { $exists: false } } ] }
          ]
        })
        .limit(BATCH_SIZE)
        .toArray();
      console.log(`Fetched ${undeclaredResults.length} undeclared results`);
      undeclaredResults.forEach(r => {
        console.log(`Result: _id=${r._id}, testId=${r.testId} (${typeof r.testId}), resultsDeclared=${r.resultsDeclared}`);
      });
      if (undeclaredResults.length === 0) break;
      await Promise.all(undeclaredResults.map(async (result) => {
        try {
          console.log(`Processing result for ${result.candidateEmail}...`)

          // Determine pass/fail status
          const isPassed = result.score >= test.passingScore
          const finalStatus = isPassed ? "Passed" : "Failed"

          // Update result in database
          const updateResult = await db.collection("assessment_results").updateOne(
            { _id: result._id },
            {
              $set: {
                resultsDeclared: true,
                status: finalStatus,
                declaredAt: new Date(),
                declaredBy: new ObjectId(userId),
              },
            },
          )

          console.log(
            `Update result for ${result.candidateEmail}:`,
            updateResult.modifiedCount > 0 ? "Success" : "Failed",
          )

          if (updateResult.modifiedCount > 0) {
            declaredCount++
            console.log(`Result declared for ${result.candidateEmail}: ${finalStatus}`)

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

            // Send email notification
            try {
              await sendEmail({
                to: result.candidateEmail,
                subject: `Your ${test.name} Assessment Results`,
                text: `
                Dear ${result.candidateName || "Candidate"},

                Your assessment results for "${test.name}" have been declared.

                Score: ${result.score}%
                Status: ${finalStatus}
                Passing Score: ${test.passingScore}%

                ${
                  isPassed
                    ? "Congratulations! You have passed the assessment."
                    : "Unfortunately, you did not meet the passing criteria for this assessment."
                }

                Best regards,
                ${employee.firstName} ${employee.lastName}
                ${employee.companyName}
              `,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <h2 style="color: #333;">Assessment Results Declared</h2>
                  <p>Dear ${result.candidateName || "Candidate"},</p>
                  <p>Your assessment results for <strong>"${test.name}"</strong> have been declared.</p>
                  
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Your Results:</h3>
                    <p style="margin: 5px 0;"><strong>Score:</strong> ${result.score}%</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${isPassed ? "#22c55e" : "#ef4444"}; font-weight: bold;">${finalStatus}</span></p>
                    <p style="margin: 5px 0;"><strong>Passing Score:</strong> ${test.passingScore}%</p>
                  </div>

                  ${
                    isPassed
                      ? '<p style="color: #22c55e; font-weight: bold;">🎉 Congratulations! You have passed the assessment.</p>'
                      : '<p style="color: #ef4444;">Unfortunately, you did not meet the passing criteria for this assessment.</p>'
                  }

                  <p>Best regards,<br>
                  ${employee.firstName} ${employee.lastName}<br>
                  ${employee.companyName}</p>
                </div>
              `,
              })

              emailsSent++
              console.log(`Email sent to ${result.candidateEmail}`)
            } catch (emailError) {
              console.error(`Failed to send email to ${result.candidateEmail}:`, emailError)
              // Continue with other results even if email fails
            }
          }
        } catch (resultError) {
          console.error(`Failed to process result for ${result.candidateEmail}:`, resultError)
          // Continue with other results
        }
      }));
      const remaining = await db.collection("assessment_results").countDocuments({
        $and: [
          { $or: [ { testId: testId }, { testId: new ObjectId(testId) } ] },
          { $or: [ { resultsDeclared: false }, { resultsDeclared: { $exists: false } } ] }
        ]
      });
      console.log(`Remaining undeclared results after batch: ${remaining}`);
    }

    console.log(`Declaration complete: ${declaredCount} results declared, ${emailsSent} emails sent`)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully declared ${declaredCount} results and sent ${emailsSent} email notifications`,
        declaredCount,
        emailsSent,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("=== Bulk Declaration Error ===")
    console.error("Error details:", error as Error)
    console.error("Stack trace:", (error as Error).stack)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to declare results",
      },
      { status: 500 },
    )
  }
}
