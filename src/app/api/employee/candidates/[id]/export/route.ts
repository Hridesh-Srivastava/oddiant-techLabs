import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Await the params since they're now a Promise in newer Next.js versions
    const { id: candidateId } = await context.params
    if (!candidateId) {
      return NextResponse.json({ success: false, message: "Candidate ID is required" }, { status: 400 })
    }

    console.log(`Attempting to export candidate with ID: ${candidateId}`)

    // Connect to database
    const { db } = await connectToDatabase()

    // Find candidate in both collections
    let candidate
    let source = "candidates"

    try {
      candidate = await db.collection("candidates").findOne({
        _id: new ObjectId(candidateId),
      })
    } catch (error) {
      console.error("Error finding candidate in candidates collection:", error)
    }

    // If not found in candidates collection, try students collection
    if (!candidate) {
      try {
        candidate = await db.collection("students").findOne({
          _id: new ObjectId(candidateId),
        })
        source = "students"
      } catch (error) {
        console.error("Error finding candidate in students collection:", error)
        return NextResponse.json({ success: false, message: "Invalid candidate ID format" }, { status: 400 })
      }
    }

    if (!candidate) {
      return NextResponse.json({ success: false, message: "Candidate not found in either collection" }, { status: 404 })
    }

    console.log(
      `Found candidate in ${source} collection: ${candidate.name || candidate.firstName + " " + candidate.lastName}`,
    )

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Candidate Details")

    // Define columns with proper width
    worksheet.columns = [
      { header: "Field", key: "field", width: 30 },
      { header: "Value", key: "value", width: 80 },
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
    headerRow.commit()

    // Normalize candidate data based on source
    const normalizedCandidate =
      source === "students"
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
            alternativePhone: candidate.alternativePhone || candidate.alternatePhone,
            portfolioLink: candidate.portfolioLink || candidate.portfolio,
            socialMediaLink: candidate.socialMediaLink || candidate.socialMedia,
            linkedIn: candidate.linkedIn || candidate.linkedin,
            resumeUrl:
              candidate.resumeUrl ||
              candidate.resume ||
              (candidate.documents && candidate.documents.resume && candidate.documents.resume.url),
            videoResumeUrl:
              candidate.videoResumeUrl ||
              candidate.videoResume ||
              (candidate.documents && candidate.documents.videoResume && candidate.documents.videoResume.url),
            audioBiodataUrl:
              candidate.audioBiodataUrl ||
              candidate.audioBiodata ||
              (candidate.documents && candidate.documents.audioBiodata && candidate.documents.audioBiodata.url),
            photographUrl:
              candidate.photographUrl ||
              candidate.photograph ||
              (candidate.documents && candidate.documents.photograph && candidate.documents.photograph.url),
            // Extract salary and notice period from top level
            currentSalary:
              candidate.currentSalary || (candidate.workExperience && candidate.workExperience[0]?.currentSalary),
            expectedSalary:
              candidate.expectedSalary || (candidate.workExperience && candidate.workExperience[0]?.expectedSalary),
            noticePeriod:
              candidate.noticePeriod || (candidate.workExperience && candidate.workExperience[0]?.noticePeriod),
            // Handle both preferenceCities (students) and preferredCities (candidates)
            preferredCities: candidate.preferredCities || candidate.preferenceCities || [],
          }
        : candidate

    // Add basic information
    worksheet.addRow({
      field: "Data Source",
      value: source === "students" ? "Students Collection" : "Candidates Collection",
    })

    // Personal Information Section
    worksheet.addRow({ field: "=== PERSONAL INFORMATION ===", value: "" })
    worksheet.addRow({
      field: "Full Name",
      value:
        `${normalizedCandidate.salutation || ""} ${normalizedCandidate.firstName || ""} ${normalizedCandidate.middleName || ""} ${normalizedCandidate.lastName || normalizedCandidate.name || ""}`.trim(),
    })
    worksheet.addRow({ field: "Gender", value: normalizedCandidate.gender || "" })
    worksheet.addRow({
      field: "Date of Birth",
      value: normalizedCandidate.dateOfBirth ? new Date(normalizedCandidate.dateOfBirth).toLocaleDateString() : "",
    })
    worksheet.addRow({ field: "Pincode", value: normalizedCandidate.pincode || "" })

    // Contact Information Section
    worksheet.addRow({ field: "=== CONTACT INFORMATION ===", value: "" })
    worksheet.addRow({ field: "Email", value: normalizedCandidate.email || "" })
    worksheet.addRow({ field: "Phone", value: normalizedCandidate.phone || "" })
    worksheet.addRow({ field: "Alternative Phone", value: normalizedCandidate.alternativePhone || "" })
    worksheet.addRow({
      field: "Current Location",
      value: `${normalizedCandidate.currentCity || ""}, ${normalizedCandidate.currentState || ""}`.trim(),
    })
    worksheet.addRow({ field: "Portfolio", value: normalizedCandidate.portfolioLink || "" })
    worksheet.addRow({ field: "Social Media", value: normalizedCandidate.socialMediaLink || "" })
    worksheet.addRow({ field: "LinkedIn", value: normalizedCandidate.linkedIn || "" })

    // Profile Summary Section
    worksheet.addRow({ field: "=== PROFILE SUMMARY ===", value: "" })
    worksheet.addRow({
      field: "Profile Outline",
      value: normalizedCandidate.profileOutline || normalizedCandidate.summary || "",
    })

    // Professional Experience Summary Section
    worksheet.addRow({ field: "=== PROFESSIONAL EXPERIENCE SUMMARY ===", value: "" })
    worksheet.addRow({
      field: "Total Experience",
      value: `${normalizedCandidate.totalExperience || normalizedCandidate.yearsOfExperience || "0"}`,
    })
    worksheet.addRow({ field: "Current Salary", value: normalizedCandidate.currentSalary || "" })
    worksheet.addRow({ field: "Expected Salary", value: normalizedCandidate.expectedSalary || "" })
    worksheet.addRow({ field: "Notice Period", value: normalizedCandidate.noticePeriod || "" })

    // Skills Section
    worksheet.addRow({ field: "=== SKILLS ===", value: "" })
    worksheet.addRow({ field: "Skills", value: (normalizedCandidate.skills || []).join(", ") })

    // Shift Preference Section
    worksheet.addRow({ field: "=== SHIFT PREFERENCE ===", value: "" })
    worksheet.addRow({ field: "Shift Preference", value: (normalizedCandidate.shiftPreference || []).join(", ") })

    // Preferred Cities Section
    worksheet.addRow({ field: "=== PREFERRED CITIES ===", value: "" })
    worksheet.addRow({ field: "Preferred Cities", value: (normalizedCandidate.preferredCities || []).join(", ") })

    // Education Section
    worksheet.addRow({ field: "=== EDUCATION ===", value: "" })
    if (normalizedCandidate.education) {
      const educationArray = Array.isArray(normalizedCandidate.education)
        ? normalizedCandidate.education
        : [normalizedCandidate.education]
      educationArray.forEach((edu: any, index: number) => {
        if (typeof edu === "string") {
          worksheet.addRow({ field: `Education #${index + 1}`, value: edu })
        } else if (edu && typeof edu === "object") {
          worksheet.addRow({
            field: `Education #${index + 1} - Degree/Course`,
            value: `${edu.degree || edu.course || ""} from ${edu.institution || edu.school || edu.college || ""}`,
          })

          // Handle different year field names and formats - check both candidates and students field names
          let startYear = edu.startYear || edu.fromYear || edu.yearFrom || edu.startingYear || ""
          let endYear = edu.endYear || edu.toYear || edu.yearTo || edu.endingYear || ""

          // If years are in a different format, try to extract them
          if (!startYear && !endYear && edu.duration) {
            const durationMatch = edu.duration.match(/(\d{4})\s*-\s*(\d{4})/)
            if (durationMatch) {
              startYear = durationMatch[1]
              endYear = durationMatch[2]
            }
          }

          // If still no years, check for year field
          if (!startYear && !endYear && edu.year) {
            if (typeof edu.year === "string" && edu.year.includes("-")) {
              const yearParts = edu.year.split("-")
              startYear = yearParts[0]
              endYear = yearParts[1]
            } else {
              endYear = edu.year
            }
          }

          worksheet.addRow({
            field: `Education #${index + 1} - Duration`,
            value: startYear || endYear ? `${startYear || ""} - ${endYear || ""}` : "Duration not specified",
          })
          if (edu.level) worksheet.addRow({ field: `Education #${index + 1} - Level`, value: edu.level })
          if (edu.mode) worksheet.addRow({ field: `Education #${index + 1} - Mode`, value: edu.mode })
          if (edu.percentage || edu.cgpa || edu.marks || edu.grade)
            worksheet.addRow({
              field: `Education #${index + 1} - Percentage/CGPA`,
              value: edu.percentage || edu.cgpa || edu.marks || edu.grade,
            })
        }
      })
    }

    // Work Experience Section
    worksheet.addRow({ field: "=== WORK EXPERIENCE ===", value: "" })
    if (normalizedCandidate.workExperience && Array.isArray(normalizedCandidate.workExperience)) {
      normalizedCandidate.workExperience.forEach((exp: any, index: number) => {
        if (typeof exp !== "object") {
          worksheet.addRow({ field: `Experience #${index + 1}`, value: String(exp) })
        } else {
          worksheet.addRow({
            field: `Experience #${index + 1} - Title`,
            value: exp.title || exp.position || exp.jobTitle || "",
          })
          worksheet.addRow({
            field: `Experience #${index + 1} - Company`,
            value: exp.companyName || exp.company || exp.organization || "",
          })
          worksheet.addRow({
            field: `Experience #${index + 1} - Department`,
            value: exp.department || exp.dept || "",
          })
          worksheet.addRow({
            field: `Experience #${index + 1} - Tenure`,
            value: exp.tenure || exp.duration || "",
          })
          worksheet.addRow({
            field: `Experience #${index + 1} - Professional Summary`,
            value: exp.summary || exp.description || exp.professionalSummary || "",
          })
        }
      })
    } else if (normalizedCandidate.experience) {
      if (typeof normalizedCandidate.experience === "string") {
        worksheet.addRow({ field: "Experience", value: normalizedCandidate.experience })
      } else if (Array.isArray(normalizedCandidate.experience)) {
        normalizedCandidate.experience.forEach((exp: any, index: number) => {
          if (typeof exp === "string") {
            worksheet.addRow({ field: `Experience #${index + 1}`, value: exp })
          } else if (exp && typeof exp === "object") {
            worksheet.addRow({
              field: `Experience #${index + 1}`,
              value: `${exp.title || ""} at ${exp.companyName || ""} (${exp.startDate || ""} - ${exp.endDate || exp.tenure || "Present"})`,
            })
            if (exp.department) worksheet.addRow({ field: "Department", value: exp.department })
            if (exp.summary || exp.description)
              worksheet.addRow({ field: "Description", value: exp.summary || exp.description || "" })
          }
        })
      }
    }

    // Certifications Section
    worksheet.addRow({ field: "=== CERTIFICATIONS ===", value: "" })
    if (normalizedCandidate.certifications) {
      if (Array.isArray(normalizedCandidate.certifications)) {
        normalizedCandidate.certifications.forEach((cert: any, index: number) => {
          if (typeof cert === "string") {
            worksheet.addRow({ field: `Certification #${index + 1}`, value: cert })
          } else if (cert && typeof cert === "object") {
            worksheet.addRow({
              field: `Certification #${index + 1}`,
              value: `${cert.name || cert.title || ""} from ${cert.issuer || ""}${
                cert.date ? ` (${new Date(cert.date).toLocaleDateString()})` : ""
              }${cert.credentialId ? `, ID: ${cert.credentialId}` : ""}`,
            })
          }
        })
      } else if (typeof normalizedCandidate.certifications === "string") {
        worksheet.addRow({ field: "Certifications", value: normalizedCandidate.certifications })
      }
    } else {
      worksheet.addRow({ field: "Certifications", value: "No Certifications" })
    }

    // Available Assets Section
    worksheet.addRow({ field: "=== AVAILABLE ASSETS ===", value: "" })
    worksheet.addRow({
      field: "Available Assets",
      value: (normalizedCandidate.availableAssets || []).map((asset: string) => asset.replace(/_/g, " ")).join(", "),
    })

    // Identity Documents Section
    worksheet.addRow({ field: "=== IDENTITY DOCUMENTS ===", value: "" })
    worksheet.addRow({
      field: "Identity Documents",
      value: (normalizedCandidate.identityDocuments || []).map((doc: string) => doc.replace(/_/g, " ")).join(", "),
    })

    // Documents Section
    worksheet.addRow({ field: "=== DOCUMENTS ===", value: "" })
    if (normalizedCandidate.resumeUrl) worksheet.addRow({ field: "Resume URL", value: normalizedCandidate.resumeUrl })
    if (normalizedCandidate.videoResumeUrl)
      worksheet.addRow({ field: "Video Resume URL", value: normalizedCandidate.videoResumeUrl })
    if (normalizedCandidate.audioBiodataUrl)
      worksheet.addRow({ field: "Audio Biodata URL", value: normalizedCandidate.audioBiodataUrl })
    if (normalizedCandidate.photographUrl)
      worksheet.addRow({ field: "Photograph URL", value: normalizedCandidate.photographUrl })

    // Additional Information Section
    worksheet.addRow({ field: "=== ADDITIONAL INFORMATION ===", value: "" })
    if (normalizedCandidate.coverLetter)
      worksheet.addRow({ field: "Cover Letter", value: normalizedCandidate.coverLetter })
    if (normalizedCandidate.additionalInfo)
      worksheet.addRow({ field: "Additional Information", value: normalizedCandidate.additionalInfo })
    if (normalizedCandidate.notes) worksheet.addRow({ field: "Notes", value: normalizedCandidate.notes })

    console.log("Excel workbook created successfully, generating buffer...")

    try {
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer()
      console.log("Excel buffer generated successfully, size:", buffer.byteLength)

      // Return the Excel file
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="candidate_${candidateId}_${source}.xlsx"`,
        },
      })
    } catch (error) {
      console.error("Error generating Excel buffer:", error)
      return NextResponse.json({ success: false, message: "Failed to generate Excel file" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error exporting candidate data:", error)
    return NextResponse.json({ success: false, message: "Failed to export candidate data" }, { status: 500 })
  }
}
