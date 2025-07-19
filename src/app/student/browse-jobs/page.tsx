"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { Briefcase, Search, MapPin, Clock, Building, Filter, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react"

interface JobPosting {
  _id: string
  jobTitle: string
  jobLocation: string
  experienceRange: string
  jobType: string
  salaryRange: string
  companyName: string
  skills: string[]
  status: string
  createdAt: string
  daysLeft: number
  hasApplied?: boolean
}

export default function BrowseJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [filterJobType, setFilterJobType] = useState("")

  const fetchJobs = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      if (filterLocation) {
        params.append("location", filterLocation)
      }
      if (filterJobType) {
        params.append("jobType", filterJobType)
      }

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        method: "GET",
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

      if (data.success) {
        setJobs(data.jobs || [])
      } else {
        throw new Error(data.message || "Failed to fetch jobs")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("Failed to load jobs. Please try again.")
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [searchTerm, filterLocation, filterJobType])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchJobs()
    setIsRefreshing(false)
    toast.success("Job listings refreshed")
  }

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/student/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.message || "Failed to apply for job")
        return
      }

      const data = await response.json()
      toast.success("Application submitted successfully")

      // Update jobs list to mark this job as applied
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === jobId
            ? {
                ...job,
                hasApplied: true,
              }
            : job,
        ),
      )
    } catch (error) {
      console.error("Error applying for job:", error)
      toast.error("An error occurred while applying for the job")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2" onClick={() => router.push("/student/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Browse Jobs</h1>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Jobs"}
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Latest Job Openings</CardTitle>
            <CardDescription>
              Browse through the latest job opportunities that match your skills and experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search jobs by title, company, or skills..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative w-full md:w-40">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Location"
                      className="pl-10"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full md:w-40">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <select
                      className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
                      value={filterJobType}
                      onChange={(e) => setFilterJobType(e.target.value)}
                    >
                      <option value="">Job Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 border rounded-lg">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Jobs</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No job openings found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterLocation || filterJobType
                    ? "Try adjusting your search filters"
                    : "Check back later for new opportunities"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{job.jobTitle}</h3>
                            <p className="text-gray-600 mb-2">{job.companyName}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.jobLocation}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {job.jobType}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Building className="h-4 w-4 mr-1" />
                                {job.experienceRange}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-50">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills.length > 3 && (
                                <Badge variant="outline" className="bg-gray-50">
                                  +{job.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-2 bg-green-100 text-green-800">{job.daysLeft} days left</Badge>
                            <p className="text-xs text-gray-500">
                              Posted on {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-sm font-medium text-gray-900">
                            {job.salaryRange || "Salary not disclosed"}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push(`/jobs/${job._id}`)}>
                              View Details
                            </Button>
                            {job.hasApplied ? (
                              <Button variant="outline" disabled>
                                Applied
                              </Button>
                            ) : (
                              <Button onClick={() => handleApplyToJob(job._id)}>Apply Now</Button>
                            )}
                          </div>
                        </div>
                      </div>
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
