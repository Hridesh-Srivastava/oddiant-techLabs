"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast, Toaster } from "sonner"
import JobPostingForm from "@/components/job-posting-form"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

export default function AddJobPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (jobData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/employee/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      })

      if (!response.ok) {
        throw new Error("Failed to create job posting")
      }

      const data = await response.json()
      toast.success("Job posting created successfully!")

      // Navigate back to the dashboard after successful submission
      setTimeout(() => {
        router.push("/employee/dashboard?tab=jobs")
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error creating job posting:", error)
      toast.error("Failed to create job posting")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="py-8">
        <Toaster position="top-center" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Job Posting</CardTitle>
            <CardDescription>Fill in the details to create a new job posting</CardDescription>
          </CardHeader>
          <CardContent>
            <JobPostingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
