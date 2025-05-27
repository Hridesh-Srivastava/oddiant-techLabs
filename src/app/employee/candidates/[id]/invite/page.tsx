"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, MapPin, Clock, Calendar, Send, Loader2, AlertTriangle } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

interface Job {
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
  companyName: string
  status: "open" | "closed" | "hold"
  applicants: number
  createdAt: string
  daysLeft: number
}

interface Candidate {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
  firstName?: string
  lastName?: string
  salutation?: string
}

export default function InviteCandidateToJobsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const candidateId = React.use(params).id
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [invitingJobs, setInvitingJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/employee/candidates/${candidateId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch candidate details")
        }

        const data = await response.json()
        setCandidate(data.candidate)
      } catch (error) {
        console.error("Error fetching candidate:", error)
        toast.error("Failed to load candidate details")
        router.push("/employee/dashboard?tab=candidates")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchEmployeeJobs = async () => {
      try {
        setIsLoadingJobs(true)
        const response = await fetch("/api/employee/jobs/for-invitation", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch jobs")
        }

        const data = await response.json()
        setJobs(data.jobs || [])
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast.error("Failed to load jobs")
      } finally {
        setIsLoadingJobs(false)
      }
    }

    fetchCandidate()
    fetchEmployeeJobs()
  }, [candidateId, router])

  const handleInviteToJob = async (jobId: string) => {
    if (!candidate) return

    try {
      setInvitingJobs((prev) => new Set(prev).add(jobId))

      const response = await fetch("/api/employee/jobs/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: candidate._id,
          jobId: jobId,
          candidateEmail: candidate.email,
          candidateName: candidate.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send invitation")
      }

      const data = await response.json()
      toast.success(`Invitation sent successfully to ${candidate.name}`)
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setInvitingJobs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "closed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return "N/A"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Loading candidate details</h3>
          <p className="text-gray-500">Please wait while we fetch the information</p>
        </div>
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
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mb-4" />
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidate Profile
        </Button>

        {/* Candidate Info Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={candidate.avatar || "/placeholder.svg?height=64&width=64"} alt={candidate.name} />
                <AvatarFallback className="text-xl">{candidate.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Invite {candidate.salutation ? `${candidate.salutation} ` : ""}
                  {candidate.name} to Jobs
                </h1>
                <p className="text-gray-500 dark:text-gray-400">{candidate.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Your Job Postings
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400">Select jobs to invite {candidate.name} to apply for</p>
          </CardHeader>
          <CardContent>
            {isLoadingJobs ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-500">Loading your job postings...</p>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Job Postings Found</h3>
                <p className="text-gray-500 mb-4">
                  You haven't created any job postings yet. Create a job posting first to invite candidates.
                </p>
                <Button onClick={() => router.push("/employee/dashboard?tab=jobs")}>Create Job Posting</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job._id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold">{job.jobTitle}</h3>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4 mr-2" />
                              {job.jobLocation}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4 mr-2" />
                              {job.experienceRange}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4 mr-2" />
                              Posted {formatDate(job.createdAt)}
                            </div>
                          </div>

                          {job.salaryRange && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Salary:</span> {job.salaryRange}
                            </p>
                          )}

                          {job.department && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Department:</span> {job.department}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>{job.applicants} applicants</span>
                            {job.daysLeft > 0 && <span>{job.daysLeft} days left</span>}
                          </div>

                          {job.skills && job.skills.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-1">
                                {job.skills.slice(0, 5).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <Button
                            onClick={() => handleInviteToJob(job._id)}
                            disabled={invitingJobs.has(job._id) || job.status !== "open"}
                            className="min-w-[120px]"
                          >
                            {invitingJobs.has(job._id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Invite
                              </>
                            )}
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => router.push(`/employee/jobs/${job._id}`)}>
                            View Details
                          </Button>
                        </div>
                      </div>

                      {job.status !== "open" && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              This job is currently {job.status}. Invitations can only be sent for open positions.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
