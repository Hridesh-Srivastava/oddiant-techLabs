"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Video,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Star,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import { use } from "react"

interface Interview {
  _id: string
  candidateId: string
  candidate?: {
    name: string
    email: string
    phone?: string
  }
  position: string
  date: string
  time: string
  duration: number
  meetingLink?: string
  notes?: string
  status: string
  location?: string
  companyName?: string
  employeeName?: string
  employeeEmail?: string
}

export default function EmployeeInterviewJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const interviewId = unwrappedParams.id
  const router = useRouter()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/employee/interviews/${interviewId}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Kolkata",
      })
    } catch (error) {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "Time not specified"
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm} IST`
    } catch (error) {
      return `${timeString} IST`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleJoinMeeting = () => {
    if (interview?.meetingLink) {
      window.open(interview.meetingLink, "_blank", "noopener,noreferrer")
    } else {
      toast.error("Meeting link not available")
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide your feedback")
      return
    }

    try {
      setIsSubmittingFeedback(true)
      const response = await fetch(`/api/interview/${interviewId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          submittedBy: "interviewer",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setFeedbackSubmitted(true)
      toast.success("Feedback submitted successfully!")
      setFeedback("")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Loading interview details</h3>
          <p className="text-gray-500">Please wait while we fetch your information</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <EmployeeNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>

          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 mb-2">Interview Not Found</h2>
              <p className="text-gray-500 mb-6 text-center">
                The interview you are looking for does not exist or has been cancelled.
              </p>
              <Button onClick={() => router.push("/employee/interviews")}>Back to Interviews</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Interview Session</CardTitle>
                    <p className="text-blue-100 mt-1">
                      Interview with {interview.candidate?.name || "Candidate"} for {interview.position}
                    </p>
                  </div>
                  <Badge className={getStatusColor(interview.status)}>
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Candidate Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Candidate
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.candidate?.name || "Unknown Candidate"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.candidate?.email || "No email provided"}
                        </p>
                        {interview.candidate?.phone && (
                          <p className="text-sm text-gray-500">{interview.candidate.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Date & Time
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{formatDate(interview.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{formatTime(interview.time)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Duration: {interview.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {interview.notes && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Notes</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-700 whitespace-pre-line">{interview.notes}</p>
                    </div>
                  </div>
                )}

                {/* Join Meeting Button */}
                <div className="text-center">
                  <Button
                    onClick={handleJoinMeeting}
                    disabled={!interview.meetingLink || interview.status === "cancelled"}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Join Meeting
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  {!interview.meetingLink && (
                    <p className="text-sm text-gray-500 mt-2">
                      Meeting link will be available closer to the interview time
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/employee/interviews/${interviewId}`)}
                >
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/employee/candidates/${interview.candidateId}`)}
                >
                  View Candidate Profile
                </Button>
              </CardContent>
            </Card>

            {/* Post-Interview Feedback - Only for completed interviews */}
            {interview.status === "completed" && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Interview Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbackSubmitted ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">Feedback submitted successfully!</p>
                      <p className="text-sm text-gray-500 mt-1">Thank you for your input.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label htmlFor="feedback">How did the interview go?</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Please share your feedback about the candidate and interview process..."
                        className="min-h-[100px]"
                      />
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback || !feedback.trim()}
                        className="w-full"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Submit Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
