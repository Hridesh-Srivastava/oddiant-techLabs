"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { ArrowLeft, Mail, CheckCircle, XCircle, AlertCircle, Download, Send, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

interface CandidateData {
  _id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  updatedAt?: string
  testsAssigned: number
  testsCompleted: number
  averageScore: number
}

interface TestData {
  _id: string
  name: string
  description: string
  type: string
  duration: number
  passingScore: number
}

interface InvitationData {
  _id: string
  testId: string
  testName: string
  status: string
  createdAt: string
  expiresAt: string
  completedAt?: string
  email: string
  token: string
}

interface ResultData {
  _id: string
  testId: string
  testName: string
  score: number
  status: string
  duration: number
  completionDate: string
  resultsDeclared: boolean
  candidateEmail: string
  candidateName: string
  answers?: {
    questionId: string
    answer: string | string[]
    isCorrect: boolean
    points: number
  }[]
}

interface VerificationData {
  _id: string
  invitationId: string
  candidateEmail: string
  idCardImageUrl?: string
  faceImageUrl?: string
  createdAt: string
  updatedAt: string
}

export default function CandidateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [candidate, setCandidate] = useState<CandidateData | null>(null)
  const [availableTests, setAvailableTests] = useState<TestData[]>([])
  const [invitations, setInvitations] = useState<InvitationData[]>([])
  const [results, setResults] = useState<ResultData[]>([])
  const [verifications, setVerifications] = useState<VerificationData[]>([])

  // Pagination state for tabs
  const [invPage, setInvPage] = useState(1);
  const [resPage, setResPage] = useState(1);
  const [verPage, setVerPage] = useState(1);
  const perPage = 8;
  const invTotalPages = Math.ceil(invitations.length / perPage);
  const resTotalPages = Math.ceil(results.length / perPage);
  const verTotalPages = Math.ceil(verifications.length / perPage);
  const paginatedInvitations = invitations.slice((invPage - 1) * perPage, invPage * perPage);
  const paginatedResults = results.slice((resPage - 1) * perPage, resPage * perPage);
  const paginatedVerifications = verifications.slice((verPage - 1) * perPage, verPage * perPage);

  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)

  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<VerificationData | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetails()
    }
  }, [candidateId])

  useEffect(() => {
    if (candidate?.email) {
      fetchAvailableTests()
      fetchInvitations()
      fetchResults()
      fetchVerifications()
    }
  }, [candidate?.email])

  const fetchCandidateDetails = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching candidate details for ID:", candidateId)

      // Get email from URL params if available
      const searchParams = new URLSearchParams(window.location.search)
      const emailFromUrl = searchParams.get('email')

      const response = await fetch(`/api/assessment/candidates/${candidateId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      // If candidate not found by ID and we have email, try to create/find by email
      if (!response.ok && response.status === 404 && emailFromUrl) {
        console.log("Candidate not found by ID, trying to find by email:", emailFromUrl)
        
        // Try to find student by email
        const studentResponse = await fetch(`/api/students?email=${emailFromUrl}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache", 
            Expires: "0",
          },
        })

        if (studentResponse.ok) {
          const studentData = await studentResponse.json()
          if (studentData.success && studentData.students && studentData.students.length > 0) {
            const student = studentData.students[0]
            // Create a candidate object from student data
            setCandidate({
              _id: student._id,
              name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email.split('@')[0],
              email: student.email,
              phone: student.phone,
              status: 'Student',
              createdAt: student.createdAt || new Date().toISOString(),
              testsAssigned: 0,
              testsCompleted: 0,
              averageScore: 0
            })
            console.log("Candidate created from student data:", student)
            return
          }
        }
        
        // If no student found, create a basic candidate object
        setCandidate({
          _id: candidateId,
          name: emailFromUrl.split('@')[0],
          email: emailFromUrl,
          status: 'Unknown',
          createdAt: new Date().toISOString(),
          testsAssigned: 0,
          testsCompleted: 0,
          averageScore: 0
        })
        console.log("Created basic candidate from email:", emailFromUrl)
        return
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.log("Candidate not found (404)")
          setCandidate(null)
          return
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch candidate details`)
      }

      const data = await response.json()
      console.log("Candidate API response:", data)

      if (data.success && data.candidate) {
        setCandidate(data.candidate)
        console.log("Candidate set:", data.candidate)
      } else {
        console.log("API returned success=false or no candidate")
        setCandidate(null)
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error)
      toast.error("Failed to load candidate details. Please try again.")
      setCandidate(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableTests = async () => {
    try {
      console.log("Fetching available tests...")
      const response = await fetch("/api/assessment/tests?status=Active", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch available tests")
      }

      const data = await response.json()
      console.log("Tests API response:", data)

      if (data.success) {
        setAvailableTests(data.tests || [])
      } else {
        throw new Error(data.message || "Failed to fetch available tests")
      }
    } catch (error) {
      console.error("Error fetching available tests:", error)
      toast.error("Failed to load available tests. Please try again.")
    }
  }

  const fetchInvitations = async () => {
    try {
      if (!candidate?.email) {
        console.log("No candidate email available for fetching invitations")
        return
      }

      console.log("Fetching invitations for email:", candidate.email)
      const response = await fetch("/api/assessment/invitations", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }

      const data = await response.json()
      console.log("Invitations API response:", data)

      if (data.success) {
        // Filter invitations by candidate email
        const candidateInvitations = (data.invitations || []).filter(
          (inv: InvitationData) => inv.email === candidate.email,
        )
        console.log("Filtered invitations:", candidateInvitations)
        setInvitations(candidateInvitations)
      } else {
        throw new Error(data.message || "Failed to fetch invitations")
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast.error("Failed to load invitations. Please try again.")
    }
  }

  const fetchResults = async () => {
    try {
      if (!candidate?.email) {
        console.log("No candidate email available for fetching results")
        return
      }

      console.log("Fetching results for email:", candidate.email)
      const response = await fetch("/api/assessment/results", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch results")
      }

      const data = await response.json()
      console.log("Results API response:", data)

      if (data.success) {
        // Filter results by candidate email
        const candidateResults = (data.results || []).filter(
          (result: ResultData) => result.candidateEmail === candidate.email,
        )
        console.log("Filtered results:", candidateResults)
        setResults(candidateResults)
      } else {
        throw new Error(data.message || "Failed to fetch results")
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      toast.error("Failed to load results. Please try again.")
    }
  }

  const fetchVerifications = async () => {
    try {
      if (!candidate?.email) {
        console.log("No candidate email available for fetching verifications")
        return
      }

      console.log("Fetching verifications for email:", candidate.email)
      const encodedEmail = encodeURIComponent(candidate.email)
      const response = await fetch(`/api/assessment/verifications/by-email/${encodedEmail}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        console.log("Verifications API failed:", response.status, response.statusText)
        // Don't throw error for verifications as it's not critical
        setVerifications([])
        return
      }

      const data = await response.json()
      console.log("Verifications API response:", data)

      if (data.success) {
        setVerifications(data.verifications || [])
      } else {
        console.log("Verifications API returned error:", data.message)
        setVerifications([])
      }
    } catch (error) {
      console.error("Error fetching verifications:", error)
      // Don't show error toast for verifications as it's not critical
      setVerifications([])
    }
  }

  const handleSendInvitation = async () => {
    if (!selectedTest || !candidate) {
      toast.error("Please select a test")
      return
    }

    try {
      setIsSendingInvitation(true)

      const response = await fetch("/api/assessment/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest,
          emails: [candidate.email],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Invitation sent successfully")
        setShowInviteDialog(false)
        setSelectedTest(null)
        fetchInvitations() // Refresh invitations
        fetchCandidateDetails() // Refresh candidate stats
      } else {
        throw new Error(data.message || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error((error as Error).message || "Failed to send invitation")
    } finally {
      setIsSendingInvitation(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      const response = await fetch(`/api/assessment/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to resend invitation")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Invitation resent successfully")
        fetchInvitations() // Refresh invitations
      } else {
        throw new Error(data.message || "Failed to resend invitation")
      }
    } catch (error) {
      console.error("Error resending invitation:", error)
      toast.error((error as Error).message || "Failed to resend invitation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      const response = await fetch(`/api/assessment/invitations/${invitationId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to cancel invitation")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Invitation cancelled successfully")
        fetchInvitations() // Refresh invitations
        fetchCandidateDetails() // Refresh candidate stats
      } else {
        throw new Error(data.message || "Failed to cancel invitation")
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error)
      toast.error((error as Error).message || "Failed to cancel invitation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclareResult = async (resultId: string) => {
    try {
      setActionLoading(resultId)
      const response = await fetch(`/api/assessment/results/${resultId}/declare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to declare result")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Result declared and email sent to candidate")
        fetchResults() // Refresh results
        fetchCandidateDetails() // Refresh candidate stats
      } else {
        throw new Error(data.message || "Failed to declare result")
      }
    } catch (error) {
      console.error("Error declaring result:", error)
      toast.error((error as Error).message || "Failed to declare result")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadResult = async (resultId: string) => {
    try {
      setActionLoading(resultId)
      const response = await fetch(`/api/assessment/results/${resultId}/download`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download result")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get("content-disposition")
      let filename = `assessment-result-${resultId}.xlsx`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Excel file downloaded successfully!")
    } catch (error) {
      console.error("Error downloading result:", error)
      toast.error("Failed to download result. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const viewVerification = (verification: VerificationData) => {
    setSelectedVerification(verification)
    setShowVerificationDialog(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "Active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Expired":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "Cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      case "Passed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "Invited":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Add this handler
  const handleDownloadAllResults = async () => {
    if (!candidate?.email || results.length === 0) return;
    try {
      setActionLoading('download-all');
      const response = await fetch(`/api/assessment/results/download-all?candidateEmail=${encodeURIComponent(candidate.email)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      if (!response.ok) throw new Error('Failed to download all results');
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `all-results-${candidate.email}.xlsx`;
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 100);
      toast.success('All results downloaded as Excel!');
    } catch (error) {
      console.error('Error downloading all results:', error);
      toast.error('Failed to download all results.');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="container mx-auto py-6">
          <Toaster position="top-center" />
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4 text-black" asChild>
            <Link href="/employee/assessment/candidates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invitations">
          <TabsList>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </Tabs>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="container mx-auto py-6">
          <Toaster position="top-center" />
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4 text-black" asChild>
            <Link href="/employee/assessment/candidates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Candidate Not Found</h1>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-medium mb-2">The requested candidate could not be found</h2>
            <p className="text-muted-foreground mb-6">
              The candidate may have been deleted or you may not have permission to view it.
            </p>
            <Button asChild className="bg-black text-white hover:text-black hover:bg-green-600">
              <Link href="/employee/assessment/candidates">View All Candidates</Link>
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-4 text-black" asChild>
            <Link href="/employee/assessment/candidates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{candidate.name || candidate.email}</h1>
            <p className="text-muted-foreground">{candidate.email}</p>
            <div className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              ID: {candidate._id}
            </div>
          </div>
        </div>
        <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={() => setShowInviteDialog(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Invite to Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{candidate.testsAssigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{candidate.testsCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{candidate.averageScore}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invitations">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Invitations</CardTitle>
              <CardDescription>View and manage all test invitations sent to {candidate.name || candidate.email}.</CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length > 0 ? (
                <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sent</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Expires</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvitations.map((invitation) => (
                        <tr key={invitation._id} className="border-t hover:bg-muted/30">
                          <td className="py-3 px-4">{invitation.testName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getStatusColor(invitation.status)}>
                              {invitation.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{formatDate(invitation.createdAt)}</td>
                          <td className="py-3 px-4">{formatDate(invitation.expiresAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {invitation.status === "Pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResendInvitation(invitation._id)}
                                    disabled={actionLoading === invitation._id}
                                  >
                                    {actionLoading === invitation._id ? (
                                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Resend
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelInvitation(invitation._id)}
                                    disabled={actionLoading === invitation._id}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {invitation.status === "Completed" && (
                                (() => {
                                  // Find the result for this invitation
                                  const matchingResult = results.find(
                                    (r) => r.testId === invitation.testId && r.candidateEmail === invitation.email
                                  );
                                  return matchingResult ? (
                                    <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" asChild>
                                      <Link href={`/employee/assessment/results/${matchingResult._id}`}>
                                        View Result
                                      </Link>
                                    </Button>
                                  ) : (
                                    <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" disabled>
                                      View Result
                                    </Button>
                                  );
                                })()
                              )}
                              {invitation.status === "Cancelled" && (
                                <span className="text-sm text-muted-foreground">Cancelled</span>
                              )}
                              {invitation.status === "Expired" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendInvitation(invitation._id)}
                                  disabled={actionLoading === invitation._id}
                                >
                                  {actionLoading === invitation._id ? (
                                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                  )}
                                  Resend
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls for Invitations */}
                {invTotalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                      disabled={invPage === 1}
                    >
                      <span className="flex items-center"><svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Previous</span>
                    </Button>
                    {Array.from({ length: invTotalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setInvPage(pageNum)}
                        className={
                          pageNum === invPage
                            ? "bg-black text-white hover:bg-green-600 hover:text-black"
                            : "hover:bg-green-600 hover:text-black"
                        }
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))}
                      disabled={invPage === invTotalPages}
                    >
                      <span className="flex items-center">Next<svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span>
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Invitations Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't sent any test invitations to this candidate yet.
                  </p>
                  <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={() => setShowInviteDialog(true)}>Invite to Test</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>View all test results for {candidate.name || candidate.email}.</CardDescription>
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllResults}
                  disabled={results.length === 0 || actionLoading === 'download-all'}
                  className="flex items-center gap-2 bg-green-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {actionLoading === 'download-all' ? 'Downloading...' : 'Download All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completed</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((result) => (
                        <tr key={result._id} className="border-t hover:bg-muted/30">
                          <td className="py-3 px-4">{result.testName}</td>
                          <td className="py-3 px-4">{result.score}%</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{result.duration} min</td>
                          <td className="py-3 px-4">{formatDate(result.completionDate)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-black text-white hover:text-black hover:bg-green-600"
                                asChild
                              >
                                <Link href={`/employee/assessment/results/${result._id}`}>
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadResult(result._id)}
                                disabled={actionLoading === result._id}
                                className="text-white bg-green-600"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              {!result.resultsDeclared && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeclareResult(result._id)}
                                  disabled={actionLoading === result._id}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Declare
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls for Results */}
                {resTotalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResPage((p) => Math.max(1, p - 1))}
                      disabled={resPage === 1}
                    >
                      <span className="flex items-center"><svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Previous</span>
                    </Button>
                    {Array.from({ length: resTotalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setResPage(pageNum)}
                        className={
                          pageNum === resPage
                            ? "bg-black text-white hover:bg-green-600 hover:text-black"
                            : "hover:bg-green-600 hover:text-black"
                        }
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResPage((p) => Math.min(resTotalPages, p + 1))}
                      disabled={resPage === resTotalPages}
                    >
                      <span className="flex items-center">Next<svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span>
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground mb-4">This candidate hasn't completed any tests yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Verifications</CardTitle>
              <CardDescription>View all verifications for {candidate.name || candidate.email}.</CardDescription>
            </CardHeader>
            <CardContent>
              {verifications.length > 0 ? (
                <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID Card</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Face</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Updated</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVerifications.map((verification) => (
                        <tr key={verification._id} className="border-t hover:bg-muted/30">
                          <td className="py-3 px-4">
                            {verification.idCardImageUrl ? (
                              <a href={verification.idCardImageUrl} target="_blank" rel="noopener noreferrer">
                                <img src={verification.idCardImageUrl} alt="ID Card" className="h-12 rounded" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {verification.faceImageUrl ? (
                              <a href={verification.faceImageUrl} target="_blank" rel="noopener noreferrer">
                                <img src={verification.faceImageUrl} alt="Face" className="h-12 rounded-full" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">{formatDate(verification.createdAt)}</td>
                          <td className="py-3 px-4">{formatDate(verification.updatedAt)}</td>
                          <td className="py-3 px-4">
                            <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" onClick={() => viewVerification(verification)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls for Verifications */}
                {verTotalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerPage((p) => Math.max(1, p - 1))}
                      disabled={verPage === 1}
                    >
                      <span className="flex items-center"><svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Previous</span>
                    </Button>
                    {Array.from({ length: verTotalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setVerPage(pageNum)}
                        className={
                          pageNum === verPage
                            ? "bg-black text-white hover:bg-green-600 hover:text-black"
                            : "hover:bg-green-600 hover:text-black"
                        }
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerPage((p) => Math.min(verTotalPages, p + 1))}
                      disabled={verPage === verTotalPages}
                    >
                      <span className="flex items-center">Next<svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span>
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Verifications Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    This candidate hasn't submitted any ID verifications yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Test</DialogTitle>
            <DialogDescription>
              Send a test invitation to {candidate.name} ({candidate.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Test</h3>
                <div className="space-y-2">
                  {availableTests.length > 0 ? (
                    availableTests.map((test) => (
                      <div key={test._id} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`test-${test._id}`}
                          name="test"
                          value={test._id}
                          checked={selectedTest === test._id}
                          onChange={() => setSelectedTest(test._id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-input"
                        />
                        <label htmlFor={`test-${test._id}`} className="text-sm font-medium">
                          {test.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({test.duration} min, {test.passingScore}% to pass)
                          </span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No active tests available. Create a test first.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={handleSendInvitation} disabled={!selectedTest || isSendingInvitation}>
              {isSendingInvitation ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Images Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Verification Images</DialogTitle>
            <DialogDescription>ID and face verification images submitted by {candidate.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Card Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">ID Card</h3>
                <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[300px] flex items-center justify-center">
                  {selectedVerification?.idCardImageUrl ? (
                    <img
                      src={selectedVerification.idCardImageUrl || "/placeholder.svg"}
                      alt="ID Card"
                      className="w-full h-auto object-contain max-h-[400px]"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <XCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>No ID card image submitted</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Face Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Face Photo</h3>
                <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[300px] flex items-center justify-center">
                  {selectedVerification?.faceImageUrl ? (
                    <img
                      src={selectedVerification.faceImageUrl || "/placeholder.svg"}
                      alt="Face Photo"
                      className="w-full h-auto object-contain max-h-[400px]"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <XCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>No face photo submitted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Debug Information */}
            {selectedVerification && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>ID Card URL: {selectedVerification.idCardImageUrl || "Not provided"}</p>
                <p>Face URL: {selectedVerification.faceImageUrl || "Not provided"}</p>
                <p>Submitted: {formatDate(selectedVerification.createdAt)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={() => setShowVerificationDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
