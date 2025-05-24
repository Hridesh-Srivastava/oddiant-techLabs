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

    const jobId = params.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Find job to verify it exists and belongs to this employee
    const job = await db.collection("jobs").findOne({
      _id: new ObjectId(jobId),
      employerId: new ObjectId(userId), // Ensure data isolation
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found or unauthorized access" }, { status: 404 })
    }

    // Find all applications for this specific job
    const applications = await db
      .collection("job_applications")
      .find({ jobId: new ObjectId(jobId) })
      .toArray()

    console.log(`Found ${applications.length} applications for job ${jobId}`)

    // If no applications found, return empty array
    if (applications.length === 0) {
      return NextResponse.json(
        { success: true, applicants: [] },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Extract candidate IDs from applications
    const candidateIds = applications
      .map((app) => {
        try {
          return new ObjectId(app.candidateId.toString())
        } catch (error) {
          console.error(`Invalid ObjectId: ${app.candidateId}`)
          return null
        }
      })
      .filter(Boolean)

    // Create a map to store all applicants
    const applicantsMap = new Map()

    // Step 1: Get candidates from candidates collection
    try {
      const candidatesFromCandidatesCollection = await db
        .collection("candidates")
        .find({ _id: { $in: candidateIds } })
        .toArray()

      console.log(`Found ${candidatesFromCandidatesCollection.length} candidates in 'candidates' collection`)

      // Add candidates to the map with comprehensive field mapping
      for (const candidate of candidatesFromCandidatesCollection) {
        const application = applications.find((app) => app.candidateId.toString() === candidate._id.toString())

        if (application) {
          applicantsMap.set(candidate._id.toString(), {
            _id: candidate._id,
            name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown",
            email: candidate.email || "",
            phone: candidate.phone || "",
            alternativePhone: candidate.alternativePhone || "",
            role: candidate.role || candidate.currentPosition || "Not specified",
            status: application.status || "Applied",
            appliedDate: application.appliedDate
              ? new Date(application.appliedDate).toISOString()
              : new Date().toISOString(),
            lastComment: application.lastComment || null,
            avatar: candidate.avatar || candidate.photographUrl || null,
            source: "candidates",
            // Additional fields for comprehensive data
            salutation: candidate.salutation || "",
            firstName: candidate.firstName || "",
            middleName: candidate.middleName || "",
            lastName: candidate.lastName || "",
            gender: candidate.gender || "",
            dateOfBirth: candidate.dateOfBirth || "",
            currentCity: candidate.currentCity || "",
            currentState: candidate.currentState || "",
            pincode: candidate.pincode || "",
            profileOutline: candidate.profileOutline || "",
            skills: candidate.skills || [],
            education: candidate.education || [],
            workExperience: candidate.workExperience || [],
            certifications: candidate.certifications || [],
            totalExperience: candidate.totalExperience || candidate.yearsOfExperience || "",
            currentSalary: candidate.currentSalary || "",
            expectedSalary: candidate.expectedSalary || "",
            noticePeriod: candidate.noticePeriod || "",
            shiftPreference: candidate.shiftPreference || [],
            preferredCities: candidate.preferredCities || [],
            availableAssets: candidate.availableAssets || [],
            identityDocuments: candidate.identityDocuments || [],
            resumeUrl: candidate.resumeUrl || "",
            videoResumeUrl: candidate.videoResumeUrl || "",
            audioBiodataUrl: candidate.audioBiodataUrl || "",
            photographUrl: candidate.photographUrl || "",
            portfolioLink: candidate.portfolioLink || "",
            socialMediaLink: candidate.socialMediaLink || "",
            linkedIn: candidate.linkedIn || "",
            coverLetter: candidate.coverLetter || "",
            additionalInfo: candidate.additionalInfo || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching from candidates collection:", error)
    }

    // Step 2: Get candidates from students collection
    try {
      const studentsFromStudentsCollection = await db
        .collection("students")
        .find({ _id: { $in: candidateIds } })
        .toArray()

      console.log(`Found ${studentsFromStudentsCollection.length} candidates in 'students' collection`)

      // Add students to the map (if not already added) with comprehensive field mapping
      for (const student of studentsFromStudentsCollection) {
        const application = applications.find((app) => app.candidateId.toString() === student._id.toString())

        if (application && !applicantsMap.has(student._id.toString())) {
          applicantsMap.set(student._id.toString(), {
            _id: student._id,
            name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unknown",
            email: student.email || "",
            phone: student.phone || "",
            alternativePhone: student.alternativePhone || "",
            role: student.experience && student.experience.length > 0 ? student.experience[0].title : "Not specified",
            status: application.status || "Applied",
            appliedDate: application.appliedDate
              ? new Date(application.appliedDate).toISOString()
              : new Date().toISOString(),
            lastComment: application.lastComment || null,
            avatar: student.avatar || student.documents?.photograph?.url || null,
            source: "students",
            // Additional fields for comprehensive data with students collection field mapping
            salutation: student.salutation || "",
            firstName: student.firstName || "",
            middleName: student.middleName || "",
            lastName: student.lastName || "",
            gender: student.gender || "",
            dateOfBirth: student.dateOfBirth || student.dob || "",
            currentCity: student.currentCity || "",
            currentState: student.currentState || "",
            pincode: student.pincode || "",
            profileOutline: student.profileOutline || student.summary || "",
            skills: student.skills || [],
            education: student.education || [],
            workExperience: student.workExperience || student.experience || [],
            certifications: student.certifications || [],
            totalExperience: student.totalExperience || student.yearsOfExperience || "",
            currentSalary: student.currentSalary || "",
            expectedSalary: student.expectedSalary || "",
            noticePeriod: student.noticePeriod || "",
            shiftPreference: student.shiftPreference || [],
            preferredCities: student.preferredCities || student.preferenceCities || [], // Handle both field names
            availableAssets: student.availableAssets || [],
            identityDocuments: student.identityDocuments || [],
            resumeUrl:
              student.resumeUrl ||
              (student.documents && student.documents.resume && student.documents.resume.url) ||
              "",
            videoResumeUrl:
              student.videoResumeUrl ||
              (student.documents && student.documents.videoResume && student.documents.videoResume.url) ||
              "",
            audioBiodataUrl:
              student.audioBiodataUrl ||
              (student.documents && student.documents.audioBiodata && student.documents.audioBiodata.url) ||
              "",
            photographUrl:
              student.photographUrl ||
              (student.documents && student.documents.photograph && student.documents.photograph.url) ||
              "",
            portfolioLink: student.portfolioLink || (student.onlinePresence && student.onlinePresence.portfolio) || "",
            socialMediaLink:
              student.socialMediaLink || (student.onlinePresence && student.onlinePresence.socialMedia) || "",
            linkedIn: student.linkedIn || (student.onlinePresence && student.onlinePresence.linkedin) || "",
            coverLetter: student.coverLetter || "",
            additionalInfo: student.additionalInfo || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching from students collection:", error)
    }

    // Step 3: For any applications without a matching candidate, create a placeholder
    for (const application of applications) {
      const candidateId = application.candidateId.toString()

      if (!applicantsMap.has(candidateId)) {
        console.log(`Creating placeholder for candidate ID: ${candidateId}`)

        // Try to get basic info from the application itself
        const name = application.studentName || application.candidateName || "Unknown Applicant"
        const email = application.studentEmail || application.candidateEmail || ""

        applicantsMap.set(candidateId, {
          _id: application.candidateId,
          name: name,
          email: email,
          phone: "",
          alternativePhone: "",
          role: application.position || "Not specified",
          status: application.status || "Applied",
          appliedDate: application.appliedDate
            ? new Date(application.appliedDate).toISOString()
            : new Date().toISOString(),
          lastComment: application.lastComment || null,
          avatar: null,
          source: "unknown",
          // Additional empty fields for consistency
          salutation: "",
          firstName: "",
          middleName: "",
          lastName: "",
          gender: "",
          dateOfBirth: "",
          currentCity: "",
          currentState: "",
          pincode: "",
          profileOutline: "",
          skills: [],
          education: [],
          workExperience: [],
          certifications: [],
          totalExperience: "",
          currentSalary: "",
          expectedSalary: "",
          noticePeriod: "",
          shiftPreference: [],
          preferredCities: [],
          availableAssets: [],
          identityDocuments: [],
          resumeUrl: "",
          videoResumeUrl: "",
          audioBiodataUrl: "",
          photographUrl: "",
          portfolioLink: "",
          socialMediaLink: "",
          linkedIn: "",
          coverLetter: "",
          additionalInfo: "",
        })
      }
    }

    // Convert map to array
    const applicants = Array.from(applicantsMap.values())

    console.log(`Returning ${applicants.length} total applicants for job ${jobId}`)

    // Update job applicants count if it doesn't match
    if (job.applicants !== applicants.length) {
      await db.collection("jobs").updateOne({ _id: new ObjectId(jobId) }, { $set: { applicants: applicants.length } })
    }

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, applicants },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching job applicants:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch applicants" }, { status: 500 })
  }
}
