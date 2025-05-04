"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Calendar, Download } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApplicantStatus } from "@/components/candidates/applicant-status"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import { Checkbox } from "@/components/ui/checkbox"
import { use } from "react"

interface Applicant {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  appliedDate: string
  avatar?: string
  lastComment?: string
}

interface Job {
  _id: string
  jobTitle: string
  status: string
}

export default function JobApplicantsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const jobId = use(params).id
  const [job, setJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch job details
        const jobResponse = await fetch(`/api/employee/jobs/${jobId}`)
        if (!jobResponse.ok) {
          throw new Error("Failed to fetch job details")
        }
        const jobData = await jobResponse.json()
        setJob(jobData.job)

        // Fetch applicants for this job
        const applicantsResponse = await fetch(`/api/employee/jobs/${jobId}/applicants`)
        if (!applicantsResponse.ok) {
          throw new Error("Failed to fetch applicants")
        }
        const applicantsData = await applicantsResponse.json()
        setApplicants(applicantsData.applicants)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [jobId])

  const filteredApplicants = applicants.filter(
    (applicant) =>
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectApplicant = (applicantId: string) => {
    setSelectedApplicants((prev) => {
      if (prev.includes(applicantId)) {
        return prev.filter((id) => id !== applicantId)
      } else {
        return [...prev, applicantId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedApplicants.length === filteredApplicants.length) {
      // If all are selected, deselect all
      setSelectedApplicants([])
    } else {
      // Otherwise, select all
      setSelectedApplicants(filteredApplicants.map((applicant) => applicant._id))
    }
  }

  const downloadExcel = async () => {
    if (selectedApplicants.length === 0) {
      toast.error("Please select at least one applicant")
      return
    }

    try {
      setIsDownloading(true)
      toast.info("Preparing Excel file for download...")

      const response = await fetch(`/api/employee/jobs/${jobId}/applicants/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantIds: selectedApplicants,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to download applicants data")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const a = document.createElement("a")
      a.href = url
      a.download = `applicants-${job?.jobTitle || jobId}-${new Date().toISOString().split("T")[0]}.xlsx`

      // Append to the document, click it, and remove it
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Successfully downloaded data for ${selectedApplicants.length} applicant(s)`)
    } catch (error) {
      console.error("Error downloading applicants data:", error)
      toast.error("Failed to download applicants data")
    } finally {
      setIsDownloading(false)
    }
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
        <EmployeeNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Job Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push(`/employee/jobs/${jobId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Details
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applicants for {job.jobTitle}</CardTitle>
                <CardDescription>
                  {filteredApplicants.length} {filteredApplicants.length === 1 ? "applicant" : "applicants"} found
                  {selectedApplicants.length > 0 && ` (${selectedApplicants.length} selected)`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={downloadExcel}
                  disabled={isDownloading || selectedApplicants.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download in Excel"}
                </Button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Search applicants..."
                    className="pl-8 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredApplicants.length > 0 ? (
              <div className="rounded-md border dark:border-gray-700">
                <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Checkbox
                      id="select-all"
                      checked={selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="mr-2"
                    />
                    <label htmlFor="select-all" className="text-xs cursor-pointer">
                      {selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </label>
                  </div>
                  <div className="col-span-2">Applicant</div>
                  <div>Status</div>
                  <div>Applied Date</div>
                  <div className="col-span-2">Comments</div>
                  <div className="text-right">Actions</div>
                </div>

                {filteredApplicants.map((applicant) => (
                  <div key={applicant._id} className="grid grid-cols-8 border-t dark:border-gray-700 p-3 items-center">
                    <div className="flex items-center">
                      <Checkbox
                        id={`select-${applicant._id}`}
                        checked={selectedApplicants.includes(applicant._id)}
                        onCheckedChange={() => handleSelectApplicant(applicant._id)}
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={applicant.avatar || "/placeholder.svg?height=32&width=32"}
                          alt={applicant.name}
                        />
                        <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{applicant.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{applicant.email}</p>
                      </div>
                    </div>
                    <div>
                      <ApplicantStatus applicantId={applicant._id} currentStatus={applicant.status} jobId={jobId} />
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{applicant.appliedDate}</div>
                    <div className="col-span-2 truncate text-sm">
                      {applicant.lastComment ? (
                        <p className="text-gray-600 dark:text-gray-300 italic">{applicant.lastComment}</p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500">No comments yet</p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/employee/candidates/${applicant._id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/employee/interviews/schedule?candidateId=${applicant._id}`)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No applicants found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {searchTerm ? "Try a different search term" : "No one has applied to this job yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
