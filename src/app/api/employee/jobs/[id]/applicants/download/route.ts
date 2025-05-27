import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id
    const { applicantIds } = await request.json()

    if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
      return NextResponse.json({ message: "No applicants selected" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find job to verify it exists
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Convert string IDs to ObjectIds
    const objectIds = applicantIds.map((id: string) => new ObjectId(id))

    // Find all selected candidates from both collections
    const candidatesFromCandidates = await db
      .collection("candidates")
      .find({ _id: { $in: objectIds } })
      .project({}) // Empty projection to ensure all fields are returned
      .toArray()

    const candidatesFromStudents = await db
      .collection("students")
      .find({ _id: { $in: objectIds } })
      .project({}) // Empty projection to ensure all fields are returned
      .toArray()

    // Combine candidates from both collections
    const allCandidates = [
      ...candidatesFromCandidates.map((c: any) => ({ ...c, source: "candidates" })),
      ...candidatesFromStudents.map((s: any) => ({ ...s, source: "students" })),
    ]

    console.log("Found candidates:", allCandidates.length)
    console.log("From candidates collection:", candidatesFromCandidates.length)
    console.log("From students collection:", candidatesFromStudents.length)

    if (allCandidates.length === 0) {
      return NextResponse.json({ message: "No candidates found in either collection" }, { status: 404 })
    }

    // Create a new workbook with single sheet
    const workbook = new ExcelJS.Workbook()

    // Add metadata
    workbook.creator = "ATS System"
    workbook.lastModifiedBy = "ATS System"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Single comprehensive sheet with ALL details
    const worksheet = workbook.addWorksheet("Complete Applicants Details")

    // Define comprehensive columns with ALL possible fields
    worksheet.columns = [
      // Source Information
      { header: "Source Collection", key: "source", width: 20 },

      // Personal Information
      { header: "Salutation", key: "salutation", width: 12 },
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "First Name", key: "firstName", width: 18 },
      { header: "Middle Name", key: "middleName", width: 18 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "Email", key: "email", width: 35 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Alternative Phone", key: "alternativePhone", width: 18 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Date of Birth", key: "dateOfBirth", width: 15 },

      // Location Information
      { header: "Current Location", key: "location", width: 30 },
      { header: "Current City", key: "currentCity", width: 20 },
      { header: "Current State", key: "currentState", width: 20 },
      { header: "Pincode", key: "pincode", width: 15 },
      { header: "Full Address", key: "fullAddress", width: 50 },

      // Professional Information
      { header: "Current Position/Role", key: "role", width: 30 },
      { header: "Application Status", key: "status", width: 18 },
      { header: "Total Experience (Years)", key: "totalExperience", width: 20 },
      { header: "Current Salary", key: "currentSalary", width: 18 },
      { header: "Expected Salary", key: "expectedSalary", width: 18 },
      { header: "Notice Period (Days)", key: "noticePeriod", width: 20 },
      { header: "Applied Date", key: "appliedDate", width: 15 },

      // Profile Information
      { header: "Profile Outline/Summary", key: "profileOutline", width: 60 },

      // Skills
      { header: "Technical Skills", key: "skills", width: 50 },

      // Education Details (Comprehensive)
      { header: "Education Details", key: "educationDetails", width: 80 },

      // Work Experience Details (Comprehensive)
      { header: "Work Experience Details", key: "workExperienceDetails", width: 100 },

      // Certifications Details (Comprehensive)
      { header: "Certifications Details", key: "certificationsDetails", width: 80 },

      // Preferences
      { header: "Shift Preference", key: "shiftPreference", width: 25 },
      { header: "Preferred Cities", key: "preferredCities", width: 40 },

      // Assets and Documents
      { header: "Available Assets", key: "availableAssets", width: 40 },
      { header: "Identity Documents", key: "identityDocuments", width: 40 },

      // Media URLs and Links
      { header: "Resume URL", key: "resumeUrl", width: 50 },
      { header: "Video Resume URL", key: "videoResumeUrl", width: 50 },
      { header: "Audio Biodata URL", key: "audioBiodataUrl", width: 50 },
      { header: "Photograph URL", key: "photographUrl", width: 50 },

      // Online Presence
      { header: "Portfolio Link", key: "portfolioLink", width: 40 },
      { header: "Social Media Link", key: "socialMediaLink", width: 40 },
      { header: "LinkedIn Profile", key: "linkedIn", width: 40 },

      // Additional Information
      { header: "Cover Letter", key: "coverLetter", width: 60 },
      { header: "Additional Information", key: "additionalInfo", width: 60 },
      { header: "Internal Notes", key: "notes", width: 60 },

      // System Information
      { header: "Created Date", key: "createdDate", width: 15 },
      { header: "Last Updated", key: "lastUpdated", width: 15 },
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, size: 11 }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.commit()

    // Safe property access helper
    const getNestedProperty = (obj: any, path: string) => {
      return path.split(".").reduce((current, key) => current && current[key], obj) || ""
    }

    // Helper function to format education comprehensively
    const formatEducationComprehensive = (education: any): string => {
      if (!education) return "No education information available"

      const educationArray = Array.isArray(education) ? education : [education]

      return educationArray
        .map((edu: any, index: number) => {
          if (typeof edu === "string") {
            return `${index + 1}. ${edu}`
          } else if (edu && typeof edu === "object") {
            // Handle different field names for start/end years
            const startYear = edu.startYear || edu.fromYear || edu.yearFrom || edu.startingYear || ""
            const endYear = edu.endYear || edu.toYear || edu.yearTo || edu.endingYear || ""

            let eduStr = `${index + 1}. DEGREE: ${edu.degree || edu.course || "Not specified"}`
            eduStr += ` | INSTITUTION: ${edu.institution || edu.school || edu.college || edu.university || "Not specified"}`

            if (startYear || endYear) {
              eduStr += ` | DURATION: ${startYear || "N/A"} - ${endYear || "Present"}`
            }

            if (edu.level) eduStr += ` | LEVEL: ${edu.level}`
            if (edu.mode) eduStr += ` | MODE: ${edu.mode}`
            if (edu.percentage || edu.grade || edu.cgpa || edu.marks) {
              eduStr += ` | SCORE: ${edu.percentage || edu.grade || edu.cgpa || edu.marks}`
            }
            if (edu.field) eduStr += ` | FIELD: ${edu.field}`
            if (edu.specialization) eduStr += ` | SPECIALIZATION: ${edu.specialization}`

            return eduStr
          }
          return ""
        })
        .filter(Boolean)
        .join("\n\n")
    }

    // Helper function to format work experience comprehensively
    const formatWorkExperienceComprehensive = (workExperience: any): string => {
      if (!workExperience) return "No work experience available"

      const expArray = Array.isArray(workExperience) ? workExperience : [workExperience]

      return expArray
        .map((exp: any, index: number) => {
          if (typeof exp === "string") {
            return `${index + 1}. ${exp}`
          } else if (exp && typeof exp === "object") {
            let expStr = `${index + 1}. POSITION: ${exp.title || exp.position || exp.jobTitle || "Not specified"}`
            expStr += ` | COMPANY: ${exp.companyName || exp.company || exp.organization || "Not specified"}`

            if (exp.department || exp.dept) expStr += ` | DEPARTMENT: ${exp.department || exp.dept}`
            if (exp.tenure || exp.duration) expStr += ` | TENURE: ${exp.tenure || exp.duration}`

            if (exp.startDate || exp.endDate) {
              expStr += ` | PERIOD: ${exp.startDate || "N/A"} to ${exp.endDate || (exp.currentlyWorking ? "Present" : "N/A")}`
            }

            if (exp.location) expStr += ` | LOCATION: ${exp.location}`
            if (exp.currentlyWorking) expStr += ` | STATUS: Currently Working`

            if (exp.summary || exp.description || exp.professionalSummary) {
              expStr += ` | SUMMARY: ${exp.summary || exp.description || exp.professionalSummary}`
            }

            // Include salary information if available
            if (exp.currentSalary) expStr += ` | CURRENT SALARY: ${exp.currentSalary}`
            if (exp.expectedSalary) expStr += ` | EXPECTED SALARY: ${exp.expectedSalary}`
            if (exp.noticePeriod) expStr += ` | NOTICE PERIOD: ${exp.noticePeriod} days`

            return expStr
          }
          return ""
        })
        .filter(Boolean)
        .join("\n\n")
    }

    // Helper function to format certifications comprehensively
    const formatCertificationsComprehensive = (certifications: any): string => {
      if (!certifications) return "No certifications available"

      if (Array.isArray(certifications)) {
        return certifications
          .map((cert: any, index: number) => {
            if (typeof cert === "string") {
              return `${index + 1}. ${cert}`
            } else if (typeof cert === "object" && cert !== null) {
              let certStr = `${index + 1}. NAME: ${cert.name || cert.title || "Not specified"}`

              if (cert.issuer || cert.organization || cert.issuingOrganization) {
                certStr += ` | ISSUER: ${cert.issuer || cert.organization || cert.issuingOrganization}`
              }

              if (cert.date || cert.issueDate || cert.year) {
                const certDate = cert.date || cert.issueDate || cert.year
                certStr += ` | ISSUE DATE: ${new Date(certDate).toLocaleDateString()}`
              }

              if (cert.expiryDate) {
                certStr += ` | EXPIRY DATE: ${new Date(cert.expiryDate).toLocaleDateString()}`
              }

              if (cert.credentialId) certStr += ` | CREDENTIAL ID: ${cert.credentialId}`
              if (cert.credentialUrl) certStr += ` | CREDENTIAL URL: ${cert.credentialUrl}`

              return certStr
            }
            return ""
          })
          .filter(Boolean)
          .join("\n\n")
      } else if (typeof certifications === "string") {
        return certifications
      } else if (typeof certifications === "object" && certifications !== null) {
        let certStr = `NAME: ${certifications.name || certifications.title || "Not specified"}`

        if (certifications.issuer || certifications.organization || certifications.issuingOrganization) {
          certStr += ` | ISSUER: ${certifications.issuer || certifications.organization || certifications.issuingOrganization}`
        }

        if (certifications.date || certifications.issueDate || certifications.year) {
          const certDate = certifications.date || certifications.issueDate || certifications.year
          certStr += ` | ISSUE DATE: ${new Date(certDate).toLocaleDateString()}`
        }

        if (certifications.expiryDate) {
          certStr += ` | EXPIRY DATE: ${new Date(certifications.expiryDate).toLocaleDateString()}`
        }

        if (certifications.credentialId) certStr += ` | CREDENTIAL ID: ${certifications.credentialId}`
        if (certifications.credentialUrl) certStr += ` | CREDENTIAL URL: ${certifications.credentialUrl}`

        return certStr
      }

      return "No certifications available"
    }

    // Format dates helper
    const formatDate = (dateString: any) => {
      if (!dateString) return ""
      try {
        return new Date(dateString).toLocaleDateString()
      } catch (e) {
        return dateString
      }
    }

    // Helper function to get available assets from students collection
    const getAvailableAssetsFromStudent = (student: any): string[] => {
      // First check if availableAssets array exists (direct field)
      if (student.availableAssets && Array.isArray(student.availableAssets)) {
        return student.availableAssets
      }

      // Then check the assets object structure from students collection
      if (student.assets && typeof student.assets === "object") {
        const assets: string[] = []
        if (student.assets.bike) assets.push("Bike / Car")
        if (student.assets.wifi) assets.push("WiFi")
        if (student.assets.laptop) assets.push("Laptop")
        return assets
      }

      return []
    }

    // Helper function to get identity documents from students collection
    const getIdentityDocumentsFromStudent = (student: any): string[] => {
      // First check if identityDocuments array exists (direct field)
      if (student.identityDocuments && Array.isArray(student.identityDocuments)) {
        return student.identityDocuments
      }

      // Then check the assets object structure from students collection
      if (student.assets && typeof student.assets === "object") {
        const documents: string[] = []
        if (student.assets.panCard) documents.push("PAN Card")
        if (student.assets.aadhar) documents.push("Aadhar")
        if (student.assets.bankAccount) documents.push("Bank Account")
        if (student.assets.idProof) documents.push("Voter ID / Passport / DL (Any)")
        return documents
      }

      return []
    }

    // Helper function to build current location for students
    const buildCurrentLocation = (candidate: any): string => {
      if (candidate.source === "students") {
        // For students collection, build from currentCity and currentState
        const city = candidate.currentCity || ""
        const state = candidate.currentState || ""
        
        if (city && state) {
          return `${city}, ${state}`
        } else if (city) {
          return city
        } else if (state) {
          return state
        }
        
        // Fallback to location field if exists
        return candidate.location || ""
      } else {
        // For candidates collection, use location field directly
        return candidate.location || ""
      }
    }

    // Add comprehensive data to worksheet
    allCandidates.forEach((candidate: any, candidateIndex: number) => {
      // Log candidate data for debugging
      console.log(`Processing candidate ${candidateIndex + 1} from ${candidate.source}:`, {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        currentCity: candidate.currentCity,
        currentState: candidate.currentState,
        location: candidate.location,
        onlinePresence: candidate.onlinePresence,
        linkedIn: candidate.linkedIn,
        coverLetter: candidate.coverLetter,
        additionalInfo: candidate.additionalInfo
      })

      // Normalize candidate data based on source
      const normalizedCandidate = candidate.source === "students" 
        ? {
            ...candidate,
            // Map student-specific field names to candidate field names
            name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim(),
            currentPosition: candidate.currentPosition || (candidate.experience && candidate.experience[0]?.title),
            role: candidate.role || (candidate.experience && candidate.experience[0]?.title),
            workExperience: candidate.workExperience || candidate.experience,
            yearsOfExperience: candidate.yearsOfExperience || candidate.totalExperience,
            
            // FIXED: Properly handle location fields for students
            location: buildCurrentLocation(candidate),
            currentCity: candidate.currentCity || "",
            currentState: candidate.currentState || "",
            
            // Handle different field names for preferred cities
            preferredCities: candidate.preferredCities || candidate.preferenceCities || [],
            
            // Handle different field names for date of birth
            dateOfBirth: candidate.dateOfBirth || candidate.dob,
            
            // Handle nested document URLs from students collection
            resumeUrl: candidate.resumeUrl || getNestedProperty(candidate, "documents.resume.url"),
            videoResumeUrl: candidate.videoResumeUrl || getNestedProperty(candidate, "documents.videoResume.url"),
            audioBiodataUrl: candidate.audioBiodataUrl || getNestedProperty(candidate, "documents.audioBiodata.url"),
            photographUrl: candidate.photographUrl || getNestedProperty(candidate, "documents.photograph.url") || candidate.avatar,
            
            // FIXED: Handle online presence from students collection
            portfolioLink: candidate.portfolioLink || getNestedProperty(candidate, "onlinePresence.portfolio"),
            socialMediaLink: candidate.socialMediaLink || getNestedProperty(candidate, "onlinePresence.socialMedia"),
            linkedIn: candidate.linkedIn || getNestedProperty(candidate, "onlinePresence.linkedin"),
            
            // FIXED: Handle cover letter and additional info from students collection
            coverLetter: candidate.coverLetter || "",
            additionalInfo: candidate.additionalInfo || "",
            
            // Handle assets and documents from students collection
            availableAssets: getAvailableAssetsFromStudent(candidate),
            identityDocuments: getIdentityDocumentsFromStudent(candidate),
            
            // Handle salary and notice period from students collection
            currentSalary: candidate.currentSalary || (candidate.experience && candidate.experience[0]?.currentSalary),
            expectedSalary: candidate.expectedSalary || (candidate.experience && candidate.experience[0]?.expectedSalary),
            noticePeriod: candidate.noticePeriod || (candidate.experience && candidate.experience[0]?.noticePeriod),
          }
        : {
            ...candidate,
            // For candidates collection, ensure location is properly set
            location: candidate.location || buildCurrentLocation(candidate),
            // Ensure other fields are properly mapped for candidates too
            linkedIn: candidate.linkedIn || candidate.linkedin || "",
            coverLetter: candidate.coverLetter || "",
            additionalInfo: candidate.additionalInfo || "",
          }

      // Get salary and notice period from top level or work experience
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

      // Format comprehensive details
      const educationDetails = formatEducationComprehensive(normalizedCandidate.education)
      const workExperienceDetails = formatWorkExperienceComprehensive(normalizedCandidate.workExperience)
      const certificationsDetails = formatCertificationsComprehensive(normalizedCandidate.certifications)

      // Format arrays
      const skillsText = Array.isArray(normalizedCandidate.skills)
        ? normalizedCandidate.skills.join(", ")
        : normalizedCandidate.skills || ""
      const shiftPreferenceText = Array.isArray(normalizedCandidate.shiftPreference)
        ? normalizedCandidate.shiftPreference.join(", ")
        : normalizedCandidate.shiftPreference || ""
      const preferredCitiesText = Array.isArray(normalizedCandidate.preferredCities)
        ? normalizedCandidate.preferredCities.join(", ")
        : normalizedCandidate.preferredCities || ""
      const availableAssetsText = Array.isArray(normalizedCandidate.availableAssets)
        ? normalizedCandidate.availableAssets.map((asset: string) => asset.replace(/_/g, " ")).join(", ")
        : normalizedCandidate.availableAssets || ""
      const identityDocumentsText = Array.isArray(normalizedCandidate.identityDocuments)
        ? normalizedCandidate.identityDocuments.map((doc: string) => doc.replace(/_/g, " ")).join(", ")
        : normalizedCandidate.identityDocuments || ""

      // Create full address
      const fullAddress = [
        normalizedCandidate.location || normalizedCandidate.currentCity || "",
        normalizedCandidate.currentState || "",
        normalizedCandidate.pincode ? `PIN: ${normalizedCandidate.pincode}` : "",
      ]
        .filter(Boolean)
        .join(", ")

      // Create full name
      const fullName = [
        normalizedCandidate.salutation || "",
        normalizedCandidate.firstName || "",
        normalizedCandidate.middleName || "",
        normalizedCandidate.lastName || normalizedCandidate.name || "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim()

      // Log final normalized data for debugging
      console.log(`Final normalized data for ${fullName}:`, {
        location: normalizedCandidate.location,
        linkedIn: normalizedCandidate.linkedIn,
        coverLetter: normalizedCandidate.coverLetter,
        additionalInfo: normalizedCandidate.additionalInfo
      })

      // Add comprehensive row to worksheet
      const row = worksheet.addRow({
        // Source Information
        source: candidate.source === "students" ? "Students Collection" : "Candidates Collection",

        // Personal Information
        salutation: normalizedCandidate.salutation || "",
        fullName: fullName,
        firstName: normalizedCandidate.firstName || "",
        middleName: normalizedCandidate.middleName || "",
        lastName: normalizedCandidate.lastName || "",
        email: normalizedCandidate.email || "",
        phone: normalizedCandidate.phone || "",
        alternativePhone: normalizedCandidate.alternativePhone || "",
        gender: normalizedCandidate.gender || "",
        dateOfBirth: formatDate(normalizedCandidate.dateOfBirth),

        // Location Information - FIXED
        location: normalizedCandidate.location || "",
        currentCity: normalizedCandidate.currentCity || "",
        currentState: normalizedCandidate.currentState || "",
        pincode: normalizedCandidate.pincode || "",
        fullAddress: fullAddress,

        // Professional Information
        role: normalizedCandidate.role || normalizedCandidate.currentPosition || "",
        status: normalizedCandidate.status || "",
        totalExperience: normalizedCandidate.yearsOfExperience || normalizedCandidate.totalExperience || "0",
        currentSalary: currentSalary,
        expectedSalary: expectedSalary,
        noticePeriod: noticePeriod,
        appliedDate: formatDate(normalizedCandidate.appliedDate || normalizedCandidate.createdAt),

        // Profile Information
        profileOutline: normalizedCandidate.profileOutline || normalizedCandidate.summary || "",

        // Skills
        skills: skillsText,

        // Comprehensive Details
        educationDetails: educationDetails,
        workExperienceDetails: workExperienceDetails,
        certificationsDetails: certificationsDetails,

        // Preferences
        shiftPreference: shiftPreferenceText,
        preferredCities: preferredCitiesText,

        // Assets and Documents
        availableAssets: availableAssetsText,
        identityDocuments: identityDocumentsText,

        // Media URLs and Links
        resumeUrl: normalizedCandidate.resumeUrl || "",
        videoResumeUrl: normalizedCandidate.videoResumeUrl || "",
        audioBiodataUrl: normalizedCandidate.audioBiodataUrl || "",
        photographUrl: normalizedCandidate.photographUrl || "",

        // Online Presence - FIXED
        portfolioLink: normalizedCandidate.portfolioLink || "",
        socialMediaLink: normalizedCandidate.socialMediaLink || "",
        linkedIn: normalizedCandidate.linkedIn || "",

        // Additional Information - FIXED
        coverLetter: normalizedCandidate.coverLetter || "",
        additionalInfo: normalizedCandidate.additionalInfo || "",
        notes: normalizedCandidate.notes || "",

        // System Information
        createdDate: formatDate(normalizedCandidate.createdAt),
        lastUpdated: formatDate(normalizedCandidate.updatedAt),
      })

      // Set wrap text for long content cells and adjust row height
      row.getCell("educationDetails").alignment = { wrapText: true, vertical: "top" }
      row.getCell("workExperienceDetails").alignment = { wrapText: true, vertical: "top" }
      row.getCell("certificationsDetails").alignment = { wrapText: true, vertical: "top" }
      row.getCell("skills").alignment = { wrapText: true, vertical: "top" }
      row.getCell("profileOutline").alignment = { wrapText: true, vertical: "top" }
      row.getCell("coverLetter").alignment = { wrapText: true, vertical: "top" }
      row.getCell("additionalInfo").alignment = { wrapText: true, vertical: "top" }
      row.getCell("notes").alignment = { wrapText: true, vertical: "top" }

      // Set row height to accommodate comprehensive content
      row.height = 150

      console.log(`Added candidate ${candidateIndex + 1}/${allCandidates.length}: ${fullName} from ${candidate.source}`)
    })

    // Auto-fit columns based on content
    worksheet.columns.forEach((column) => {
      if (!column.key) return

      const maxLength = [
        column.header ? column.header.toString().length : 0,
        ...worksheet
          .getColumn(column.key)
          .values.filter((value) => value !== undefined && value !== null)
          .map((value) => {
            const strValue = value.toString() || ""
            // For multiline text, get the longest line
            if (strValue.includes("\n")) {
              return Math.max(...strValue.split("\n").map((line) => line.length))
            }
            return strValue.length
          }),
      ].reduce((max, length) => Math.max(max, length), 0)

      column.width = Math.min(maxLength + 2, 120) // Cap width at 120 characters
    })

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
    })

    console.log("Excel workbook created successfully with single comprehensive sheet")

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="applicants-${job.jobTitle}-comprehensive-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generating Excel file:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate Excel file", error: String(error) },
      { status: 500 },
    )
  }
}