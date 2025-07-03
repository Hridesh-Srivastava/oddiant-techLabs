"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { Download, Search, X, Filter, ChevronDown, UserPlus } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AssessmentLayout } from "@/components/assessment-layout"

interface CandidateData {
  _id: string
  name: string
  email: string
  testsAssigned: number
  testsCompleted: number
  averageScore: number
  status: "Completed" | "In Progress" | "Invited" | "Failed"
}

export default function CandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  // Filter states
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [scoreFilters, setScoreFilters] = useState<string[]>([])

  // Status filter options
  const statusOptions = [
    { label: "Completed", value: "Completed" },
    { label: "In Progress", value: "In Progress" },
    { label: "Invited", value: "Invited" },
    { label: "Failed", value: "Failed" },
  ]

  // Score filter options
  const scoreOptions = [
    { label: "> 90%", value: "> 90%" },
    { label: "80-90%", value: "80-90%" },
    { label: "70-80%", value: "70-80%" },
    { label: "< 70%", value: "< 70%" },
  ]

  useEffect(() => {
    fetchCandidates()

    // Get initial filters from URL if any
    const initialStatusFilters = searchParams.getAll("status")
    if (initialStatusFilters.length > 0) {
      setStatusFilters(initialStatusFilters)
    }

    const initialScoreFilters = searchParams.getAll("score")
    if (initialScoreFilters.length > 0) {
      setScoreFilters(initialScoreFilters)
    }
  }, [searchParams])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilters, scoreFilters, candidates])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()

      statusFilters.forEach((filter) => params.append("status", filter))
      scoreFilters.forEach((filter) => params.append("score", filter))

      // Fetch candidates from API
      const response = await fetch(`/api/assessment/candidates?${params.toString()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch candidates")
      }

      const data = await response.json()

      if (data.success) {
        setCandidates(data.candidates || [])
      } else {
        throw new Error(data.message || "Failed to fetch candidates")
      }
    } catch (error) {
      console.error("Error fetching candidates:", error)
      toast.error("Failed to load candidates. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...candidates]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filters
    if (statusFilters.length > 0) {
      filtered = filtered.filter((candidate) => statusFilters.includes(candidate.status))
    }

    // Apply score filters
    if (scoreFilters.length > 0) {
      filtered = filtered.filter((candidate) => {
        const score = candidate.averageScore

        return scoreFilters.some((filter) => {
          if (filter === "> 90%" && score > 90) return true
          if (filter === "80-90%" && score >= 80 && score <= 90) return true
          if (filter === "70-80%" && score >= 70 && score < 80) return true
          if (filter === "< 70%" && score < 70) return true
          return false
        })
      })
    }

    setFilteredCandidates(filtered)

    // Update URL with filters
    const params = new URLSearchParams()
    statusFilters.forEach((filter) => params.append("status", filter))
    scoreFilters.forEach((filter) => params.append("score", filter))

    // Replace URL without refreshing the page
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const handleScoreFilterChange = (value: string) => {
    setScoreFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const clearStatusFilter = (filter: string) => {
    setStatusFilters((prev) => prev.filter((item) => item !== filter))
  }

  const clearScoreFilter = (filter: string) => {
    setScoreFilters((prev) => prev.filter((item) => item !== filter))
  }

  const clearAllFilters = () => {
    setStatusFilters([])
    setScoreFilters([])
    setSearchTerm("")
  }

  const handleExportResults = async () => {
    try {
      setIsExporting(true)
      toast.info("Exporting candidates data...")

      // Build query parameters for export
      const params = new URLSearchParams()

      statusFilters.forEach((filter) => params.append("status", filter))
      scoreFilters.forEach((filter) => params.append("score", filter))

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      // Fetch export from API
      const response = await fetch(`/api/assessment/candidates/export?${params.toString()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to export candidates data")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidates-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Candidates data exported successfully")
    } catch (error) {
      console.error("Error exporting candidates data:", error)
      toast.error("Failed to export candidates data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AssessmentLayout>
      <div className="container py-6">
        <Toaster position="top-center" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Candidates</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportResults} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <Button asChild>
              <Link href="/employee/assessment/invitations">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Candidates
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">Filter status</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilters([])}
                      className="h-auto p-0 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={statusFilters.includes(option.value)}
                          onCheckedChange={() => handleStatusFilterChange(option.value)}
                        />
                        <Label htmlFor={`status-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Score
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">Filter score</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScoreFilters([])}
                      className="h-auto p-0 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {scoreOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`score-${option.value}`}
                          checked={scoreFilters.includes(option.value)}
                          onCheckedChange={() => handleScoreFilterChange(option.value)}
                        />
                        <Label htmlFor={`score-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Applied Filters */}
        {(statusFilters.length > 0 || scoreFilters.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="flex items-center gap-1">
                Status: {filter}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearStatusFilter(filter)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {scoreFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="flex items-center gap-1">
                Score: {filter}
                <Button variant="ghost" size="sm" onClick={() => clearScoreFilter(filter)} className="h-4 w-4 p-0 ml-1">
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {(statusFilters.length > 0 || scoreFilters.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6">
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Candidates List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4 grid grid-cols-7 font-medium">
            <div className="col-span-2">Name</div>
            <div>Tests Assigned</div>
            <div>Tests Completed</div>
            <div>Average Score</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  <div className="col-span-2 flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-8 self-center" />
                  <Skeleton className="h-4 w-8 self-center" />
                  <Skeleton className="h-4 w-12 self-center" />
                  <Skeleton className="h-6 w-20 rounded-full self-center" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCandidates.length > 0 ? (
            <div>
              {filteredCandidates.map((candidate) => (
                <div key={candidate._id} className="p-4 grid grid-cols-7 border-t hover:bg-muted/30 transition-colors">
                  <div className="col-span-2 flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">{candidate.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center">{candidate.testsAssigned}</div>
                  <div className="flex items-center">{candidate.testsCompleted}</div>
                  <div className="flex items-center">{candidate.averageScore}%</div>
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className={
                        candidate.status === "Completed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : candidate.status === "In Progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : candidate.status === "Invited"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {candidate.status}
                    </Badge>
                  </div>
                  <div className="flex justify-end items-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/employee/assessment/candidates/${candidate._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No candidates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilters.length > 0 || scoreFilters.length > 0
                  ? "Try adjusting your filters or search term"
                  : "Invite candidates to take your assessments"}
              </p>
              <Button asChild>
                <Link href="/employee/assessment/invitations">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Candidates
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AssessmentLayout>
  )
}
