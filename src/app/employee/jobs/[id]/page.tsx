"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  Share2,
  Copy,
  Building,
  FileText,
  Clipboard,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface JobPosting {
  _id: string
  jobTitle: string
  jobLocation: string
  experienceRange: string
  jobType: string
  salaryRange: string
  industry: string
  department: string
  skills: string[]
  jobDescription: string
  educationalPreference: string
  shiftPreference: string[]
  genderPreference: string[]
  assetsRequirement: {
    wifi: boolean
    laptop: boolean
    vehicle: boolean
  }
  companyName: string
  aboutCompany: string
  websiteLink: string
  questions: string[]
  answers: string[]
  status: "open" | "hold" | "closed"
  applicants?: number
  daysLeft?: number
  interviews?: number
  createdAt: string
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Unwrap the params object using React.use()
  const unwrappedParams = use(params)
  const jobId = unwrappedParams.id

  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true)
        // Add a cache-busting query parameter to prevent caching
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/employee/jobs/${jobId}?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch job details")
        }

        const data = await response.json()
        setJob(data.job)
      } catch (error) {
        console.error("Error fetching job:", error)
        toast.error("Failed to load job details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()

    // Set up an interval to refresh the data every 30 seconds
    const intervalId = setInterval(fetchJob, 30000)

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [jobId])

  const handleDeleteJob = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete job posting")
      }

      toast.success("Job posting deleted successfully")
      router.push("/employee/dashboard?tab=jobs")
    } catch (error) {
      console.error("Error deleting job posting:", error)
      toast.error(`Failed to delete job posting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicateJob = async () => {
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate job")
      }

      const data = await response.json()
      toast.success("Job duplicated successfully")
      router.push(`/employee/jobs/${data.jobId}`)
    } catch (error) {
      console.error("Error duplicating job:", error)
      toast.error("Failed to duplicate job")
    }
  }

  const handleShareJob = () => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(jobUrl)
    toast.success("Job URL copied to clipboard")
  }

  const updateJobStatus = async (status: "open" | "hold" | "closed") => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update job status")
      }

      setJob((prev) => (prev ? { ...prev, status } : null))
      toast.success(`Job status updated to ${status}`)
    } catch (error) {
      console.error("Error updating job status:", error)
      toast.error("Failed to update job status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Function to format website URL properly
  const formatWebsiteUrl = (url: string) => {
    if (!url) return ""
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "hold":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <EmployeeNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 mb-2">Job Not Found</h2>
              <p className="text-gray-500 mb-6">
                The job posting you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/dashboard?tab=jobs")}>View All Jobs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{job.jobTitle}</h1>
            <div className="flex items-center mt-1">
              <FileText className="h-4 w-4 mr-1 text-black" />
              <span className="text-sm text-black">Job ID: {jobId}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-1"
                onClick={() => {
                  navigator.clipboard.writeText(jobId)
                  toast.success("Job ID copied to clipboard")
                }}
              >
                <Clipboard className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push(`/employee/jobs/${jobId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleShareJob}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDuplicateJob}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Job Details</CardTitle>
                <select
                  value={job.status || "open"}
                  onChange={(e) => updateJobStatus(e.target.value as "open" | "hold" | "closed")}
                  disabled={isUpdatingStatus}
                  className={`px-3 py-1.5 rounded-md text-sm ${getStatusColor(job.status || "open")}`}
                >
                  <option value="open">Open</option>
                  <option value="hold">Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{job.jobLocation}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{job.jobType}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{job.experienceRange}</span>
                  </div>
                  {/* Department field - explicitly displayed */}
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{job.department || "Not specified"}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Salary:</span>
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                  {job.industry && (
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap items-start">
                        <span className="font-medium mr-1 whitespace-nowrap">Industry:</span>
                        <span className="break-words">{job.industry}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{job.jobDescription}</p>
                  </div>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {job.educationalPreference && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Educational Requirements</h3>
                      <p>
                        {job.educationalPreference === "high_school"
                          ? "High School"
                          : job.educationalPreference === "intermediate"
                            ? "Intermediate"
                            : job.educationalPreference === "bachelors"
                              ? "Bachelor's Degree"
                              : job.educationalPreference === "masters"
                                ? "Master's Degree"
                                : job.educationalPreference === "phd"
                                  ? "PhD"
                                  : job.educationalPreference === "diploma"
                                    ? "Diploma"
                                    : job.educationalPreference === "certificate"
                                      ? "Certificate"
                                      : job.educationalPreference === "none"
                                        ? "No Specific Educational Requirements"
                                        : job.educationalPreference}
                      </p>
                    </div>
                  </>
                )}

                {job.shiftPreference && job.shiftPreference.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Shift Preference</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.shiftPreference.map((shift, index) => (
                          <Badge key={index} variant="outline">
                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {job.genderPreference && job.genderPreference.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Gender Preference</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.genderPreference.map((gender, index) => (
                          <Badge key={index} variant="outline">
                            {gender === "no_preference"
                              ? "No Preference"
                              : gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(job.assetsRequirement?.wifi || job.assetsRequirement?.laptop || job.assetsRequirement?.vehicle) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Required Assets</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.assetsRequirement.wifi && <Badge variant="outline">WiFi</Badge>}
                        {job.assetsRequirement.laptop && <Badge variant="outline">Laptop</Badge>}
                        {job.assetsRequirement.vehicle && <Badge variant="outline">Vehicle</Badge>}
                      </div>
                    </div>
                  </>
                )}

                {job.questions && job.questions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Screening Questions</h3>
                      <div className="space-y-4">
                        {job.questions.map((question, index) => (
                          <div key={index} className="border p-4 rounded-md">
                            <p className="font-medium mb-2">Q: {question}</p>
                            {job.answers && job.answers[index] && (
                              <p className="text-gray-600">
                                <span className="font-medium">A:</span> {job.answers[index]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Company Information Card - Always display this card */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-1">Company Name</h3>
                  <p>{job.companyName || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-1">About Company</h3>
                  <p className="whitespace-pre-line">{job.aboutCompany || "No company description provided"}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-1">Website</h3>
                  {job.websiteLink ? (
                    <Button variant="link" className="p-0 h-auto text-blue-700" asChild>
                      <a href={formatWebsiteUrl(job.websiteLink)} target="_blank" rel="noopener noreferrer">
                        {job.websiteLink} &rarr;
                      </a>
                    </Button>
                  ) : (
                    <p>No website provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-blue-900">
              <CardHeader>
                <CardTitle>Job Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Job ID</span>
                  <div className="flex items-center max-w-[180px] sm:max-w-full">
                    <span className="font-medium text-right truncate">{jobId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-0 flex-shrink-0 mr-2"
                      onClick={() => {
                        navigator.clipboard.writeText(jobId)
                        toast.success("Job ID copied to clipboard")
                      }}
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Posted on</span>
                  <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Applicants</span>
                  <span className="font-medium">{job.applicants || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Interviews</span>
                  <span className="font-medium">{job.interviews || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Days Left</span>
                  <span className="font-medium">{job.daysLeft || 30}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge className={getStatusColor(job.status || "open")}>
                    {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : "Open"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-900">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-black text-white hover:text-black hover:bg-green-600" onClick={() => router.push(`/employee/jobs/${jobId}/applicants`)}>
                  <Users className="h-4 w-4 mr-2" />
                  View Applicants
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/employee/jobs/${jobId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </Button>
                <Button variant="outline" className="w-full bg-black text-white hover:text-black hover:bg-green-600" onClick={handleShareJob}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Job
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDuplicateJob}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Job
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
