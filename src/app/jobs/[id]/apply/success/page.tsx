"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft, Home } from "lucide-react"
import { use } from "react"

export default function ApplicationSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const resolvedParams = use(params)
  const router = useRouter()
  const jobId = resolvedParams.id
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [applicationType, setApplicationType] = useState<"new" | "existing">("new")

  useEffect(() => {
    // Check if this was a quick sign-in application
    const checkApplicationType = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const type = urlParams.get("type")
      if (type === "existing") {
        setApplicationType("existing")
      }
    }

    checkApplicationType()

    const fetchJob = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/jobs/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data.job)
        }
      } catch (error) {
        console.error("Error fetching job:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle className="text-2xl">Application Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for applying to {job?.jobTitle || "the position"} at {job?.companyName || "our company"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              {applicationType === "existing" ? (
                <p>
                  We have received your application using your existing profile. Your application has been automatically
                  submitted for this position.
                </p>
              ) : (
                <p>We have received your application and will review it shortly.</p>
              )}
              <p className="mt-2">
                If your qualifications match our requirements, our recruitment team will contact you for the next steps.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => router.push(`/jobs/${jobId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job
              </Button>
              <Button onClick={() => router.push("/")}>
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
