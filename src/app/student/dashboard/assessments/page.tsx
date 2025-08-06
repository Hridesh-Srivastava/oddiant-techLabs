"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast, Toaster } from "sonner"
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
  type?: string // Add this line
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
  type?: string // Add this line to fix linter error
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
  type?: string // Add this line to fix linter error
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
  type?: string // Add this line
}

interface StudentData {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  avatar?: string;
  [key: string]: any;
}

export default function StudentAssessmentDashboard() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [yourTests, setYourTests] = useState<YourTest[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")
  
  // Student data state
  const [student, setStudent] = useState<StudentData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    test.title.toLowerCase().includes(availableTestsSearch.toLowerCase()) ||
    (test.id && test.id.toLowerCase().includes(availableTestsSearch.toLowerCase()))
  );

  const filteredInvitations = invitations.filter((inv) =>
    (inv.testTitle || "").toLowerCase().includes(invitationsSearch.toLowerCase()) ||
    (inv.id && inv.id.toLowerCase().includes(invitationsSearch.toLowerCase()))
  );
  const filteredYourTests = yourTests.filter((test) =>
    (test.testTitle || "").toLowerCase().includes(yourTestsSearch.toLowerCase())
  );
  const filteredResults = results.filter((result) =>
    (result.testTitle || "").toLowerCase().includes(resultsSearch.toLowerCase())
  );

  // Add state for recent tests filter
  const [showRecentTests, setShowRecentTests] = useState(false);

  // Add state for recent invitations filter
  const [showRecentInvitations, setShowRecentInvitations] = useState(false);

  // Add state for recent your tests filter
  const [showRecentYourTests, setShowRecentYourTests] = useState(false);

  // Add state for recent results filter
  const [showRecentResults, setShowRecentResults] = useState(false);

  // Helper function to get full name
  const getFullName = (student: StudentData): string => {
    if (!student) return ""
    const salutation = student.salutation || ""
    const firstName = student.firstName || ""
    const middleName = student.middleName || ""
    const lastName = student.lastName || ""
    return `${salutation} ${firstName} ${middleName} ${lastName}`.trim()
  }

  // Fetch student data
  const fetchStudentData = async () => {
    try {
      const response = await fetch("/api/student/profile", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.status === 401) {
        router.push("/auth/login")
        return
      }

      if (!response.ok) {
        console.error("Failed to load profile data")
        return
      }

      const data = await response.json()

      if (!data.success) {
        console.error("Failed to load profile data")
        return
      }

      setStudent(data.student)
    } catch (error) {
      console.error("Error loading profile data:", error)
    }
  }

  // Fetch all data function
  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([fetchStudentData(), fetchTests(), fetchInvitations(), fetchYourTests(), fetchResults()])
    setLoading(false)
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchAllData()
      toast.success("Data refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filtered tests by category
  const filteredByCategory = categoryFilter === "all"
    ? filteredTests
    : filteredTests.filter((test) => (test.type || "").replace(/\s+/g, "_").toLowerCase() === categoryFilter.toLowerCase());

  // Filtered by recent
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const filteredByRecent = showRecentTests
    ? filteredByCategory.filter((test) => new Date(test.createdAt) >= fiveDaysAgo)
    : filteredByCategory;

  // Map UI filter values to backend status values
  const statusMap: Record<string, string> = {
    all: "all",
    pending: "Pending",
    completed: "Completed",
  };

  // Filter by status using mapped backend values
  const filteredByStatus = invitationStatusFilter === "all"
    ? filteredInvitations
    : filteredInvitations.filter((inv) => (inv.status || "").toLowerCase() === statusMap[invitationStatusFilter].toLowerCase());

  // Filter by recent
  const nowInv = new Date();
  const fiveDaysAgoInv = new Date(nowInv.getTime() - 5 * 24 * 60 * 60 * 1000);
  const filteredByRecentInv = showRecentInvitations
    ? filteredByStatus.filter((inv) => new Date(inv.invitedAt) >= fiveDaysAgoInv)
    : filteredByStatus;

  // Filter for recent your tests (last 5 days)
  const nowYT = new Date();
  const fiveDaysAgoYT = new Date(nowYT.getTime() - 5 * 24 * 60 * 60 * 1000);
  const filteredYourTestsByRecent = showRecentYourTests
    ? filteredYourTests.filter((test) => new Date(test.completedAt || test.startedAt || 0) >= fiveDaysAgoYT)
    : filteredYourTests;

  // Update category filter for your tests to use type (like available tests)
  const filteredYourTestsByCategory = yourTestsCategoryFilter === "all"
    ? filteredYourTestsByRecent
    : filteredYourTestsByRecent.filter((test) => (test.type || "").replace(/\s+/g, "_").toLowerCase() === yourTestsCategoryFilter.toLowerCase());

  // Filter for recent results (last 5 days)
  const nowRes = new Date();
  const fiveDaysAgoRes = new Date(nowRes.getTime() - 5 * 24 * 60 * 60 * 1000);
  const filteredResultsByRecent = showRecentResults
    ? filteredResults.filter((result) => new Date(result.completedAt || 0) >= fiveDaysAgoRes)
    : filteredResults;

  // Pagination state and logic (now after all filtered variables)
  const [availablePage, setAvailablePage] = useState(1)
  const [invitationsPage, setInvitationsPage] = useState(1)
  const [yourTestsPage, setYourTestsPage] = useState(1)
  const [resultsPage, setResultsPage] = useState(1)
  const PER_PAGE = 8
  useEffect(() => { setAvailablePage(1) }, [availableTestsSearch, categoryFilter, difficultyFilter, showRecentTests])
  useEffect(() => { setInvitationsPage(1) }, [invitationsSearch, invitationStatusFilter, showRecentInvitations])
  useEffect(() => { setYourTestsPage(1) }, [yourTestsSearch, yourTestsStatusFilter, yourTestsCategoryFilter, showRecentYourTests])
  useEffect(() => { setResultsPage(1) }, [resultsSearch, resultsCategoryFilter, showRecentResults])
  const paginatedAvailable = filteredByRecent.slice((availablePage-1)*PER_PAGE, availablePage*PER_PAGE)
  const paginatedInvitations = filteredByRecentInv.slice((invitationsPage-1)*PER_PAGE, invitationsPage*PER_PAGE)
  const paginatedYourTests = filteredYourTestsByCategory.slice((yourTestsPage-1)*PER_PAGE, yourTestsPage*PER_PAGE)
  const paginatedResults = filteredResultsByRecent.slice((resultsPage-1)*PER_PAGE, resultsPage*PER_PAGE)
  const totalAvailablePages = Math.max(1, Math.ceil(filteredByRecent.length / PER_PAGE))
  const totalInvitationsPages = Math.max(1, Math.ceil(filteredByRecentInv.length / PER_PAGE))
  const totalYourTestsPages = Math.max(1, Math.ceil(filteredYourTestsByCategory.length / PER_PAGE))
  const totalResultsPages = Math.max(1, Math.ceil(filteredResultsByRecent.length / PER_PAGE))

  // Category options for test types
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "Frontend", label: "Frontend" },
    { value: "Backend", label: "Backend" },
    { value: "Full Stack", label: "Full Stack" },
    { value: "QA", label: "QA" },
    { value: "DevOps", label: "DevOps" },
    { value: "Problem_Solving", label: "Problem Solving" },
    { value: "Data_Science", label: "Data Science" },
    { value: "Data_Analysis", label: "Data Analysis" },
    { value: "Math/Aptitude", label: "Math/Aptitude" },
    { value: "Verbal_Ability", label: "Verbal Ability" },
    { value: "Programming_Logic", label: "Programming Logic" },
  ];

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
        // Map type from backend
        setTests(data.tests.map((t: any) => ({ ...t, type: t.type || t.category || "" })))
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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <header className="bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-black">
              Candidate Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={student?.avatar} alt={student ? getFullName(student) : "User"} />
                <AvatarFallback className="text-xs">
                  {student ? getFullName(student).split(' ').map(n => n[0]).join('').toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-black">
                Welcome, {student ? getFullName(student) : "User"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-black text-white border-black hover:bg-green-600 hover:text-black group"
            >
              <LogOut className="h-4 w-4 mr-2 text-white group-hover:text-black" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Navigation Tabs - Same as main dashboard */}
        <div className="mb-8">
          <div className="flex items-center border-b">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mb-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-input bg-background shadow-sm refresh-button-hover"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            
            <div className="flex space-x-2 justify-center flex-1 -ml-24">
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
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Dashboard</h2>
          <p className="text-gray-600">Manage your assessments and track your progress</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white">Available Tests</CardTitle>
              <CardDescription className="text-white">Tests you can take</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{tests.length}</div>
              <p className="text-sm text-white mt-2">Ready to start</p>
            </CardContent>
          </Card>

          <Card className="bg-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white">Invitations</CardTitle>
              <CardDescription className="text-white">Pending invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingInvitations.length}</div>
              <p className="text-sm text-white mt-2">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white">Completed</CardTitle>
              <CardDescription className="text-white">Tests finished</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completedTests.length}</div>
              <p className="text-sm text-white mt-2">View results</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white">Results Published</CardTitle>
              <CardDescription className="text-white">Results available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{publishedResults.length}</div>
              <p className="text-sm text-white mt-2">Check your scores</p>
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
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <Input
                placeholder="Search available tests..."
                value={availableTestsSearch}
                onChange={e => setAvailableTestsSearch(e.target.value)}
                className="w-full max-w-md"
              />
              <select
                className="border rounded px-3 py-2"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button
                variant={showRecentTests ? "default" : "outline"}
                onClick={() => setShowRecentTests(!showRecentTests)}
                className="ml-2"
              >
                {showRecentTests ? "Show All Tests" : "Show Recent Tests"}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Available Tests</CardTitle>
                    <CardDescription>Choose a test to begin your assessment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading tests...</div>
                  </div>
                ) : paginatedAvailable.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tests available with current filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedAvailable.map((test) => {
                      const token = latestInvitationTokenMap[test.id];
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
                                <div className="text-xs text-black mb-1">ID: {test.id}</div>
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
                              {/* Test Type */}
                              {['Frontend','Backend','Full Stack','QA','DevOps','Problem_Solving','Data_Science','Data_Analysis','Math/Aptitude','Verbal_Ability','Programming_Logic'].includes(test.type || "") && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">{test.type}</span>
                              )}
                              {/* Created At */}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs">{formatDate(test.createdAt)}</span>
                              </div>
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
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setAvailablePage(p => Math.max(1, p-1))} disabled={availablePage===1} className="flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  {Array.from({length: totalAvailablePages}, (_,i) => (
                                         <Button key={i} variant="outline" size="sm" onClick={()=>setAvailablePage(i+1)} className={availablePage===i+1?"bg-black text-white hover:bg-green-600 hover:text-black":"hover:bg-green-600 hover:text-black"}>{i+1}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={()=>setAvailablePage(p=>Math.min(totalAvailablePages,p+1))} disabled={availablePage===totalAvailablePages} className="flex items-center">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <Input
                placeholder="Search invitations..."
                value={invitationsSearch}
                onChange={e => setInvitationsSearch(e.target.value)}
                className="w-full max-w-md"
              />
              <select
                value={invitationStatusFilter}
                onChange={(e) => setInvitationStatusFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                variant={showRecentInvitations ? "default" : "outline"}
                onClick={() => setShowRecentInvitations(!showRecentInvitations)}
                className="ml-2"
              >
                {showRecentInvitations ? "Show All Invitations" : "Show Recent Invitations"}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Test Invitations</CardTitle>
                    <CardDescription>Invitations from instructors and organizations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading invitations...</div>
                  </div>
                ) : paginatedInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No invitations found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedInvitations.map((invitation) => (
                      <Card key={invitation.id} className="border-l-4 border-l-orange-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-black mb-1">ID: {invitation.id}</div>
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
                            {/* Test Type */}
                            {['Frontend','Backend','Full Stack','QA','DevOps','Problem_Solving','Data_Science','Data_Analysis','Math/Aptitude','Verbal_Ability','Programming_Logic'].includes(invitation.type || "") && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">{invitation.type}</span>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Expires: {formatDate(invitation.expiresAt)}</span>
                            </div>
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

                          {invitation.status === "completed" && (
                            <Button className="w-full bg-green-600 text-white hover:bg-green-700" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setInvitationsPage(p => Math.max(1, p-1))} disabled={invitationsPage===1} className="flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  {Array.from({length: totalInvitationsPages}, (_,i) => (
                                         <Button key={i} variant="outline" size="sm" onClick={()=>setInvitationsPage(i+1)} className={invitationsPage===i+1?"bg-black text-white hover:bg-green-600 hover:text-black":"hover:bg-green-600 hover:text-black"}>{i+1}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={()=>setInvitationsPage(p=>Math.min(totalInvitationsPages,p+1))} disabled={invitationsPage===totalInvitationsPages} className="flex items-center">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Your Tests Tab */}
          <TabsContent value="your-tests">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <Input
                placeholder="Search your tests..."
                value={yourTestsSearch}
                onChange={e => setYourTestsSearch(e.target.value)}
                className="w-full max-w-md"
              />
              <select
                value={yourTestsCategoryFilter}
                onChange={(e) => setYourTestsCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button
                variant={showRecentYourTests ? "default" : "outline"}
                onClick={() => setShowRecentYourTests(!showRecentYourTests)}
                className="ml-2"
              >
                {showRecentYourTests ? "Show All Tests" : "Your Recent Tests"}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Your Tests</CardTitle>
                    <CardDescription>Track your completed and in-progress assessments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading your tests...</div>
                  </div>
                ) : paginatedYourTests.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tests found with current filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedYourTests.map((test) => (
                      <Card
                        key={test.id}
                        className={`border-l-4 ${test.status === "completed" ? "border-l-green-500" : "border-l-blue-500"}`}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-black mb-1">ID: {test.testId}</div>
                              <CardTitle className="text-lg">{test.testTitle}</CardTitle>
                              <CardDescription className="mt-2">{test.description}</CardDescription>
                              {/* Test Type/Category Badge */}
                              {['Frontend','Backend','Full Stack','QA','DevOps','Problem_Solving','Data_Science','Data_Analysis','Math/Aptitude','Verbal_Ability','Programming_Logic'].includes(test.type || "") && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold mt-2 inline-block">{test.type}</span>
                              )}
                              {/* Given Date */}
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span className="text-black">Given on: {formatDate(test.completedAt || test.startedAt || "")}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {/* Removed Passed/Failed badge for Your Tests */}
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
                          </div>

                          {test.status === "completed" && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Score: {test.score}%</span>
                                <span>
                                  Correct: {test.correctAnswers}/{test.totalQuestions}
                                </span>
                                <span>Time: {typeof test.timeTaken === 'number' && test.timeTaken > 0 ? `${Math.round(test.timeTaken)} min` : 'N/A'}</span>
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
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setYourTestsPage(p => Math.max(1, p-1))} disabled={yourTestsPage===1} className="flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  {Array.from({length: totalYourTestsPages}, (_,i) => (
                                         <Button key={i} variant="outline" size="sm" onClick={()=>setYourTestsPage(i+1)} className={yourTestsPage===i+1?"bg-black text-white hover:bg-green-600 hover:text-black":"hover:bg-green-600 hover:text-black"}>{i+1}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={()=>setYourTestsPage(p=>Math.min(totalYourTestsPages,p+1))} disabled={yourTestsPage===totalYourTestsPages} className="flex items-center">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <Input
                placeholder="Search results..."
                value={resultsSearch}
                onChange={e => setResultsSearch(e.target.value)}
                className="w-full max-w-md"
              />
              <select
                value={resultsCategoryFilter}
                onChange={(e) => setResultsCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button
                variant={showRecentResults ? "default" : "outline"}
                onClick={() => setShowRecentResults(!showRecentResults)}
                className="ml-2"
              >
                {showRecentResults ? "Show All Results" : "Your Recent Results"}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Test Results</CardTitle>
                    <CardDescription>View detailed results of your completed assessments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading results...</div>
                  </div>
                ) : paginatedResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No published results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedResults.map((result) => (
                      <Card key={result.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-black mb-1">ID: {result.id}</div>
                              <CardTitle className="text-lg">{result.testTitle}</CardTitle>
                              <CardDescription className="mt-2">{result.description}</CardDescription>
                              {/* Test Type/Category Badge */}
                              {['Frontend','Backend','Full Stack','QA','DevOps','Problem_Solving','Data_Science','Data_Analysis','Math/Aptitude','Verbal_Ability','Programming_Logic'].includes(result.type || "") && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold mt-2 inline-block">{result.type}</span>
                              )}
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
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Score: {result.score}%</span>
                              <span>
                                Correct: {result.correctAnswers}/{result.totalQuestions}
                              </span>
                              <span>Time: {typeof result.timeTaken === 'number' && result.timeTaken > 0 ? `${Math.round(result.timeTaken)} min` : 'N/A'}</span>
                            </div>
                            <Progress value={result.score || 0} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Completed on {formatDate(result.completedAt!)}</p>
                          </div>

                          <Button onClick={() => handleViewResult(result.id)} className="w-full hover:bg-green-600 hover:text-black">
                            <Eye className="h-4 w-4 mr-2" />
                            View Detailed Results
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setResultsPage(p => Math.max(1, p-1))} disabled={resultsPage===1} className="flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  {Array.from({length: totalResultsPages}, (_,i) => (
                                         <Button key={i} variant="outline" size="sm" onClick={()=>setResultsPage(i+1)} className={resultsPage===i+1?"bg-black text-white hover:bg-green-600 hover:text-black":"hover:bg-green-600 hover:text-black"}>{i+1}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={()=>setResultsPage(p=>Math.min(totalResultsPages,p+1))} disabled={resultsPage===totalResultsPages} className="flex items-center">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
