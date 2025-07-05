"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import {
  ArrowLeft,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  Users,
  Clock,
  CheckCircle,
  Send,
  Download,
  AlertTriangle,
  Mail,
  Code,
  Calculator,
  Shuffle,
  Shield,
  Timer,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TestData {
  _id: string
  name: string
  description: string
  duration: number
  passingScore: number
  instructions: string
  type: string
  settings: {
    shuffleQuestions: boolean
    preventTabSwitching: boolean
    allowCalculator: boolean
    allowCodeEditor: boolean
    autoSubmit: boolean
  }
  sections: SectionData[]
  status: string
  createdAt: string
  updatedAt: string
}

interface SectionData {
  id: string
  title: string
  duration: number
  questionType: string
  questions: QuestionData[]
}

interface QuestionData {
  id: string
  text: string
  type: string
  options?: string[]
  correctAnswer?: string | string[]
  points: number
  codeLanguage?: string
  codeTemplate?: string
  testCases?: any[]
}

interface CandidateData {
  _id: string
  name: string
  email: string
  status: string
  score: number
  completionDate?: string
  resultsDeclared?: boolean
  invitationId?: string
}

interface ResultData {
  _id: string
  testId: string
  testName: string
  candidateEmail: string
  candidateName: string
  score: number
  status: string
  duration: number
  completionDate: string
  resultsDeclared: boolean
  answers?: any[]
}

export default function TestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [test, setTest] = useState<TestData | null>(null)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [results, setResults] = useState<ResultData[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)
  const [isLoadingResults, setIsLoadingResults] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [showDeclareResultsDialog, setShowDeclareResultsDialog] = useState(false)
  const [isDeclaringResults, setIsDeclaringResults] = useState(false)
  const [testStats, setTestStats] = useState({
    candidatesCount: 0,
    completionRate: 0,
    averageScore: 0,
    passRate: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [pendingResultsCount, setPendingResultsCount] = useState(0)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)
  const [showDeclareIndividualResultDialog, setShowDeclareIndividualResultDialog] = useState(false)
  const [isDeclaringIndividualResult, setIsDeclaringIndividualResult] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Set active tab from URL if present
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const tab = hash.replace("#", "")
      if (["overview", "candidates", "results"].includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])

  // Update URL when tab changes
  useEffect(() => {
    window.history.replaceState(null, "", `#${activeTab}`)
  }, [activeTab])

  const fetchTest = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/assessment/tests/${testId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch test")
      }

      const data = await response.json()

      if (data.success) {
        setTest(data.test)
      } else {
        throw new Error(data.message || "Failed to fetch test")
      }
    } catch (error) {
      console.error("Error fetching test:", error)
      toast.error("Failed to load test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [testId])

  const fetchResults = useCallback(async () => {
    try {
      setIsLoadingResults(true)
      console.log("Fetching results for test ID:", testId)

      // Fetch all results and filter by testId
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
      console.log("All results API response:", data)

      if (data.success && data.results) {
        // Filter results for this specific test
        const testResults = (data.results || []).filter((result: ResultData) => {
          // Handle both string and ObjectId comparisons
         const resultTestId = result.testId ? result.testId.toString() : ''
          const currentTestId = testId ? testId.toString() : ''
          return resultTestId === currentTestId
        })

        console.log(`Found ${testResults.length} results for test ${testId}`)
        console.log("Filtered test results:", testResults)

        setResults(testResults)

        // Count pending results - using the same logic as the API
        const pendingResults = testResults.filter((result: ResultData) => {
          const isUndeclared = !result.resultsDeclared
          console.log(
            `Frontend: Result ${result.candidateEmail}: declared=${result.resultsDeclared}, isUndeclared=${isUndeclared}`,
          )
          return isUndeclared
        })

        setPendingResultsCount(pendingResults.length)
        console.log(`Found ${pendingResults.length} pending results (frontend calculation)`)
      } else {
        console.log("No results found or API error")
        setResults([])
        setPendingResultsCount(0)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      toast.error("Failed to load results. Please try again.")
      setResults([])
      setPendingResultsCount(0)
    } finally {
      setIsLoadingResults(false)
    }
  }, [testId])

  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoadingCandidates(true)

      // Get all invitations for this test
      const invitationsResponse = await fetch(`/api/assessment/invitations`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!invitationsResponse.ok) {
        throw new Error("Failed to fetch invitations")
      }

      const invitationsData = await invitationsResponse.json()

      // Create a map of email to candidate data
      const candidateMap = new Map()

      // Process invitations to build candidate data
      if (invitationsData.success && invitationsData.invitations) {
        // Filter invitations for this test
        const testInvitations = invitationsData.invitations.filter((inv: any) => {
          const invTestId = inv.testId?.toString()
          const currentTestId = testId ? testId.toString() : ''
          return invTestId === currentTestId
        })

        console.log(`Found ${testInvitations.length} invitations for test ${testId}`)

        for (const invitation of testInvitations) {
          const email = invitation.email

          if (!candidateMap.has(email)) {
            // Initialize candidate data with proper status mapping
            let candidateStatus = "Invited"

            // Map invitation status to candidate status
            if (invitation.status === "Completed") {
              candidateStatus = "Completed"
            } else if (invitation.status === "Expired") {
              candidateStatus = "Expired"
            } else if (invitation.status === "Cancelled") {
              candidateStatus = "Cancelled"
            }

            candidateMap.set(email, {
              _id: `invitation-${invitation._id}`,
              name: invitation.candidateName || email.split("@")[0],
              email,
              status: candidateStatus,
              score: 0,
              createdAt: invitation.createdAt,
              invitationId: invitation._id,
            })
          }
        }
      }

      // Update candidate data with results
      if (results.length > 0) {
        for (const result of results) {
          const email = result.candidateEmail

          if (candidateMap.has(email)) {
            const candidateData = candidateMap.get(email)
            candidateData.score = result.score
            candidateData.completionDate = result.completionDate
            candidateData.resultsDeclared = result.resultsDeclared
            candidateData._id = result._id // Store result ID for individual declaration

            if (result.resultsDeclared) {
              candidateData.status = result.status // Passed or Failed
            } else {
              candidateData.status = "Completed" // Completed but not declared
            }
          } else {
            // If candidate not found in invitations, add from result
            candidateMap.set(email, {
              _id: result._id,
              name: result.candidateName || email.split("@")[0],
              email,
              status: result.resultsDeclared ? result.status : "Completed",
              score: result.score,
              completionDate: result.completionDate,
              resultsDeclared: result.resultsDeclared,
            })
          }
        }
      }

      // After building candidateMap from results and invitations
      const candidateEmails = Array.from(candidateMap.keys());
      // Fetch students with matching emails
      const res = await fetch(`/api/students/by-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: candidateEmails })
      });
      if (res.ok) {
        const { students } = await res.json();
        for (const student of students) {
          if (!candidateMap.has(student.email)) {
            candidateMap.set(student.email, {
              _id: student._id,
              name: student.firstName || student.name || student.email.split("@")[0],
              email: student.email,
              status: "Student",
              score: null,
              completionDate: null,
              resultsDeclared: false,
            });
          }
        }
      }

      // Convert map to array and sort by status priority
      const candidatesArray = Array.from(candidateMap.values()).sort((a, b) => {
        const statusPriority: Record<string, number> = {
  Completed: 1,
  Passed: 2,
  Failed: 3,
  Invited: 4,
  Expired: 5,
  Cancelled: 6,
}
return (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999)
      })

      console.log(`Total candidates for test: ${candidatesArray.length}`)
      setCandidates(candidatesArray)
    } catch (error) {
      console.error("Error fetching candidates:", error)
      toast.error("Failed to load candidates. Please try again.")
    } finally {
      setIsLoadingCandidates(false)
    }
  }, [testId, results])

  const fetchTestStats = useCallback(async () => {
    try {
      setIsLoadingStats(true)

      const response = await fetch(`/api/assessment/tests/${testId}/stats`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch test stats")
      }

      const data = await response.json()

      if (data.success) {
        // Calculate real-time stats based on test configuration and actual data
        const stats = data.stats

        // Use the test's passing score for pass rate calculation
        if (test && stats.completedCount > 0) {
          const passedCount = candidates.filter(
            (c) =>
              (c.status === "Completed" || c.status === "Passed" || c.status === "Failed") &&
              c.score >= test.passingScore,
          ).length

          stats.passRate = Math.round((passedCount / stats.completedCount) * 100)
        }

        setTestStats(stats)
      } else {
        throw new Error(data.message || "Failed to fetch test stats")
      }
    } catch (error) {
      console.error("Error fetching test stats:", error)
      toast.error("Failed to load test statistics. Please try again.")
    } finally {
      setIsLoadingStats(false)
    }
  }, [testId, test, candidates])

  useEffect(() => {
    fetchTest()
  }, [fetchTest])

  useEffect(() => {
    if (test) {
      fetchResults()
    }
  }, [test, fetchResults])

  useEffect(() => {
    if (test && results.length >= 0) {
      fetchCandidates()
    }
  }, [test, results, fetchCandidates])

  useEffect(() => {
    if (test && candidates.length >= 0) {
      fetchTestStats()
    }
  }, [test, candidates, fetchTestStats])

  const handleDeleteTest = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/assessment/tests/${testId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete test")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Test deleted successfully")
        router.push("/employee/assessment/tests")
      } else {
        throw new Error(data.message || "Failed to delete test")
      }
    } catch (error) {
      console.error("Error deleting test:", error)
      toast.error("Failed to delete test. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleChangeStatus = async () => {
    try {
      if (!newStatus) return

      setIsChangingStatus(true)

      const response = await fetch(`/api/assessment/tests/${testId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update test status")
      }

      const data = await response.json()

      if (data.success) {
        setTest((prev) => (prev ? { ...prev, status: newStatus } : null))
        toast.success(`Test status updated to ${newStatus}`)
      } else {
        throw new Error(data.message || "Failed to update test status")
      }
    } catch (error) {
      console.error("Error updating test status:", error)
      toast.error((error as Error).message || "Failed to update test status. Please try again.")
    } finally {
      setIsChangingStatus(false)
      setShowStatusDialog(false)
    }
  }

  const handleDeclareResults = async () => {
    try {
      setIsDeclaringResults(true)

      console.log("Frontend: Starting bulk declaration...")
      console.log("Frontend: Pending results count:", pendingResultsCount)
      console.log("Frontend: Results array:", results)

      // Double-check pending results count before API call
      const actualPendingResults = results.filter((result) => {
        const isUndeclared = !result.resultsDeclared
        console.log(
          `Frontend check: ${result.candidateEmail} - declared: ${result.resultsDeclared}, isUndeclared: ${isUndeclared}`,
        )
        return isUndeclared
      })

      console.log("Frontend: Actual pending results:", actualPendingResults.length)

      if (actualPendingResults.length === 0) {
        toast.error("No new results to declare")
        setShowDeclareResultsDialog(false)
        return
      }

      const response = await fetch(`/api/assessment/tests/${testId}/declare-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Frontend: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("Frontend: API error data:", errorData)
        throw new Error(errorData.message || "Failed to declare results")
      }

      const data = await response.json()
      console.log("Frontend: API success data:", data)

      if (data.success) {
        toast.success(data.message || "Results declared successfully")
        // Refresh results and candidates
        await fetchResults()
        await fetchTestStats()
      } else {
        throw new Error(data.message || "Failed to declare results")
      }
    } catch (error) {
      console.error("Error declaring results:", error)
      toast.error((error as Error).message || "Failed to declare results. Please try again.")
    } finally {
      setIsDeclaringResults(false)
      setShowDeclareResultsDialog(false)
    }
  }

  const handleDeclareIndividualResult = async () => {
    try {
      if (!selectedResult) return

      setIsDeclaringIndividualResult(true)

      const response = await fetch(`/api/assessment/results/${selectedResult}/declare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to declare individual result")
      }

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || "Result declared successfully")
        // Refresh results and candidates
        await fetchResults()
        await fetchTestStats()
      } else {
        throw new Error(data.message || "Failed to declare individual result")
      }
    } catch (error) {
      console.error("Error declaring individual result:", error)
      toast.error((error as Error).message || "Failed to declare individual result. Please try again.")
    } finally {
      setIsDeclaringIndividualResult(false)
      setShowDeclareIndividualResultDialog(false)
      setSelectedResult(null)
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
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to resend invitation")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Invitation resent successfully")
        // Refresh candidates data
        await fetchCandidates()
      } else {
        throw new Error(data.message || "Failed to resend invitation")
      }
    } catch (error) {
      console.error("Error resending invitation:", error)
      toast.error((error as Error).message || "Failed to resend invitation. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportResults = async () => {
    try {
      toast.info("Exporting test results...")

      // Fetch export from API
      const response = await fetch(`/api/assessment/results/export?test=${testId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to export test results")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `test-results-${test?.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Test results exported successfully")
    } catch (error) {
      console.error("Error exporting test results:", error)
      toast.error("Failed to export test results. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Draft":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    }
  }

  const getCandidateStatusColor = (status: string): string => {
    switch (status) {
      case "Passed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "Completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Invited":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Test Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-medium mb-2">The requested test could not be found</h2>
            <p className="text-muted-foreground mb-6">
              The test may have been deleted or you may not have access to it.
            </p>
            <Button onClick={() => router.push("/employee/assessment/tests")}>Go to Tests</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{test.name}</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className={getStatusColor(test.status)}>
                {test.status}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">Last updated: {formatDate(test.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/employee/assessment/tests/${testId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Test
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/employee/assessment/tests/${testId}/preview`)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Test
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewStatus(test.status === "Draft" ? "Active" : test.status === "Active" ? "Archived" : "Active")
                  setShowStatusDialog(true)
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {test.status === "Draft"
                  ? "Activate Test"
                  : test.status === "Active"
                    ? "Archive Test"
                    : "Activate Test"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/employee/assessment/invitations?testId=${testId}`)}>
                <Send className="h-4 w-4 mr-2" />
                Invite Candidates
              </DropdownMenuItem>
              {pendingResultsCount > 0 && (
                <DropdownMenuItem onClick={() => setShowDeclareResultsDialog(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Declare All Results ({pendingResultsCount})
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push(`/employee/assessment/tests/${testId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Test
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="mt-1">{test.description || "No description provided."}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Instructions</h3>
                      <p className="mt-1">{test.instructions || "No instructions provided."}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                        <p className="mt-1">{test.type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                        <p className="mt-1">{test.duration} minutes</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Passing Score</h3>
                        <p className="mt-1">{test.passingScore}%</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                        <p className="mt-1">{formatDate(test.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {test.sections.map((section, index) => (
                      <div key={section.id} className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">
                          Section {index + 1}: {section.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {section.duration} minutes
                          </div>
                          <div>{section.questionType}</div>
                          <div>{section.questions.length} questions</div>
                        </div>
                        <div className="space-y-2">
                          {section.questions.slice(0, 3).map((question, qIndex) => (
                            <div key={question.id} className="text-sm">
                              <span className="font-medium">Q{qIndex + 1}:</span>{" "}
                              {question.text.length > 100 ? `${question.text.substring(0, 100)}...` : question.text}
                            </div>
                          ))}
                          {section.questions.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              + {section.questions.length - 3} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {test.sections.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No sections added to this test yet.</p>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/employee/assessment/tests/${testId}/edit`)}
                          className="mt-2"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Test
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Test Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shuffle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">Shuffle Questions</h3>
                          <p className="text-xs text-muted-foreground">Randomize question order</p>
                        </div>
                      </div>
                      <Badge variant={test.settings.shuffleQuestions ? "default" : "secondary"}>
                        {test.settings.shuffleQuestions ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">Prevent Tab Switching</h3>
                          <p className="text-xs text-muted-foreground">Alert when switching tabs</p>
                        </div>
                      </div>
                      <Badge variant={test.settings.preventTabSwitching ? "default" : "secondary"}>
                        {test.settings.preventTabSwitching ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">Allow Calculator</h3>
                          <p className="text-xs text-muted-foreground">Provide calculator tool</p>
                        </div>
                      </div>
                      <Badge variant={test.settings.allowCalculator ? "default" : "secondary"}>
                        {test.settings.allowCalculator ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">Allow Code Editor</h3>
                          <p className="text-xs text-muted-foreground">Enable coding questions</p>
                        </div>
                      </div>
                      <Badge variant={test.settings.allowCodeEditor ? "default" : "secondary"}>
                        {test.settings.allowCodeEditor ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-sm">Auto Submit</h3>
                          <p className="text-xs text-muted-foreground">Submit when time expires</p>
                        </div>
                      </div>
                      <Badge variant={test.settings.autoSubmit ? "default" : "secondary"}>
                        {test.settings.autoSubmit ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-3 text-center">
                          <h3 className="text-sm font-medium text-muted-foreground">Candidates</h3>
                          <p className="text-2xl font-bold mt-1">{testStats.candidatesCount}</p>
                        </div>
                        <div className="border rounded-md p-3 text-center">
                          <h3 className="text-sm font-medium text-muted-foreground">Completion</h3>
                          <p className="text-2xl font-bold mt-1">{testStats.completionRate}%</p>
                        </div>
                      </div>

                      {pendingResultsCount > 0 && (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-md p-3">
                          <div className="flex items-center text-yellow-800">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <h3 className="text-sm font-medium">Pending Results</h3>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            {pendingResultsCount} {pendingResultsCount === 1 ? "result" : "results"} waiting to be
                            declared
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                            onClick={() => setShowDeclareResultsDialog(true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Declare Results
                          </Button>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/employee/assessment/invitations?testId=${testId}`)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Invite Candidates
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>Candidates who have been invited to take this test</CardDescription>
              </div>
              <Button onClick={() => router.push(`/employee/assessment/invitations?testId=${testId}`)}>
                <Send className="h-4 w-4 mr-2" />
                Invite Candidates
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCandidates ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-1">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidates.map((candidate) => (
                            <tr key={candidate._id} className="border-t hover:bg-muted/30">
                              <td className="py-3 px-4">{candidate.name}</td>
                              <td className="py-3 px-4">{candidate.email}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className={getCandidateStatusColor(candidate.status)}>
                                  {candidate.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  {/* View candidate details */}
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/employee/assessment/candidates?email=${candidate.email}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Link>
                                  </Button>

                                  {/* Declare individual result if completed but not declared */}
                                  {candidate.status === "Completed" && !candidate.resultsDeclared && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedResult(candidate._id)
                                        setShowDeclareIndividualResultDialog(true)
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Declare
                                    </Button>
                                  )}

                                  {/* Resend invitation if invited but not completed */}
                                  {candidate.status === "Invited" && candidate.invitationId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResendInvitation(candidate.invitationId!)}
                                      disabled={actionLoading === candidate.invitationId}
                                    >
                                      {actionLoading === candidate.invitationId ? (
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
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No candidates yet</h3>
                  <p className="text-muted-foreground mb-4">Invite candidates to take this test</p>
                  <Button onClick={() => router.push(`/employee/assessment/invitations?testId=${testId}`)}>
                    <Send className="h-4 w-4 mr-2" />
                    Invite Candidates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Results from candidates who have completed this test</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
                {pendingResultsCount > 0 && (
                  <Button onClick={() => setShowDeclareResultsDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Declare All Results ({pendingResultsCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completion Date</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Results Declared</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => (
                            <tr key={result._id} className="border-t hover:bg-muted/30">
                              <td className="py-3 px-4">{result.candidateName || "N/A"}</td>
                              <td className="py-3 px-4">{result.candidateEmail}</td>
                              <td className="py-3 px-4">{result.resultsDeclared ? `${result.score}%` : "Pending"}</td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    result.resultsDeclared
                                      ? getCandidateStatusColor(result.status)
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  }
                                >
                                  {result.resultsDeclared ? result.status : "Pending"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">{formatDate(result.completionDate)}</td>
                              <td className="py-3 px-4">
                                <Badge variant={result.resultsDeclared ? "default" : "outline"}>
                                  {result.resultsDeclared ? "Yes" : "No"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/employee/assessment/results/${result._id}`}>View</Link>
                                  </Button>
                                  {!result.resultsDeclared && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedResult(result._id)
                                        setShowDeclareIndividualResultDialog(true)
                                      }}
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
                  </div>

                  {pendingResultsCount > 0 && (
                    <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                      <div className="flex items-center text-yellow-800">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Pending Results</h3>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1 mb-3">
                        There are {pendingResultsCount} completed tests with results waiting to be declared. Candidates
                        cannot see their scores until you declare the results.
                      </p>
                      <Button
                        onClick={() => setShowDeclareResultsDialog(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Declare All Results Now
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results yet</h3>
                  <p className="text-muted-foreground mb-4">
                    No candidates have completed this test yet. Invite candidates to take the test.
                  </p>
                  <Button onClick={() => router.push(`/employee/assessment/invitations?testId=${testId}`)}>
                    <Send className="h-4 w-4 mr-2" />
                    Invite Candidates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTest} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Test Status</DialogTitle>
            <DialogDescription>
              {newStatus === "Active"
                ? "Activating this test will make it available for candidates to take. Are you sure you want to proceed?"
                : newStatus === "Archived"
                  ? "Archiving this test will make it unavailable for candidates. Are you sure you want to proceed?"
                  : "Are you sure you want to change the status of this test?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeStatus} disabled={isChangingStatus}>
              {isChangingStatus ? "Updating..." : `Change to ${newStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Declare All Results Dialog */}
      <Dialog open={showDeclareResultsDialog} onOpenChange={setShowDeclareResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Test Results</DialogTitle>
            <DialogDescription>
              This will send email notifications to all candidates who have completed this test with their results. Once
              declared, candidates will be able to see their scores and pass/fail status.
              {pendingResultsCount > 0 ? (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <span className="font-medium">{pendingResultsCount}</span>{" "}
                  {pendingResultsCount === 1 ? "result is" : "results are"} waiting to be declared.
                </div>
              ) : (
                <div className="mt-2 p-3 bg-muted rounded-md">There are no new results to declare at this time.</div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclareResultsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeclareResults} disabled={isDeclaringResults || pendingResultsCount === 0}>
              {isDeclaringResults ? "Declaring..." : "Declare Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Declare Individual Result Dialog */}
      <Dialog open={showDeclareIndividualResultDialog} onOpenChange={setShowDeclareIndividualResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Individual Result</DialogTitle>
            <DialogDescription>
              This will send an email notification to the candidate with their test results. Once declared, the
              candidate will be able to see their score and pass/fail status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclareIndividualResultDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeclareIndividualResult} disabled={isDeclaringIndividualResult}>
              {isDeclaringIndividualResult ? (
                "Declaring..."
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Declare and Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
