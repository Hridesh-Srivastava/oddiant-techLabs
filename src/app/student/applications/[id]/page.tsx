"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "sonner"
import { ArrowLeft, Briefcase, Building, Calendar, MapPin, AlertTriangle, ExternalLink, Clock } from "lucide-react"
import { use } from "react"
import { StudentNavbar } from "@/components/layout/student-navbar"

interface Application {
  _id: string
  jobId: string
  candidateId: string
  status: string
  appliedDate: string
  coverLetter?: string
  history: Array<{
    status: string
    date: string
    note?: string
  }>
  job?: {
    jobTitle: string
    companyName: string
    jobLocation: string
    jobType: string
    experienceRange?: string
    salaryRange?: string
    skills?: string[]
  }
}

interface RecentJob {
  _id: string
  jobTitle: string
  companyName: string
  jobLocation: string
  jobType: string
  experienceRange?: string
  salaryRange?: string
  skills?: string[]
  createdAt: string
  hasApplied: boolean
  applicationStatus?: string
}

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const applicationId = resolvedParams.id
  const [application, setApplication] = useState<Application | null>(null)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRecentJobs, setIsLoadingRecentJobs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/student/applications/${applicationId}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (response.status === 401) {
          router.push("/auth/login")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch application details")
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch application details")
        }

        setApplication(data.application)
      } catch (error) {
        console.error("Error fetching application details:", error)
        setError("An error occurred while fetching application details")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchRecentJobs = async () => {
      try {
        setIsLoadingRecentJobs(true)
        const response = await fetch("/api/jobs/recent", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setRecentJobs(data.jobs)
          }
        }
      } catch (error) {
        console.error("Error fetching recent jobs:", error)
      } finally {
        setIsLoadingRecentJobs(false)
      }
    }

    fetchApplicationDetails()
    fetchRecentJobs()
  }, [applicationId, router])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>
      case "shortlisted":
        return <Badge className="bg-yellow-100 text-yellow-800">Shortlisted</Badge>
      case "interview":
        return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "hired":
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleExploreMoreJobs = () => {
    router.push("/student/dashboard?tab=jobs")
  }

  const handleViewJobDetails = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>There was a problem loading the application details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/student/dashboard?tab=applications")}>
                Back to Applications
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Application Not Found</CardTitle>
            <CardDescription>
              The application you're looking for doesn't exist or you don't have access to it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/student/dashboard?tab=applications")} className="w-full">
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        <StudentNavbar />
        
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/student/dashboard?tab=applications")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Details - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{application.job?.jobTitle || "Unknown Job"}</CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {application.job?.companyName || "Unknown Company"}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(application.status)}
                    <p className="text-sm text-gray-500 mt-2">
                      Applied on {new Date(application.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{application.job?.jobLocation || "Unknown Location"}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{application.job?.jobType || "Unknown Job Type"}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{application.job?.experienceRange || "Experience not specified"}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">Application Status History</h3>
                  <div className="space-y-4">
                    {application.history?.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="mr-4 mt-1">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                          </div>
                          {index < (application.history?.length || 0) - 1 && (
                            <div className="h-10 w-0.5 bg-gray-200 mx-auto mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {application.coverLetter && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Cover Letter</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="whitespace-pre-line">{application.coverLetter}</p>
                      </div>
                    </div>
                  </>
                )}

                {application.job?.skills && application.job.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {application.job?.salaryRange && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Salary Range</h3>
                      <p>{application.job.salaryRange}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" onClick={() => router.push(`/jobs/${application.jobId}`)}>
                    View Job Details
                  </Button>

                  {application.status.toLowerCase() === "rejected" && (
                    <div className="text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span>Your application was not selected for this position</span>
                    </div>
                  )}

                  {application.status.toLowerCase() === "hired" && (
                    <div className="text-green-600 flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Congratulations! You've been hired for this position</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Other Jobs to Explore - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
                             <CardHeader>
                 <CardTitle className="text-lg">Other Jobs to Explore</CardTitle>
                 <CardDescription>Recent job openings from the last 30 days</CardDescription>
               </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingRecentJobs ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : recentJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent jobs available</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentJobs.slice(0, 50).map((job) => (
                        <div
                          key={job._id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-yellow-400"
                          onClick={() => handleViewJobDetails(job._id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{job.jobTitle}</h4>
                            <ExternalLink className="h-4 w-4 text-black flex-shrink-0 ml-2" />
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{job.companyName}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="line-clamp-1">{job.jobLocation}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDate(job.createdAt)}</span>
                            </div>
                            {job.hasApplied && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                Applied
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Fixed "Explore More Jobs" button at bottom */}
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleExploreMoreJobs} 
                        className="w-full bg-black text-white hover:text-black hover:bg-green-600"
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Explore More Jobs
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
