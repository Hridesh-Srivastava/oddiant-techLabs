"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { Download, Search, Filter, ChevronDown, ArrowUpDown, CheckCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AssessmentLayout } from "@/components/assessment-layout"

interface ResultData {
  _id: string
  candidateName: string
  candidateEmail: string
  testId: string
  testName: string
  score: number
  status: string
  duration: number
  completionDate: string
  resultsDeclared: boolean
}

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<ResultData[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [stats, setStats] = useState({
    averageScore: 0,
    passRate: 0,
    completionRate: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [testFilter, setTestFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [scoreFilter, setScoreFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("completionDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const resultsPerPage = 10
  const totalPages = Math.ceil(totalResults / resultsPerPage)

  // Declare results dialog
  const [showDeclareResultsDialog, setShowDeclareResultsDialog] = useState(false)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)
  const [isDeclaringResult, setIsDeclaringResult] = useState(false)
  const [showBatchDeclareDialog, setShowBatchDeclareDialog] = useState(false)
  const [isDeclaringBatch, setIsDeclaringBatch] = useState(false)
  const [pendingResultsCount, setPendingResultsCount] = useState(0)

  useEffect(() => {
    // Get filters and page from URL if present
    const test = searchParams.get("test")
    if (test) setTestFilter(test)
    const page = parseInt(searchParams.get("page") || "1", 10)
    setCurrentPage(page)

    fetchResults(page)
  }, []) // fetch only on mount

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1)
    }, 500) // Debounce search and filter changes

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, testFilter, statusFilter, scoreFilter, dateFilter, sortBy, sortDirection])

  useEffect(() => {
    fetchResults(currentPage);
  }, [currentPage, searchQuery, testFilter, statusFilter, scoreFilter, dateFilter, sortBy, sortDirection]);

  const fetchResults = async (page = 1) => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      if (testFilter) params.append("test", testFilter)
      if (statusFilter) params.append("status", statusFilter)
      if (scoreFilter) params.append("score", scoreFilter)
      if (dateFilter) params.append("date", dateFilter)
      params.append("sort", sortBy)
      params.append("page", page.toString())
      params.append("limit", resultsPerPage.toString())

      const response = await fetch(`/api/assessment/results?${params.toString()}`, {
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

      if (data.success) {
        setResults(data.results || [])
        setTotalResults(data.total || 0)
        setCurrentPage(data.page || 1)
        setStats(data.stats || { averageScore: 0, passRate: 0, completionRate: 0 })

        // Count pending results
        const pendingResults = data.results.filter((result: ResultData) => !result.resultsDeclared)
        setPendingResultsCount(pendingResults.length)
      } else {
        throw new Error(data.message || "Failed to fetch results")
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      toast.error("Failed to load results. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      const params = new URLSearchParams(window.location.search)
      params.set("page", newPage.toString())
      router.replace(`${window.location.pathname}?${params.toString()}`)
    }
  }

  const handleExport = async () => {
    try {
      toast.info("Exporting results...")

      // Build query parameters
      const params = new URLSearchParams()
      if (testFilter) params.append("test", testFilter)
      if (statusFilter) params.append("status", statusFilter)
      if (scoreFilter) params.append("score", scoreFilter)
      if (dateFilter) params.append("date", dateFilter)

      // Fetch export from API
      const response = await fetch(`/api/assessment/results/export?${params.toString()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to export results")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `assessment-results-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Results exported successfully")
    } catch (error) {
      console.error("Error exporting results:", error)
      toast.error("Failed to export results. Please try again.")
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
    }
    // The useEffect will handle re-fetching
  }

  const applyFilter = (type: string, value: string | null) => {
    switch (type) {
      case "test":
        setTestFilter(value)
        break
      case "status":
        setStatusFilter(value)
        break
      case "score":
        setScoreFilter(value)
        break
      case "date":
        setDateFilter(value)
        break
    }
    // The useEffect will handle re-fetching
  }

  const clearFilters = () => {
    setTestFilter(null)
    setStatusFilter(null)
    setScoreFilter(null)
    setDateFilter(null)
    // The useEffect will handle re-fetching
  }

  const handleDeclareResult = async () => {
    if (!selectedResult) return

    try {
      setIsDeclaringResult(true)

      const response = await fetch(`/api/assessment/results/${selectedResult}/declare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to declare result")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Result declared and email sent to candidate")
        fetchResults() // Refresh the results
      } else {
        throw new Error(data.message || "Failed to declare result")
      }
    } catch (error) {
      console.error("Error declaring result:", error)
      toast.error((error as Error).message || "Failed to declare result")
    } finally {
      setIsDeclaringResult(false)
      setShowDeclareResultsDialog(false)
      setSelectedResult(null)
    }
  }

  const handleBatchDeclareResults = async () => {
    if (pendingResultsCount === 0) {
      toast.error("No pending results to declare")
      return
    }

    try {
      setIsDeclaringBatch(true)

      // Get the test ID from the first pending result
      const pendingResult = results.find((result) => !result.resultsDeclared)
      if (!pendingResult) {
        throw new Error("No pending results found")
      }

      const response = await fetch(`/api/assessment/tests/${pendingResult.testId}/declare-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to declare results")
      }

      const data = await response.json()

      if (data.success) {
        // Use declaredCount and emailsSent from API response for robust feedback
        toast.success(`${data.declaredCount || 0} results declared and ${data.emailsSent || 0} emails sent to candidates`)
        fetchResults() // Refresh the results
      } else {
        throw new Error(data.message || "Failed to declare results")
      }
    } catch (error) {
      console.error("Error declaring results:", error)
      toast.error((error as Error).message || "Failed to declare results")
    } finally {
      setIsDeclaringBatch(false)
      setShowBatchDeclareDialog(false)
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
      case "Passed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <AssessmentLayout>
    <div className="container mx-auto py-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Test Results</h1>
        <div className="flex gap-2">
          {pendingResultsCount > 0 && (
            <Button onClick={() => setShowBatchDeclareDialog(true)} className="bg-black text-white hover:text-black hover:bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Declare All Results ({pendingResultsCount})
            </Button>
          )}
          <Button onClick={handleExport} className="text-white bg-green-600">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">+2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">-5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">+3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search results by ID, name, email, or test..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Test
                {testFilter && <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyFilter("test", null)}>All Tests</DropdownMenuItem>
              {/* This would be populated with actual tests */}
              <DropdownMenuItem onClick={() => applyFilter("test", "test1")}>Test 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("test", "test2")}>Test 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Status
                {statusFilter && <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyFilter("status", null)}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("status", "Passed")}>Passed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("status", "Failed")}>Failed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Score
                {scoreFilter && <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyFilter("score", null)}>All Scores</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("score", "> 90%")}>Above 90%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("score", "80-90%")}>80% - 90%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("score", "70-80%")}>70% - 80%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("score", "< 70%")}>Below 70%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Date
                {dateFilter && <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyFilter("date", null)}>All Dates</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("date", "Today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("date", "This week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("date", "This month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFilter("date", "Older")}>Older</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(testFilter || statusFilter || scoreFilter || dateFilter) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("candidateName")}>
                    Candidate
                    {sortBy === "candidateName" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("testName")}>
                    Test
                    {sortBy === "testName" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("score")}>
                    Score
                    {sortBy === "score" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("status")}>
                    Status
                    {sortBy === "status" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("duration")}>
                    Duration
                    {sortBy === "duration" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("completionDate")}>
                    Completion Date
                    {sortBy === "completionDate" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button className="flex items-center" onClick={() => handleSort("resultsDeclared")}>
                    Declared
                    {sortBy === "resultsDeclared" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-32" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-12" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-12" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                  </tr>
                ))
              ) : results.length > 0 ? (
                results.map((result) => (
                  <tr key={result._id} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 border-l-4 border-l-amber-400">
                      <div>
                        <div className="font-medium">{result.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{result.candidateEmail}</div>
                        <div className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          Result ID: {result._id}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{result.testName}</div>
                        <div className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          Test ID: {result.testId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{result.score}%</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{result.duration} min</td>
                    <td className="py-3 px-4">{formatDate(result.completionDate)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={result.resultsDeclared ? "default" : "outline"}>
                        {result.resultsDeclared ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" asChild>
                          <Link href={`/employee/assessment/results/${result._id}`}>View</Link>
                        </Button>
                        {!result.resultsDeclared && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result._id)
                              setShowDeclareResultsDialog(true)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Declare
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No results found.{" "}
                    {testFilter || statusFilter || scoreFilter || dateFilter ? (
                      <button className="text-primary underline" onClick={clearFilters}>
                        Clear filters
                      </button>
                    ) : (
                      <Link href="/employee/assessment/invitations" className="text-primary underline">
                        Invite candidates
                      </Link>
                    )}{" "}
                    to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="flex items-center"><svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Previous</span>
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                                   className={pageNum === currentPage ? "bg-black text-white hover:bg-green-600 hover:text-black" : "hover:bg-green-600 hover:text-black"}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="flex items-center">Next<svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span>
            </Button>
          </div>
        )}
      </div>

      {/* Declare Individual Result Dialog */}
      <Dialog open={showDeclareResultsDialog} onOpenChange={setShowDeclareResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Result</DialogTitle>
            <DialogDescription>
              This will send an email notification to the candidate with their test results. Once declared, the
              candidate will be able to see their score and pass/fail status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclareResultsDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={handleDeclareResult} disabled={isDeclaringResult}>
              {isDeclaringResult ? (
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

      {/* Batch Declare Results Dialog */}
      <Dialog open={showBatchDeclareDialog} onOpenChange={setShowBatchDeclareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare All Results</DialogTitle>
            <DialogDescription>
              This will declare all pending results ({pendingResultsCount}) and send email notifications to all
              candidates. Once declared, candidates will be able to see their scores and pass/fail status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeclareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchDeclareResults} disabled={isDeclaringBatch} className="bg-black text-white hover:text-black hover:bg-green-600">
              {isDeclaringBatch ? (
                "Declaring..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Declare All Results
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
 </AssessmentLayout>
  )
}
