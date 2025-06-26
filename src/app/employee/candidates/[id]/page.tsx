"use client"

import React, { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, User, Briefcase, GraduationCap, Clock, Laptop, CreditCard, LinkIcon, Linkedin, FileCheck, MessageSquare, Info, Award, FileSpreadsheet, Loader2, DollarSign, Send } from 'lucide-react'
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

interface Interview {
  _id: string
  position: string
  date: string
  time: string
  status: string
}

interface Education {
  level: string
  mode: string
  degree: string
  institution: string
  startYear: string
  endYear: string
  percentage: string
}

interface Certification {
  name: string
  issuer: string
  date: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
}

interface WorkExperience {
  title: string
  department: string
  companyName: string
  tenure: string
  summary: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  location: string
}

interface Candidate {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  location: string
  experience: string
  education: Education | string | Education[]
  skills: string[]
  notes: string
  resumeUrl: string
  appliedDate: string
  createdAt: string
  updatedAt: string

  // Personal Information
  salutation?: string
  firstName?: string
  middleName?: string
  lastName?: string
  alternativePhone?: string
  dateOfBirth?: string
  gender?: string
  currentCity?: string
  currentState?: string
  pincode?: string
  profileOutline?: string

  // Experience
  totalExperience?: string
  currentSalary?: string
  expectedSalary?: string
  noticePeriod?: string
  workExperience?: WorkExperience[]
  shiftPreference?: string[]
  preferredCities?: string[]

  // Education & Certifications
  certifications?: Certification[]

  // Assets & Documents
  availableAssets?: string[]
  identityDocuments?: string[]

  // Media
  avatar?: string
  videoResumeUrl?: string
  audioBiodataUrl?: string
  photographUrl?: string

  // Additional
  portfolioLink?: string
  socialMediaLink?: string
  linkedIn?: string
  coverLetter?: string
  additionalInfo?: string

  // Formatted fields
  formattedEducation?: string
  fullName?: string
}

// Helper function to safely render any value
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "Not available"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map((item) => safeRender(item)).join(", ")
  if (typeof value === "object") {
    // Handle specific object types
    if (value.title && value.companyName) {
      return `${value.title} at ${value.companyName}${value.tenure ? ` (${value.tenure})` : ""}`
    }
    if (value.degree && value.institution) {
      return `${value.degree} from ${value.institution}`
    }
    // Generic object fallback
    return Object.entries(value)
      .filter(([key, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, val]) => `${key}: ${safeRender(val)}`)
      .join(", ")
  }
  return String(value)
}

export default function CandidateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  // Await the params as they're now Promise-based in Next.js 15
  const resolvedParams = use(params)
  const candidateId = resolvedParams.id
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/employee/candidates/${candidateId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch candidate details")
        }

        const data = await response.json()
        console.log("Candidate data:", data.candidate) // Debug log
        setCandidate(data.candidate)
      } catch (error) {
        console.error("Error fetching candidate:", error)
        toast.error("Failed to load candidate details")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchInterviews = async () => {
      try {
        setIsLoadingInterviews(true)
        const response = await fetch(`/api/employee/candidates/${candidateId}/interviews`)

        if (!response.ok) {
          throw new Error("Failed to fetch interviews")
        }

        const data = await response.json()
        console.log("Interviews data:", data.interviews) // Debug log
        setInterviews(data.interviews || [])
      } catch (error) {
        console.error("Error fetching interviews:", error)
        // Don't show toast for this, just log the error
      } finally {
        setIsLoadingInterviews(false)
      }
    }

    fetchCandidate()
    fetchInterviews()
  }, [candidateId])

  const handleStatusChange = async (newStatus: string) => {
    if (!candidate) return

    try {
      const response = await fetch(`/api/employee/candidates/${candidateId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update candidate status")
      }

      setCandidate({
        ...candidate,
        status: newStatus,
      })

      toast.success(`Candidate status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating candidate status:", error)
      toast.error("Failed to update candidate status")
    }
  }

  // Function to export candidate data to Excel
  const handleExportToExcel = async () => {
    if (!candidate) return

    try {
      setIsExporting(true)

      // Use the GET endpoint for single candidate export
      const response = await fetch(`/api/employee/candidates/${candidateId}/export`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export candidate data")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate_${candidateId}.xlsx`

      // Append to the document, click it, and remove it
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Candidate data exported successfully")
    } catch (error) {
      console.error("Error exporting candidate data:", error)
      toast.error("Failed to export candidate data")
    } finally {
      setIsExporting(false)
    }
  }

  // Function to handle invite to jobs
  const handleInviteToJobs = () => {
    router.push(`/employee/candidates/${candidateId}/invite`)
  }

  // Function to format website URL properly
  const formatWebsiteUrl = (url: string) => {
    if (!url) return ""
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "Shortlisted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Interview":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Hired":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Not available"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Not available"
      return date.toLocaleDateString()
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Not available"
    }
  }

  // Helper function to render education information
  const renderEducation = (education: Education | string | Education[] | undefined) => {
    if (!education) return "Not available"

    if (Array.isArray(education)) {
      return education.map((edu, index) => (
        <Card key={index} className="mb-3 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  {typeof edu === "object" && edu !== null ? edu.degree : "Degree not specified"}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeof edu === "object" && edu !== null ? edu.institution : "Institution not specified"}
                </p>
              </div>
              {typeof edu === "object" && edu !== null && (
                <Badge variant="outline">
                  {edu.startYear && edu.endYear
                    ? `${edu.startYear} - ${edu.endYear}`
                    : edu.startYear
                      ? `${edu.startYear}`
                      : edu.endYear
                        ? `${edu.endYear}`
                        : "Duration not specified"}
                </Badge>
              )}
            </div>
            {typeof edu === "object" && edu !== null && (
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Level: </span>
                  {edu.level || "N/A"}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Mode: </span>
                  {edu.mode || "N/A"}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Percentage/CGPA: </span>
                  {edu.percentage || "N/A"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))
    }

    if (typeof education === "string") {
      return <p>{education}</p>
    }

    // If education is an object, format it properly
    if (typeof education === "object" && education !== null) {
      return (
        <Card className="mb-3 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{education.degree || "Degree not specified"}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {education.institution || "Institution not specified"}
                </p>
              </div>
              <Badge variant="outline">
                {education.startYear && education.endYear
                  ? `${education.startYear} - ${education.endYear}`
                  : education.startYear
                    ? `${education.startYear}`
                    : education.endYear
                      ? `${education.endYear}`
                      : "Duration not specified"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Level: </span>
                {education.level || "N/A"}
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Mode: </span>
                {education.mode || "N/A"}
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Percentage/CGPA: </span>
                {education.percentage || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return "Not available"
  }

  // Helper function to render certifications
  const renderCertifications = (certifications: Certification[] | undefined) => {
    if (!certifications || !Array.isArray(certifications)) {
      // Handle case when certifications is a string or simple value
      if (certifications && typeof certifications === "object") {
        // Try to convert to array if it's an object but not an array
        const certsArray = Object.values(certifications)
        if (certsArray.length > 0) {
          return renderCertificationsArray(certsArray as Certification[])
        }
      }
      return "No certifications available"
    }

    return renderCertificationsArray(certifications)
  }

  // Helper function to render an array of certifications
  const renderCertificationsArray = (certifications: Certification[] | any[]) => {
    if (certifications.length === 0) return "No certifications added yet."

    return certifications.map((cert, index) => {
      // Handle simple string values in the array
      if (typeof cert === "string") {
        return (
          <Card key={index} className="mb-3 bg-gray-50 dark:bg-gray-800">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{cert}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      // Handle certification objects
      return (
        <Card key={index} className="mb-3 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{cert.name || cert}</h4>
                {cert.issuer && <p className="text-sm text-gray-500 dark:text-gray-400">{cert.issuer}</p>}
              </div>
              {cert.date && <Badge variant="outline">{formatDate(cert.date)}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              {cert.expiryDate && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Expiry Date: </span>
                  {formatDate(cert.expiryDate)}
                </div>
              )}
              {cert.credentialId && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Credential ID: </span>
                  {cert.credentialId}
                </div>
              )}
              {cert.credentialUrl && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">Credential URL: </span>
                  <a
                    href={formatWebsiteUrl(cert.credentialUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {cert.credentialUrl}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <EmployeeNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Candidate Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The candidate you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/dashboard?tab=candidates")}>View All Candidates</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage
                      src={candidate.avatar || candidate.photographUrl || "/placeholder.svg?height=96&width=96"}
                      alt={candidate.name}
                    />
                    <AvatarFallback className="text-2xl">{candidate.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">
                    {candidate.salutation ? `${candidate.salutation} ` : ""}
                    {candidate.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">{candidate.role}</p>
                  <Badge className={getStatusColor(candidate.status)}>{candidate.status}</Badge>

                  <div className="w-full mt-6 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/employee/candidates/${candidateId}/contact`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Candidate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/employee/interviews/schedule?candidateId=${candidateId}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleExportToExcel}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? "Exporting..." : "Export to Excel"}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleInviteToJobs}>
                      <Send className="h-4 w-4 mr-2" />
                      Invite to Jobs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.email}</p>
                  </div>
                </div>
                {candidate.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.phone}</p>
                    </div>
                  </div>
                )}
                {candidate.alternativePhone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Alternative Phone</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.alternativePhone}</p>
                    </div>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.location}</p>
                    </div>
                  </div>
                )}
                {(candidate.currentCity || candidate.currentState) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Current Location</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {candidate.currentCity}
                        {candidate.currentState && `, ${candidate.currentState}`}
                        {candidate.pincode && ` - ${candidate.pincode}`}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.linkedIn && (
                  <div className="flex items-start">
                    <Linkedin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">LinkedIn</p>
                      <a
                        href={formatWebsiteUrl(candidate.linkedIn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        {candidate.linkedIn}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {candidate.availableAssets && candidate.availableAssets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Available Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidate.availableAssets.map((asset, index) => (
                      <div key={index} className="flex items-center">
                        <Laptop className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{asset.replace("_", "/")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {candidate.identityDocuments && candidate.identityDocuments.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidate.identityDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{doc.replace("_", " ")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Candidate Profile</CardTitle>
                <div className="flex space-x-2">
                  <select
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    value={candidate.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                      <p>
                        {candidate.salutation ? `${candidate.salutation} ` : ""}
                        {candidate.firstName || ""} {candidate.middleName || ""} {candidate.lastName || candidate.name}
                      </p>
                    </div>
                    {candidate.gender && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                        <p>{candidate.gender}</p>
                      </div>
                    )}
                    {candidate.dateOfBirth && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                        <p>{formatDate(candidate.dateOfBirth)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</p>
                      <p>{formatDate(candidate.appliedDate || candidate.createdAt)}</p>
                    </div>
                  </div>

                  {candidate.profileOutline && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Outline</p>
                      <p className="whitespace-pre-line">{candidate.profileOutline}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Professional Summary */}
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Professional Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</p>
                      <p>{candidate.role}</p>
                    </div>
                    {candidate.experience && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</p>
                        <p>{safeRender(candidate.experience)}</p>
                      </div>
                    )}
                    {candidate.totalExperience && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Experience (years)</p>
                        <p>{candidate.totalExperience}</p>
                      </div>
                    )}
                  </div>

                  {/* Salary and Notice Period Section */}
                  {(candidate.currentSalary || candidate.expectedSalary || candidate.noticePeriod) && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Salary & Notice Period
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {candidate.currentSalary && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Salary</p>
                            <p className="text-green-600 font-medium">{candidate.currentSalary}</p>
                          </div>
                        )}
                        {candidate.expectedSalary && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Salary</p>
                            <p className="text-blue-600 font-medium">{candidate.expectedSalary}</p>
                          </div>
                        )}
                        {candidate.noticePeriod && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notice Period</p>
                            <p className="text-orange-600 font-medium">{candidate.noticePeriod} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Education */}
                {candidate && candidate.education && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Educational Qualifications
                      </h3>
                      <div className="space-y-2">{renderEducation(candidate.education)}</div>
                    </div>
                  </>
                )}

                {/* Certifications */}
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Certifications
                    </h3>
                    <div className="space-y-2">{renderCertifications(candidate.certifications)}</div>
                  </div>
                </>

                {/* Work Experience */}
                {candidate.workExperience && candidate.workExperience.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Work Experience
                      </h3>
                      <div className="space-y-4">
                        {candidate.workExperience.map((exp, index) => {
                          // Safely handle work experience objects
                          if (typeof exp === "string") {
                            return (
                              <Card key={index} className="bg-gray-50 dark:bg-gray-800">
                                <CardContent className="pt-4">
                                  <p>{exp}</p>
                                </CardContent>
                              </Card>
                            )
                          }

                          // Handle work experience objects
                          const workExp = exp as WorkExperience
                          return (
                            <Card key={index} className="bg-gray-50 dark:bg-gray-800">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{workExp.title || "Position"}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {workExp.companyName || "Company"}{" "}
                                      {workExp.department && `- ${workExp.department}`}
                                    </p>
                                  </div>
                                  {workExp.tenure && <Badge variant="outline">{workExp.tenure}</Badge>}
                                </div>
                                {workExp.summary && (
                                  <div className="mt-2">
                                    <p className="text-sm whitespace-pre-line">{workExp.summary}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Shift Preference */}
                {candidate.shiftPreference && candidate.shiftPreference.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Shift Preference
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.shiftPreference.map((shift, index) => (
                          <Badge key={index} variant="outline">
                            {shift}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Preferred Cities */}
                {candidate.preferredCities && candidate.preferredCities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Preferred Cities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.preferredCities.map((city, index) => (
                          <Badge key={index} variant="outline">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <FileCheck className="h-5 w-5 mr-2" />
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Portfolio & Social Links */}
                {(candidate.portfolioLink || candidate.socialMediaLink) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        Online Presence
                      </h3>
                      <div className="space-y-2">
                        {candidate.portfolioLink && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio</p>
                            <a
                              href={formatWebsiteUrl(candidate.portfolioLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {candidate.portfolioLink}
                            </a>
                          </div>
                        )}
                        {candidate.socialMediaLink && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Social Media</p>
                            <a
                              href={formatWebsiteUrl(candidate.socialMediaLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {candidate.socialMediaLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Cover Letter */}
                {candidate.coverLetter && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Cover Letter
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                        <p className="whitespace-pre-line">{candidate.coverLetter}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Information */}
                {candidate.additionalInfo && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <Info className="h-5 w-5 mr-2" />
                        Additional Information
                      </h3>
                      <p className="whitespace-pre-line">{candidate.additionalInfo}</p>
                    </div>
                  </>
                )}

                {/* Notes */}
                {candidate.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Notes
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{candidate.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents and Media */}
            <Card>
              <CardHeader>
                <CardTitle>Documents & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resume */}
                {candidate.resumeUrl && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Resume
                    </h3>
                    <Button variant="outline" className="text-blue-600 dark:text-blue-400" asChild>
                      <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    </Button>
                  </div>
                )}

                {/* Media Assets */}
                {(candidate.videoResumeUrl || candidate.audioBiodataUrl || candidate.photographUrl) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Candidate Assets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {candidate.videoResumeUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Video Resume</p>
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                            <video src={candidate.videoResumeUrl} controls className="w-full h-full object-contain">
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>
                      )}

                      {candidate.audioBiodataUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Audio Biodata</p>
                          <audio src={candidate.audioBiodataUrl} controls className="w-full">
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )}

                      {candidate.photographUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Photograph</p>
                          <div className="rounded-md overflow-hidden border dark:border-gray-700">
                            <img
                              src={candidate.photographUrl || "/placeholder.svg"}
                              alt={`${candidate.name}'s photograph`}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview History */}
            <Card>
              <CardHeader>
                <CardTitle>Interview History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : interviews.length > 0 ? (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <div
                        key={interview._id}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md dark:border-gray-700"
                      >
                        <div className="mb-2 md:mb-0">
                          <p className="font-medium">{interview.position}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(interview.date)} at {interview.time}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              interview.status === "scheduled"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : interview.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : interview.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employee/interviews/${interview._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No interviews scheduled yet</p>
                    <Button onClick={() => router.push(`/employee/interviews/schedule?candidateId=${candidateId}`)}>
                      Schedule Interview
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}