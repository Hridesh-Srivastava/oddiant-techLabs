import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id
    console.log(`=== DEBUGGING JOB APPLICANTS FOR JOB: ${jobId} ===`)

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

    console.log(`Job found: ${job.jobTitle}`)

    // Find all applications for this specific job - handle all possible applicant ID fields
    const applications = await db
      .collection("job_applications")
      .find({
        jobId: new ObjectId(jobId),
      })
      .sort({ updatedAt: -1, createdAt: -1 }) // Sort by most recent first
      .toArray()

    console.log(`=== FOUND ${applications.length} TOTAL APPLICATIONS FOR JOB ${jobId} ===`)

    // Log each application in detail
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`, {
        _id: app._id,
        candidateId: app.candidateId,
        studentId: app.studentId,
        applicantId: app.applicantId,
        status: app.status,
        lastComment: app.lastComment,
        studentName: app.studentName,
        studentEmail: app.studentEmail,
        updatedAt: app.updatedAt,
        createdAt: app.createdAt,
      })
    })

    // Filter applications that have valid applicant IDs
    const validApplications = applications.filter((app) => app.candidateId || app.studentId || app.applicantId)

    console.log(`=== FOUND ${validApplications.length} VALID APPLICATIONS ===`)

    // If no applications found, return empty array
    if (validApplications.length === 0) {
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

    // Group applications by applicant ID and get the most recent one for each applicant
    const latestApplicationsMap = new Map()

    validApplications.forEach((app) => {
      const applicantId = (app.candidateId || app.studentId || app.applicantId)?.toString()

      if (applicantId) {
        // If we don't have this applicant yet, or if this application is more recent
        if (!latestApplicationsMap.has(applicantId)) {
          latestApplicationsMap.set(applicantId, app)
          console.log(`Setting initial application for ${applicantId}:`, {
            appId: app._id,
            status: app.status,
            lastComment: app.lastComment,
            updatedAt: app.updatedAt,
          })
        } else {
          const existingApp = latestApplicationsMap.get(applicantId)
          const existingDate = existingApp.updatedAt || existingApp.createdAt || new Date(0)
          const currentDate = app.updatedAt || app.createdAt || new Date(0)

          if (currentDate > existingDate) {
            latestApplicationsMap.set(applicantId, app)
            console.log(`Updating to more recent application for ${applicantId}:`, {
              oldAppId: existingApp._id,
              oldStatus: existingApp.status,
              oldComment: existingApp.lastComment,
              newAppId: app._id,
              newStatus: app.status,
              newComment: app.lastComment,
              oldDate: existingDate,
              newDate: currentDate,
            })
          }
        }
      }
    })

    const latestApplications = Array.from(latestApplicationsMap.values())
    console.log(`=== USING ${latestApplications.length} LATEST APPLICATIONS ===`)

    // Extract all possible applicant IDs from latest applications
    const allApplicantIds = new Set<string>()

    latestApplications.forEach((app) => {
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

    const applicantIdsArray = Array.from(allApplicantIds)
    console.log(`=== PROCESSING ${applicantIdsArray.length} UNIQUE APPLICANT IDS ===`)
    console.log("Applicant IDs:", applicantIdsArray)

    // Convert to ObjectIds safely
    const candidateObjectIds = applicantIdsArray
      .map((id: string) => {
        try {
          return new ObjectId(id)
        } catch (error) {
          console.error(`Invalid ObjectId: ${id}`)
          return null
        }
      })
      .filter((id): id is ObjectId => id !== null)

    // Create a map to store all applicants
    const applicantsMap = new Map()

    // Step 1: Get candidates from candidates collection
    try {
      const candidatesFromCandidatesCollection = await db
        .collection("candidates")
        .find({ _id: { $in: candidateObjectIds } })
        .toArray()

      console.log(`=== FOUND ${candidatesFromCandidatesCollection.length} CANDIDATES IN 'candidates' COLLECTION ===`)

      // Add candidates to the map
      for (const candidate of candidatesFromCandidatesCollection) {
        const candidateIdStr = candidate._id.toString()
        console.log(
          `Processing candidate: ${candidate.name || candidate.firstName + " " + candidate.lastName} (ID: ${candidateIdStr})`,
        )

        // Find the LATEST application for this candidate FOR THIS SPECIFIC JOB
        const application = latestApplications.find((app) => {
          const appCandidateId = (app.candidateId || app.studentId || app.applicantId)?.toString()
          const match = appCandidateId === candidateIdStr
          if (match) {
            console.log(`  ✓ Found matching LATEST application:`, {
              appId: app._id,
              status: app.status,
              lastComment: app.lastComment,
              matchedBy: app.candidateId ? "candidateId" : app.studentId ? "studentId" : "applicantId",
              updatedAt: app.updatedAt,
            })
          }
          return match
        })

        if (application) {
          const applicantData = {
            _id: candidate._id,
            name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown",
            email: candidate.email || "",
            phone: candidate.phone || "",
            alternativePhone: candidate.alternativePhone || "",
            role: candidate.role || candidate.currentPosition || "Not specified",
            status: application.status || "applied",
            appliedDate: application.appliedDate
              ? new Date(application.appliedDate).toISOString()
              : new Date().toISOString(),
            lastComment: application.lastComment || null,
            avatar: candidate.avatar || candidate.photographUrl || null,
            source: "candidates",
            // Additional fields
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
            coverLetter: application.coverLetter || candidate.coverLetter || "",
            additionalInfo: candidate.additionalInfo || "",
          }

          console.log(`  ✓ Adding to map:`, {
            name: applicantData.name,
            status: applicantData.status,
            lastComment: applicantData.lastComment,
          })

          applicantsMap.set(candidateIdStr, applicantData)
        } else {
          console.log(`  ✗ No matching application found for candidate ${candidateIdStr}`)
        }
      }
    } catch (error) {
      console.error("Error fetching from candidates collection:", error)
    }

    // Step 2: Get students from students collection
    try {
      const studentsFromStudentsCollection = await db
        .collection("students")
        .find({ _id: { $in: candidateObjectIds } })
        .toArray()

      console.log(`=== FOUND ${studentsFromStudentsCollection.length} STUDENTS IN 'students' COLLECTION ===`)

      // Add students to the map (if not already added)
      for (const student of studentsFromStudentsCollection) {
        const studentIdStr = student._id.toString()
        console.log(`Processing student: ${student.firstName} ${student.lastName} (ID: ${studentIdStr})`)

        // Find the LATEST application for this student FOR THIS SPECIFIC JOB
        const application = latestApplications.find((app) => {
          const appCandidateId = (app.candidateId || app.studentId || app.applicantId)?.toString()
          const match = appCandidateId === studentIdStr
          if (match) {
            console.log(`  ✓ Found matching LATEST application:`, {
              appId: app._id,
              status: app.status,
              lastComment: app.lastComment,
              matchedBy: app.candidateId ? "candidateId" : app.studentId ? "studentId" : "applicantId",
              updatedAt: app.updatedAt,
            })
          }
          return match
        })

        if (application && !applicantsMap.has(studentIdStr)) {
          const applicantData = {
            _id: student._id,
            name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.name || "Unknown",
            email: student.email || "",
            phone: student.phone || "",
            alternativePhone: student.alternativePhone || "",
            role:
              (student.experience && student.experience.length > 0 ? student.experience[0].title : null) ||
              student.role ||
              student.currentPosition ||
              "Not specified",
            status: application.status || "applied",
            appliedDate: application.appliedDate
              ? new Date(application.appliedDate).toISOString()
              : new Date().toISOString(),
            lastComment: application.lastComment || null,
            avatar:
              student.avatar ||
              (student.documents && student.documents.photograph && student.documents.photograph.url) ||
              null,
            source: "students",
            // Additional fields with students collection field mapping
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
            preferredCities: student.preferredCities || student.preferenceCities || [],
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
            coverLetter: application.coverLetter || student.coverLetter || "",
            additionalInfo: student.additionalInfo || "",
          }

          console.log(`  ✓ Adding to map:`, {
            name: applicantData.name,
            status: applicantData.status,
            lastComment: applicantData.lastComment,
          })

          applicantsMap.set(studentIdStr, applicantData)
        } else if (!application) {
          console.log(`  ✗ No matching application found for student ${studentIdStr}`)
        } else {
          console.log(`  ✗ Student ${studentIdStr} already in map`)
        }
      }
    } catch (error) {
      console.error("Error fetching from students collection:", error)
    }

    // Step 3: For any applications without a matching candidate/student, create a placeholder
    for (const application of latestApplications) {
      // Get the applicant ID from any available field
      let applicantId = null
      if (application.candidateId) {
        applicantId = application.candidateId.toString()
      } else if (application.studentId) {
        applicantId = application.studentId.toString()
      } else if (application.applicantId) {
        applicantId = application.applicantId.toString()
      }

      if (applicantId && !applicantsMap.has(applicantId)) {
        console.log(`=== CREATING PLACEHOLDER FOR APPLICANT ID: ${applicantId} ===`)
        console.log(`Placeholder data:`, {
          status: application.status,
          lastComment: application.lastComment,
          studentName: application.studentName,
          studentEmail: application.studentEmail,
        })

        // Try to get basic info from the application itself
        const name = application.studentName || application.candidateName || "Unknown Applicant"
        const email = application.studentEmail || application.candidateEmail || ""

        const placeholderData = {
          _id: applicantId,
          name: name,
          email: email,
          phone: "",
          alternativePhone: "",
          role: application.position || "Not specified",
          status: application.status || "applied",
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
          coverLetter: application.coverLetter || "",
          additionalInfo: "",
        }

        console.log(`  ✓ Adding placeholder to map:`, {
          name: placeholderData.name,
          status: placeholderData.status,
          lastComment: placeholderData.lastComment,
        })

        applicantsMap.set(applicantId, placeholderData)
      }
    }

    // Convert map to array
    const applicants = Array.from(applicantsMap.values())

    console.log(`=== FINAL APPLICANTS DATA (${applicants.length} total) ===`)
    applicants.forEach((app, index) => {
      console.log(`Applicant ${index + 1}:`, {
        name: app.name,
        email: app.email,
        status: app.status,
        lastComment: app.lastComment,
        source: app.source,
      })
    })

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
