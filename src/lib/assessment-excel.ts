import ExcelJS from "exceljs"

interface AssessmentResultData {
  _id: string
  testId: string
  testName: string
  score: number
  status: string
  duration: number
  completionDate: string
  resultsDeclared: boolean
  candidateEmail: string
  candidateName: string
  answers?: {
    questionId: string
    questionText?: string
    answer: string | string[]
    correctAnswer?: string | string[]
    isCorrect: boolean
    points: number
  }[]
}

interface TestData {
  _id: string
  name: string
  description?: string
  type?: string
  category?: string
  difficulty?: string
  duration: number
  totalQuestions: number
  pointsPerQuestion?: number
  passingScore: number
  negativeMarking?: boolean
  randomizeQuestions?: boolean
  showResultsImmediately?: boolean
  allowReview?: boolean
  proctoringEnabled?: boolean
  status?: string
  createdAt: Date
  updatedAt?: Date
}

interface QuestionData {
  _id: string
  questionText: string
  type?: string
  correctAnswer?: string | string[]
  explanation?: string
  points?: number
}

export async function generateAssessmentResultExcel(
  result: AssessmentResultData,
  test: TestData,
  questions: QuestionData[],
): Promise<Buffer> {
  try {
    console.log("Starting Assessment Excel generation for result:", result._id)

    // Calculate robust statistics from actual data
    const totalQuestionsFromDB = questions.length
    const totalQuestionsFromTest = test.totalQuestions || 0
    const totalQuestionsFromAnswers = result.answers?.length || 0

    // Use the most reliable source for total questions
    const actualTotalQuestions = Math.max(totalQuestionsFromDB, totalQuestionsFromTest, totalQuestionsFromAnswers)

    // Calculate correct answers from actual result data
    const correctAnswersCount = result.answers?.filter((answer) => answer.isCorrect === true).length || 0

    // Calculate total points scored from actual answer data
    const totalPointsScored =
      result.answers?.reduce((sum, answer) => {
        return sum + (answer.points || 0)
      }, 0) || 0

    console.log("Calculated statistics:", {
      totalQuestionsFromDB,
      totalQuestionsFromTest,
      totalQuestionsFromAnswers,
      actualTotalQuestions,
      correctAnswersCount,
      totalPointsScored,
    })

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()

    // Set workbook properties
    workbook.creator = "Assessment Portal"
    workbook.lastModifiedBy = "Assessment Portal"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create Summary Sheet
    const summarySheet = workbook.addWorksheet("Assessment Summary", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    })

    // Summary Sheet Styling
    summarySheet.columns = [
      { header: "Field", key: "field", width: 25 },
      { header: "Value", key: "value", width: 40 },
    ]

    // Add title
    summarySheet.mergeCells("A1:B1")
    const titleCell = summarySheet.getCell("A1")
    titleCell.value = "ASSESSMENT RESULT REPORT"
    titleCell.font = { bold: true, size: 16, color: { argb: "FF000000" } }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Add sections
    let currentRow = 3

    // Candidate Information (removed phone number)
    summarySheet.getCell(`A${currentRow}`).value = "CANDIDATE INFORMATION"
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    summarySheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    summarySheet.mergeCells(`A${currentRow}:B${currentRow}`)
    currentRow++

    const candidateData = [
      ["Candidate Name", result.candidateName || "N/A"],
      ["Email Address", result.candidateEmail],
    ]

    candidateData.forEach(([field, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = field
      summarySheet.getCell(`B${currentRow}`).value = value
      currentRow++
    })

    currentRow++ // Empty row

    // Identifiers (Result ID and Test ID)
    summarySheet.getCell(`A${currentRow}`).value = "IDENTIFIERS"
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    summarySheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    summarySheet.mergeCells(`A${currentRow}:B${currentRow}`)
    currentRow++

    const identifiersData = [
      ["Result ID", result._id],
      ["Test ID", result.testId],
    ]

    identifiersData.forEach(([field, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = field
      summarySheet.getCell(`B${currentRow}`).value = value
      currentRow++
    })

    currentRow++ // Empty row

    // Test Information
    summarySheet.getCell(`A${currentRow}`).value = "TEST INFORMATION"
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    summarySheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    summarySheet.mergeCells(`A${currentRow}:B${currentRow}`)
    currentRow++

    const testData = [
      ["Test Name", test.name],
      ["Test Description", test.description || "N/A"],
      ["Test Type", test.type || "N/A"],
      ["Total Questions", actualTotalQuestions], // Using calculated value
      ["Time Limit", `${test.duration} minutes`],
      ["Passing Score", `${test.passingScore}%`],
    ]

    testData.forEach(([field, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = field
      summarySheet.getCell(`B${currentRow}`).value = value
      currentRow++
    })

    currentRow++ // Empty row

    // Result Summary
    summarySheet.getCell(`A${currentRow}`).value = "RESULT SUMMARY"
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    summarySheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    summarySheet.mergeCells(`A${currentRow}:B${currentRow}`)
    currentRow++

    const isPassed = result.score >= test.passingScore
    const resultData = [
      ["Score Achieved", `${result.score}%`],
      ["Status", result.status],
      ["Result", isPassed ? "PASSED" : "FAILED"],
      ["Duration Taken", `${result.duration} minutes`],
      ["Completion Date", new Date(result.completionDate).toLocaleString()],
      ["Results Declared", result.resultsDeclared ? "Yes" : "No"],
    ]

    resultData.forEach(([field, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = field
      summarySheet.getCell(`B${currentRow}`).value = value

      // Color code the result
      if (field === "Result") {
        summarySheet.getCell(`B${currentRow}`).font = {
          bold: true,
          color: { argb: isPassed ? "FF008000" : "FFFF0000" },
        }
      }
      currentRow++
    })

    currentRow++ // Empty row

    // Performance Analysis (simplified - removed unwanted fields)
    summarySheet.getCell(`A${currentRow}`).value = "PERFORMANCE ANALYSIS"
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    summarySheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    summarySheet.mergeCells(`A${currentRow}:B${currentRow}`)
    currentRow++

    const performanceData = [["Total Questions", actualTotalQuestions]]

    performanceData.forEach(([field, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = field
      summarySheet.getCell(`B${currentRow}`).value = value
      currentRow++
    })

    // Question Analysis Sheet
    if (result.answers && result.answers.length > 0) {
      const questionSheet = workbook.addWorksheet("Question Analysis")

      questionSheet.columns = [
        { header: "Q. No.", key: "questionNo", width: 8 },
        { header: "Question Text", key: "questionText", width: 50 },
        { header: "Question Type", key: "questionType", width: 15 },
        { header: "Candidate Answer", key: "candidateAnswer", width: 30 },
        { header: "Correct Answer", key: "correctAnswer", width: 30 },
        { header: "Result", key: "result", width: 12 },
        { header: "Points", key: "points", width: 10 },
        { header: "Max Points", key: "maxPoints", width: 12 },
        { header: "Explanation", key: "explanation", width: 40 },
      ]

      // Style header row
      const headerRow = questionSheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      }
      headerRow.alignment = { horizontal: "center", vertical: "middle" }

      // Add question data
      result.answers.forEach((answer, index) => {
        const question = questions.find((q) => q._id.toString() === answer.questionId)
        const candidateAnswer = Array.isArray(answer.answer) ? answer.answer.join(", ") : answer.answer || "No Answer"
        const correctAnswer = Array.isArray(answer.correctAnswer)
          ? answer.correctAnswer.join(", ")
          : answer.correctAnswer || question?.correctAnswer || "N/A"

        const row = questionSheet.addRow({
          questionNo: index + 1,
          questionText: question?.questionText || answer.questionText || `Question ${index + 1}`,
          questionType: question?.type || "N/A",
          candidateAnswer: candidateAnswer,
          correctAnswer: correctAnswer,
          result: answer.isCorrect ? "Correct" : "Wrong",
          points: answer.points || 0,
          maxPoints: question?.points || 1,
          explanation: question?.explanation || "N/A",
        })

        // Color code the result column
        const resultCell = row.getCell("result")
        resultCell.font = {
          bold: true,
          color: { argb: answer.isCorrect ? "FF008000" : "FFFF0000" },
        }

        // Wrap text for long content
        row.getCell("questionText").alignment = { wrapText: true, vertical: "top" }
        row.getCell("candidateAnswer").alignment = { wrapText: true, vertical: "top" }
        row.getCell("correctAnswer").alignment = { wrapText: true, vertical: "top" }
        row.getCell("explanation").alignment = { wrapText: true, vertical: "top" }
      })

      // Auto-fit row heights
      questionSheet.eachRow((row) => {
        row.height = 30
      })
    }

  // Coding-specific sheets (Final Code, Test Cases, Submissions)
    // Minimal structural types to describe coding extras without changing existing logic
    type CodingCase = { input?: string; expectedOutput?: string; actualOutput?: string; passed?: boolean }
    type CodeSubmission = {
      code?: string; language?: string; timestamp?: string | Date; allPassed?: boolean;
      passedCount?: number; totalCount?: number; results?: CodingCase[]
    }
    type AnswerLike = {
      questionId?: string; questionType?: string; type?: string; language?: string; code?: string;
      codeSubmissions?: CodeSubmission[]; codingTestResults?: CodingCase[]
    }
  const answersAny = (result as unknown as { answers?: Array<AnswerLike> }).answers
    const codingAnswers = (answersAny || []).filter((a) => {
      const qt = a.questionType || a.type
      return typeof qt === 'string' && qt.toLowerCase() === 'coding'
    })

    if (codingAnswers.length > 0) {
      // Final Code sheet
      const codeSheet = workbook.addWorksheet("Coding Final Code")
      codeSheet.columns = [
        { header: "Q. No.", key: "qno", width: 8 },
        { header: "Question ID", key: "qid", width: 26 },
        { header: "Language", key: "lang", width: 14 },
        { header: "Final Code", key: "code", width: 120 },
      ]

      codingAnswers.forEach((ans, idx) => {
        const subs = Array.isArray(ans.codeSubmissions) ? ans.codeSubmissions : []
        const fallbackLang = subs.length > 0 ? subs[subs.length - 1]?.language : undefined
        const displayLang = fallbackLang || ans.language || ''
        const row = codeSheet.addRow({
          qno: idx + 1,
          qid: ans.questionId || '',
          lang: displayLang,
          code: ans.code || '',
        })
        row.getCell('code').alignment = { wrapText: true, vertical: 'top' }
        row.height = 120
      })

      // Coding Test Cases sheet (if any)
      const anyHasCases = codingAnswers.some(a => Array.isArray(a.codingTestResults) && a.codingTestResults.length > 0)
      if (anyHasCases) {
        const casesSheet = workbook.addWorksheet("Coding Test Cases")
        casesSheet.columns = [
          { header: "Q. No.", key: "qno", width: 8 },
          { header: "Case #", key: "caseNo", width: 8 },
          { header: "Input", key: "input", width: 40 },
          { header: "Expected", key: "expected", width: 40 },
          { header: "Actual", key: "actual", width: 40 },
          { header: "Passed", key: "passed", width: 10 },
        ]

        codingAnswers.forEach((ans, idx) => {
          const cases = Array.isArray(ans.codingTestResults) ? ans.codingTestResults : []
          cases.forEach((tc: CodingCase, cIdx: number) => {
            const row = casesSheet.addRow({
              qno: idx + 1,
              caseNo: cIdx + 1,
              input: tc?.input ?? '',
              expected: tc?.expectedOutput ?? '',
              actual: tc?.actualOutput ?? '',
              passed: tc?.passed ? 'Yes' : 'No',
            })
            row.getCell('input').alignment = { wrapText: true, vertical: 'top' }
            row.getCell('expected').alignment = { wrapText: true, vertical: 'top' }
            row.getCell('actual').alignment = { wrapText: true, vertical: 'top' }
          })
        })
      }

      // Coding Submissions sheet (history)
  const anyHasSubs = codingAnswers.some(a => Array.isArray(a.codeSubmissions) && a.codeSubmissions.length > 0)
      if (anyHasSubs) {
        const subsSheet = workbook.addWorksheet("Coding Submissions")
        subsSheet.columns = [
          { header: "Q. No.", key: "qno", width: 8 },
          { header: "Attempt #", key: "attempt", width: 10 },
          { header: "Timestamp", key: "ts", width: 22 },
          { header: "Language", key: "lang", width: 14 },
          { header: "Passed Count", key: "passed", width: 12 },
          { header: "Total Count", key: "total", width: 12 },
          { header: "All Passed", key: "all", width: 10 },
          { header: "Code", key: "code", width: 100 },
          { header: "Results (JSON)", key: "results", width: 80 },
        ]

        codingAnswers.forEach((ans, idx) => {
    const subs = Array.isArray(ans.codeSubmissions) ? ans.codeSubmissions as CodeSubmission[] : []
    subs.forEach((s: CodeSubmission, sIdx: number) => {
            const attemptNo = sIdx + 1
            let resultsJson = ''
            try {
              if (Array.isArray(s.results)) {
                resultsJson = JSON.stringify(
      s.results.map((r: CodingCase) => ({
                    passed: !!r?.passed,
                    input: r?.input ?? '',
                    expectedOutput: r?.expectedOutput ?? '',
                    actualOutput: r?.actualOutput ?? '',
                  }))
                )
              }
            } catch {}
            const row = subsSheet.addRow({
              qno: idx + 1,
              attempt: attemptNo,
              ts: s?.timestamp ? new Date(s.timestamp).toLocaleString() : '',
              lang: s?.language || '',
              passed: s?.passedCount ?? '',
              total: s?.totalCount ?? '',
              all: s?.allPassed ? 'Yes' : 'No',
              code: s?.code || '',
              results: resultsJson,
            })
            row.getCell('code').alignment = { wrapText: true, vertical: 'top' }
            row.getCell('results').alignment = { wrapText: true, vertical: 'top' }
          })
        })
      }
    }

    // Test Configuration Sheet
    const configSheet = workbook.addWorksheet("Test Configuration")

    configSheet.columns = [
      { header: "Configuration", key: "config", width: 25 },
      { header: "Value", key: "value", width: 40 },
    ]

    // Style header
    const configHeaderRow = configSheet.getRow(1)
    configHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    configHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }

    const configData = [
      ["Test ID", test._id.toString()],
      ["Test Name", test.name],
      ["Description", test.description || "N/A"],
      ["Test Type", test.type || "N/A"],
      ["Category", test.category || "N/A"],
      ["Difficulty Level", test.difficulty || "N/A"],
      ["Duration", `${test.duration} minutes`],
      ["Total Questions", actualTotalQuestions], // Using calculated value
      ["Points Per Question", test.pointsPerQuestion || 1],
      ["Total Points", actualTotalQuestions * (test.pointsPerQuestion || 1)],
      ["Passing Score", `${test.passingScore}%`],
      ["Negative Marking", test.negativeMarking ? "Yes" : "No"],
      ["Randomize Questions", test.randomizeQuestions ? "Yes" : "No"],
      ["Show Results Immediately", test.showResultsImmediately ? "Yes" : "No"],
      ["Allow Review", test.allowReview ? "Yes" : "No"],
      ["Proctoring Enabled", test.proctoringEnabled ? "Yes" : "No"],
      ["Created Date", new Date(test.createdAt).toLocaleString()],
      ["Last Updated", new Date(test.updatedAt || test.createdAt).toLocaleString()],
      ["Status", test.status || "Active"],
    ]

    configData.forEach(([config, value]) => {
      configSheet.addRow({ config, value })
    })

    // Generate buffer - Fixed TypeScript error
    console.log("Generating Assessment Excel buffer...")
    const uint8Array = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(uint8Array)
    console.log("Assessment Excel generation complete, buffer size:", buffer.length)

    return buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in Assessment Excel generation:", error)
    throw new Error(`Failed to generate Assessment Excel file: ${error.message}`)
  }
}

// Helper function for fallback Excel generation
export async function createFallbackAssessmentExcel(result: AssessmentResultData): Promise<Buffer> {
  try {
    console.log("Creating fallback Assessment Excel file...")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Assessment Result Summary")

    worksheet.columns = [
      { header: "Field", key: "field", width: 25 },
      { header: "Value", key: "value", width: 40 },
    ]

    // Style header
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Calculate basic statistics from result data
    const correctAnswersCount = result.answers?.filter((answer) => answer.isCorrect === true).length || 0
    const totalPointsScored = result.answers?.reduce((sum, answer) => sum + (answer.points || 0), 0) || 0
    const totalQuestions = result.answers?.length || 0

    // Add basic result data (removed phone, correct answers, and total points)
    const basicData = [
      ["Candidate Name", result.candidateName || "N/A"],
      ["Email", result.candidateEmail],
      ["Test Name", result.testName],
      ["Score", `${result.score}%`],
      ["Status", result.status],
      ["Duration", `${result.duration} minutes`],
      ["Completion Date", new Date(result.completionDate).toLocaleString()],
      ["Results Declared", result.resultsDeclared ? "Yes" : "No"],
      ["Total Questions", totalQuestions],
    ]

    basicData.forEach(([field, value]) => {
      worksheet.addRow({ field, value })
    })

    // Generate buffer - Fixed TypeScript error
    const uint8Array = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(uint8Array)
    console.log("Fallback Assessment Excel file created successfully, buffer size:", buffer.length)
    return buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (fallbackError: any) {
    console.error("Error creating fallback Assessment Excel:", fallbackError)
    throw new Error(`Failed to create fallback Assessment Excel: ${fallbackError.message}`)
  }
}