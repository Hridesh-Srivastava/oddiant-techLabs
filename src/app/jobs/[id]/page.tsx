"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Clipboard,
  Building,
  GraduationCap,
  Users,
  FileText,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  applicants: number
  interviews: number
  daysLeft: number
  createdAt: string
}

export default function PublicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const jobId = use(params).id
  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true)
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/jobs/${jobId}?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          // Handle the case where the job is not found
          toast.error("This job is no longer available or has been removed.")
          router.push("/") // Redirect to home or jobs listing page
          return // Exit the function to prevent further execution
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
  }, [jobId, router])

  const handleApply = () => {
    setIsApplying(true)
    // Redirect to application form
    router.push(`/jobs/${jobId}/apply`)
  }

  const handleShareJob = () => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(jobUrl)
    toast.success("Job URL copied to clipboard")
  }

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId)
    toast.success("Job ID copied to clipboard")
  }

  // Function to format website URL properly
  const formatWebsiteUrl = (url: string) => {
    if (!url) return ""
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Job Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The job posting you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/")}>Go to Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Format status for display
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "success"
      case "hold":
        return "warning"
      case "closed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{job.jobTitle}</CardTitle>
                <div className="flex items-center mt-1">
                  <FileText className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-500">Job ID: {jobId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={handleCopyJobId}
                    title="Copy Job ID"
                  >
                    <Clipboard className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.companyName && (
                    <Badge variant="outline" className="text-sm">
                      {job.companyName}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </Badge>
                  {job.status && (
                    <Badge variant={getStatusBadgeVariant(job.status)} className="text-sm">
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                    <span>{job.jobLocation}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                    <span>{job.jobType}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                    <span>{job.experienceRange}</span>
                  </div>
                  {/* Department field - explicitly displayed */}
                  {job.department && (
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                      <span>{job.department}</span>
                    </div>
                  )}
                </div>

                {/* Salary and Industry in their own row with proper wrapping */}
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {job.salaryRange && (
                    <div className="flex items-start">
                      <span className="font-medium mr-1 whitespace-nowrap flex-shrink-0">Salary:</span>
                      <span className="break-words">{job.salaryRange}</span>
                    </div>
                  )}
                  {job.industry && (
                    <div className="flex items-start">
                      <span className="font-medium mr-1 whitespace-nowrap flex-shrink-0">Industry:</span>
                      <span className="break-words">{job.industry}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">Job Description</h3>
                  <div className="prose dark:prose-invert max-w-none">
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
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                        <span>
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
                        </span>
                      </div>
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
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
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
                      <div className="space-y-3">
                        {job.questions.map((question, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <p className="font-medium">
                              Q{index + 1}: {question}
                            </p>
                            {job.answers && job.answers[index] && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium">Expected answer:</span> {job.answers[index]}
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
            <Card>
              <CardHeader>
                <CardTitle>About {job.companyName || "Company"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.aboutCompany && (
                  <div>
                    <p className="whitespace-pre-line">{job.aboutCompany}</p>
                  </div>
                )}
                {job.websiteLink && (
                  <div>
                    <Button variant="link" className="p-0 h-auto text-blue-700" asChild>
                      <a href={formatWebsiteUrl(job.websiteLink)} target="_blank" rel="noopener noreferrer">
                        Visit Website &rarr;
                      </a>
                    </Button>
                  </div>
                )}
                {!job.aboutCompany && !job.websiteLink && (
                  <p className="text-gray-500 dark:text-gray-400">No company information provided</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apply Now</CardTitle>
                {job.status !== "open" && (
                  <CardDescription className="text-amber-500">
                    This job is currently {job.status}. Applications may not be accepted at this time.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Interested in this position? Submit your application now.</p>
                <Button className="w-full" onClick={handleApply} disabled={isApplying || job.status !== "open"}>
                  {isApplying ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Apply for this Job
                    </>
                  )}
                </Button>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                  {job.daysLeft !== undefined && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {job.daysLeft > 0 ? `${job.daysLeft} days left to apply` : "Application deadline has passed"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Job ID</span>
                  <div className="flex items-center max-w-[150px] sm:max-w-full">
                    <span className="font-medium truncate">{jobId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-0 mr-2 flex-shrink-0"
                      onClick={handleCopyJobId}
                      title="Copy Job ID"
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <Badge className={getStatusBadgeVariant(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Posted on</span>
                  <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                {job.daysLeft !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Days Left</span>
                    <span className="font-medium">{job.daysLeft}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share This Job</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleShareJob}>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy Job Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
