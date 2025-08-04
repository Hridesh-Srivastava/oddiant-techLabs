"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { FileText, Plus, RefreshCw, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssessmentLayout } from "@/components/assessment-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TestData {
  _id: string
  name: string
  status: string
  candidatesCount: number
  createdAt: string
}

interface ResultData {
  _id: string
  candidateName: string
  testName: string
  score: number
  completionDate: string
  status: "Passed" | "Failed"
}

interface EmployeeData {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export default function AssessmentDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [dashboardStats, setDashboardStats] = useState({
    totalTests: 0,
    activeTests: 0,
    totalCandidates: 0,
    completionRate: 0,
  })
  const [recentTests, setRecentTests] = useState<TestData[]>([])
  const [recentResults, setRecentResults] = useState<ResultData[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("recent-tests")
  const [recentTestsPage, setRecentTestsPage] = useState(1)
  const [recentResultsPage, setRecentResultsPage] = useState(1)
  const TESTS_PER_PAGE = 8
  const RESULTS_PER_PAGE = 8

  // Reset page to 1 when data changes
  useEffect(() => { setRecentTestsPage(1) }, [recentTests])
  useEffect(() => { setRecentResultsPage(1) }, [recentResults])

  // Pagination logic
  const paginatedTests = recentTests.slice((recentTestsPage-1)*TESTS_PER_PAGE, recentTestsPage*TESTS_PER_PAGE)
  const paginatedResults = recentResults.slice((recentResultsPage-1)*RESULTS_PER_PAGE, recentResultsPage*RESULTS_PER_PAGE)
  const totalTestsPages = Math.max(1, Math.ceil(recentTests.length / TESTS_PER_PAGE))
  const totalResultsPages = Math.max(1, Math.ceil(recentResults.length / RESULTS_PER_PAGE))

  useEffect(() => {
    fetchEmployeeData()
    fetchDashboardData()
  }, [])

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch("/api/employee/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEmployee(data.employee)
      } else {
        console.error("Failed to fetch employee data")
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        router.push("/auth/employee/login")
      } else {
        toast.error("Logout failed. Please try again.")
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed. Please try again.")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/assessment/dashboard/stats", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }

      const statsData = await statsResponse.json()

      if (statsData.success) {
        setDashboardStats(statsData.stats)
      } else {
        throw new Error(statsData.message || "Failed to fetch dashboard stats")
      }

      // Fetch recent tests
      const testsResponse = await fetch("/api/assessment/tests?limit=5&sort=createdAt", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!testsResponse.ok) {
        throw new Error("Failed to fetch recent tests")
      }

      const testsData = await testsResponse.json()

      if (testsData.success) {
        setRecentTests(testsData.tests || [])
      } else {
        throw new Error(testsData.message || "Failed to fetch recent tests")
      }

      // Fetch recent results
      const resultsResponse = await fetch("/api/assessment/results?limit=5&sort=completionDate", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!resultsResponse.ok) {
        throw new Error("Failed to fetch recent results")
      }

      const resultsData = await resultsResponse.json()

      if (resultsData.success) {
        setRecentResults(resultsData.results || [])
      } else {
        throw new Error(resultsData.message || "Failed to fetch recent results")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchDashboardData()
      toast.success("Dashboard data refreshed")
    } catch (error) {
      toast.error("Failed to refresh data")
    } finally {
      setIsRefreshing(false)
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

  const handleChangeTestStatus = async (testId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/assessment/tests/${testId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update test status")
      }

      const data = await response.json()

      if (data.success) {
        toast.success(`Test status updated to ${newStatus}`)
        fetchDashboardData() // Refresh data
      } else {
        throw new Error(data.message || "Failed to update test status")
      }
    } catch (error) {
      console.error("Error updating test status:", error)
      toast.error("Failed to update test status. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with avatar, username, and logout */}
      <header className="bg-white text-black shadow">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Assessment Dashboard</h1>
          </div>
          
          {/* Right side - Welcome message and logout button */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={employee?.avatar} alt={`${employee?.firstName} ${employee?.lastName}`} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              Welcome, {employee?.firstName} {employee?.lastName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-white bg-black border-black hover:bg-green-600 hover:text-black"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <AssessmentLayout>
        <div className="container mx-auto px-6 py-6">
        <Toaster position="top-center" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Assessment Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button asChild className="bg-black text-white hover:text-black hover:bg-green-600">
              <Link href="/employee/assessment/tests/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.totalTests}</div>
                  <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.activeTests}</div>
                  <p className="text-xs text-muted-foreground mt-1">+1 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.totalCandidates}</div>
                  <p className="text-xs text-muted-foreground mt-1">+22 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.completionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Tests & Results Tabs */}
        <Card>
          <Tabs defaultValue="recent-tests" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border">
              <TabsList className="h-auto p-0">
                <TabsTrigger
                  value="recent-tests"
                  className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  Recent Tests
                </TabsTrigger>
                <TabsTrigger
                  value="recent-results"
                  className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  Recent Results
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recent-tests" className="p-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Recent Tests</h3>
                <p className="text-sm text-muted-foreground mb-4">Your recently created or modified tests</p>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : recentTests.length > 0 ? (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Candidates</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTests.map((test) => (
                          <tr key={test._id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/employee/assessment/tests/${test._id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {test.name}
                              </Link>
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {test._id}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  test.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : test.status === "Draft"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {test.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">{test.candidatesCount} invited</td>
                            <td className="py-3 px-4">{formatDate(test.createdAt)}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" asChild>
                                  <Link href={`/employee/assessment/tests/${test._id}`}>View</Link>
                                </Button>
                                <Button className="text-black" variant="outline" size="sm" asChild>
                                  <Link href={`/employee/assessment/tests/${test._id}/edit`}>Edit</Link>
                                </Button>
                                <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" asChild>
                                  <Link href={`/employee/assessment/tests/${test._id}/preview`}>Preview</Link>
                                </Button>
                                {test.status === "Draft" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChangeTestStatus(test._id, "Active")}
                                  >
                                    Publish
                                  </Button>
                                ) : test.status === "Active" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChangeTestStatus(test._id, "Archived")}
                                  >
                                    Archive
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChangeTestStatus(test._id, "Active")}
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tests created yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first assessment test to get started</p>
                    <Button asChild className="bg-black text-white hover:text-black hover:bg-green-600">
                      <Link href="/employee/assessment/tests/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Test
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent-results" className="p-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Recent Results</h3>
                <p className="text-sm text-muted-foreground mb-4">Latest candidate assessment results</p>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : recentResults.length > 0 ? (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Candidate</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completion Date</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResults.map((result) => (
                          <tr key={result._id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{result.candidateName}</td>
                            <td className="py-3 px-4">{result.testName}</td>
                            <td className="py-3 px-4">{result.score}%</td>
                            <td className="py-3 px-4">{formatDate(result.completionDate)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.status === "Passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {result.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No results yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Results will appear here once candidates complete their assessments
                    </p>
                    <Button asChild className="bg-black text-white hover:text-black hover:bg-green-600">
                      <Link href="/employee/assessment/invitations">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Candidates
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
                 </Card>
       </div>
     </AssessmentLayout>
    </div>
   )
 }
