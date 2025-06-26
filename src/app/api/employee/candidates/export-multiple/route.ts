import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get candidate IDs from request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 })
    }

    const { candidateIds } = body

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ success: false, message: "No candidates selected" }, { status: 400 })
    }

    console.log(`Attempting to export ${candidateIds.length} candidates`)

    // Connect to database
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = []
    for (const id of candidateIds) {
      try {
        objectIds.push(new ObjectId(id))
      } catch (error) {
        console.error(`Invalid ID format: ${id}`)
        // Continue with valid IDs
      }
    }

    if (objectIds.length === 0) {
      return NextResponse.json({ success: false, message: "No valid candidate IDs provided" }, { status: 400 })
    }

    console.log(`Found ${objectIds.length} valid candidate IDs`)

    // Find candidates from both collections
    const candidatesFromCandidates = await db
      .collection("candidates")
      .find({
        _id: { $in: objectIds },
      })
      .toArray()

    const candidatesFromStudents = await db
      .collection("students")
      .find({
        _id: { $in: objectIds },
      })
      .toArray()

    // Combine candidates from both collections
    const allCandidates = [
      ...candidatesFromCandidates.map((c: any) => ({ ...c, source: "candidates" })),
      ...candidatesFromStudents.map((s: any) => ({ ...s, source: "students" })),
    ]

    if (allCandidates.length === 0) {
      return NextResponse.json({ success: false, message: "No candidates found in either collection" }, { status: 404 })
    }

    console.log(`Retrieved ${allCandidates.length} candidates from both collections`)

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()

    // Add metadata
    workbook.creator = "ATS System"
    workbook.lastModifiedBy = "ATS System"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Add a single sheet for all candidates
    const candidatesSheet = workbook.addWorksheet("All Candidates")

    // Define columns for the sheet with comprehensive fields
    candidatesSheet.columns = [
      { header: "Source Collection", key: "source", width: 20 },
      { header: "Salutation", key: "salutation", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Middle Name", key: "middleName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Alternative Phone", key: "alternativePhone", width: 20 },
      { header: "Position", key: "role", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Location", key: "location", width: 25 },
      { header: "Current City", key: "currentCity", width: 20 },
      { header: "Current State", key: "currentState", width: 20 },
      { header: "Pincode", key: "pincode", width: 20 },
      { header: "Gender", key: "gender", width: 15 },
      { header: "Date of Birth", key: "dateOfBirth", width: 15 },
      { header: "Profile Outline", key: "profileOutline", width: 50 },
      { header: "Certifications", key: "certifications", width: 50 },
      { header: "Experience (Years)", key: "experience", width: 15 },
      { header: "Current Salary", key: "currentSalary", width: 15 },
      { header: "Expected Salary", key: "expectedSalary", width: 15 },
      { header: "Notice Period (Days)", key: "noticePeriod", width: 20 },
      { header: "Skills", key: "skills", width: 40 },
      { header: "Education", key: "education", width: 40 },
      { header: "Work Experience", key: "workExperience", width: 50 },
      { header: "Shift Preference", key: "shiftPreference", width: 25 },
      { header: "Preferred Cities", key: "preferredCities", width: 25 },
      { header: "Available Assets", key: "availableAssets", width: 25 },
      { header: "Identity Documents", key: "identityDocuments", width: 25 },
      { header: "Resume URL", key: "resumeUrl", width: 50 },
      { header: "Video Resume URL", key: "videoResumeUrl", width: 50 },
      { header: "Audio Biodata URL", key: "audioBiodataUrl", width: 50 },
      { header: "Photograph URL", key: "photographUrl", width: 50 },
      { header: "Cover Letter", key: "coverLetter", width: 40 },
      { header: "Portfolio Link", key: "portfolioLink", width: 20 },
      { header: "Social Media Link", key: "socialMediaLink", width: 20 },
      { header: "LinkedIn", key: "linkedIn", width: 20 },
      { header: "Profile Summary", key: "profileSummary", width: 40 },
      { header: "Additional Info", key: "additionalInfo", width: 40 },
      { header: "Applied Date", key: "appliedDate", width: 15 },
    ]

    // Style the header row
    const headerRow = candidatesSheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.commit()

    // Safe property access helper
    const getNestedProperty = (obj: any, path: string) => {
      return path.split(".").reduce((current, key) => current && current[key], obj) || ""
    }

    // Add data for each candidate
    for (let i = 0; i < allCandidates.length; i++) {
      const candidate = allCandidates[i]

      try {
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
                // Handle nested document URLs
                resumeUrl: candidate.resumeUrl || getNestedProperty(candidate, "documents.resume.url"),
                videoResumeUrl: candidate.videoResumeUrl || getNestedProperty(candidate, "documents.videoResume.url"),
                audioBiodataUrl:
                  candidate.audioBiodataUrl || getNestedProperty(candidate, "documents.audioBiodata.url"),
                photographUrl:
                  candidate.photographUrl ||
                  getNestedProperty(candidate, "documents.photograph.url") ||
                  candidate.avatar,
                // Handle online presence
                portfolioLink: candidate.portfolioLink || getNestedProperty(candidate, "onlinePresence.portfolio"),
                socialMediaLink:
                  candidate.socialMediaLink || getNestedProperty(candidate, "onlinePresence.socialMedia"),
                linkedIn: candidate.linkedIn || getNestedProperty(candidate, "onlinePresence.linkedin"),
              }
            : candidate

        // Format education information with support for different field names
        let educationSummary = ""
        if (normalizedCandidate.education) {
          if (Array.isArray(normalizedCandidate.education)) {
            educationSummary = normalizedCandidate.education
              .map((edu: any, index: number) => {
                if (typeof edu === "string") return `${index + 1}. ${edu}`
                if (edu && typeof edu === "object") {
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
                    eduStr += `, CGPA/Percentage: ${edu.percentage || edu.grade || edu.cgpa || edu.marks}`
                  }
                  if (edu.field) eduStr += `, Field: ${edu.field}`
                  return eduStr
                }
                return ""
              })
              .filter(Boolean)
              .join("\n")
          } else if (typeof normalizedCandidate.education === "string") {
            educationSummary = normalizedCandidate.education
          } else if (normalizedCandidate.education && typeof normalizedCandidate.education === "object") {
            const edu = normalizedCandidate.education
            const startYear = edu.startYear || edu.fromYear || edu.yearFrom || edu.startingYear || ""
            const endYear = edu.endYear || edu.toYear || edu.yearTo || edu.endingYear || ""

            educationSummary = `${edu.degree || ""} from ${edu.institution || edu.school || ""}`
            if (startYear || endYear) {
              educationSummary += ` (${startYear} - ${endYear || "Present"})`
            }
          }
        }

        // Format experience information
        let experienceSummary = ""
        if (normalizedCandidate.workExperience && Array.isArray(normalizedCandidate.workExperience)) {
          experienceSummary = normalizedCandidate.workExperience
            .map((exp: any, index: number) => {
              let expStr = `${index + 1}. ${exp.title || ""} at ${exp.companyName || ""}`
              if (exp.tenure) expStr += ` (${exp.tenure})`
              if (exp.department) expStr += `, Dept: ${exp.department}`
              if (exp.summary || exp.professionalSummary)
                expStr += `, Summary: ${exp.summary || exp.professionalSummary}`
              return expStr
            })
            .join("\n")
        } else if (normalizedCandidate.experience) {
          if (typeof normalizedCandidate.experience === "string") {
            experienceSummary = normalizedCandidate.experience
          } else if (Array.isArray(normalizedCandidate.experience)) {
            experienceSummary = normalizedCandidate.experience
              .map((exp: any, index: number) => {
                if (typeof exp === "string") return `${index + 1}. ${exp}`
                if (exp && typeof exp === "object") {
                  let expStr = `${index + 1}. ${exp.title || ""} at ${exp.companyName || ""}`
                  if (exp.startDate || exp.endDate || exp.tenure) {
                    expStr += ` (${exp.startDate || ""} - ${exp.endDate || exp.tenure || "Present"})`
                  }
                  if (exp.department) expStr += `, Dept: ${exp.department}`
                  if (exp.description || exp.summary || exp.professionalSummary) {
                    expStr += `, Desc: ${exp.description || exp.summary || exp.professionalSummary || ""}`
                  }
                  return expStr
                }
                return ""
              })
              .filter(Boolean)
              .join("\n")
          }
        }

        // Get current and expected salary from either top-level or from the most recent experience
        let currentSalary = normalizedCandidate.currentSalary || ""
        let expectedSalary = normalizedCandidate.expectedSalary || ""
        let noticePeriod = normalizedCandidate.noticePeriod || ""

        if (!currentSalary && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
          currentSalary = normalizedCandidate.workExperience[0].currentSalary || ""
        }
        if (!expectedSalary && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
          expectedSalary = normalizedCandidate.workExperience[0].expectedSalary || ""
        }
        if (!noticePeriod && normalizedCandidate.workExperience && normalizedCandidate.workExperience.length > 0) {
          noticePeriod = normalizedCandidate.workExperience[0].noticePeriod || ""
        }

        // Format certifications
        let certificationsText = ""
        if (normalizedCandidate.certifications) {
          if (Array.isArray(normalizedCandidate.certifications)) {
            certificationsText = normalizedCandidate.certifications
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
            certificationsText = normalizedCandidate.certifications
          }
        }

        // Add row with all available information
        const rowData = {
          source: candidate.source === "students" ? "Students Collection" : "Candidates Collection",
          salutation: normalizedCandidate.salutation || "",
          name: `${normalizedCandidate.salutation || ""} ${normalizedCandidate.firstName || ""} ${normalizedCandidate.middleName || ""} ${normalizedCandidate.lastName || normalizedCandidate.name || ""}`
            .trim()
            .replace(/\s+/g, " "),
          firstName: normalizedCandidate.firstName || "",
          middleName: normalizedCandidate.middleName || "",
          lastName: normalizedCandidate.lastName || "",
          email: normalizedCandidate.email || "",
          phone: normalizedCandidate.phone || "",
          alternativePhone: normalizedCandidate.alternativePhone || "",
          role: normalizedCandidate.role || normalizedCandidate.currentPosition || "",
          status: normalizedCandidate.status || "",
          location: normalizedCandidate.location || "",
          currentCity: normalizedCandidate.currentCity || "",
          currentState: normalizedCandidate.currentState || "",
          pincode: normalizedCandidate.pincode || "",
          gender: normalizedCandidate.gender || "",
          dateOfBirth: normalizedCandidate.dateOfBirth
            ? new Date(normalizedCandidate.dateOfBirth).toLocaleDateString()
            : "",
          profileOutline: normalizedCandidate.profileOutline || normalizedCandidate.summary || "",
          certifications: certificationsText || "No Certifications",
          experience: `${normalizedCandidate.yearsOfExperience || normalizedCandidate.totalExperience || "0"}`,
          currentSalary: currentSalary,
          expectedSalary: expectedSalary,
          noticePeriod: noticePeriod,
          skills: (normalizedCandidate.skills || []).join(", "),
          education: educationSummary,
          workExperience: experienceSummary,
          shiftPreference: (normalizedCandidate.shiftPreference || []).join(", "),
          preferredCities: (normalizedCandidate.preferredCities || []).join(", "),
          availableAssets: (normalizedCandidate.availableAssets || [])
            .map((asset: string) => asset.replace(/_/g, " "))
            .join(", "),
          identityDocuments: (normalizedCandidate.identityDocuments || [])
            .map((doc: string) => doc.replace(/_/g, " "))
            .join(", "),
          resumeUrl: normalizedCandidate.resumeUrl || "",
          videoResumeUrl: normalizedCandidate.videoResumeUrl || "",
          audioBiodataUrl: normalizedCandidate.audioBiodataUrl || "",
          photographUrl: normalizedCandidate.photographUrl || "",
          coverLetter: normalizedCandidate.coverLetter || "",
          portfolioLink: normalizedCandidate.portfolioLink || "",
          socialMediaLink: normalizedCandidate.socialMediaLink || "",
          linkedIn: normalizedCandidate.linkedIn || "",
          profileSummary: normalizedCandidate.profileOutline || normalizedCandidate.summary || "",
          additionalInfo: normalizedCandidate.additionalInfo || "",
          appliedDate: normalizedCandidate.appliedDate
            ? new Date(normalizedCandidate.appliedDate).toLocaleDateString()
            : normalizedCandidate.createdAt
              ? new Date(normalizedCandidate.createdAt).toLocaleDateString()
              : "",
        }

        // Add the row to the sheet
        const row = candidatesSheet.addRow(rowData)

        // Set wrap text for long content cells
        row.getCell("education").alignment = { wrapText: true, vertical: "top" }
        row.getCell("workExperience").alignment = { wrapText: true, vertical: "top" }
        row.getCell("skills").alignment = { wrapText: true, vertical: "top" }
        row.getCell("profileSummary").alignment = { wrapText: true, vertical: "top" }
        row.getCell("coverLetter").alignment = { wrapText: true, vertical: "top" }
        row.getCell("certifications").alignment = { wrapText: true, vertical: "top" }

        // Set row height to accommodate content
        row.height = 100

        console.log(`Added candidate ${i + 1}/${allCandidates.length} to sheet: ${rowData.name} from ${rowData.source}`)
      } catch (error) {
        console.error(`Error adding candidate ${candidate._id} to sheet:`, error)
        // Continue with other candidates
      }
    }

    // Auto-fit columns based on content
    candidatesSheet.columns.forEach((column) => {
      if (!column.key) return

      const maxLength = [
        column.header ? column.header.toString().length : 0,
        ...candidatesSheet
          .getColumn(column.key)
          .values.filter((value) => value !== undefined && value !== null)
          .map((value) => {
            const strValue = (value?.toString() || "")
            // For multiline text, get the longest line
            if (strValue.includes("\n")) {
              return Math.max(...strValue.split("\n").map((line) => line.length))
            }
            return strValue.length
          }),
      ].reduce((max, length) => Math.max(max, length), 0)

      column.width = Math.min(maxLength + 2, 100) // Cap width at 100 characters
    })

    // Add a debug sheet to verify data is being processed
    const debugSheet = workbook.addWorksheet("Debug Info")
    debugSheet.columns = [
      { header: "Info", key: "info", width: 30 },
      { header: "Value", key: "value", width: 70 },
    ]

    // Add debug info
    debugSheet.addRow({ info: "Total Candidates", value: allCandidates.length })
    debugSheet.addRow({ info: "From Candidates Collection", value: candidatesFromCandidates.length })
    debugSheet.addRow({ info: "From Students Collection", value: candidatesFromStudents.length })
    debugSheet.addRow({ info: "Export Time", value: new Date().toISOString() })
    debugSheet.addRow({ info: "Candidate IDs", value: candidateIds.join(", ") })

    // Add sample of first candidate data if available
    if (allCandidates.length > 0) {
      const sampleCandidate = allCandidates[0]
      debugSheet.addRow({ info: "Sample Candidate ID", value: sampleCandidate._id.toString() })
      debugSheet.addRow({ info: "Sample Candidate Source", value: sampleCandidate.source })
      debugSheet.addRow({
        info: "Sample Candidate Name",
        value:
          `${sampleCandidate.firstName || ""} ${sampleCandidate.middleName || ""} ${sampleCandidate.lastName || sampleCandidate.name || ""}`
            .trim()
            .replace(/\s+/g, " "),
      })
      debugSheet.addRow({ info: "Sample Candidate Email", value: sampleCandidate.email || "" })
    }

    console.log("Excel workbook created successfully, generating buffer...")

    try {
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer()
      console.log("Excel buffer generated successfully, size:", buffer.byteLength)

      // Return the Excel file
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="candidates_export_dual_collection_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } catch (error) {
      console.error("Error generating Excel buffer:", error)
      return NextResponse.json({ success: false, message: "Failed to generate Excel file" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error exporting candidates data:", error)
    return NextResponse.json({ success: false, message: "Failed to export candidates data" }, { status: 500 })
  }
}