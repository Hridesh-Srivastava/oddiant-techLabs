"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { use } from "react"

interface Interview {
  _id: string
  candidateId: string
  candidate: {
    name: string
    role: string
  }
}

export default function InterviewFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  // Await the params as they're now Promise-based in Next.js 15
  const resolvedParams = use(params)
  const interviewId = resolvedParams.id
  const [interview, setInterview] = useState<Interview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [formData, setFormData] = useState({
    strengths: "",
    weaknesses: "",
    recommendation: "",
  })

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/employee/interviews/${interviewId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch interview details")
        }

        const data = await response.json()
        setInterview(data.interview)
      } catch (error) {
        console.error("Error fetching interview:", error)
        toast.error("Failed to load interview details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInterview()
  }, [interviewId])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please provide a rating")
      return
    }

    if (!formData.strengths || !formData.weaknesses || !formData.recommendation) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/employee/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      toast.success("Feedback submitted successfully!")

      // Redirect back to interview details after a short delay
      setTimeout(() => {
        router.push(`/employee/interviews/${interviewId}`)
      }, 1500)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Interview Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The interview you are trying to provide feedback for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/dashboard?tab=interviews")}>View All Interviews</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push(`/employee/interviews/${interviewId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interview
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Interview Feedback</CardTitle>
            <CardDescription>
              Provide feedback for {interview.candidate.name}'s interview for the {interview.candidate.role} position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer ${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {rating > 0 ? `${rating} out of 5` : "Select a rating"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengths">
                  Strengths <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="strengths"
                  name="strengths"
                  value={formData.strengths}
                  onChange={handleInputChange}
                  placeholder="What were the candidate's strengths?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weaknesses">
                  Areas for Improvement <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="weaknesses"
                  name="weaknesses"
                  value={formData.weaknesses}
                  onChange={handleInputChange}
                  placeholder="What areas could the candidate improve on?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendation">
                  Recommendation <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="recommendation"
                  name="recommendation"
                  value={formData.recommendation}
                  onChange={handleInputChange}
                  placeholder="Would you recommend hiring this candidate? Why or why not?"
                  rows={3}
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Submitting Feedback...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
