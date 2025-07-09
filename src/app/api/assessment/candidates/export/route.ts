import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"

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
    const status = url.searchParams.get("status")
    const score = url.searchParams.get("score")
    const search = url.searchParams.get("search")

    // Fetch candidates from assessment_candidates (like the UI)
    const candidates = await db
      .collection("assessment_candidates")
      .find({ createdBy: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // For each candidate, calculate stats and robust full name
    const candidatesWithStats = await Promise.all(
      candidates.map(async (candidate) => {
        // Robust full name resolution
        let candidateName = candidate.name || "";
        const isLikelyEmailPrefix = candidateName && typeof candidateName === "string" && !candidateName.includes(" ") && candidate.email && candidateName === candidate.email.split("@")[0];
        if ((!candidateName || candidateName === candidate.email || isLikelyEmailPrefix) && candidate.email) {
          let candidateDoc = null;
          candidateDoc = await db.collection("students").findOne({ email: candidate.email });
          if (!candidateDoc) {
            candidateDoc = await db.collection("candidates").findOne({ email: candidate.email });
          }
          if (!candidateDoc && candidate._id) {
            candidateDoc = await db.collection("students").findOne({ _id: new ObjectId(candidate._id) });
          }
          if (!candidateDoc && candidate._id) {
            candidateDoc = await db.collection("candidates").findOne({ _id: new ObjectId(candidate._id) });
          }
          if (candidateDoc) {
            let fullName = "";
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
              candidateName = candidate.email;
            }
          } else {
            candidateName = candidate.email;
          }
        }
        // Get invitation count
        const invitationCount = await db.collection("assessment_invitations").countDocuments({
          email: candidate.email,
          createdBy: new ObjectId(userId),
        });
        // Get completed results count
        const completedResults = await db
          .collection("assessment_results")
          .find({ candidateEmail: candidate.email })
          .toArray();
        // Calculate average score
        let averageScore = 0;
        if (completedResults.length > 0) {
          const totalScore = completedResults.reduce((sum, result) => sum + (result.score || 0), 0);
          averageScore = Math.round(totalScore / completedResults.length);
        }
        // Find latest invitation for this candidate
        const latestInvitation = await db.collection("assessment_invitations").find({
          email: candidate.email,
          createdBy: new ObjectId(userId),
        }).sort({ invitedAt: -1 }).limit(1).toArray();
        let status = "Invited";
        if (latestInvitation.length > 0) {
          const invitation = latestInvitation[0];
          if (invitation.status === "Pending") {
            status = "Pending";
          } else if (invitation.status === "Completed") {
            status = "Completed";
          } else {
            status = invitation.status;
          }
        }
        return {
          name: candidateName,
          email: candidate.email,
          testsAssigned: invitationCount,
          testsCompleted: completedResults.length,
          averageScore: averageScore ? `${averageScore}%` : "N/A",
          status: status,
          createdAt: candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : "N/A",
        };
      })
    );

    // Apply filters
    let filteredCandidates = candidatesWithStats;
    if (status) {
      filteredCandidates = filteredCandidates.filter((candidate) => candidate.status === status);
    }
    if (score) {
      filteredCandidates = filteredCandidates.filter((candidate) => {
        const avgScore = parseInt(candidate.averageScore);
        if (score === "> 90%" && avgScore > 90) return true;
        if (score === "80-90%" && avgScore >= 80 && avgScore <= 90) return true;
        if (score === "70-80%" && avgScore >= 70 && avgScore < 80) return true;
        if (score === "< 70%" && avgScore < 70) return true;
        return false;
      });
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCandidates = filteredCandidates.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchLower) || candidate.email.toLowerCase().includes(searchLower)
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Assessment Platform";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Candidates");

    // Add headers
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Tests Assigned", key: "testsAssigned", width: 15 },
      { header: "Tests Completed", key: "testsCompleted", width: 15 },
      { header: "Average Score", key: "averageScore", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created Date", key: "createdAt", width: 20 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.commit();

    // Add data
    filteredCandidates.forEach((candidate) => {
      worksheet.addRow(candidate);
    });

    // Apply some styling to all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle" }
        })
      }
    })

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="candidates-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting candidates:", error)
    return NextResponse.json({ success: false, message: "Failed to export candidates" }, { status: 500 })
  }
}
