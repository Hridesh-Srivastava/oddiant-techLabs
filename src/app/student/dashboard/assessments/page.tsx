"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  LogOut,
  Clock,
  FileText,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Trophy,
  Eye,
  Search,
  Briefcase,
  Settings,
  Award,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Test {
  id: string
  title: string
  description: string
  duration: number
  questions: number
  difficulty: string
  category: string
  status: string
  createdAt: string
  token?: string // Added token for new logic
}

interface Invitation {
  id: string
  testId: string
  testTitle: string
  description: string
  invitedBy: string
  invitedByEmail: string
  invitedAt: string
  expiresAt: string
  status: string
  duration: number
  questions: number
  difficulty: string
  category: string
  token?: string // Added token for new logic
}

interface YourTest {
  id: string
  testId: string
  testTitle: string
  description: string
  status: string
  score: number | null
  totalQuestions: number
  correctAnswers: number | null
  duration: number
  timeTaken: number | null
  completedAt: string | null
  startedAt?: string
  difficulty: string
  category: string
  grade: string | null
  progress?: number
  token?: string // Added token for new logic
}

interface Result {
  id: string
  testId: string
  testTitle: string
  description: string
  status: string
  score: number
  totalQuestions: number
  correctAnswers: number
  duration: number
  timeTaken: number
  completedAt: string
  difficulty: string
  category: string
  grade: string
  resultStatus: string
}

export default function StudentAssessmentDashboard() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [yourTests, setYourTests] = useState<YourTest[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [invitationStatusFilter, setInvitationStatusFilter] = useState("all")
  const [yourTestsStatusFilter, setYourTestsStatusFilter] = useState("all")
  const [yourTestsCategoryFilter, setYourTestsCategoryFilter] = useState("all")
  const [resultsCategoryFilter, setResultsCategoryFilter] = useState("all")

  // Search states for each section
  const [availableTestsSearch, setAvailableTestsSearch] = useState("");
  const [invitationsSearch, setInvitationsSearch] = useState("");
  const [yourTestsSearch, setYourTestsSearch] = useState("");
  const [resultsSearch, setResultsSearch] = useState("");

    // Filtered lists based on search
    const filteredTests = tests.filter((test) =>
      test.title.toLowerCase().includes(availableTestsSearch.toLowerCase())
    );
  
  const filteredInvitations = invitations.filter((inv) =>
    (inv.testTitle || "").toLowerCase().includes(invitationsSearch.toLowerCase())
  );
  const filteredYourTests = yourTests.filter((test) =>
    (test.testTitle || "").toLowerCase().includes(yourTestsSearch.toLowerCase())
  );
  const filteredResults = results.filter((result) =>
    (result.testTitle || "").toLowerCase().includes(resultsSearch.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Logout failed")
      }
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleTabChange = (value: string) => {
    router.push(`/student/dashboard?tab=${value}`)
  }

  const fetchTests = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (difficultyFilter !== "all") params.append("difficulty", difficultyFilter)

      const response = await fetch(`/api/student/tests?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTests(data.tests)
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const params = new URLSearchParams()
      if (invitationStatusFilter !== "all") params.append("status", invitationStatusFilter)

      const response = await fetch(`/api/student/invitations?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
    }
  }

  const fetchYourTests = async () => {
    try {
      const params = new URLSearchParams()
      if (yourTestsStatusFilter !== "all") params.append("status", yourTestsStatusFilter)
      if (yourTestsCategoryFilter !== "all") params.append("category", yourTestsCategoryFilter)

      const response = await fetch(`/api/student/your-tests?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setYourTests(data.tests)
      }
    } catch (error) {
      console.error("Error fetching your tests:", error)
    }
  }

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams()
      if (resultsCategoryFilter !== "all") params.append("category", resultsCategoryFilter)

      const response = await fetch(`/api/student/results?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      await Promise.all([fetchTests(), fetchInvitations(), fetchYourTests(), fetchResults()])
      setLoading(false)
    }
    fetchAllData()
  }, [])

  useEffect(() => {
    fetchTests()
  }, [categoryFilter, difficultyFilter])

  useEffect(() => {
    fetchInvitations()
  }, [invitationStatusFilter])

  useEffect(() => {
    fetchYourTests()
  }, [yourTestsStatusFilter, yourTestsCategoryFilter])

  useEffect(() => {
    fetchResults()
  }, [resultsCategoryFilter])

  // Map testId to the latest invitation token (pending or completed)
  const latestInvitationTokenMap: Record<string, string | undefined> = {};
  invitations
    .filter((inv) =>
      ["pending", "completed"].includes((inv.status || "").toLowerCase()) &&
      new Date(inv.expiresAt) > new Date()
    )
    .sort((a, b) => {
      const dateA = new Date(a.invitedAt).getTime();
      const dateB = new Date(b.invitedAt).getTime();
      return dateB - dateA;
    })
    .forEach((inv) => {
      if (!latestInvitationTokenMap[inv.testId]) {
        latestInvitationTokenMap[inv.testId] = inv.token;
      }
    });

  const getDifficultyColor = (difficulty: string | undefined) => {
    if (!difficulty) {
      return "bg-gray-100 text-gray-800"
    }
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "published":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade?.includes("A")) return "text-green-600"
    if (grade?.includes("B")) return "text-blue-600"
    if (grade?.includes("C")) return "text-yellow-600"
    return "text-red-600"
  }

  const handleStartTest = (tokenOrId: string) => {
    window.open(`/exam/system-check?token=${tokenOrId}`, '_blank');
  }

  const handleAcceptInvitation = (invitationId: string) => {
    console.log(`Accepting invitation: ${invitationId}`)
  }

  const handleViewResult = (resultId: string) => {
    router.push(`/student/dashboard/assessments/results/${resultId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Fix: Completed tests should include all finished statuses (passed, failed, completed)
  const completedTests = yourTests.filter((test) => ["passed", "failed", "completed"].includes((test.status || "").toLowerCase()))
  const inProgressTests = yourTests.filter((test) => test.status === "in-progress")
  // Fix: Invitations should include all non-expired invitations (pending or completed)
  const pendingInvitations = invitations.filter((inv) => ["pending", "completed"].includes((inv.status || "").toLowerCase()) && new Date(inv.expiresAt) > new Date())
  const publishedResults = results.filter((result) => result.resultStatus === "published")

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Navigation Tabs - Same as main dashboard */}
        <div className="mb-8">
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => handleTabChange("jobs")}
              className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"
            >
              <Briefcase className="h-4 w-4 inline mr-2" />
              Job Openings
            </button>
            <button
              onClick={() => handleTabChange("applications")}
              className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"
            >
              <FileText className="h-4 w-4 inline mr-2" />
              My Applications
            </button>
            <button
              onClick={() => handleTabChange("profile")}
              className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"
            >
              <User className="h-4 w-4 inline mr-2" />
              My Profile
            </button>
            {/* Active Assessments Tab */}
            <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
              <Award className="h-4 w-4 inline mr-2" />
              Assessments
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Dashboard</h2>
          <p className="text-gray-600">Manage your assessments and track your progress</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Tests</CardTitle>
              <CardDescription>Tests you can take</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
              <p className="text-sm text-gray-500 mt-2">Ready to start</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitations</CardTitle>
              <CardDescription>Pending invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingInvitations.length}</div>
              <p className="text-sm text-gray-500 mt-2">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed</CardTitle>
              <CardDescription>Tests finished</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTests.length}</div>
              <p className="text-sm text-gray-500 mt-2">View results</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Results Published</CardTitle>
              <CardDescription>Results available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{publishedResults.length}</div>
              <p className="text-sm text-gray-500 mt-2">Check your scores</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available">Available Tests</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="your-tests">Your Tests</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Available Tests Tab */}
          <TabsContent value="available">
            <div className="mb-4">
              <Input
                placeholder="Search available tests..."
                value={availableTestsSearch}
                onChange={e => setAvailableTestsSearch(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Available Tests</CardTitle>
                    <CardDescription>Choose a test to begin your assessment</CardDescription>
                  </div>
                  <div className="flex gap-4">
                  <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="programming">Programming</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                    </select>

                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>

                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading tests...</div>
                  </div>
                  ) : filteredTests.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tests available with current filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredTests.map((test) => {
                      const token = latestInvitationTokenMap[test.id];
                      // Debug log to compare tokens and statuses
                      const testResultTokensStatuses = yourTests.filter(t => t.testId === test.id).map(t => ({ token: t.token, status: t.status }));
                      console.log('DEBUG: test.id', test.id, 'button token', token, 'result tokens/statuses', testResultTokensStatuses);
                      // Find if there is a submission for this test and this token (latest invitation)
                      const isTestCompletedForToken = yourTests.some(
                        (t) =>
                          t.testId === test.id &&
                          t.token === token &&
                          ["failed", "passed", "completed"].includes((t.status || "").toLowerCase())
                      );
                      return (
                        <Card key={test.id} className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{test.title}</CardTitle>
                                <CardDescription className="mt-2">{test.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{test.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{test.questions} questions</span>
                              </div>
                              <Badge variant="outline">{test.category}</Badge>
                            </div>
                            {token && !isTestCompletedForToken ? (
                              <Button onClick={() => handleStartTest(token)} className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Start Test
                              </Button>
                            ) : isTestCompletedForToken ? (
                              <Button className="w-full bg-green-600 text-white hover:bg-green-700" disabled>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                              </Button>
                            ) : (
                              <Button className="w-full" disabled>
                                <Play className="h-4 w-4 mr-2" />
                                No Invitation
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <div className="mb-4">
              <Input
                placeholder="Search invitations..."
                value={invitationsSearch}
                onChange={e => setInvitationsSearch(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Test Invitations</CardTitle>
                    <CardDescription>Invitations from instructors and organizations</CardDescription>
                  </div>
                  <select
                    value={invitationStatusFilter}
                    onChange={(e) => setInvitationStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading invitations...</div>
                  </div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No invitations found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation) => (
                      <Card key={invitation.id} className="border-l-4 border-l-orange-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{invitation.testTitle}</CardTitle>
                              <CardDescription className="mt-2">{invitation.description}</CardDescription>
                              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>Invited by: {invitation.invitedBy}</span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(invitation.status)}>{invitation.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{invitation.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{invitation.questions} questions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Expires: {formatDate(invitation.expiresAt)}</span>
                            </div>
                            <Badge className={getDifficultyColor(invitation.difficulty)}>{invitation.difficulty}</Badge>
                          </div>

                          {invitation.status === "pending" && (
                            <div className="flex gap-2">
                              <Button onClick={() => handleAcceptInvitation(invitation.id)} className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Invitation
                              </Button>
                              <Button variant="outline" className="flex-1 bg-transparent">
                                Decline
                              </Button>
                            </div>
                          )}

                          {invitation.status === "accepted" && (
                            <Button onClick={() => handleStartTest(invitation.testId)} className="w-full">
                              <Play className="h-4 w-4 mr-2" />
                              Start Test
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Your Tests Tab */}
          <TabsContent value="your-tests">
            <div className="mb-4">
              <Input
                placeholder="Search your tests..."
                value={yourTestsSearch}
                onChange={e => setYourTestsSearch(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Your Tests</CardTitle>
                    <CardDescription>Track your completed and in-progress assessments</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={yourTestsStatusFilter}
                      onChange={(e) => setYourTestsStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                    </select>

                    <select
                      value={yourTestsCategoryFilter}
                      onChange={(e) => setYourTestsCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="programming">Programming</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="design">Design</option>
                      <option value="computer science">Computer Science</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading your tests...</div>
                  </div>
                ) : filteredYourTests.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tests found with current filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredYourTests.map((test) => (
                      <Card
                        key={test.id}
                        className={`border-l-4 ${test.status === "completed" ? "border-l-green-500" : "border-l-blue-500"}`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{test.testTitle}</CardTitle>
                              <CardDescription className="mt-2">{test.description}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                              {test.grade && (
                                <Badge variant="outline" className={getGradeColor(test.grade)}>
                                  {test.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{test.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{test.totalQuestions} questions</span>
                            </div>
                            <Badge variant="outline">{test.category}</Badge>
                          </div>

                          {test.status === "completed" && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Score: {test.score}%</span>
                                <span>
                                  Correct: {test.correctAnswers}/{test.totalQuestions}
                                </span>
                                <span>Time: {test.timeTaken} min</span>
                              </div>
                              <Progress value={test.score || 0} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">Completed on {formatDate(test.completedAt!)}</p>
                            </div>
                          )}

                          {test.status === "in-progress" && test.progress && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Progress: {test.progress}%</span>
                                <span>Started: {formatDate(test.startedAt!)}</span>
                              </div>
                              <Progress value={test.progress} className="h-2" />
                            </div>
                          )}

                          <div className="flex gap-2">
                            {test.status === "completed" && (
                              <Button onClick={() => handleViewResult(test.id)} variant="outline" className="flex-1">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            )}
                            {test.status === "in-progress" && (
                              <Button onClick={() => handleStartTest(test.testId)} className="flex-1">
                                Continue Test
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="mb-4">
              <Input
                placeholder="Search results..."
                value={resultsSearch}
                onChange={e => setResultsSearch(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Test Results</CardTitle>
                    <CardDescription>View detailed results of your completed assessments</CardDescription>
                  </div>
                  <select
                    value={resultsCategoryFilter}
                    onChange={(e) => setResultsCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="programming">Programming</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="design">Design</option>
                    <option value="computer science">Computer Science</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading results...</div>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No published results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <Card key={result.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{result.testTitle}</CardTitle>
                              <CardDescription className="mt-2">{result.description}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(result.resultStatus)}>{result.resultStatus}</Badge>
                              {result.grade && (
                                <Badge variant="outline" className={getGradeColor(result.grade)}>
                                  {result.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{result.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{result.totalQuestions} questions</span>
                            </div>
                            <Badge className={getDifficultyColor(result.difficulty)}>{result.difficulty}</Badge>
                            <Badge variant="outline">{result.category}</Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Score: {result.score}%</span>
                              <span>
                                Correct: {result.correctAnswers}/{result.totalQuestions}
                              </span>
                              <span>Time: {result.timeTaken} min</span>
                            </div>
                            <Progress value={result.score || 0} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Completed on {formatDate(result.completedAt!)}</p>
                          </div>

                          <Button onClick={() => handleViewResult(result.id)} className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Detailed Results
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
