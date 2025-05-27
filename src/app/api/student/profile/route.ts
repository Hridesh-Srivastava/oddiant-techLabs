import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Define proper types
interface Certification {
  name: string
  issuingOrganization: string
  issueDate: string
  expiryDate?: string | null
  credentialId?: string | null
  credentialUrl?: string | null
}

interface UserDocument {
  _id: ObjectId
  firstName: string
  lastName: string
  email: string
  certifications?: Certification[] | string[]
  preferredCities?: string[]
  preferenceCities?: string[]
  profileCompleted?: boolean
  updatedAt?: Date
  [key: string]: any // For other dynamic fields
}

// Transform candidates collection data to student format
function transformCandidateToStudentFormat(candidate: any) {
  console.log("=== DEBUGGING CANDIDATE DATA ===")
  console.log("Full candidate object:", JSON.stringify(candidate, null, 2))

  // Check education structure specifically
  if (candidate.education) {
    console.log("Education field exists:")
    console.log("Type:", typeof candidate.education)
    console.log("Is Array:", Array.isArray(candidate.education))
    console.log("Education data:", JSON.stringify(candidate.education, null, 2))

    if (Array.isArray(candidate.education)) {
      candidate.education.forEach((edu: any, index: number) => {
        console.log(`Education entry ${index}:`, JSON.stringify(edu, null, 2))
        console.log(`Available keys in education ${index}:`, Object.keys(edu))
      })
    }
  } else {
    console.log("No education field found")
  }

  // Split name into firstName and lastName
  const nameParts = (candidate.name || "").split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  // Map salutation values to match dropdown options
  const mapSalutation = (value: string) => {
    if (!value) return ""
    const val = value.toLowerCase()
    if (val.includes("mr")) return "Mr."
    if (val.includes("mrs")) return "Mrs."
    if (val.includes("ms")) return "Ms."
    if (val.includes("dr")) return "Dr."
    if (val.includes("prof")) return "Prof."
    return value // Return original if no match
  }

  // Map education level values to match dropdown options
  const mapEducationLevel = (value: string) => {
    if (!value) return ""
    const val = value.toLowerCase()
    if (val.includes("high") || val.includes("10th") || val.includes("secondary")) return "high_school"
    if (val.includes("intermediate") || val.includes("12th") || val.includes("higher secondary")) return "intermediate"
    if (val.includes("bachelor") || val.includes("b.") || val.includes("graduation") || val.includes("ug"))
      return "bachelors"
    if (val.includes("master") || val.includes("m.") || val.includes("post graduation") || val.includes("pg"))
      return "masters"
    if (val.includes("phd") || val.includes("doctorate")) return "phd"
    if (val.includes("diploma")) return "diploma"
    if (val.includes("certificate")) return "certificate"
    return "" // Return empty if no match to show "Select level"
  }

  // Map education mode values to match dropdown options
  const mapEducationMode = (value: string) => {
    if (!value) return ""
    const val = value.toLowerCase()
    if (val.includes("regular") || val.includes("full time") || val.includes("fulltime")) return "regular"
    if (val.includes("distance") || val.includes("correspondence")) return "distance"
    if (val.includes("open") || val.includes("open schooling")) return "open_schooling"
    if (val.includes("part time") || val.includes("parttime")) return "part_time"
    return "regular" // Default to regular if no match
  }

  // Map gender values
  const mapGender = (value: string) => {
    if (!value) return ""
    const val = value.toLowerCase()
    if (val.includes("male") && !val.includes("female")) return "male"
    if (val.includes("female")) return "female"
    if (val.includes("other")) return "other"
    return value.toLowerCase()
  }

  // Transform education data - COMPREHENSIVE APPROACH
  let educationArray = []
  if (candidate.education) {
    if (typeof candidate.education === "string") {
      educationArray = [
        {
          degree: candidate.education,
          institution: "",
          level: mapEducationLevel(candidate.education),
          mode: "regular",
          startingYear: "",
          endingYear: "",
          percentage: "",
          field: "",
        },
      ]
    } else if (Array.isArray(candidate.education)) {
      educationArray = candidate.education.map((edu: any, index: number) => {
        console.log(`\n=== Processing Education Entry ${index} ===`)
        console.log("Raw education entry:", JSON.stringify(edu, null, 2))

        // Try to find year fields - check ALL possible keys
        const allKeys = Object.keys(edu)
        console.log("All available keys:", allKeys)

        // Look for year-related keys
        const yearKeys = allKeys.filter(
          (key) =>
            key.toLowerCase().includes("year") ||
            key.toLowerCase().includes("from") ||
            key.toLowerCase().includes("to") ||
            key.toLowerCase().includes("start") ||
            key.toLowerCase().includes("end") ||
            key.toLowerCase().includes("admission") ||
            key.toLowerCase().includes("graduation") ||
            key.toLowerCase().includes("completion"),
        )
        console.log("Year-related keys found:", yearKeys)

        // Log values of year-related keys
        yearKeys.forEach((key) => {
          console.log(`${key}:`, edu[key])
        })

        const transformedEdu = {
          degree: edu.degree || edu.course || edu.qualification || edu.courseName || "",
          institution: edu.institution || edu.school || edu.college || edu.university || "",
          level: mapEducationLevel(edu.level || edu.educationLevel || edu.degree || edu.course || ""),
          mode: mapEducationMode(edu.mode || edu.modeOfEducation || ""),
          // Try to get years from ANY field that might contain them
          startingYear:
            edu.startingYear ||
            edu.fromYear ||
            edu.startYear ||
            edu.yearFrom ||
            edu.admissionYear ||
            edu.joinYear ||
            edu.from ||
            edu.startDate ||
            edu.admissionDate ||
            edu.joiningYear ||
            "",
          endingYear:
            edu.endingYear ||
            edu.toYear ||
            edu.endYear ||
            edu.yearTo ||
            edu.graduationYear ||
            edu.passoutYear ||
            edu.completionYear ||
            edu.to ||
            edu.endDate ||
            edu.graduationDate ||
            edu.passingYear ||
            "",
          percentage: edu.percentage || edu.grade || edu.marks || edu.cgpa || edu.score || "",
          field: edu.field || edu.specialization || edu.stream || edu.branch || edu.subject || "",
        }

        console.log("Transformed education entry:", JSON.stringify(transformedEdu, null, 2))
        return transformedEdu
      })
    }
  }

  // Transform experience data
  let experienceArray = []
  if (candidate.experience) {
    if (typeof candidate.experience === "string") {
      experienceArray = [
        {
          title: "",
          companyName: "",
          professionalSummary: candidate.experience,
          tenure: "",
          currentlyWorking: false,
          location: "",
          department: "",
          summary: candidate.experience,
        },
      ]
    } else if (Array.isArray(candidate.experience)) {
      experienceArray = candidate.experience.map((exp: any) => ({
        title: exp.title || exp.designation || exp.position || "",
        companyName: exp.companyName || exp.company || exp.organization || "",
        professionalSummary: exp.professionalSummary || exp.summary || exp.description || "",
        tenure: exp.tenure || exp.duration || "",
        currentlyWorking: exp.currentlyWorking === true || exp.currentlyWorking === "true",
        location: exp.location || exp.city || "",
        department: exp.department || exp.division || "",
        summary: exp.summary || exp.professionalSummary || "",
      }))
    }
  }

  // Transform work experience (alternative field name)
  if (candidate.workExperience && Array.isArray(candidate.workExperience)) {
    experienceArray = candidate.workExperience.map((exp: any) => ({
      title: exp.title || exp.designation || exp.position || "",
      companyName: exp.companyName || exp.company || exp.organization || "",
      professionalSummary: exp.professionalSummary || exp.summary || exp.description || "",
      tenure: exp.tenure || exp.duration || "",
      currentlyWorking: exp.currentlyWorking === true || exp.currentlyWorking === "true",
      location: exp.location || exp.city || "",
      department: exp.department || exp.division || "",
      summary: exp.summary || exp.professionalSummary || "",
    }))
  }

  const transformedData = {
    ...candidate,
    // Personal Information mapping with proper dropdown values
    firstName,
    lastName,
    salutation: mapSalutation(candidate.salutation || candidate.title || candidate.prefix || ""),
    gender: mapGender(candidate.gender || ""),
    dob: candidate.dateOfBirth || candidate.dob || "",
    dateOfBirth: candidate.dateOfBirth || candidate.dob || "",
    profileOutline: candidate.profileOutline || candidate.summary || candidate.bio || "",
    middleName: candidate.middleName || "",

    // Contact Information mapping
    phone: candidate.phone || candidate.mobile || "",
    alternativePhone: candidate.alternativePhone || candidate.altPhone || "",
    currentCity: candidate.location || candidate.city || candidate.currentCity || "",
    currentState: candidate.state || candidate.currentState || "",
    pincode: candidate.pincode || candidate.zipCode || "",
    permanentAddress: candidate.permanentAddress || candidate.address || "",

    // Education mapping with proper dropdown values and years
    education: educationArray,

    // Experience mapping
    experience: experienceArray,
    workExperience: candidate.workExperience || experienceArray,
    totalExperience: candidate.totalExperience || candidate.yearsOfExperience || "",
    yearsOfExperience: candidate.yearsOfExperience || candidate.totalExperience || "",

    // Skills mapping
    skills: Array.isArray(candidate.skills) ? candidate.skills : [],

    // Certifications mapping
    certifications: candidate.certifications || [],

    // Preferences mapping
    preferenceCities: candidate.preferredCities || candidate.preferenceCities || [],
    preferredCities: candidate.preferredCities || candidate.preferenceCities || [],
    shiftPreference: candidate.shiftPreference || [],

    // Salary and notice period
    currentSalary: candidate.currentSalary || "",
    expectedSalary: candidate.expectedSalary || "",
    noticePeriod: candidate.noticePeriod || "",

    // Assets mapping
    assets: candidate.assets || {},
    availableAssets: candidate.availableAssets || [],
    identityDocuments: candidate.identityDocuments || [],

    // Documents mapping
    documents: candidate.documents || {},
    resumeUrl: candidate.resumeUrl || candidate.resume || "",
    videoResumeUrl: candidate.videoResumeUrl || "",
    audioBiodataUrl: candidate.audioBiodataUrl || "",
    photographUrl: candidate.photographUrl || candidate.avatar || "",
    avatar: candidate.avatar || candidate.photographUrl || "",

    // Online presence mapping
    onlinePresence: candidate.onlinePresence || {
      portfolio: candidate.portfolioLink || candidate.portfolio || "",
      linkedin: candidate.linkedIn || candidate.linkedin || "",
      github: candidate.github || "",
      socialMedia: candidate.socialMediaLink || candidate.socialMedia || "",
    },
    portfolioLink: candidate.portfolioLink || candidate.portfolio || "",
    linkedIn: candidate.linkedIn || candidate.linkedin || "",
    socialMediaLink: candidate.socialMediaLink || candidate.socialMedia || "",

    // Additional information
    additionalInfo: candidate.additionalInfo || candidate.notes || "",
    coverLetter: candidate.coverLetter || "",

    // Settings
    settings: candidate.settings || {
      profileVisibility: true,
      notifications: {
        email: true,
        jobRecommendations: true,
        applicationUpdates: true,
      },
      preferredJobTypes: [],
      preferredLocations: candidate.preferredCities || candidate.preferenceCities || [],
      shiftPreference: candidate.shiftPreference || "",
    },
  }

  console.log("=== FINAL TRANSFORMED EDUCATION ===")
  console.log("Final education array:", JSON.stringify(transformedData.education, null, 2))

  return transformedData
}

// Transform student format back to candidate format for storage
function transformStudentToCandidateFormat(studentData: any, originalCandidate: any) {
  const updateData: any = { ...studentData }

  // Map firstName and lastName back to name
if (updateData.firstName || updateData.lastName) {
  const firstName = updateData.firstName || ""
  const middleName = updateData.middleName ? ` ${updateData.middleName}` : ""
  const lastName = updateData.lastName ? ` ${updateData.lastName}` : ""
  updateData.name = `${firstName}${middleName}${lastName}`.trim()
}

  // Keep original candidate fields and add new ones
  return {
    ...originalCandidate,
    ...updateData,
    // Ensure we keep the name field for candidates
    name: updateData.name || originalCandidate.name,
    // Map location back
    location: updateData.currentCity || updateData.location || originalCandidate.location,
    // Keep both education formats
    education: updateData.education,
    // Keep both experience formats
    experience: updateData.experience,
    workExperience: updateData.experience,
    // Update timestamp
    updatedAt: new Date(),
    profileCompleted: true,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // First check students collection
    let student: UserDocument | null = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let sourceCollection = "students"

    // If not found in students, check candidates collection
    if (!student) {
      student = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      sourceCollection = "candidates"
    }

    if (!student) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Log complete user data for debugging
    console.log("=== USER DATA FROM", sourceCollection.toUpperCase(), "===")
    console.log("Complete user data:", JSON.stringify(student, null, 2))
    console.log("All available fields:", Object.keys(student))

    let transformedStudent = student

    // Transform candidates data to student format
    if (sourceCollection === "candidates") {
      transformedStudent = transformCandidateToStudentFormat(student)
    }

    // Ensure certifications are properly structured
    if (transformedStudent.certifications) {
      // Check if certifications is an array of strings (old format) and convert to proper format
      if (
        Array.isArray(transformedStudent.certifications) &&
        transformedStudent.certifications.length > 0 &&
        typeof transformedStudent.certifications[0] === "string"
      ) {
        transformedStudent.certifications = (transformedStudent.certifications as string[]).map(
          (cert: string): Certification => ({
            name: cert,
            issuingOrganization: "Not specified",
            issueDate: new Date().toISOString(),
          }),
        )
      }

      // Ensure each certification has all required fields
      transformedStudent.certifications = (transformedStudent.certifications as Certification[]).map(
        (cert: any): Certification => ({
          name: cert.name || "Not specified",
          issuingOrganization: cert.issuingOrganization || "Not specified",
          issueDate: cert.issueDate || new Date().toISOString(),
          expiryDate: cert.expiryDate || null,
          credentialId: cert.credentialId || null,
          credentialUrl: cert.credentialUrl || null,
        }),
      )
    } else {
      // Initialize empty certifications array if it doesn't exist
      transformedStudent.certifications = []
    }

    // Create response data without sensitive fields (only remove fields that actually exist)
    const responseData = { ...transformedStudent }

    // Only delete fields that might exist
    if ("password" in responseData) delete responseData.password

    // Add source collection info
    responseData.sourceCollection = sourceCollection

    // Add cache control headers to prevent caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")

    return NextResponse.json(
      { success: true, student: responseData },
      {
        status: 200,
        headers: headers,
      },
    )
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from request
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const data: Partial<UserDocument> = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()

    // First check students collection
    let student: UserDocument | null = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let collection = "students"

    // If not found in students, check candidates collection
    if (!student) {
      student = await db.collection("candidates").findOne({ _id: new ObjectId(userId) })
      collection = "candidates"
    }

    if (!student) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Process certifications data if provided
    if (data.certifications) {
      // Ensure certifications are in the correct format
      if (Array.isArray(data.certifications)) {
        // If certifications are strings, convert them to objects
        if (data.certifications.length > 0 && typeof data.certifications[0] === "string") {
          data.certifications = (data.certifications as string[]).map(
            (cert: string): Certification => ({
              name: cert,
              issuingOrganization: "Not specified",
              issueDate: new Date().toISOString(),
            }),
          )
        }

        // Ensure each certification has all required fields
        data.certifications = (data.certifications as any[]).map(
          (cert: any): Certification => ({
            name: cert.name || "Not specified",
            issuingOrganization: cert.issuingOrganization || "Not specified",
            issueDate: cert.issueDate || new Date().toISOString(),
            expiryDate: cert.expiryDate || null,
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
          }),
        )
      }
    }

    let updateData: Partial<UserDocument>

    // Handle different update logic based on collection
    if (collection === "candidates") {
      // Transform student format back to candidate format for storage
      updateData = transformStudentToCandidateFormat(data, student)
    } else {
      // For students collection, use data as is
      updateData = {
        ...data,
        profileCompleted: true,
        updatedAt: new Date(),
      }
    }

    // Don't allow updating sensitive fields (only remove fields that might exist)
    if ("password" in updateData) delete updateData.password
    if ("email" in updateData) delete updateData.email // Email should be updated through a separate endpoint with verification
    if ("_id" in updateData) delete updateData._id

    console.log("Updating", collection, "with data:", JSON.stringify(updateData, null, 2))

    // Update the user document in the correct collection
    const result = await db.collection(collection).updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
    }

    // Get updated user data
    let updatedStudent: UserDocument | null = await db.collection(collection).findOne({ _id: new ObjectId(userId) })

    if (!updatedStudent) {
      return NextResponse.json({ success: false, message: "Failed to retrieve updated profile" }, { status: 500 })
    }

    // Transform candidates data to student format for response
    if (collection === "candidates") {
      updatedStudent = transformCandidateToStudentFormat(updatedStudent)
    }

    // Ensure certifications are properly structured in the response
    if (updatedStudent.certifications) {
      // Check if certifications is an array of strings (old format) and convert to proper format
      if (
        Array.isArray(updatedStudent.certifications) &&
        updatedStudent.certifications.length > 0 &&
        typeof updatedStudent.certifications[0] === "string"
      ) {
        updatedStudent.certifications = (updatedStudent.certifications as string[]).map(
          (cert: string): Certification => ({
            name: cert,
            issuingOrganization: "Not specified",
            issueDate: new Date().toISOString(),
          }),
        )
      }

      // Ensure each certification has all required fields
      updatedStudent.certifications = (updatedStudent.certifications as Certification[]).map(
        (cert: any): Certification => ({
          name: cert.name || "Not specified",
          issuingOrganization: cert.issuingOrganization || "Not specified",
          issueDate: cert.issueDate || new Date().toISOString(),
          expiryDate: cert.expiryDate || null,
          credentialId: cert.credentialId || null,
          credentialUrl: cert.credentialUrl || null,
        }),
      )
    } else {
      // Initialize empty certifications array if it doesn't exist
      updatedStudent.certifications = []
    }

    // Create response data without sensitive fields (only remove fields that actually exist)
    const updatedStudentData = { ...updatedStudent }
    if ("password" in updatedStudentData) delete updatedStudentData.password

    return NextResponse.json(
      { success: true, message: "Profile updated successfully", student: updatedStudentData },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
