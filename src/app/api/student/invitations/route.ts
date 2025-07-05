import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    console.log("[DEBUG] Extracted token:", token);
    const authResult = token ? verifyToken(token) : null;
    console.log("[DEBUG] verifyToken result:", authResult);
    if (!authResult || !authResult.userId) {
      console.log("[DEBUG] Unauthorized: No valid userId");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const studentId = authResult.userId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Connect to database
    const { db } = await connectToDatabase()

    console.log("[DEBUG] Using userId for query:", studentId);
    // Build query for invitations using $expr to compare ObjectId to string
    const baseQuery: any = {
      $or: [
        { $expr: { $eq: [ { $toString: "$studentId" }, studentId ] } },
        { $expr: { $eq: [ { $toString: "$candidateId" }, studentId ] } }
      ]
    }
    let query = { ...baseQuery };
    if (status && status !== "all") {
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      if (normalizedStatus === "Pending") {
        query = { ...baseQuery, status: "Pending", expiresAt: { $gt: new Date() } };
      } else if (normalizedStatus === "Completed") {
        query = { ...baseQuery, status: "Completed" };
      } else {
        query = { ...baseQuery, status: normalizedStatus };
      }
    } else {
      query = baseQuery;
    }
    console.log("[DEBUG] Final MongoDB query:", JSON.stringify(query, null, 2));
    // Fetch invitations from assessment_invitations collection (not test_invitations)
    const invitations = await db.collection("assessment_invitations").find(query).sort({ createdAt: -1 }).toArray();
    console.log("[DEBUG] Invitations found:", invitations.map(i => ({ _id: i._id, studentId: i.studentId, candidateId: i.candidateId, status: i.status, email: i.email })));

    // Get test details for each invitation
    const invitationsWithTestDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const test = await db.collection("assessment_tests").findOne({
          _id: new ObjectId(invitation.testId),
        })

        return {
          id: invitation._id.toString(),
          testId: invitation.testId.toString(),
          testTitle: test?.name || test?.title || test?.testTitle || "Unknown Test",
          description: test?.description || "",
          invitedBy: invitation.companyName || invitation.invitedBy || "Unknown",
          invitedByEmail: invitation.invitedByEmail || "",
          invitedAt: invitation.createdAt || invitation.invitedAt,
          expiresAt: invitation.expiresAt,
          status: invitation.status || "pending",
          duration: test?.duration || 60,
          questions: Array.isArray(test?.sections) ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0) : (test?.questions?.length || test?.totalQuestions || 0),
          difficulty: test?.difficulty || "intermediate",
          category: test?.category || "general",
          type: test?.type || "",
          token: invitation.token, // Include the token for frontend usage
        }
      }),
    )

    return NextResponse.json({
      success: true,
      invitations: invitationsWithTestDetails,
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
