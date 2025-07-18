import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get test data from request body
    const testData = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Validate test data
    if (!testData.name || !testData.name.trim()) {
      return NextResponse.json({ success: false, message: "Test name is required" }, { status: 400 })
    }

    if (!testData.duration || testData.duration <= 0) {
      return NextResponse.json({ success: false, message: "Test duration must be greater than 0" }, { status: 400 })
    }

    if (testData.passingScore < 0 || testData.passingScore > 100) {
      return NextResponse.json({ success: false, message: "Passing score must be between 0 and 100" }, { status: 400 })
    }

    // Validate and process sections with proper correctAnswer handling
    if (testData.sections && testData.sections.length > 0) {
      const processedSections = testData.sections.map((section: any) => ({
        ...section,
        questions: section.questions.map((question: any) => {
          console.log(`Processing question: ${question.text}`)
          console.log(`Question type: ${question.type}`)
          console.log(`Original correctAnswer:`, question.correctAnswer)

          // Ensure correctAnswer is properly set for Multiple Choice questions
          if (question.type === "Multiple Choice") {
            // Validate that correctAnswer exists and is one of the options
            const validOptions = question.options?.filter((opt: string) => opt.trim() !== "") || []

            if (!question.correctAnswer || !question.correctAnswer.trim()) {
              console.error(`❌ No correctAnswer set for MCQ: ${question.text}`)
              throw new Error(`Multiple Choice question "${question.text}" must have a correct answer selected`)
            }

            if (!validOptions.includes(question.correctAnswer)) {
              console.error(`❌ Invalid correctAnswer for MCQ: ${question.text}`)
              console.error(`correctAnswer: "${question.correctAnswer}"`)
              console.error(`validOptions:`, validOptions)
              throw new Error(
                `Correct answer "${question.correctAnswer}" is not one of the valid options for question "${question.text}"`,
              )
            }

            console.log(`✅ Valid correctAnswer set: "${question.correctAnswer}"`)
          }

          return {
            ...question,
            // Ensure correctAnswer is always included in the database
            correctAnswer: question.correctAnswer || "",
            // Clean up options for MCQ
            options:
              question.type === "Multiple Choice"
                ? question.options?.filter((opt: string) => opt.trim() !== "") || []
                : question.options,
          }
        }),
      }))

      console.log("Processed sections with correctAnswer:", JSON.stringify(processedSections, null, 2))

      // Update testData with processed sections
      testData.sections = processedSections
    }

    // Create new test
    const newTest = {
      ...testData,
      // Ensure notepadEnabled is always present in settings
      settings: {
        shuffleQuestions: Boolean(testData.settings?.shuffleQuestions),
        preventTabSwitching: Boolean(testData.settings?.preventTabSwitching),
        allowCalculator: Boolean(testData.settings?.allowCalculator),
        allowCodeEditor: Boolean(testData.settings?.allowCodeEditor),
        autoSubmit: Boolean(testData.settings?.autoSubmit),
        notepadEnabled: Boolean(testData.settings?.notepadEnabled),
      },
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: testData.status || "Draft",
    }

    // Insert test into database
    const result = await db.collection("assessment_tests").insertOne(newTest)

    if (!result.insertedId) {
      throw new Error("Failed to create test in database")
    }

    // Fetch the created test to verify correctAnswer was saved
    const createdTest = await db.collection("assessment_tests").findOne({
      _id: result.insertedId,
    })

    console.log("Created test with correctAnswer verification:", JSON.stringify(createdTest?.sections, null, 2))

    return NextResponse.json(
      {
        success: true,
        testId: result.insertedId.toString(),
        message: "Test created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating test:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create test",
      },
      { status: 500 },
    )
  }
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
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    // Build query
    const query: any = {
      createdBy: new ObjectId(userId),
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    if (status) {
      query.status = status
    }

    // Get total count
    const total = await db.collection("assessment_tests").countDocuments(query)

    // Get tests with pagination
    const tests = await db
      .collection("assessment_tests")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return NextResponse.json(
      {
        success: true,
        tests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch tests" }, { status: 500 })
  }
}
