import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Starting Results Export Process ===")

    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    console.log("User ID:", userId)

    // Connect to database
    const { db } = await connectToDatabase()
    console.log("Database connected successfully")

    // Get query parameters
    const url = new URL(request.url)
    const testParam = url.searchParams.get("test")
    const status = url.searchParams.get("status")
    const score = url.searchParams.get("score")
    const date = url.searchParams.get("date")

    console.log("Query parameters:", { testParam, status, score, date })

    // Build query - fetch all results first, then filter
    const query: any = {}

    // If test parameter is provided, filter by test
    if (testParam && ObjectId.isValid(testParam)) {
      console.log("Filtering by test ID:", testParam)
      // Get all results and filter by testId
      const allResults = await db.collection("assessment_results").find({}).toArray()
      console.log(`Found ${allResults.length} total results in database`)

      // Filter results for the specific test
      const testResults = allResults.filter((result) => {
        const resultTestId = result.testId?.toString()
        const targetTestId = testParam.toString()
        return resultTestId === targetTestId
      })

      console.log(`Found ${testResults.length} results for test ${testParam}`)

      // If no results found for this test, return empty Excel
      if (testResults.length === 0) {
        console.log("No results found for this test, creating empty Excel")
        return await createEmptyExcel(testParam)
      }

      // Use filtered results
      const results = testResults

      // Apply additional filters if provided
      let filteredResults = results

      if (status) {
        filteredResults = filteredResults.filter((result) => result.status === status)
        console.log(`After status filter (${status}): ${filteredResults.length} results`)
      }

      if (score) {
        if (score === "> 90%") {
          filteredResults = filteredResults.filter((result) => result.score > 90)
        } else if (score === "80-90%") {
          filteredResults = filteredResults.filter((result) => result.score >= 80 && result.score <= 90)
        } else if (score === "70-80%") {
          filteredResults = filteredResults.filter((result) => result.score >= 70 && result.score < 80)
        } else if (score === "< 70%") {
          filteredResults = filteredResults.filter((result) => result.score < 70)
        }
        console.log(`After score filter (${score}): ${filteredResults.length} results`)
      }

      if (date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (date === "Today") {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          filteredResults = filteredResults.filter((result) => {
            const completionDate = new Date(result.completionDate)
            return completionDate >= today && completionDate < tomorrow
          })
        } else if (date === "This week") {
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)
          filteredResults = filteredResults.filter((result) => {
            const completionDate = new Date(result.completionDate)
            return completionDate >= startOfWeek && completionDate < endOfWeek
          })
        } else if (date === "This month") {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          filteredResults = filteredResults.filter((result) => {
            const completionDate = new Date(result.completionDate)
            return completionDate >= startOfMonth && completionDate <= endOfMonth
          })
        } else if (date === "Older") {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          filteredResults = filteredResults.filter((result) => {
            const completionDate = new Date(result.completionDate)
            return completionDate < startOfMonth
          })
        }
        console.log(`After date filter (${date}): ${filteredResults.length} results`)
      }

      console.log(`Final filtered results count: ${filteredResults.length}`)
      return await createExcelFile(filteredResults, testParam)
    } else {
      // No test filter - get all results for this user (if we had user-based filtering)
      console.log("No test filter provided, fetching all results")
      const results = await db.collection("assessment_results").find({}).sort({ completionDate: -1 }).toArray()
      console.log(`Found ${results.length} total results`)
      return await createExcelFile(results)
    }
  } catch (error) {
    console.error("=== Export Error ===")
    console.error("Error details:", error)
    console.error("Stack trace:", (error as Error).stack)
    return NextResponse.json({ success: false, message: "Failed to export results" }, { status: 500 })
  }
}

async function createEmptyExcel(testId?: string) {
  console.log("Creating empty Excel file")

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Assessment Platform"
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet("Assessment Results")

  // Add headers only
  worksheet.columns = [
    { header: "Candidate Name", key: "candidateName", width: 25 },
    { header: "Email", key: "candidateEmail", width: 30 },
    { header: "Test Name", key: "testName", width: 25 },
    { header: "Score (%)", key: "score", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Duration (min)", key: "duration", width: 15 },
    { header: "Completion Date", key: "completionDate", width: 20 },
    { header: "Results Declared", key: "resultsDeclared", width: 15 },
  ]

  // Style the header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }

  // Add a note row
  worksheet.addRow({
    candidateName: "No results found for this test",
    candidateEmail: "",
    testName: "",
    score: "",
    status: "",
    duration: "",
    completionDate: "",
    resultsDeclared: "",
  })

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="assessment-results-${testId || "all"}-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}

async function createExcelFile(results: any[], testId?: string) {
  console.log(`Creating Excel file with ${results.length} results`)

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Assessment Platform"
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet("Assessment Results")

  // Add headers - removed non-existent fields, kept existing ones
  worksheet.columns = [
    { header: "Candidate Name", key: "candidateName", width: 25 },
    { header: "Email", key: "candidateEmail", width: 30 },
    { header: "Test Name", key: "testName", width: 25 },
    { header: "Score (%)", key: "score", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Duration (min)", key: "duration", width: 15 },
    { header: "Completion Date", key: "completionDate", width: 20 },
    { header: "Results Declared", key: "resultsDeclared", width: 15 },
  ]

  // Style the header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }

  // Add data
  results.forEach((result, index) => {
    console.log(`Adding result ${index + 1}:`, {
      candidateName: result.candidateName,
      email: result.candidateEmail,
      testName: result.testName,
      score: result.score,
      status: result.status,
    })

    worksheet.addRow({
      candidateName: result.candidateName || "N/A",
      candidateEmail: result.candidateEmail || "N/A",
      testName: result.testName || "N/A",
      score: result.score || 0,
      status: result.status || "N/A",
      duration: result.duration || "N/A",
      completionDate: result.completionDate ? new Date(result.completionDate).toLocaleDateString() : "N/A",
      resultsDeclared: result.resultsDeclared ? "Yes" : "No",
    })
  })

  // Apply styling to all cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle" }

        // Color the status cell based on value - FIXED: Using address-based check
        if (cell.address && cell.address.startsWith("E")) {
          // Status column (column E)
          if (cell.value === "Passed") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE6F4EA" }, // Light green
            }
          } else if (cell.value === "Failed") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCE8E6" }, // Light red
            }
          }
        }
      })
    }
  })

  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer()
  console.log("Excel file generated successfully, buffer size:", buffer.length)

  // Return Excel file
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="assessment-results-${testId || "all"}-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  })
}
