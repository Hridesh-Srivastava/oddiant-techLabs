"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { toast, Toaster } from "sonner"
import CandidateForm from "@/components/candidate-form"

export default function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Await the params as they're now Promise-based in Next.js 15
  const resolvedParams = use(params)
  const candidateId = resolvedParams.id
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [candidate, setCandidate] = useState<any>(null)

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
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidate()
  }, [candidateId])

  const handleSubmit = async (candidateData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/employee/candidates/${candidateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update candidate")
      }

      toast.success("Candidate updated successfully!")

      // Navigate back to the candidate details page after successful submission
      setTimeout(() => {
        router.push(`/employee/candidates/${candidateId}`)
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error updating candidate:", error)
      toast.error("Failed to update candidate")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium text-gray-700 mb-2">Candidate Not Found</h2>
              <p className="text-gray-500 mb-6">
                The candidate you are trying to edit does not exist or has been removed.
              </p>
              <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={() => router.push("/employee/dashboard?tab=candidates")}>View All Candidates</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidate
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Candidate</CardTitle>
            <CardDescription>Update the candidate's information</CardDescription>
          </CardHeader>
          <CardContent>
            <CandidateForm
              candidateId={candidateId}
              isEditing={true}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}