"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, Clock, ArrowUpRight } from "lucide-react"
import { toast, Toaster } from "sonner"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

interface Interview {
  _id: string
  candidateId: string
  candidate?: {
    name: string
    email: string
  }
  position: string
  date: string
  time: string
  status: string
}

export default function InterviewsPage() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/employee/interviews", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch interviews")
      }

      const data = await response.json()

      // Filter and sort interviews by date - only future interviews
      const now = new Date()
      const filteredInterviews = data.interviews
        .filter((interview: Interview) => {
          const interviewDate = new Date(interview.date)
          return interviewDate >= now && interview.status !== "cancelled" && interview.status !== "expired"
        })
        .sort((a: Interview, b: Interview) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })

      setInterviews(filteredInterviews)
    } catch (error) {
      console.error("Error fetching interviews:", error)
      toast.error("Failed to load interviews")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  // Filter interviews for today's interviews
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayInterviews = interviews.filter((interview) => {
    const interviewDate = new Date(interview.date)
    interviewDate.setHours(0, 0, 0, 0)
    return interviewDate.getTime() === today.getTime()
  })

  // Filter interviews for upcoming interviews (future dates only)
  const upcomingInterviews = interviews.filter((interview) => {
    const interviewDate = new Date(interview.date)
    interviewDate.setHours(0, 0, 0, 0)
    return interviewDate.getTime() >= tomorrow.getTime()
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <EmployeeNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Interviews</h1>
          <Button onClick={() => router.push("/employee/interviews/schedule")}>Schedule Interview</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Today's Interviews */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Today's Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                {todayInterviews.length > 0 ? (
                  <div className="space-y-4">
                    {todayInterviews.map((interview) => (
                      <div
                        key={interview._id}
                        className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div>
                            <h3 className="font-medium">{interview.position}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {interview.candidate?.name || "Unknown Candidate"} · {interview.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employee/interviews/${interview._id}`)}
                          >
                            Details
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/employee/interviews/${interview._id}/join`)}>
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No interviews scheduled for today
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">Schedule an interview to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Interviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <div
                        key={interview._id}
                        onClick={() => router.push(`/employee/interviews/${interview._id}`)}
                        className="flex items-start border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                          <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div className="flex-1 mr-4">
                          <h3 className="font-medium mb-1">{interview.position}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {interview.candidate?.name || "Unknown Candidate"}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(interview.date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {interview.time}
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No upcoming interviews
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">Schedule an interview to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
