"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Video,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
  MessageSquare,
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { use } from "react"

interface Interview {
  _id: string
  candidateId: string
  candidate?: {
    _id: string
    name: string
    email: string
    phone?: string
    role?: string
    status?: string
    avatar?: string
  }
  job?: {
    _id: string
    jobTitle: string
  }
  position: string
  date: string
  time: string
  duration: number
  interviewers: string[]
  meetingLink?: string
  notes?: string
  status: string
  location?: string
  feedback?: Array<{
    _id: string
    feedback: string
    submittedBy: string
    submittedAt: string
  }>
  scheduledBy: string
  employeeId: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export default function InterviewDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const interviewId = unwrappedParams.id
  const router = useRouter()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    duration: 60,
    meetingLink: "",
    notes: "",
    status: "scheduled",
  })

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

        // Initialize edit form
        const interviewDate = new Date(data.interview.date)
        const dateString = interviewDate.toISOString().split("T")[0]

        setEditForm({
          date: dateString,
          time: data.interview.time || "",
          duration: data.interview.duration || 60,
          meetingLink: data.interview.meetingLink || "",
          notes: data.interview.notes || "",
          status: data.interview.status || "scheduled",
        })
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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form to original values
    if (interview) {
      const interviewDate = new Date(interview.date)
      const dateString = interviewDate.toISOString().split("T")[0]

      setEditForm({
        date: dateString,
        time: interview.time || "",
        duration: interview.duration || 60,
        meetingLink: interview.meetingLink || "",
        notes: interview.notes || "",
        status: interview.status || "scheduled",
      })
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Determine if this is a reschedule
      const isReschedule =
        editForm.date !== new Date(interview!.date).toISOString().split("T")[0] || editForm.time !== interview!.time

      const updateData = {
        ...editForm,
        status: isReschedule ? "rescheduled" : editForm.status,
      }

      const response = await fetch(`/api/employee/interviews/${interviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update interview")
      }

      // Refresh interview data
      const updatedResponse = await fetch(`/api/employee/interviews/${interviewId}`, {
        cache: "no-store",
      })
      const updatedData = await updatedResponse.json()
      setInterview(updatedData.interview)

      setIsEditing(false)
      toast.success(isReschedule ? "Interview rescheduled successfully" : "Interview updated successfully")
    } catch (error) {
      console.error("Error updating interview:", error)
      toast.error("Failed to update interview")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/employee/interviews/${interviewId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete interview")
      }

      toast.success("Interview deleted successfully")
      router.push("/employee/interviews")
    } catch (error) {
      console.error("Error deleting interview:", error)
      toast.error("Failed to delete interview")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleJoinMeeting = () => {
    if (interview?.meetingLink) {
      window.open(interview.meetingLink, "_blank", "noopener,noreferrer")
    } else {
      toast.error("Meeting link not available")
    }
  }

  const getPublicInterviewUrl = () => {
    return `${window.location.origin}/interview/${interviewId}/join`
  }

  const copyPublicLink = () => {
    navigator.clipboard.writeText(getPublicInterviewUrl())
    toast.success("Public interview link copied to clipboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Loading interview details</h3>
          <p className="text-gray-500">Please wait while we fetch the information</p>
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

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 mb-2">Interview Not Found</h2>
              <p className="text-gray-500 mb-6">
                The interview you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/interviews")}>View All Interviews</Button>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Details Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{interview.position}</CardTitle>
                  <p className="text-gray-500 mt-1">
                    Interview with {interview.candidate?.name || "Unknown Candidate"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(interview.status)}>
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </Badge>
                  {!isEditing && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleEdit} className="bg-black text-white hover:text-black hover:bg-green-600">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting} className="bg-red-600 text-white hover:bg-red-500 hover:text-white">
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={editForm.time}
                          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm({ ...editForm, duration: Number.parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="meetingLink">Meeting Link</Label>
                      <Input
                        id="meetingLink"
                        value={editForm.meetingLink}
                        onChange={(e) => setEditForm({ ...editForm, meetingLink: e.target.value })}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Additional notes for the interview..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving} className="bg-black text-white hover:text-black hover:bg-green-600">
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="space-y-6">
                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-gray-600">{formatDate(interview.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="font-medium">Time</p>
                          <p className="text-gray-600">
                            {formatTime(interview.time)} ({interview.duration} minutes)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Link */}
                    {interview.meetingLink && (
                      <div>
                        <p className="font-medium mb-2">Meeting Link</p>
                        <div className="flex items-center space-x-2">
                          <Button onClick={handleJoinMeeting} className="flex-1 bg-black text-white hover:text-black hover:bg-green-600">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Public Interview Link */}
                    <div>
                      <p className="font-medium mb-2">Candidate Interview Link</p>
                      <div className="flex items-center space-x-2">
                        <Input value={getPublicInterviewUrl()} readOnly className="flex-1" />
                        <Button variant="outline" onClick={copyPublicLink}>
                          Copy Link
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Share this link with the candidate to join the interview
                      </p>
                    </div>

                    {/* Notes */}
                    {interview.notes && (
                      <div>
                        <p className="font-medium mb-2">Notes</p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="whitespace-pre-line">{interview.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Section - FIXED: Only show for completed interviews */}
            {interview.status === "completed" && interview.feedback && interview.feedback.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Interview Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interview.feedback.map((feedback) => (
                      <div key={feedback._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-2" />
                            <span className="font-medium">
                              {feedback.submittedBy === "candidate" ? "Candidate Feedback" : "Interviewer Feedback"}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(feedback.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line">{feedback.feedback}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent>
                {interview.candidate ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={interview.candidate.avatar || "/placeholder.svg"}
                          alt={interview.candidate.name}
                        />
                        <AvatarFallback>{interview.candidate.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{interview.candidate.name}</h3>
                        <p className="text-sm text-gray-500">{interview.candidate.role}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{interview.candidate.email}</span>
                      </div>
                      {interview.candidate.phone && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">{interview.candidate.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Badge className={getStatusColor(interview.candidate.status || "applied")}>
                          {interview.candidate.status || "Applied"}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/employee/candidates/${interview.candidate?._id}`)}
                    >
                      View Full Profile
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">Candidate information not available</p>
                )}
              </CardContent>
            </Card>

            {/* Job Information */}
            {interview.job && (
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{interview.job.jobTitle}</p>
                      <p className="text-sm text-gray-500">Position</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/employee/jobs/${interview.job?._id}`)}
                    >
                      View Job Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-black text-white hover:text-black hover:bg-green-600"
                  onClick={() => router.push(`/employee/candidates/${interview.candidateId}/contact`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Contact Candidate
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/employee/interviews/schedule?candidateId=${interview.candidateId}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Another Interview
                </Button>
                {interview.meetingLink && (
                  <Button className="w-full justify-start bg-black text-white hover:text-black hover:bg-green-600" onClick={handleJoinMeeting}>
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Interview Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Interview Scheduled</p>
                      <p className="text-xs text-gray-500">{new Date(interview.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {interview.status === "rescheduled" && (
                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-2 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Interview Rescheduled</p>
                        <p className="text-xs text-gray-500">{new Date(interview.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {interview.status === "completed" && (
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Interview Completed</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(interview.date)} at {formatTime(interview.time)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
