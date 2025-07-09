import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"
import { generateAssessmentResultExcel } from "@/lib/assessment-excel"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const url = new URL(request.url)
    const candidateEmail = url.searchParams.get("candidateEmail")
    if (!candidateEmail) {
      return NextResponse.json({ success: false, message: "candidateEmail is required" }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    const results = await db.collection("assessment_results").find({ candidateEmail, createdBy: new ObjectId(userId) }).toArray()
    if (!results.length) {
      return NextResponse.json({ success: false, message: "No results found for candidate" }, { status: 404 })
    }
    // If only one result, return a single .xlsx file
    if (results.length === 1) {
      let result = results[0]
      // Robust candidate name logic (same as single download)
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
      // Get test
      let test = null
      if (result.testId && ObjectId.isValid(result.testId)) {
        test = await db.collection("assessment_tests").findOne({ _id: new ObjectId(result.testId) })
      }
      if (!test) return NextResponse.json({ success: false, message: "Test not found" }, { status: 404 })
      // Get questions
      const questions = await db.collection("assessment_questions").find({ testId: new ObjectId(result.testId) }).toArray()
      // Generate Excel
      const excelBuffer = await generateAssessmentResultExcel(result as any, test as any, questions as any)
      const filename = `assessment-result-${candidateName || "candidate"}-${test.name.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date(result.completionDate).toISOString().split("T")[0]}.xlsx`
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }
    // If multiple results, generate a single Excel file with all results in one sheet
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("All Results")
    sheet.columns = [
      { header: "Candidate Name", key: "candidateName", width: 30 },
      { header: "Email", key: "candidateEmail", width: 30 },
      { header: "Test Name", key: "testName", width: 30 },
      { header: "Score", key: "score", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Duration (min)", key: "duration", width: 15 },
      { header: "Completion Date", key: "completionDate", width: 25 },
      { header: "Results Declared", key: "resultsDeclared", width: 18 },
    ]
    for (const result of results) {
      // Robust candidate name logic (same as above)
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
      // Status logic
      let status = result.score >= (result.passingScore || 0) ? "Passed" : "Failed"
      sheet.addRow({
        candidateName,
        candidateEmail: result.candidateEmail,
        testName: result.testName || "",
        score: `${result.score}%`,
        status,
        duration: result.duration,
        completionDate: result.completionDate ? new Date(result.completionDate).toLocaleString() : "",
        resultsDeclared: result.resultsDeclared ? "Yes" : "No",
      })
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `all-results-${candidateEmail}.xlsx`
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to download all results", error: (error as Error).message }, { status: 500 })
  }
} 