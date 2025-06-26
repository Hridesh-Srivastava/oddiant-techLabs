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

    // First, get ALL results for this test to debug
    console.log("Fetching all results for test...")
    const allResults = await db.collection("assessment_results").find({}).toArray()

    console.log(`Total results in database: ${allResults.length}`)

    // Filter results for this specific test
    const testResults = allResults.filter((result) => {
      const resultTestId = result.testId?.toString()
      const currentTestId = testId?.toString()
      const matches = resultTestId === currentTestId

      if (matches) {
        console.log(`Found result for test: ${result.candidateEmail}, declared: ${result.resultsDeclared}`)
      }

      return matches
    })

    console.log(`Results for this test: ${testResults.length}`)

    // Find undeclared results
    const undeclaredResults = testResults.filter((result) => {
      const isUndeclared = !result.resultsDeclared || result.resultsDeclared === false
      console.log(`Result ${result.candidateEmail}: declared=${result.resultsDeclared}, isUndeclared=${isUndeclared}`)
      return isUndeclared
    })

    console.log(`Found ${undeclaredResults.length} undeclared results`)

    if (undeclaredResults.length === 0) {
      console.log("No new results to declare")
      return NextResponse.json(
        {
          success: false,
          message: "No new results to declare",
        },
        { status: 400 },
      )
    }

    // Get test details for email
    const test = await db.collection("assessment_tests").findOne({
      _id: new ObjectId(testId),
    })

    if (!test) {
      console.log("Test not found")
      return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
    }

    console.log("Test found:", test.name)

    // Get employee details for email
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(userId) })

    if (!employee) {
      console.log("Employee not found")
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 })
    }

    console.log("Employee found:", employee.firstName, employee.lastName)

    let declaredCount = 0
    let emailsSent = 0

    // Process each undeclared result
    for (const result of undeclaredResults) {
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
    console.error("Error details:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to declare results",
      },
      { status: 500 },
    )
  }
}
