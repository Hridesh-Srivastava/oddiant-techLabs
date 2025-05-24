import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidateId = await params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Try to find candidate in candidates collection first
    let candidate = await db.collection("candidates").findOne({ _id: new ObjectId(candidateId) })
    let source = "candidates"

    // If not found in candidates collection, try students collection
    if (!candidate) {
      candidate = await db.collection("students").findOne({ _id: new ObjectId(candidateId) })
      source = "students"

      // If found in students collection, normalize the data structure
      if (candidate) {
        // Map student fields to candidate structure for consistent display
        candidate = {
          ...candidate,
          // Basic info mapping
          name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim(),
          role:
            candidate.role ||
            candidate.currentPosition ||
            (candidate.experience && candidate.experience[0]?.title) ||
            "Not specified",

          // Contact info
          phone: candidate.phone || candidate.mobileNumber,
          email: candidate.email || candidate.emailAddress,
          alternativePhone: candidate.alternativePhone || candidate.alternatePhone || candidate.emergencyContact,
          location:
            candidate.location ||
            candidate.currentCity ||
            candidate.currentLocation ||
            `${candidate.currentCity || ""}, ${candidate.currentState || ""}`.trim(),

          // Personal details
          salutation: candidate.salutation || candidate.title,
          firstName: candidate.firstName,
          middleName: candidate.middleName,
          lastName: candidate.lastName,
          dateOfBirth: candidate.dateOfBirth || candidate.dob,
          gender: candidate.gender,
          currentCity: candidate.currentCity || candidate.city,
          currentState: candidate.currentState || candidate.state,
          pincode: candidate.pincode || candidate.zipCode || candidate.postalCode,

          // Professional info - extract salary and notice period from top level or first work experience
          experience: candidate.experience || candidate.workExperience || candidate.totalExperience,
          totalExperience: candidate.totalExperience || candidate.yearsOfExperience,
          currentSalary:
            candidate.currentSalary || (candidate.workExperience && candidate.workExperience[0]?.currentSalary),
          expectedSalary:
            candidate.expectedSalary || (candidate.workExperience && candidate.workExperience[0]?.expectedSalary),
          noticePeriod:
            candidate.noticePeriod || (candidate.workExperience && candidate.workExperience[0]?.noticePeriod),

          // Education mapping - handle both array and single object
          education: candidate.education || candidate.educationDetails || candidate.qualifications,

          // Skills mapping
          skills: candidate.skills || candidate.technicalSkills || candidate.keySkills || [],

          // Work experience mapping - ensure it's properly structured
          workExperience: candidate.workExperience || candidate.experience || candidate.professionalExperience,

          // Additional mappings for student-specific fields
          profileOutline: candidate.profileOutline || candidate.summary || candidate.aboutMe || candidate.description,
          certifications: candidate.certifications || candidate.certificates || candidate.achievements,

          // Preferences - handle both students and candidates collections field names
          shiftPreference: Array.isArray(candidate.shiftPreference)
            ? candidate.shiftPreference
            : candidate.shiftPreference
              ? [candidate.shiftPreference]
              : candidate.preferredShift || [],

          // Handle both preferenceCities (students) and preferredCities (candidates)
          preferredCities: Array.isArray(candidate.preferredCities)
            ? candidate.preferredCities
            : candidate.preferredCities
              ? [candidate.preferredCities]
              : Array.isArray(candidate.preferenceCities)
                ? candidate.preferenceCities
                : candidate.preferenceCities
                  ? [candidate.preferenceCities]
                  : candidate.preferredLocations || [],

          // Assets and documents
          availableAssets: Array.isArray(candidate.availableAssets)
            ? candidate.availableAssets
            : candidate.availableAssets
              ? [candidate.availableAssets]
              : candidate.assets || [],
          identityDocuments: Array.isArray(candidate.identityDocuments)
            ? candidate.identityDocuments
            : candidate.identityDocuments
              ? [candidate.identityDocuments]
              : candidate.documents || [],

          // Media URLs - handle nested document structure
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
            (candidate.documents && candidate.documents.photograph && candidate.documents.photograph.url) ||
            candidate.profilePicture,

          // Social links
          portfolioLink: candidate.portfolioLink || candidate.portfolio || candidate.portfolioUrl,
          socialMediaLink: candidate.socialMediaLink || candidate.socialMedia,
          linkedIn: candidate.linkedIn || candidate.linkedin || candidate.linkedinProfile,

          // Additional info
          coverLetter: candidate.coverLetter || candidate.coverLetterText,
          additionalInfo: candidate.additionalInfo || candidate.notes || candidate.remarks,
          notes: candidate.notes || candidate.internalNotes || candidate.comments,

          // Status and dates
          status: candidate.status || "Applied",
          appliedDate: candidate.appliedDate || candidate.registrationDate || candidate.createdAt,

          // Avatar/Profile picture
          avatar:
            candidate.avatar ||
            candidate.profilePicture ||
            (candidate.documents && candidate.documents.photograph && candidate.documents.photograph.url),
        }
      }
    }

    if (!candidate) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    // Format the education field properly if it exists and is an object or array
    if (candidate.education) {
      // If education is an array of objects, format each one
      if (Array.isArray(candidate.education)) {
        candidate.education = candidate.education.map((edu) => {
          if (typeof edu === "object" && edu !== null) {
            // Format each education entry properly
            const degree = edu.degree || edu.course || "N/A"
            const institution = edu.institution || edu.school || edu.college || edu.university || "N/A"

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

            const level = edu.level || "N/A"
            const mode = edu.mode || "N/A"
            const percentage = edu.percentage || edu.cgpa || edu.marks || edu.grade || "N/A"

            // Create a formatted string representation
            edu.formattedEducation = `${degree} from ${institution}${startYear || endYear ? ` (${startYear || ""}-${endYear || ""})` : ""}`

            // Ensure all fields are properly set
            edu.degree = degree
            edu.institution = institution
            edu.startYear = startYear || ""
            edu.endYear = endYear || ""
            edu.level = level
            edu.mode = mode
            edu.percentage = percentage
          }
          return edu
        })
      }
      // If education is a single object, format it
      else if (typeof candidate.education === "object" && candidate.education !== null) {
        const edu = candidate.education
        const degree = edu.degree || edu.course || "N/A"
        const institution = edu.institution || edu.school || edu.college || edu.university || "N/A"

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

        candidate.formattedEducation = `${degree} from ${institution}${startYear || endYear ? ` (${startYear || ""}-${endYear || ""})` : ""}`

        // Ensure the education object has all required fields
        candidate.education = {
          ...edu,
          degree,
          institution,
          startYear: startYear || "",
          endYear: endYear || "",
          level: edu.level || "N/A",
          mode: edu.mode || "N/A",
          percentage: edu.percentage || edu.cgpa || edu.marks || edu.grade || "N/A",
        }
      }
    }

    // Format work experience properly - remove salary and notice period from individual entries
    if (candidate.workExperience && Array.isArray(candidate.workExperience)) {
      candidate.workExperience = candidate.workExperience.map((exp) => {
        if (typeof exp === "object" && exp !== null) {
          return {
            title: exp.title || exp.position || exp.jobTitle || "N/A",
            companyName: exp.companyName || exp.company || exp.organization || "N/A",
            department: exp.department || exp.dept || "N/A",
            tenure: exp.tenure || exp.duration || "N/A",
            summary: exp.summary || exp.description || exp.professionalSummary || "N/A",
            startDate: exp.startDate || exp.fromDate || "N/A",
            endDate: exp.endDate || exp.toDate || "N/A",
            currentlyWorking: exp.currentlyWorking || false,
            location: exp.location || "N/A",
            // Remove salary and notice period from individual work experience entries
          }
        }
        return exp
      })
    }

    // Add source information
    candidate.source = source

    // If from students collection, normalize the name field
    if (source === "students" && !candidate.name) {
      candidate.name = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown"
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, candidate },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidate" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidateId = params.id
    const candidateData = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // Try to update in candidates collection first
    let result = await db.collection("candidates").updateOne(
      { _id: new ObjectId(candidateId) },
      {
        $set: {
          ...candidateData,
          updatedAt: new Date(),
        },
      },
    )

    // If not found in candidates collection, try students collection
    if (result.matchedCount === 0) {
      result = await db.collection("students").updateOne(
        { _id: new ObjectId(candidateId) },
        {
          $set: {
            ...candidateData,
            updatedAt: new Date(),
          },
        },
      )
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Candidate updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating candidate:", error)
    return NextResponse.json({ success: false, message: "Failed to update candidate" }, { status: 500 })
  }
}
