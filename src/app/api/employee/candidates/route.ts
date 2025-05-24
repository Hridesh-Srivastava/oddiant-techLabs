import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find employee to verify
    const employee = await db.collection("employees").findOne({
      $or: [{ _id: new ObjectId(userId) }, { _id: userId }],
    })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    // Get company ID for data isolation
    const companyId = employee.companyId || employee._id.toString()

    // Get all candidates from candidates collection for this employee/company
    const candidatesFromCandidates = await db
      .collection("candidates")
      .find({
        $or: [
          { employerId: new ObjectId(userId) },
          { companyId: companyId },
          { employerId: userId },
          { companyId: new ObjectId(companyId) },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Get all job applications for this employee
    const applications = await db
      .collection("job_applications")
      .find({
        $or: [{ employerId: new ObjectId(userId) }, { employerId: userId }],
      })
      .toArray()

    // Create a map of candidate IDs from applications
    const applicationCandidateIds = new Set(applications.map((app) => app.candidateId.toString()))

    // Get all students who have applied to this employee's jobs
    const studentIds = Array.from(applicationCandidateIds)
      .filter((id) => !candidatesFromCandidates.some((c) => c._id.toString() === id))
      .map((id) => {
        try {
          return new ObjectId(id)
        } catch (error) {
          console.error(`Invalid ObjectId: ${id}`)
          return null
        }
      })
      .filter(Boolean)

    // Fetch students who have applied
    const studentsFromStudents =
      studentIds.length > 0
        ? await db
            .collection("students")
            .find({ _id: { $in: studentIds } })
            .toArray()
        : []

    // Also get students directly associated with this employee/company
    const directStudents = await db
      .collection("students")
      .find({
        $or: [
          { employerId: new ObjectId(userId) },
          { companyId: companyId },
          { employerId: userId },
          { companyId: new ObjectId(companyId) },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Combine all students (remove duplicates)
    const allStudents = [...studentsFromStudents, ...directStudents]
    const uniqueStudents = allStudents.filter(
      (student, index, self) => index === self.findIndex((s) => s._id.toString() === student._id.toString()),
    )

    // Convert students to candidate format with comprehensive mapping
    const studentCandidates = uniqueStudents.map((student) => {
      // Find the application for this student
      const application = applications.find((app) => app.candidateId.toString() === student._id.toString())

      return {
        _id: student._id,
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.name || "Unknown",
        email: student.email || student.emailAddress || "",
        phone: student.phone || student.mobileNumber || "",
        alternativePhone: student.alternativePhone || student.alternatePhone || "",
        role:
          student.role ||
          student.currentPosition ||
          (student.experience && student.experience[0]?.title) ||
          application?.position ||
          "Not specified",
        status: application?.status || student.status || "Applied",
        location:
          student.location ||
          student.currentCity ||
          student.currentLocation ||
          `${student.currentCity || ""}, ${student.currentState || ""}`.trim(),

        // Personal details
        salutation: student.salutation || student.title,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth || student.dob,
        gender: student.gender,
        currentCity: student.currentCity || student.city,
        currentState: student.currentState || student.state,
        pincode: student.pincode || student.zipCode,

        // Professional information
        experience: student.experience || student.workExperience || student.totalExperience || "Not specified",
        totalExperience: student.totalExperience || student.yearsOfExperience,
        currentSalary: student.currentSalary,
        expectedSalary: student.expectedSalary,
        noticePeriod: student.noticePeriod,

        // Education
        education: student.education || student.educationDetails || student.qualifications,

        // Skills
        skills: student.skills || student.technicalSkills || student.keySkills || [],

        // Work experience
        workExperience: student.workExperience || student.experience || student.professionalExperience,

        // Profile information
        profileOutline: student.profileOutline || student.summary || student.aboutMe,

        // Certifications
        certifications: student.certifications || student.certificates || student.achievements,

        // Preferences - Handle both field names
        shiftPreference: student.shiftPreference || student.preferredShift || [],
        preferredCities: student.preferredCities || student.preferenceCities || student.preferredLocations || [],

        // Assets and documents
        availableAssets: student.availableAssets || student.assets || [],
        identityDocuments: student.identityDocuments || student.documents || [],

        // Media URLs with nested document support
        resumeUrl:
          student.resumeUrl ||
          student.resume ||
          (student.documents && student.documents.resume && student.documents.resume.url),
        videoResumeUrl:
          student.videoResumeUrl ||
          student.videoResume ||
          (student.documents && student.documents.videoResume && student.documents.videoResume.url),
        audioBiodataUrl:
          student.audioBiodataUrl ||
          student.audioBiodata ||
          (student.documents && student.documents.audioBiodata && student.documents.audioBiodata.url),
        photographUrl:
          student.photographUrl ||
          student.photograph ||
          (student.documents && student.documents.photograph && student.documents.photograph.url) ||
          student.profilePicture,
        avatar:
          student.avatar ||
          student.profilePicture ||
          (student.documents && student.documents.photograph && student.documents.photograph.url),

        // Social links
        portfolioLink:
          student.portfolioLink || student.portfolio || (student.onlinePresence && student.onlinePresence.portfolio),
        socialMediaLink:
          student.socialMediaLink ||
          student.socialMedia ||
          (student.onlinePresence && student.onlinePresence.socialMedia),
        linkedIn: student.linkedIn || student.linkedin || (student.onlinePresence && student.onlinePresence.linkedin),

        // Additional information
        coverLetter: student.coverLetter || student.coverLetterText,
        additionalInfo: student.additionalInfo || student.notes || student.remarks,
        notes: student.notes || student.internalNotes,

        // Dates
        createdAt: application?.createdAt || student.createdAt || new Date(),
        appliedDate: application?.appliedDate || student.registrationDate || student.createdAt,

        // System fields
        employerId: new ObjectId(userId),
        companyId: companyId,
        source: "students", // Add source identifier

        // Include all original student fields for compatibility
        ...student,
      }
    })

    // Add source identifier to candidates from candidates collection
    const candidatesWithSource = candidatesFromCandidates.map((candidate) => ({
      ...candidate,
      source: "candidates",
    }))

    // Combine candidates from both sources
    const allCandidates = [...candidatesWithSource, ...studentCandidates]

    // Sort by creation date
    allCandidates.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, candidates: allCandidates },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch candidates" }, { status: 500 })
  }
}
