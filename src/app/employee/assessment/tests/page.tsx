"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { Plus, Search, X, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AssessmentLayout } from "@/components/assessment-layout"

interface TestData {
  _id: string
  name: string
  status: string
  type: string
  duration: number
  candidatesCount: number
  createdAt: string
}

export default function TestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [tests, setTests] = useState<TestData[]>([])
  const [filteredTests, setFilteredTests] = useState<TestData[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Filter states
  const [activeTab, setActiveTab] = useState("Active")
  const [durationFilters, setDurationFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])

  // Type filter options
  const typeOptions = [
    { label: "Frontend", value: "Frontend" },
    { label: "Backend", value: "Backend" },
    { label: "Full Stack", value: "Full Stack" },
    { label: "QA", value: "QA" },
    { label: "DevOps", value: "DevOps" },
    { label: "Data", value: "Data" },
  ]

  // Duration filter options
  const durationOptions = [
    { label: "< 60 min", value: "< 60" },
    { label: "60-120 min", value: "60-120" },
    { label: "> 120 min", value: "> 120" },
  ]

  // Show/hide filter dropdowns
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showDurationFilter, setShowDurationFilter] = useState(false)

  useEffect(() => {
    fetchTests()

    // Get initial filters from URL if any
    const initialDurationFilters = searchParams.getAll("duration")
    if (initialDurationFilters.length > 0) {
      setDurationFilters(initialDurationFilters)
    }

    const initialTypeFilters = searchParams.getAll("type")
    if (initialTypeFilters.length > 0) {
      setTypeFilters(initialTypeFilters)
    }

    const tab = searchParams.get("tab")
    if (tab && ["Active", "Draft", "Archived"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, activeTab, durationFilters, typeFilters, tests])

  const fetchTests = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      params.append("status", activeTab)

      durationFilters.forEach((filter) => {
        params.append("duration", filter)
      })

      typeFilters.forEach((filter) => {
        params.append("type", filter)
      })

      // Fetch tests from API
      const response = await fetch(`/api/assessment/tests?${params.toString()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tests")
      }

      const data = await response.json()

      if (data.success) {
        setTests(data.tests || [])
      } else {
        throw new Error(data.message || "Failed to fetch tests")
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
      toast.error("Failed to load tests. Please try again.")
      setTests([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tests]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((test) => test.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply duration filters
    if (durationFilters.length > 0) {
      filtered = filtered.filter((test) => {
        return durationFilters.some((filter) => {
          if (filter === "< 60" && test.duration < 60) return true
          if (filter === "60-120" && test.duration >= 60 && test.duration <= 120) return true
          if (filter === "> 120" && test.duration > 120) return true
          return false
        })
      })
    }

    // Apply type filters
    if (typeFilters.length > 0) {
      filtered = filtered.filter((test) => typeFilters.includes(test.type))
    }

    setFilteredTests(filtered)

    // Update URL with filters
    const params = new URLSearchParams()
    params.set("tab", activeTab)
    durationFilters.forEach((filter) => params.append("duration", filter))
    typeFilters.forEach((filter) => params.append("type", filter))

    // Replace URL without refreshing the page
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }

  const handleDurationFilterChange = (value: string) => {
    setDurationFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const clearDurationFilter = (filter: string) => {
    setDurationFilters((prev) => prev.filter((item) => item !== filter))
  }

  const clearTypeFilter = (filter: string) => {
    setTypeFilters((prev) => prev.filter((item) => item !== filter))
  }

  const clearAllFilters = () => {
    setDurationFilters([])
    setTypeFilters([])
    setSearchTerm("")
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Fetch tests with new tab
    router.push(`/employee/assessment/tests?tab=${tab}`)
  }

  const handleDeleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/assessment/tests/${testId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete test")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Test deleted successfully")
        // Refresh the tests list
        fetchTests()
      } else {
        throw new Error(data.message || "Failed to delete test")
      }
    } catch (error) {
      console.error("Error deleting test:", error)
      toast.error("Failed to delete test. Please try again.")
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

  return (
     <AssessmentLayout> 
    <div className="container mx-auto py-6 pt-24">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tests</h1>
        <Button asChild>
          <Link href="/employee/assessment/tests/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu open={showTypeFilter} onOpenChange={setShowTypeFilter}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Type
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="p-2">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">Filter type</h4>
                  <Button variant="ghost" size="sm" onClick={() => setTypeFilters([])} className="h-auto p-0 text-xs">
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {typeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${option.value}`}
                        checked={typeFilters.includes(option.value)}
                        onCheckedChange={() => handleTypeFilterChange(option.value)}
                      />
                      <Label htmlFor={`type-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={showDurationFilter} onOpenChange={setShowDurationFilter}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Duration
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="p-2">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">Filter duration</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDurationFilters([])}
                    className="h-auto p-0 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {durationOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`duration-${option.value}`}
                        checked={durationFilters.includes(option.value)}
                        onCheckedChange={() => handleDurationFilterChange(option.value)}
                      />
                      <Label htmlFor={`duration-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Applied Filters */}
      {(durationFilters.length > 0 || typeFilters.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {durationFilters.map((filter) => (
            <Badge key={filter} variant="outline" className="flex items-center gap-1">
              Duration: {filter === "< 60" ? "< 60 min" : filter === "> 120" ? "> 120 min" : "60-120 min"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearDurationFilter(filter)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {typeFilters.map((filter) => (
            <Badge key={filter} variant="outline" className="flex items-center gap-1">
              Type: {filter}
              <Button variant="ghost" size="sm" onClick={() => clearTypeFilter(filter)} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {(durationFilters.length > 0 || typeFilters.length > 0) && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6">
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex border-b mb-6">
        {["Active", "Draft", "Archived"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-background">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-9 w-16 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTests.length > 0 ? (
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <div key={test._id} className="border rounded-lg p-4 bg-background hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">
                    <Link href={`/employee/assessment/tests/${test._id}`} className="hover:underline">
                      {test.name}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{test.type}</span>
                    <span>•</span>
                    <span>{test.duration} min</span>
                    <span>•</span>
                    <span>Created on {formatDate(test.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      test.status === "Active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : test.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {test.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/employee/assessment/tests/${test._id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employee/assessment/tests/${test._id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employee/assessment/tests/${test._id}/preview`}>Preview</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTest(test._id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2">No tests found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || durationFilters.length > 0 || typeFilters.length > 0
              ? "Try adjusting your filters or search term"
              : "Create a new test to get started"}
          </p>
          <Button asChild>
            <Link href="/employee/assessment/tests/create">
              <Plus className="h-4 w-4 mr-2" />
              Create a new test
            </Link>
          </Button>
        </div>
      )}
    </div>
  </AssessmentLayout>
  )
}
