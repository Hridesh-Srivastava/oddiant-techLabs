"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, LinkIcon } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import { use } from "react"

interface Interview {
  _id: string
  candidateId: string
  candidate: {
    name: string
    role: string
  }
  position: string
  date: string
  time: string
  duration: string
  interviewers: string[]
  meetingLink: string
  notes: string
}

export default function RescheduleInterviewPage({
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
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: "60",
    interviewers: "",
    meetingLink: "",
    notes: "",
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

        // Populate form with existing data
        setFormData({
          date: new Date(data.interview.date).toISOString().split("T")[0],
          time: data.interview.time,
          duration: data.interview.duration || "60",
          interviewers: data.interview.interviewers?.join(", ") || "",
          meetingLink: data.interview.meetingLink || "",
          notes: data.interview.notes || "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.time) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/employee/interviews/${interviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          interviewers: formData.interviewers
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          status: "rescheduled",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reschedule interview")
      }

      toast.success("Interview rescheduled successfully")

      // Navigate back to interview details
      setTimeout(() => {
        router.push(`/employee/interviews/${interviewId}`)
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error rescheduling interview:", error)
      toast.error("Failed to reschedule interview")
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

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <EmployeeNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium text-gray-700 mb-2">Interview Not Found</h2>
              <p className="text-gray-500 mb-6">
                The interview you are trying to reschedule does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/dashboard?tab=interviews")}>View All Interviews</Button>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interview
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Reschedule Interview</CardTitle>
            <CardDescription>
              Reschedule interview with {interview.candidate.name} for {interview.position}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">New Date*</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">New Time*</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewers">Interviewers (comma separated)</Label>
                <Input
                  id="interviewers"
                  name="interviewers"
                  value={formData.interviewers}
                  onChange={handleChange}
                  placeholder="e.g. Person 1, Person 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link (Google Meet/Zoom)</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="meetingLink"
                    name="meetingLink"
                    type="url"
                    value={formData.meetingLink}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about the interview"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:text-black hover:bg-green-600">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Rescheduling...
                    </>
                  ) : (
                    "Reschedule Interview"
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
