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
      _id: new ObjectId(userId),
    })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    }

    console.log(`=== FETCHING CANDIDATES FOR EMPLOYEE: ${userId} ===`)

    // Get company ID for data isolation
    const companyId = employee.companyId || employee._id.toString()

    // Step 1: Get all job applications for this employee's jobs
    const employeeJobs = await db
      .collection("jobs")
      .find({
        $or: [
          { employerId: new ObjectId(userId) },
          { companyId: companyId },
          { companyId: new ObjectId(companyId) },
        ],
      })
      .toArray()

    const employeeJobIds = employeeJobs.map((job) => job._id)
    console.log(`Found ${employeeJobIds.length} jobs for this employee`)

    // Step 2: Get all applications for this employee's jobs
    const applications = await db
      .collection("job_applications")
      .find({
        jobId: { $in: employeeJobIds },
      })
      .toArray()

    console.log(`Found ${applications.length} applications for employee's jobs`)

    // Step 3: Extract all unique applicant IDs from applications
    const allApplicantIds = new Set()

    applications.forEach((app) => {
      if (app.candidateId) {
        allApplicantIds.add(app.candidateId.toString())
      }
      if (app.studentId) {
        allApplicantIds.add(app.studentId.toString())
      }
      if (app.applicantId) {
        allApplicantIds.add(app.applicantId.toString())
      }
    })

    console.log(`Found ${allApplicantIds.size} unique applicant IDs from applications`)

    // Step 4: Convert to ObjectIds for database queries
    const applicantObjectIds = Array.from(allApplicantIds)
      .map((id) => {
        try {
          return new ObjectId(id)
        } catch (error) {
          console.error(`Invalid ObjectId: ${id}`)
          return null
        }
      })
      .filter((id): id is ObjectId => id !== null)

    // Step 5: Fetch candidates from candidates collection
    const candidatesFromCandidates = await db
      .collection("candidates")
      .find({
        _id: { $in: applicantObjectIds },
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${candidatesFromCandidates.length} candidates from candidates collection`)

    // Step 6: Fetch students from students collection
    const studentsFromStudents = await db
      .collection("students")
      .find({
        _id: { $in: applicantObjectIds },
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${studentsFromStudents.length} students from students collection`)

    // Step 7: Also get candidates directly associated with this employee/company (for backward compatibility)
    const directCandidates = await db
      .collection("candidates")
      .find({
        $or: [
          { employerId: new ObjectId(userId) },
          { companyId: companyId },
          { companyId: new ObjectId(companyId) },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${directCandidates.length} direct candidates`)

    // Step 8: Also get students directly associated with this employee/company (for backward compatibility)
    const directStudents = await db
      .collection("students")
      .find({
        $or: [
          { employerId: new ObjectId(userId) },
          { companyId: companyId },
          { companyId: new ObjectId(companyId) },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${directStudents.length} direct students`)

    // Step 9: Combine all candidates and remove duplicates
    const allCandidatesRaw = [...candidatesFromCandidates, ...directCandidates]

    const uniqueCandidates = allCandidatesRaw.filter(
      (candidate, index, self) => index === self.findIndex((c) => c._id.toString() === candidate._id.toString()),
    )

    // Step 10: Combine all students and remove duplicates
    const allStudentsRaw = [...studentsFromStudents, ...directStudents]

    const uniqueStudents = allStudentsRaw.filter(
      (student, index, self) => index === self.findIndex((s) => s._id.toString() === student._id.toString()),
    )

    console.log(`After deduplication: ${uniqueCandidates.length} candidates, ${uniqueStudents.length} students`)

    // Step 11: Convert students to candidate format with comprehensive mapping
    const studentCandidates = uniqueStudents.map((student) => {
      // Find the most recent application for this student
      const studentApplications = applications.filter((app) => {
        const studentIdStr = student._id.toString()
        return (
          (app.candidateId && app.candidateId.toString() === studentIdStr) ||
          (app.studentId && app.studentId.toString() === studentIdStr) ||
          (app.applicantId && app.applicantId.toString() === studentIdStr)
        )
      })

      // Get the most recent application
      const application =
        studentApplications.length > 0
          ? studentApplications.sort(
              (a, b) =>
                new Date(b.createdAt || b.appliedDate).getTime() - new Date(a.createdAt || a.appliedDate).getTime(),
            )[0]
          : null

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
        coverLetter: application?.coverLetter || student.coverLetter || student.coverLetterText,
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

    // Step 12: Process candidates from candidates collection
    const processedCandidates = uniqueCandidates.map((candidate) => {
      // Find the most recent application for this candidate
      const candidateApplications = applications.filter((app) => {
        const candidateIdStr = candidate._id.toString()
        return (
          (app.candidateId && app.candidateId.toString() === candidateIdStr) ||
          (app.studentId && app.studentId.toString() === candidateIdStr) ||
          (app.applicantId && app.applicantId.toString() === candidateIdStr)
        )
      })

      // Get the most recent application
      const application =
        candidateApplications.length > 0
          ? candidateApplications.sort(
              (a, b) =>
                new Date(b.createdAt || b.appliedDate).getTime() - new Date(a.createdAt || a.appliedDate).getTime(),
            )[0]
          : null

      return {
        ...candidate,
        // Update status from application if available
        status: application?.status || candidate.status || "Applied",
        // Update role from application if available
        role: candidate.role || application?.position || "Not specified",
        // Update dates
        appliedDate: application?.appliedDate || candidate.appliedDate || candidate.createdAt,
        // Add source identifier
        source: "candidates",
        // Add application-specific data
        coverLetter: application?.coverLetter || candidate.coverLetter,
        // Ensure employerId is set
        employerId: candidate.employerId || new ObjectId(userId),
        companyId: candidate.companyId || companyId,
      }
    })

    // Step 13: Combine all candidates
    const allCandidates = [...processedCandidates, ...studentCandidates]

    // Step 14: Sort by creation/application date
    allCandidates.sort((a, b) => {
      const dateA = new Date(a.appliedDate || a.createdAt).getTime()
      const dateB = new Date(b.appliedDate || b.createdAt).getTime()
      return dateB - dateA
    })

    console.log(`=== FINAL RESULT ===`)
    console.log(`Total candidates: ${allCandidates.length}`)
    console.log(`From candidates collection: ${processedCandidates.length}`)
    console.log(`From students collection: ${studentCandidates.length}`)

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