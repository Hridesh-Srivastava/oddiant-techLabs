"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Clock,
  User,
  Building,
  MapPin,
  Video,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Star,
  Globe,
  Headphones,
  Camera,
  FileText,
  Monitor,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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

export default function PublicInterviewJoinPage({ params }: { params: Promise<{ id: string }> }) {
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
        const response = await fetch(`/api/interview/${interviewId}/public`, {
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
          submittedBy: "candidate",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setFeedbackSubmitted(true)
      toast.success("Thank you for your feedback!")
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
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Interview Portal</h3>
          <p className="text-gray-600">Preparing your interview session...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview you are looking for does not exist or has been cancelled.
            </p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Video className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Oddiant Interview Portal</h1>
                <p className="text-gray-600">Professional Interview Platform</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(interview.status)} font-semibold px-4 py-2`}>
              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 border-2 border-gray-300">
                      <AvatarImage src="/placeholder.svg" alt="Company" />
                      <AvatarFallback className="bg-blue-600 text-white text-xl font-semibold">
                        {interview.companyName?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {interview.position}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">
                        {interview.companyName || "Company Interview"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {/* Interview Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Candidate Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Candidate Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="/placeholder.svg" alt={interview.candidate?.name} />
                          <AvatarFallback className="bg-gray-600 text-white">
                            {interview.candidate?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {interview.candidate?.name || "Unknown Candidate"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {interview.candidate?.email || "No email provided"}
                          </p>
                          {interview.candidate?.phone && (
                            <p className="text-sm text-gray-600">{interview.candidate.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                      <Calendar className="h-5 w-5 mr-2 text-green-600" />
                      Schedule Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(interview.date)}</p>
                          <p className="text-sm text-gray-600">Interview Date</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatTime(interview.time)}</p>
                          <p className="text-sm text-gray-600">
                            {interview.duration} minutes duration
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                {interview.companyName && (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                      <Building className="h-5 w-5 mr-2 text-blue-600" />
                      Company Information
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{interview.companyName}</p>
                        {interview.location && (
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1 text-gray-600" />
                            <span className="text-sm text-gray-600">{interview.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {interview.notes && (
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 mb-8">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                      <MessageSquare className="h-5 w-5 mr-2 text-yellow-600" />
                      Important Notes
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                        {interview.notes}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="my-8" />

                {/* Join Meeting Section */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                    <div className="mb-6">
                      <Video className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Join?</h3>
                      <p className="text-gray-600">
                        Click the button below to start your interview session
                      </p>
                    </div>

                    <Button
                      onClick={handleJoinMeeting}
                      disabled={!interview.meetingLink || interview.status === "cancelled"}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Video className="h-6 w-6 mr-3" />
                      Join Interview
                      <ExternalLink className="h-5 w-5 ml-3" />
                    </Button>

                    {!interview.meetingLink && (
                      <p className="text-gray-600 mt-3 text-sm">
                        Meeting link will be available closer to the interview time
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-green-600" />
                  Need Assistance?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interview.employeeEmail && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <a
                        href={`mailto:${interview.employeeEmail}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Contact Interviewer
                      </a>
                      <p className="text-xs text-gray-600">Email Support</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Headphones className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-900 font-medium">Technical Support</span>
                    <p className="text-xs text-gray-600">Available 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Guidelines */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Interview Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-900 font-medium">Join 5 minutes early</span>
                    <p className="text-xs text-gray-600">Be prepared and punctual</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-900 font-medium">
                      Stable internet connection
                    </span>
                    <p className="text-xs text-gray-600">Ensure smooth communication</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Camera className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-900 font-medium">Test camera & microphone</span>
                    <p className="text-xs text-gray-600">Check audio/video quality</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-900 font-medium">Have your resume ready</span>
                    <p className="text-xs text-gray-600">Keep documents accessible</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Monitor className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-900 font-medium">Professional environment</span>
                    <p className="text-xs text-gray-600">Choose a quiet, well-lit space</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post-Interview Feedback */}
            {interview.status === "completed" && (
              <Card className="shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-600" />
                    Interview Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbackSubmitted ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-green-600 font-medium">Thank you for your feedback!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        We appreciate your time and input.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label htmlFor="feedback" className="text-gray-900">
                        How was your interview experience?
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Please share your feedback about the interview process..."
                        className="min-h-[100px] border-gray-300"
                      />
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback || !feedback.trim()}
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
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
