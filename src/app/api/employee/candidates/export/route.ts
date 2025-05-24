import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import * as XLSX from "xlsx"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body to get candidate IDs to export
    const body = await request.json()
    const { candidateIds } = body

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ success: false, message: "At least one candidate ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds and prepare query
    const objectIds = candidateIds
      .map((id) => {
        try {
          return new ObjectId(id)
        } catch (error) {
          console.warn(`Invalid ObjectId format: ${id}`)
          return null
        }
      })
      .filter(Boolean)

    if (objectIds.length === 0) {
      return NextResponse.json({ success: false, message: "No valid candidate IDs provided" }, { status: 400 })
    }

    // Find candidates from both collections
    const candidatesFromCandidates = await db
      .collection("candidates")
      .find({ _id: { $in: objectIds } })
      .toArray()

    const candidatesFromStudents = await db
      .collection("students")
      .find({ _id: { $in: objectIds } })
      .toArray()

    // Combine candidates from both collections
    const allCandidates = [
      ...candidatesFromCandidates.map((c: any) => ({ ...c, source: "candidates" })),
      ...candidatesFromStudents.map((s: any) => ({ ...s, source: "students" })),
    ]

    if (allCandidates.length === 0) {
      return NextResponse.json({ success: false, message: "No candidates found in either collection" }, { status: 404 })
    }

    // Prepare data for Excel export with all the detailed fields
    const candidatesData = allCandidates.map((candidate: any) => {
      // Normalize candidate data based on source
      const normalizedCandidate =
        candidate.source === "students"
          ? {
              ...candidate,
              name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim(),
              // Map student fields to candidate fields for consistency
              currentPosition: candidate.currentPosition || (candidate.experience && candidate.experience[0]?.title),
              role: candidate.role || (candidate.experience && candidate.experience[0]?.title),
              workExperience: candidate.workExperience || candidate.experience,
              yearsOfExperience: candidate.yearsOfExperience || candidate.totalExperience,
              currentCity: candidate.currentCity || candidate.location,
              currentState: candidate.currentState || candidate.state,
              // Handle different field names for preferred cities
              preferredCities: candidate.preferredCities || candidate.preferenceCities || [],
              // Handle different field names for date of birth
              dateOfBirth: candidate.dateOfBirth || candidate.dob,
            }
          : candidate

      // Extract salary and notice period data from multiple possible locations
      let currentSalary = normalizedCandidate.currentSalary || ""
      let expectedSalary = normalizedCandidate.expectedSalary || ""
      let noticePeriod = normalizedCandidate.noticePeriod || ""

      // Try to get from work experience if not available at top level
      if (!currentSalary && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
        currentSalary = normalizedCandidate.workExperience[0].currentSalary || ""
      }
      if (!expectedSalary && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
        expectedSalary = normalizedCandidate.workExperience[0].expectedSalary || ""
      }
      if (!noticePeriod && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
        noticePeriod = normalizedCandidate.workExperience[0].noticePeriod || ""
      }

      // Format certifications properly
      let certifications = ""
      if (normalizedCandidate.certifications) {
        if (Array.isArray(normalizedCandidate.certifications)) {
          certifications = normalizedCandidate.certifications
            .map((cert: any, index: number) => {
              if (typeof cert === "string") {
                return `${index + 1}. ${cert}`
              } else if (typeof cert === "object" && cert !== null) {
                const name = cert.name || cert.title || ""
                const issuer = cert.issuer || cert.organization || cert.issuingOrganization || ""
                const date = cert.date || cert.issueDate || cert.year || ""
                return `${index + 1}. ${name}${issuer ? ` from ${issuer}` : ""}${date ? ` (${date})` : ""}`
              }
              return ""
            })
            .filter(Boolean)
            .join("\n")
        } else if (typeof normalizedCandidate.certifications === "string") {
          certifications = normalizedCandidate.certifications
        } else if (
          typeof normalizedCandidate.certifications === "object" &&
          normalizedCandidate.certifications !== null
        ) {
          certifications = Object.entries(normalizedCandidate.certifications)
            .map(([key, value], index) => `${index + 1}. ${key}: ${value}`)
            .join("\n")
        }
      }

      if (!certifications) {
        certifications = "No Certifications"
      }

      // Safe property access with fallbacks
      const getNestedProperty = (obj: any, path: string) => {
        return path.split(".").reduce((current, key) => current && current[key], obj) || ""
      }

      return {
        // Source Information
        "Source Collection": candidate.source === "students" ? "Students Collection" : "Candidates Collection",

        // Personal Information
        "Full Name":
          `${normalizedCandidate.salutation || ""} ${normalizedCandidate.firstName || ""} ${normalizedCandidate.middleName || ""} ${normalizedCandidate.lastName || normalizedCandidate.name || ""}`.trim(),
        "First Name": normalizedCandidate.firstName || "",
        "Middle Name": normalizedCandidate.middleName || "",
        "Last Name": normalizedCandidate.lastName || "",
        Email: normalizedCandidate.email || "",
        Phone: normalizedCandidate.phone || "",
        "Alternative Phone": normalizedCandidate.alternativePhone || "",
        "Current Position": normalizedCandidate.currentPosition || normalizedCandidate.role || "",
        Location: normalizedCandidate.location || normalizedCandidate.currentCity || "",
        "Current City": normalizedCandidate.currentCity || "",
        "Current State": normalizedCandidate.currentState || "",
        Pincode: normalizedCandidate.pincode || "",
        "Full Address":
          `${normalizedCandidate.location || normalizedCandidate.currentCity || ""}, ${normalizedCandidate.currentState || ""} ${normalizedCandidate.pincode ? `pincode: ${normalizedCandidate.pincode}` : ""}`.trim(),
        Gender: normalizedCandidate.gender || "",
        "Date of Birth": normalizedCandidate.dateOfBirth
          ? new Date(normalizedCandidate.dateOfBirth).toLocaleDateString()
          : "",
        "Profile Outline": normalizedCandidate.profileOutline || normalizedCandidate.summary || "",
        "Total Experience": `${normalizedCandidate.yearsOfExperience || normalizedCandidate.totalExperience || "0/fresher"} years`,

        // Skills
        Skills: Array.isArray(normalizedCandidate.skills)
          ? normalizedCandidate.skills.join(", ")
          : normalizedCandidate.skills || "",

        // Education
        Education: formatEducation(normalizedCandidate.education),
        Certifications: certifications,

        // Experience
        Experience: formatExperience(normalizedCandidate.workExperience || normalizedCandidate.experience),
        "Current Salary": currentSalary,
        "Expected Salary": expectedSalary,
        "Notice Period": noticePeriod,

        // Preferences
        "Shift Preference": Array.isArray(normalizedCandidate.shiftPreference)
          ? normalizedCandidate.shiftPreference.join(", ")
          : normalizedCandidate.shiftPreference || "",
        "Preferred Cities": Array.isArray(normalizedCandidate.preferredCities)
          ? normalizedCandidate.preferredCities.join(", ")
          : normalizedCandidate.preferredCities || "",

        // Assets and Documents
        "Available Assets": Array.isArray(normalizedCandidate.availableAssets)
          ? normalizedCandidate.availableAssets.map((asset: string) => asset.replace(/_/g, " ")).join(", ")
          : normalizedCandidate.availableAssets || "",
        "Identity Documents": Array.isArray(normalizedCandidate.identityDocuments)
          ? normalizedCandidate.identityDocuments.map((doc: string) => doc.replace(/_/g, " ")).join(", ")
          : normalizedCandidate.identityDocuments || "",

        // URLs and Links - Safe property access
        "Portfolio Link":
          normalizedCandidate.portfolioLink || getNestedProperty(normalizedCandidate, "onlinePresence.portfolio") || "",
        "Social Media Link":
          normalizedCandidate.socialMediaLink ||
          getNestedProperty(normalizedCandidate, "onlinePresence.socialMedia") ||
          "",
        LinkedIn:
          normalizedCandidate.linkedIn || getNestedProperty(normalizedCandidate, "onlinePresence.linkedin") || "",
        "Resume URL":
          normalizedCandidate.resumeUrl || getNestedProperty(normalizedCandidate, "documents.resume.url") || "",
        "Video Resume URL":
          normalizedCandidate.videoResumeUrl ||
          getNestedProperty(normalizedCandidate, "documents.videoResume.url") ||
          "",
        "Audio Biodata URL":
          normalizedCandidate.audioBiodataUrl ||
          getNestedProperty(normalizedCandidate, "documents.audioBiodata.url") ||
          "",
        "Photograph URL":
          normalizedCandidate.photographUrl ||
          getNestedProperty(normalizedCandidate, "documents.photograph.url") ||
          normalizedCandidate.avatar ||
          "",

        // Additional Information
        "Cover Letter": normalizedCandidate.coverLetter || "",
        "Additional Information": normalizedCandidate.additionalInfo || "",
        Notes: normalizedCandidate.notes || "",

        // Status Information
        Status: normalizedCandidate.status || "",
        "Applied Date": normalizedCandidate.createdAt
          ? new Date(normalizedCandidate.createdAt).toLocaleDateString()
          : "",
        "Last Updated": normalizedCandidate.updatedAt
          ? new Date(normalizedCandidate.updatedAt).toLocaleDateString()
          : "",
      }
    })

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Add candidates sheet
    const ws = XLSX.utils.json_to_sheet(candidatesData)

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Source Collection
      { wch: 25 }, // Full Name
      { wch: 15 }, // First Name
      { wch: 15 }, // Middle Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Email
      { wch: 20 }, // Phone
      { wch: 20 }, // Alternative Phone
      { wch: 30 }, // Current Position
      { wch: 25 }, // Location
      { wch: 20 }, // Current City
      { wch: 20 }, // Current State
      { wch: 15 }, // Pincode
      { wch: 40 }, // Full Address
      { wch: 15 }, // Gender
      { wch: 20 }, // Date of Birth
      { wch: 50 }, // Profile Outline
      { wch: 20 }, // Total Experience
      { wch: 50 }, // Skills
      { wch: 50 }, // Education
      { wch: 40 }, // Certifications
      { wch: 50 }, // Experience
      { wch: 20 }, // Current Salary
      { wch: 20 }, // Expected Salary
      { wch: 20 }, // Notice Period
      { wch: 30 }, // Shift Preference
      { wch: 30 }, // Preferred Cities
      { wch: 40 }, // Available Assets
      { wch: 40 }, // Identity Documents
      { wch: 40 }, // Portfolio Link
      { wch: 40 }, // Social Media Link
      { wch: 40 }, // LinkedIn
      { wch: 40 }, // Resume URL
      { wch: 40 }, // Video Resume URL
      { wch: 40 }, // Audio Biodata URL
      { wch: 40 }, // Photograph URL
      { wch: 50 }, // Cover Letter
      { wch: 50 }, // Additional Information
      { wch: 50 }, // Notes
      { wch: 20 }, // Status
      { wch: 20 }, // Applied Date
      { wch: 20 }, // Last Updated
    ]

    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Candidates")

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="candidates_export_dual_collection_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting candidates data:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to export candidates data",
      },
      { status: 500 },
    )
  }
}

// Helper function to format education data with support for both collection field names
function formatEducation(education: any): string {
  if (!education) return ""

  const educationArray = Array.isArray(education) ? education : [education]

  return educationArray
    .map((edu: any, index: number) => {
      if (typeof edu === "string") {
        return edu
      } else if (edu && typeof edu === "object") {
        // Handle different field names for start/end years
        const startYear = edu.startYear || edu.fromYear || edu.yearFrom || edu.startingYear || ""
        const endYear = edu.endYear || edu.toYear || edu.yearTo || edu.endingYear || ""

        let eduStr = `${index + 1}. ${edu.degree || ""} from ${edu.institution || edu.school || ""}`

        if (startYear || endYear) {
          eduStr += ` (${startYear} - ${endYear || "Present"})`
        }

        if (edu.level) eduStr += `, Level: ${edu.level}`
        if (edu.mode) eduStr += `, Mode: ${edu.mode}`
        if (edu.percentage || edu.grade || edu.cgpa || edu.marks) {
          eduStr += `, Percentage/CGPA: ${edu.percentage || edu.grade || edu.cgpa || edu.marks}`
        }
        if (edu.field) eduStr += `, Field: ${edu.field}`

        return eduStr
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

// Helper function to format experience data
function formatExperience(experience: any): string {
  if (!experience) return ""

  if (typeof experience === "string") {
    return experience
  }

  const expArray = Array.isArray(experience) ? experience : [experience]

  return expArray
    .map((exp: any, index: number) => {
      if (typeof exp === "string") {
        return exp
      } else if (exp && typeof exp === "object") {
        let expStr = `${index + 1}. ${exp.title || ""} at ${exp.companyName || ""}`

        if (exp.startDate || exp.endDate || exp.tenure) {
          expStr += ` (${exp.startDate || ""} - ${exp.endDate || exp.tenure || "Present"})`
        }

        if (exp.department) expStr += `, Department: ${exp.department}`
        if (exp.summary || exp.description || exp.professionalSummary) {
          expStr += `, Description: ${exp.summary || exp.description || exp.professionalSummary || ""}`
        }

        // Include salary and notice period information in the experience string
        if (exp.currentSalary) expStr += `, Current Salary: ${exp.currentSalary}`
        if (exp.expectedSalary) expStr += `, Expected Salary: ${exp.expectedSalary}`
        if (exp.noticePeriod) expStr += `, Notice Period: ${exp.noticePeriod} days`

        return expStr
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}
