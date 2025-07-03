"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast, Toaster } from "sonner"
import { AddCandidateForm } from "@/components/candidates/add-candidate-form"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

interface JobOption {
  id: string
  title: string
  location: string
}

export default function AddCandidatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<JobOption[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/employee/jobs")

        if (!response.ok) {
          throw new Error("Failed to fetch jobs")
        }

        const data = await response.json()

        // Format jobs for the dropdown
        const formattedJobs = data.jobs.map((job: any) => ({
          id: job._id,
          title: job.jobTitle,
          location: job.jobLocation || "",
        }))

        setJobs(formattedJobs)
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast.error("Failed to load jobs")
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add New Candidate</CardTitle>
            <CardDescription>Invite candidates to apply for open positions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <AddCandidateForm jobs={jobs} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
