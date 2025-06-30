"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast, Toaster } from "sonner"
import {
  User,
  Briefcase,
  Settings,
  Users,
  Calendar,
  PlusCircle,
  Search,
  RefreshCw,
  Download,
  LogOut,
  Clock,
  Send,
  UserCog,
  BarChart,
  ClipboardCheck,
  ArrowUpRight,
  Eye,
  Plus,
  Edit,
  Video,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useCandidateSelection } from "@/components/candidate-selection-context"
import { CandidatesFilterBar } from "@/components/candidates/candidates-filter-bar"
import AvatarUpload from "@/components/avatar-upload"
import JobPostingForm from "@/components/job-posting-form"
import withAuth from "@/components/auth/withAuth"
import type { Employee } from "@/types"
import { FilterPanel } from "@/components/ats/filter-panel"
import { CandidateList } from "@/components/ats/candidate-list"
import { FilterDropdown } from "@/components/ats/filter-dropdown"
import { CandidateSelectionProvider } from "@/components/candidate-selection-context"

interface EmployeeData {
  _id: string
  firstName: string
  lastName: string
  email: string
  alternativeEmail?: string
  designation?: string
  companyName?: string
  companyLocation?: string
  phone?: string
  profileCompleted?: boolean
  avatar?: string
  companyId?: string
  notificationSettings?: {
    emailNotifications: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
  }
}

interface Candidate {
  _id: string
  name: string
  email: string
  emailAddress?: string
  role: string
  status: string
  avatar?: string
  appliedDate: string
  skills: string[]
  location: string
  currentCity?: string
  city?: string
  currentState?: string
  yearsOfExperience: number
  currentPosition: string
  designation?: string
  content: string
  profileOutline?: string
  summary?: string
  aboutMe?: string
  description?: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  mobileNumber?: string
  website: string
  experience: any[]
  education: any[]
  matchScore: number
  gender: string
  state: string
  currentSalary: number
  age: number
  industry?: string
  collection?: string
  employerId: string // Added for data isolation
  geminiScore?: number // Gemini ATS score prediction
  geminiFeedback?: string // Gemini ATS feedback
}

interface JobPosting {
  _id: string
  jobTitle: string
  department: string
  jobType: string
  jobLocation: string
  applicants?: number
  daysLeft?: number
  interviews?: number
  createdAt: string
  updatedAt?: string
  employerId: string // Added for data isolation
}

interface Interview {
  _id: string
  candidate: {
    name: string
    email: string
  }
  position: string
  date: string
  time: string
  jobId?: string
  status: string
  meetingLink?: string
  notes?: string
  duration?: number
  employerId: string // Added for data isolation
}

interface DashboardStats {
  activeCandidates: number
  openPositions: number
  interviewsToday: number
  hiringSuccessRate: number
}

// Define props interface for EmployeeDashboard
interface EmployeeDashboardProps {
  userData?: Employee | null
}

// Main component with typed props
function EmployeeDashboard({ userData = null }: EmployeeDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  // Add pagination states
  const [currentCandidatesPage, setCurrentCandidatesPage] = useState(1)
  const [currentJobsPage, setCurrentJobsPage] = useState(1)
  const itemsPerPage = 6

  // Pagination calculation functions
  const paginateItems = (items: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  const calculateTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  // Pagination UI component
  const PaginationControls = ({
    currentPage,
    totalItems,
    onPageChange,
  }: {
    currentPage: number
    totalItems: number
    onPageChange: (page: number) => void
  }) => {
    const totalPages = calculateTotalPages(totalItems)

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4 ml-1" />
          Previous
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className={`${pageNum === currentPage ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-100"}`}
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    )
  }

  const [employee, setEmployee] = useState<EmployeeData | null>(null)

  // Enhanced debugging and monitoring
  useEffect(() => {
    if (employee && employee._id) {
      console.log("👤 Employer loaded:", {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        companyId: employee.companyId,
      })
    }
  }, [employee])

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(tabParam || "overview")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeCandidates: 0,
    openPositions: 0,
    interviewsToday: 0,
    hiringSuccessRate: 0,
  })

  useEffect(() => {
    console.log(`📊 Dashboard Stats Updated:`, dashboardStats)
  }, [dashboardStats])

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    interviewReminders: true,
  })
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    alternativeEmail: "",
    phone: "",
  })
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)
  const [isSingleExporting, setIsSingleExporting] = useState<string | null>(null)
  const [emailError, setEmailError] = useState("")
  const [globalSearchTerm, setGlobalSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{
    candidates: Candidate[]
    jobs: JobPosting[]
    interviews: Interview[]
  }>({
    candidates: [],
    jobs: [],
    interviews: [],
  })
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Get candidate selection context
  const { selectedCandidates, toggleCandidateSelection, selectAllCandidates, clearSelectedCandidates, isSelected } =
    useCandidateSelection()

  // ATS State Variables
  const [atsResumes, setAtsResumes] = useState<Candidate[]>([])
  const [atsFilteredResumes, setAtsFilteredResumes] = useState<Candidate[]>([])

  useEffect(() => {
    console.log(`🎯 ATS Tab - Resumes loaded: ${atsResumes.length}, Filtered: ${atsFilteredResumes.length}`)
  }, [atsResumes, atsFilteredResumes])

  const [atsSelectedResume, setAtsSelectedResume] = useState<Candidate | null>(null)
  const [atsSearchTerm, setAtsSearchTerm] = useState("")
  const [atsIsLoading, setAtsIsLoading] = useState(true)
  const [atsIsExporting, setAtsIsExporting] = useState(false)
  const [atsFilters, setAtsFilters] = useState({
    mandatoryKeywords: [] as string[],
    preferredKeywords: [] as string[],
    location: "",
    state: "",
    educationLevel: [] as string[],
    gender: "",
    experienceRange: [0, 20],
    salaryRange: [0, 200000],
    industry: "",
    ageRange: [18, 65],
    notKeywords: [] as string[],
    atsScore: 0,
    assets: {
      bike: false,
      car: false,
      wifi: false,
      laptop: false,
    },
    shiftPreference: "",
  })

  const [atsHighlightKeywords, setAtsHighlightKeywords] = useState(true)

  // Column filter states for ATS candidates
  const [candidateNameFilter, setCandidateNameFilter] = useState<string[]>([])
  const [positionFilter, setPositionFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [appliedDateFilter, setAppliedDateFilter] = useState<string[]>([])

  // Sort states
  const [candidateNameSort, setCandidateNameSort] = useState<"asc" | "desc" | null>(null)
  const [positionSort, setPositionSort] = useState<"asc" | "desc" | null>(null)
  const [statusSort, setStatusSort] = useState<"asc" | "desc" | null>(null)
  const [appliedDateSort, setAppliedDateSort] = useState<"asc" | "desc" | null>(null)

  // After filteredCandidates state declaration:
  const prevFilteredIds = useRef<string[]>([])
  useEffect(() => {
    const currentIds = filteredCandidates.map(c => c._id).sort().join(",")
    const prevIds = prevFilteredIds.current.sort().join(",")
    if (currentIds !== prevIds) {
      clearSelectedCandidates()
      prevFilteredIds.current = filteredCandidates.map(c => c._id)
    }
  }, [filteredCandidates, clearSelectedCandidates])

  // Effect to update the URL when tab changes
  useEffect(() => {
    if (activeTab !== tabParam) {
      router.push(`/employee/dashboard?tab=${activeTab}`, { scroll: false })
    }
  }, [activeTab, router, tabParam])

  // Global search function
  const handleGlobalSearch = useCallback(() => {
    if (!globalSearchTerm.trim()) {
      setShowSearchResults(false)
      return
    }

    const searchTermLower = globalSearchTerm.toLowerCase()

    // Search in candidates
    const matchedCandidates = candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTermLower) ||
        candidate.email.toLowerCase().includes(searchTermLower) ||
        candidate.role.toLowerCase().includes(searchTermLower) ||
        candidate.status.toLowerCase().includes(searchTermLower) ||
        candidate.location.toLowerCase().includes(searchTermLower),
    )

    // Search in jobs
    const matchedJobs = jobPostings.filter(
      (job) =>
        job.jobTitle.toLowerCase().includes(searchTermLower) ||
        job.department.toLowerCase().includes(searchTermLower) ||
        job.jobType.toLowerCase().includes(searchTermLower) ||
        job.jobLocation.toLowerCase().includes(searchTermLower),
    )

    // Search in interviews
    const matchedInterviews = interviews.filter(
      (interview) =>
        interview.candidate.name.toLowerCase().includes(searchTermLower) ||
        interview.candidate.email.toLowerCase().includes(searchTermLower) ||
        interview.position.toLowerCase().includes(searchTermLower) ||
        interview.status.toLowerCase().includes(searchTermLower) ||
        interview.date.toLowerCase().includes(searchTermLower),
    )

    setSearchResults({
      candidates: matchedCandidates,
      jobs: matchedJobs,
      interviews: matchedInterviews,
    })

    setShowSearchResults(true)
  }, [globalSearchTerm, candidates, jobPostings, interviews])

  // Effect to trigger search when search term changes
  useEffect(() => {
    if (globalSearchTerm.trim()) {
      handleGlobalSearch()
    } else {
      setShowSearchResults(false)
    }
  }, [globalSearchTerm, handleGlobalSearch])

  // Handle search result click
  const handleSearchResultClick = (type: string, id: string) => {
    setShowSearchResults(false)

    if (type === "candidate") {
      router.push(`/employee/candidates/${id}`)
    } else if (type === "job") {
      router.push(`/employee/jobs/${id}`)
    } else if (type === "interview") {
      router.push(`/employee/interviews/${id}`)
    }
  }

  // Memoized fetch functions to avoid recreating them on every render
  const fetchCandidates = useCallback(async () => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping candidate fetch")
        return
      }

      const response = await fetch("/api/employee/candidates", {
        // Add cache busting to prevent caching
        cache: "no-store",
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

      // Filter candidates to only show those belonging to the current employee
      const employeeCandidates = data.candidates.filter((candidate: any) => {
        return candidate.employerId === employee._id || candidate.companyId === employee._id
      })

      console.log(`Filtered ${data.candidates.length} candidates to ${employeeCandidates.length} for this employee`)

      // Format the data with minimal normalization
      const formattedCandidates = employeeCandidates.map((candidate: any) => ({
        _id: candidate._id,
        name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim(),
        email: candidate.email || candidate.emailAddress || "",
        role: candidate.role || candidate.currentPosition || "Not specified",
        status: candidate.status || "Applied",
        avatar:
          candidate.avatar ||
          candidate.profilePicture ||
          candidate.photographUrl ||
          "/placeholder.svg?height=40&width=40",
        appliedDate: new Date(candidate.createdAt || candidate.appliedDate || Date.now()).toLocaleDateString(),
        skills: candidate.skills || [],
        location:
          candidate.location ||
          candidate.currentCity ||
          `${candidate.currentCity || ""}, ${candidate.currentState || ""}`.trim() ||
          "",
        yearsOfExperience: candidate.yearsOfExperience || candidate.totalExperience || 0,
        currentPosition: candidate.currentPosition || candidate.role || "Not specified",
        content: candidate.content || candidate.profileOutline || candidate.summary || "",
        firstName: candidate.firstName || "",
        lastName: candidate.lastName || "",
        phone: candidate.phone || candidate.mobileNumber || "",
        website: candidate.website || candidate.portfolioLink || "",
        experience: candidate.experience || candidate.workExperience || [],
        education: candidate.education || candidate.educationDetails || [],
        matchScore: candidate.matchScore || 0,
        gender: candidate.gender || "",
        state: candidate.state || candidate.currentState || "",
        currentSalary: candidate.currentSalary || 0,
        age: candidate.age || 0,
        industry: candidate.industry || "",
        source: candidate.source || "candidates",
        employerId: candidate.employerId || employee._id,
      }))

      setCandidates(formattedCandidates)
      setFilteredCandidates(formattedCandidates)

      // Update dashboard stats
      setDashboardStats((prev) => ({
        ...prev,
        activeCandidates: formattedCandidates.length,
      }))
    } catch (error) {
      console.error("Error fetching candidates:", error)
      toast.error("Failed to load candidates")
    }
  }, [employee])

  const fetchJobPostings = useCallback(async () => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping job postings fetch")
        return
      }

      const response = await fetch("/api/employee/jobs", {
        // Add cache busting parameter to prevent caching
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch job postings")
      }

      const data = await response.json()

      // Filter jobs to only show those belonging to the current employee
      const employeeJobs = data.jobs.filter((job: any) => {
        return job.employerId === employee._id || job.companyId === employee._id
      })

      console.log(`Filtered ${data.jobs.length} jobs to ${employeeJobs.length} for this employee`)

      // Format the data
      const formattedJobs = employeeJobs.map((job: any) => {
        // Calculate days left based on job duration or default to 30 days
        const createdDate = new Date(job.createdAt)
        const durationDays = job.duration || 30
        const expiryDate = new Date(createdDate)
        expiryDate.setDate(createdDate.getDate() + durationDays)

        const today = new Date()
        const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          _id: job._id,
          jobTitle: job.jobTitle,
          department: job.department,
          jobType: job.jobType,
          jobLocation: job.jobLocation,
          applicants: job.applicants || 0,
          daysLeft: daysLeft,
          interviews: job.interviews || 0,
          createdAt: new Date(job.createdAt).toLocaleDateString(),
          updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : undefined,
          employerId: job.employerId || employee._id, // Ensure employerId is set
        }
      })

      setJobPostings(formattedJobs)

      // Update dashboard stats
      setDashboardStats((prev) => ({
        ...prev,
        openPositions: formattedJobs.length,
      }))
    } catch (error) {
      console.error("Error fetching job postings:", error)
      toast.error("Failed to load job postings")
    }
  }, [employee])

  const fetchInterviews = useCallback(async () => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping interviews fetch")
        return
      }

      // First cleanup expired interviews
      try {
        await fetch("/api/cron/cleanup-interviews", {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        console.log("✅ Expired interviews cleaned up")
      } catch (error) {
        console.error("❌ Error cleaning up interviews:", error)
      }

      const response = await fetch("/api/employee/interviews", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch interviews")
      }

      const data = await response.json()
      console.log("Fetched ALL interviews data:", data)

      // Don't filter here - show ALL current and future interviews
      const allCurrentInterviews = data.interviews.filter((interview: any) => {
        const interviewDate = new Date(interview.date)
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Start of today
        return interviewDate >= now && interview.status !== "cancelled" && interview.status !== "expired"
      })

      // Format the data
      const formattedInterviews = allCurrentInterviews.map((interview: any) => ({
        _id: interview._id,
        candidate: interview.candidate,
        position: interview.position,
        date: new Date(interview.date).toLocaleDateString(),
        time: interview.time,
        jobId: interview.jobId,
        status: interview.status || "scheduled",
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        duration: interview.duration,
        employerId: interview.scheduledBy || employee._id,
      }))

      setInterviews(formattedInterviews)

      // Count today's interviews
      const today = new Date().toDateString()
      const todayInterviews = formattedInterviews.filter(
        (interview: any) => new Date(interview.date).toDateString() === today,
      ).length

      // Update dashboard stats
      setDashboardStats((prev) => ({
        ...prev,
        interviewsToday: todayInterviews,
      }))

      console.log(`Set ${formattedInterviews.length} total interviews, ${todayInterviews} today`)
    } catch (error) {
      console.error("Error fetching interviews:", error)
      toast.error("Failed to load interviews")
    }
  }, [employee])

  // Update job postings with interview counts
  const updateJobPostingsWithInterviewCounts = useCallback((interviewsData: Interview[]) => {
    setJobPostings((prevJobs) => {
      return prevJobs.map((job) => {
        // Count interviews for this job
        const jobInterviews = interviewsData.filter(
          (interview) => interview.jobId === job._id || interview.position.includes(job.jobTitle),
        ).length

        return {
          ...job,
          interviews: jobInterviews,
        }
      })
    })
  }, [])

  // ATS: Fetch Resumes from DB - Enhanced to fetch from database
  const fetchAtsResumes = useCallback(async () => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping ATS resumes fetch")
        return
      }

      setAtsIsLoading(true)
      console.log("🔄 Fetching ATS data...")

      // Add cache busting parameters to prevent caching
      const response = await fetch("/api/employee/candidates", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ATS resumes: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Raw API response:", data)

      // Use the candidates as they come from the API (both students and candidates collections)
      const allCandidates = data.candidates || []
      console.log(`📋 Total candidates received: ${allCandidates.length}`)

      // Filter candidates to only show those belonging to the current employee
      const employeeCandidates = allCandidates.filter((candidate: any) => {
        return candidate.employerId === employee._id || candidate.companyId === employee._id
      })

      console.log(`🎯 Filtered to employee's candidates: ${employeeCandidates.length}`)

      // Format for ATS display while preserving original nomenclature
      const formattedResumes = employeeCandidates.map((candidate: any) => {
        // Determine source and use appropriate field mapping
        const isFromStudents = candidate.source === "students"

        // Enhanced mapping with fallbacks but preserving original structure
        const formatted = {
          _id: candidate._id,
          // Basic info - use original field names based on source
          name: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Unknown",
          email: candidate.email || candidate.emailAddress || "",
          phone: candidate.phone || candidate.mobileNumber || "",

          // Role mapping with source-specific logic
          role: isFromStudents
            ? candidate.role || candidate.currentPosition || candidate.designation || "Not specified"
            : candidate.role || candidate.currentPosition || "Not specified",

          status: candidate.status || "Applied",

          // Avatar/Profile picture with multiple fallbacks
          avatar:
            candidate.avatar ||
            candidate.profilePicture ||
            candidate.photographUrl ||
            candidate.documents?.photograph?.url ||
            "/placeholder.svg?height=40&width=40",

          // Dates
          appliedDate: new Date(
            candidate.createdAt || candidate.appliedDate || candidate.registrationDate || Date.now(),
          ).toLocaleDateString(),
          createdAt: candidate.createdAt || candidate.registrationDate,

          // Skills with proper handling
          skills: Array.isArray(candidate.skills) ? candidate.skills : candidate.skills ? [candidate.skills] : [],

          // Location with source-specific mapping
          location:
            candidate.location ||
            candidate.currentCity ||
            candidate.address ||
            `${candidate.currentCity || ""}, ${candidate.currentState || ""}`.trim() ||
            "",

          // Experience
          yearsOfExperience:
            candidate.yearsOfExperience ||
            candidate.totalExperience ||
            (candidate.workExperience?.length > 0 ? candidate.workExperience.length : 0) ||
            0,

          currentPosition:
            candidate.currentPosition ||
            candidate.role ||
            candidate.designation ||
            candidate.workExperience?.[0]?.title ||
            "Not specified",

          // Content/Summary with source-specific mapping
          content:
            candidate.content ||
            candidate.profileOutline ||
            candidate.summary ||
            candidate.aboutMe ||
            candidate.description ||
            "",

          // Personal details
          firstName: candidate.firstName || "",
          lastName: candidate.lastName || "",
          middleName: candidate.middleName || "",
          salutation: candidate.salutation || candidate.title || "",

          // Contact details
          alternativePhone: candidate.alternativePhone || candidate.alternatePhone || "",
          website: candidate.website || candidate.portfolioLink || candidate.portfolioUrl || "",

          // Professional info
          experience: candidate.experience || candidate.workExperience || [],
          education: candidate.education || candidate.educationDetails || candidate.qualifications || [],

          // Additional fields with proper mapping
          matchScore: candidate.matchScore || 0,
          gender: candidate.gender || "",
          dateOfBirth: candidate.dateOfBirth || candidate.dob || "",
          age:
            candidate.age ||
            (candidate.dateOfBirth ? new Date().getFullYear() - new Date(candidate.dateOfBirth).getFullYear() : 0),

          // Location details
          state: candidate.state || candidate.currentState || "",
          city: candidate.city || candidate.currentCity || "",
          pincode: candidate.pincode || candidate.zipCode || "",

          // Salary information
          currentSalary: candidate.currentSalary || 0,
          expectedSalary: candidate.expectedSalary || 0,

          // Industry and other professional info
          industry: candidate.industry || "",
          noticePeriod: candidate.noticePeriod || "",

          // Preferences
          shiftPreference: candidate.shiftPreference || candidate.preferredShift || [],
          preferredCities:
            candidate.preferredCities || candidate.preferenceCities || candidate.preferredLocations || [],

          // Assets and documents
          availableAssets: candidate.availableAssets || candidate.assets || [],
          identityDocuments: candidate.identityDocuments || candidate.documents || [],

          // Media URLs
          resumeUrl: candidate.resumeUrl || candidate.resume || candidate.documents?.resume?.url,
          videoResumeUrl: candidate.videoResumeUrl || candidate.videoResume || candidate.documents?.videoResume?.url,
          audioBiodataUrl:
            candidate.audioBiodataUrl || candidate.audioBiodata || candidate.documents?.audioBiodata?.url,
          photographUrl: candidate.photographUrl || candidate.photograph || candidate.documents?.photograph?.url,

          // Social links
          linkedIn: candidate.linkedIn || candidate.linkedin || candidate.onlinePresence?.linkedin,
          portfolioLink: candidate.portfolioLink || candidate.portfolio || candidate.onlinePresence?.portfolio,
          socialMediaLink: candidate.socialMediaLink || candidate.socialMedia || candidate.onlinePresence?.socialMedia,

          // Additional information
          coverLetter: candidate.coverLetter || candidate.coverLetterText || "",
          additionalInfo: candidate.additionalInfo || candidate.notes || candidate.remarks || "",
          notes: candidate.notes || candidate.internalNotes || candidate.comments || "",

          // Certifications
          certifications: candidate.certifications || candidate.certificates || candidate.achievements || [],

          // System fields
          source: candidate.source || (isFromStudents ? "students" : "candidates"),
          employerId: candidate.employerId || employee._id,
          companyId: candidate.companyId || employee._id,

          // Preserve ALL original fields for complete compatibility
          ...candidate,
        }

        return formatted
      })

      // --- Backend ATS scoring for all candidates on initial load ---
      const scoredResumes = await Promise.all(formattedResumes.map(async (resume: any) => {
        const type = resume.source === "students" ? "students" : "candidates";
        try {
          const res = await fetch(`/api/ats/score/${resume._id}?type=${type}`);
          if (res.ok) {
            const { score, feedback } = await res.json();
            resume.geminiScore = score;
            resume.geminiFeedback = feedback;
          } else {
            resume.geminiScore = 0;
            resume.geminiFeedback = "AI evaluation unavailable.";
          }
        } catch {
          resume.geminiScore = 0;
          resume.geminiFeedback = "AI evaluation unavailable.";
        }
        return resume;
      }));
      // --- End Backend ATS scoring ---

      setAtsResumes(scoredResumes)
      setAtsFilteredResumes(scoredResumes)

      // Prepare filter options for dropdowns
      prepareFilterOptions(scoredResumes)

      toast.success(`Loaded ${formattedResumes.length} candidates`)
    } catch (error) {
      console.error("❌ Error fetching ATS resumes:", error)
      toast.error("Failed to load ATS resumes")
    } finally {
      setAtsIsLoading(false)
    }
  }, [employee])

  // Handle action parameter for scheduling
  useEffect(() => {
    const action = searchParams.get("action")

    if (action === "schedule") {
      setShowScheduleModal(true)

      // Clean up URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("action")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])
  // Effect to fetch employee data on mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true)

        // Use the user data passed from withAuth HOC
        if (userData) {
          setEmployee(userData)

          // Initialize personal info form
          setPersonalInfo({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            alternativeEmail: userData.alternativeEmail || "",
            phone: userData.phone || "",
          })

          // Initialize notification settings
          if (userData.notificationSettings) {
            setNotificationSettings(userData.notificationSettings)
          }

          // Fetch dashboard data
          await fetchDashboardData()
        } else {
          // Fallback to API call if user data is not available
          const response = await fetch("/api/employee/profile", {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (response.status === 401) {
            router.push("/auth/employee/login")
            return
          }

          if (!response.ok) {
            throw new Error("Failed to fetch employee data")
          }

          const data = await response.json()
          setEmployee(data.employee)

          // Initialize personal info form
          setPersonalInfo({
            firstName: data.employee.firstName || "",
            lastName: data.employee.lastName || "",
            email: data.employee.email || "",
            alternativeEmail: data.employee.alternativeEmail || "",
            phone: data.employee.phone || "",
          })

          // Initialize notification settings
          if (data.employee.notificationSettings) {
            setNotificationSettings(data.employee.notificationSettings)
          }

          // Fetch dashboard data
          await fetchDashboardData()
        }
      } catch (error) {
        toast.error("Error loading profile data")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployeeData()
  }, [router, userData])

  // Effect to fetch data after employee data is loaded
  useEffect(() => {
    if (employee && employee._id) {
      // Fetch additional data
      Promise.all([fetchCandidates(), fetchJobPostings(), fetchInterviews()]).catch((error) => {
        console.error("Error fetching dashboard data:", error)
      })
    }
  }, [employee, fetchCandidates, fetchJobPostings, fetchInterviews])

  // Fetch dashboard data from the new API endpoint
  const fetchDashboardData = async () => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping dashboard stats fetch")
        return
      }

      setIsRefreshing(true)
      const response = await fetch("/api/employee/dashboard/stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      console.log("Dashboard stats:", data.stats)
      setDashboardStats(data.stats)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Effect to update job postings with interview counts whenever interviews change
  useEffect(() => {
    updateJobPostingsWithInterviewCounts(interviews)
  }, [interviews, updateJobPostingsWithInterviewCounts])

  // Effect to refresh data when tab changes
  useEffect(() => {
    if (activeTab === "jobs" || activeTab === "interviews") {
      refreshData(false)
    } else if (activeTab === "ats") {
      // Fetch fresh data when ATS tab is selected
      fetchAtsResumes()
    }
  }, [activeTab, fetchAtsResumes])

  // Enhanced Function to refresh all data including ATS
  const refreshData = async (showToast = true) => {
    try {
      if (!employee || !employee._id) {
        console.log("No employee data available, skipping data refresh")
        return
      }

      setIsRefreshing(true)
      console.log(`🔄 Refreshing data for tab: ${activeTab}`)

      if (activeTab === "ats") {
        await fetchAtsResumes()
        console.log("✅ ATS data refreshed")
      } else {
        await Promise.all([fetchDashboardData(), fetchCandidates(), fetchJobPostings(), fetchInterviews()])
        console.log("✅ General dashboard data refreshed")
      }

      setLastRefreshed(new Date())

      if (showToast) {
        toast.success(`${activeTab === "ats" ? "ATS" : "Dashboard"} data refreshed successfully`)
      }
    } catch (error) {
      console.error("❌ Error refreshing data:", error)
      if (showToast) {
        toast.error("Failed to refresh data")
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      router.push("/auth/employee/login")
    } catch (error) {
      toast.error("Logout failed")
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSavePersonalInfo = async () => {
    try {
      // Reset error state
      setEmailError("")

      // Validate email
      if (personalInfo.email && !validateEmail(personalInfo.email)) {
        setEmailError("Please enter a valid email address")
        return
      }

      // Validate alternative email if provided
      if (personalInfo.alternativeEmail && !validateEmail(personalInfo.alternativeEmail)) {
        setEmailError("Please enter a valid alternative email address")
        return
      }

      // Check if emails are the same
      if (
        personalInfo.email &&
        personalInfo.alternativeEmail &&
        personalInfo.email.toLowerCase() === personalInfo.alternativeEmail.toLowerCase()
      ) {
        setEmailError("Primary and alternative emails cannot be the same")
        return
      }

      setIsUpdatingProfile(true)

      const response = await fetch("/api/employee/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          phone: personalInfo.phone,
          alternativeEmail: personalInfo.alternativeEmail,
          designation: employee?.designation,
          email: personalInfo.email, // Include primary email in the update
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update profile")
      }

      // Update the employee state with new data
      setEmployee((prev) => {
        if (!prev) return null
        return {
          ...prev,
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          phone: personalInfo.phone,
          alternativeEmail: personalInfo.alternativeEmail,
          email: personalInfo.email, // Update primary email in state
        }
      })

      toast.success("Personal information updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setEmailError(error.message || "Failed to update personal information")
      toast.error(error.message || "Failed to update personal information")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleAvatarUpdate = (url: string) => {
    setEmployee((prev) => {
      if (!prev) return null
      return {
        ...prev,
        avatar: url,
      }
    })
  }

  const handleSaveNotificationSettings = async () => {
    try {
      setIsUpdatingNotifications(true)

      const response = await fetch("/api/employee/notifications/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to update notification settings")
      }

      // Update the employee state with new notification settings
      setEmployee((prev) => {
        if (!prev) return null
        return {
          ...prev,
          notificationSettings,
        }
      })

      toast.success("Notification preferences saved successfully")
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast.error("Failed to save notification preferences")
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const handleUpdatePassword = async () => {
    try {
      // Validate passwords
      if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
        toast.error("New passwords don't match")
        return
      }

      if (!passwordInfo.currentPassword || !passwordInfo.newPassword) {
        toast.error("Please fill in all password fields")
        return
      }

      setIsUpdatingPassword(true)

      const response = await fetch("/api/employee/password/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordInfo.currentPassword,
          newPassword: passwordInfo.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update password")
      }

      // Clear password fields
      setPasswordInfo({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast.success("Password updated successfully")
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast.error(error.message || "Failed to update password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        setIsDeletingAccount(true)

        const response = await fetch("/api/employee/account/delete", {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete account")
        }

        toast.success("Account deleted successfully")
        router.push("/auth/employee/login")
      } catch (error) {
        console.error("Error deleting account:", error)
        toast.error("Failed to delete account")
      } finally {
        setIsDeletingAccount(false)
      }
    }
  }

  const handleCreateJobPosting = async (jobData: any) => {
    try {
      if (!employee || !employee._id) {
        toast.error("You must be logged in to create a job posting")
        return
      }

      // Add employee ID to job data for proper isolation
      const jobWithEmployeeId = {
        ...jobData,
        employerId: employee._id,
        companyId: employee._id,
      }

      const response = await fetch("/api/employee/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobWithEmployeeId),
      })

      if (!response.ok) {
        throw new Error("Failed to create job posting")
      }

      toast.success("Job posting created successfully!")

      // Refresh job postings
      await fetchJobPostings()

      // Switch to jobs tab
      setActiveTab("jobs")
    } catch (error) {
      console.error("Error creating job posting:", error)
      toast.error("Failed to create job posting")
    }
  }

  // Handle export of selected candidates
  const handleExportSelectedCandidates = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate to export")
      return
    }

    try {
      setIsExporting(true)
      toast.info(`Preparing export for ${selectedCandidates.length} candidates, please wait...`)

      // Create a more robust fetch with timeout and retry logic
      const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 60000) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          })
          clearTimeout(id)
          return response
        } catch (error) {
          clearTimeout(id)
          throw error
        }
      }

      // Try up to 3 times with exponential backoff
      let response = null
      let attempt = 0
      const maxAttempts = 3

      while (attempt < maxAttempts) {
        try {
          response = await fetchWithTimeout(
            "/api/employee/candidates/export-multiple",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                candidateIds: selectedCandidates,
              }),
            },
            60000,
          ) // 60 second timeout

          if (response.ok) break

          // If response is not ok but is a JSON response, don't retry
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to export candidates")
          }

          // Otherwise, retry with backoff
          attempt++
          if (attempt < maxAttempts) {
            const backoffTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
            toast.info(`Export attempt ${attempt} failed. Retrying in ${backoffTime / 1000} seconds...`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error)
          attempt++

          if (attempt < maxAttempts) {
            const backoffTime = Math.pow(2, attempt) * 1000
            toast.info(`Export attempt ${attempt} failed. Retrying in ${backoffTime / 1000} seconds...`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
          } else {
            throw error
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error("Failed to export candidates after multiple attempts")
      }

      // Check if the response is a blob or JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to export candidates")
      }

      // Get the blob from the response
      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error("Received empty file from server")
      }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `candidates_export_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Successfully exported ${selectedCandidates.length} candidates`)

      // Clear selection after successful export
      clearSelectedCandidates()
    } catch (error) {
      console.error("Error exporting candidates:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export candidates")
    } finally {
      setIsExporting(false)
    }
  }

  // Handle export of a single candidate
  const handleExportSingleCandidate = async (candidateId: string, candidateName: string) => {
    try {
      setIsSingleExporting(candidateId)
      toast.info("Preparing export, please wait...")

      const response = await fetch(`/api/employee/candidates/${candidateId}/export`)

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to export resume"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Could not parse error response:", e)
        }
        throw new Error(errorMessage)
      }

      // Get the blob from the response
      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error("Received empty file from server")
      }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${candidateName.replace(/\s+/g, "_")}_resume.xlsx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Resume exported successfully")
    } catch (error) {
      console.error("Error exporting resume:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export resume")
    } finally {
      setIsSingleExporting(null)
    }
  }

  // Prepare filter options for dropdowns
  const prepareFilterOptions = (resumes: Candidate[]) => {
    // Extract unique values for each filter
    const nameOptions = [...new Set(resumes.map((r) => `${r.firstName} ${r.lastName}`.trim()))].filter(Boolean)
    const positionOptions = [...new Set(resumes.map((r) => r.currentPosition))].filter(Boolean)
    const statusOptions = [...new Set(resumes.map((r) => r.status))].filter(Boolean)
    const dateOptions = [...new Set(resumes.map((r) => r.appliedDate))].filter(Boolean)

    // Set initial filter states (all options unchecked)
    setCandidateNameFilter([])
    setPositionFilter([])
    setStatusFilter([])
    setAppliedDateFilter([])
  }

  // Enhanced ATS: Handle search with better field mapping
  useEffect(() => {
    if (!atsSearchTerm.trim()) {
      setAtsFilteredResumes(atsResumes)
      return
    }

    const searchLower = atsSearchTerm.toLowerCase()
    console.log(`🔍 Searching for: "${searchLower}"`)

    const filtered = atsResumes.filter((resume) => {
      // Enhanced search across multiple fields with null checks
      const searchFields = [
        // Name variations
        resume.name || "",
        `${resume.firstName || ""} ${resume.lastName || ""}`.trim(),
        `${resume.firstName || ""} ${resume.middleName || ""} ${resume.lastName || ""}`.trim(),

        // Email variations
        resume.email || "",
        resume.emailAddress || "",

        // Content variations
        resume.content || "",
        resume.profileOutline || "",
        resume.summary || "",
        resume.aboutMe || "",
        resume.description || "",

        // Location variations
        resume.location || "",
        resume.currentCity || "",
        resume.city || "",
        resume.state || "",
        resume.currentState || "",

        // Position variations
        resume.currentPosition || "",
        resume.role || "",
        resume.designation || "",

        // Skills (handle array)
        Array.isArray(resume.skills) ? resume.skills.join(" ") : resume.skills || "",

        // Phone variations
        resume.phone || "",
        resume.mobileNumber || "",

        // Additional searchable fields
        resume.industry || "",
        resume.gender || "",
      ]

      // Check if any field contains the search term
      return searchFields.some((field) => field.toString().toLowerCase().includes(searchLower))
    })

    console.log(`Search results: ${filtered.length} matches found`)
    setAtsFilteredResumes(filtered)
  }, [atsSearchTerm, atsResumes])

  // ATS: Apply filters
  const applyAtsFilters = () => {
    setAtsIsLoading(true)

    setTimeout(() => {
      let filtered = [...atsResumes]

      // Apply mandatory keywords filter
      if (atsFilters.mandatoryKeywords.length > 0) {
        filtered = filtered.filter((resume) => {
          return atsFilters.mandatoryKeywords.every((keyword) => {
            if (!keyword) return true
            return resume.content.toLowerCase().includes(keyword.toLowerCase())
          })
        })
      }

      // Apply preferred keywords filter (boost score but don't filter out)
      if (atsFilters.preferredKeywords.length > 0) {
        // In a real implementation, this would adjust a score
        // For now, we'll just sort by the number of preferred keywords matched
        filtered.sort((a, b) => {
          const aMatches = atsFilters.preferredKeywords.filter((keyword) => {
            if (!keyword || typeof keyword !== 'string') return false
            return a.content.toLowerCase().includes(keyword.toLowerCase())
          }).length

          const bMatches = atsFilters.preferredKeywords.filter((keyword) => {
            if (!keyword) return false
            return b.content.toLowerCase().includes(keyword.toLowerCase())
          }).length

          return bMatches - aMatches
        })
      }

      // Apply location filter
      if (atsFilters.location) {
        filtered = filtered.filter((resume) =>
          resume.location.toLowerCase().includes(atsFilters.location.toLowerCase()),
        )
      }

      // Apply state filter
      if (atsFilters.state) {
        filtered = filtered.filter((resume) => resume.state.toLowerCase().includes(atsFilters.state.toLowerCase()))
      }

      // Apply education level filter
      if (atsFilters.educationLevel.length > 0) {
        filtered = filtered.filter((resume) =>
          atsFilters.educationLevel.some((level) =>
            resume.education.some((edu) => {
              if (typeof edu === "object" && edu && typeof edu.degree === "string") {
                return edu.degree.toLowerCase().includes(level.toLowerCase())
              }
              return false
            }),
          ),
        )
      }

      // Apply gender filter
      if (atsFilters.gender) {
        filtered = filtered.filter((resume) => resume.gender.toLowerCase() === atsFilters.gender.toLowerCase())
      }

      // Apply experience range filter
      filtered = filtered.filter(
        (resume) =>
          resume.yearsOfExperience >= atsFilters.experienceRange[0] &&
          resume.yearsOfExperience <= atsFilters.experienceRange[1],
      )

      // Apply salary range filter
      filtered = filtered.filter(
        (resume) =>
          resume.currentSalary >= atsFilters.salaryRange[0] && resume.currentSalary <= atsFilters.salaryRange[1],
      )

      // Apply industry filter
      if (atsFilters.industry) {
        filtered = filtered.filter((resume) => {
          if (!resume.industry) return false
          return resume.industry.toLowerCase().includes(atsFilters.industry.toLowerCase())
        })
      }

      // Apply age range filter
      filtered = filtered.filter(
        (resume) => resume.age >= atsFilters.ageRange[0] && resume.age <= atsFilters.ageRange[1],
      )

      // Apply NOT keywords filter
      if (atsFilters.notKeywords.length > 0) {
        filtered = filtered.filter((resume) => {
          return !atsFilters.notKeywords.some((keyword) => {
            if (!keyword) return false
            return resume.content.toLowerCase().includes(keyword.toLowerCase())
          })
        })
      }

      // --- Use backend-driven ATS score for filtering ---
      if (atsFilters.atsScore > 0) {
        filtered = filtered.filter((resume) =>
          typeof resume.geminiScore === 'number' ? resume.geminiScore >= atsFilters.atsScore : false
        )
      }
      // --- End backend-driven ATS score filter ---

      // Apply assets filter
      if (atsFilters.assets) {
        const { bike, car, wifi, laptop } = atsFilters.assets
        if (bike || car || wifi || laptop) {
          filtered = filtered.filter((resume) => {
            const assets = resume.skills.map((s) => s.toLowerCase())
            if (bike && !assets.some((a) => a.includes("bike") || a.includes("motorcycle"))) return false
            if (car && !assets.some((a) => a.includes("car") || a.includes("driving"))) return false
            if (wifi && !assets.some((a) => a.includes("wifi") || a.includes("internet"))) return false
            if (laptop && !assets.some((a) => a.includes("laptop") || a.includes("computer"))) return false
            return true
          })
        }
      }

      // Apply shift preference filter
      if (atsFilters.shiftPreference) {
        filtered = filtered.filter((resume) => {
          const content = resume.content.toLowerCase()
          const preference = atsFilters.shiftPreference.toLowerCase()
          return (
            content.includes(preference) ||
            (resume.skills && resume.skills.some((s) => s.toLowerCase().includes(preference)))
          )
        })
      }

      // Apply column filters
      if (candidateNameFilter.length > 0) {
        filtered = filtered.filter((resume) => {
          const fullName = `${resume.firstName} ${resume.lastName}`.trim()
          return candidateNameFilter.includes(fullName)
        })
      }

      if (positionFilter.length > 0) {
        filtered = filtered.filter((resume) => positionFilter.includes(resume.currentPosition))
      }

      if (statusFilter.length > 0) {
        filtered = filtered.filter((resume) => statusFilter.includes(resume.status))
      }

      if (appliedDateFilter.length > 0) {
        filtered = filtered.filter((resume) => appliedDateFilter.includes(resume.appliedDate))
      }

      // Apply sorting
      if (candidateNameSort) {
        filtered.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
          const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
          return candidateNameSort === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })
      }

      if (positionSort) {
        filtered.sort((a, b) => {
          return positionSort === "asc"
            ? a.currentPosition.localeCompare(b.currentPosition)
            : b.currentPosition.localeCompare(a.currentPosition)
        })
      }

      if (statusSort) {
        filtered.sort((a, b) => {
          return statusSort === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
        })
      }

      if (appliedDateSort) {
        filtered.sort((a, b) => {
          const dateA = new Date(a.appliedDate).getTime()
          const dateB = new Date(b.appliedDate).getTime()
          return appliedDateSort === "asc" ? dateA - dateB : dateB - dateA
        })
      }

      setAtsFilteredResumes(filtered)
      setAtsIsLoading(false)

      toast.success(`Found ${filtered.length} matching resumes`)
    }, 500) // Simulate API delay
  }

  const resetAtsFilters = () => {
    // Create a completely fresh default state object
    const defaultFilters = {
      mandatoryKeywords: [] as string[],
      preferredKeywords: [] as string[],
      location: "",
      state: "",
      educationLevel: [],
      gender: "",
      experienceRange: [0, 20],
      salaryRange: [0, 200000],
      industry: "",
      ageRange: [18, 65],
      notKeywords: [] as string[],
      atsScore: 0,
      assets: {
        bike: false,
        car: false,
        wifi: false,
        laptop: false,
      },
      shiftPreference: "",
    }

    // Set the filters back to default
    setAtsFilters(defaultFilters)

    // Reset column filters and sorts
    setCandidateNameFilter([])
    setPositionFilter([])
    setStatusFilter([])
    setAppliedDateFilter([])
    setCandidateNameSort(null)
    setPositionSort(null)
    setStatusSort(null)
    setAppliedDateSort(null)

    // Reset the filtered resumes to show all resumes
    setAtsFilteredResumes(atsResumes)

    // Clear the location input field in the DOM
    const locationInput = document.querySelector('input[placeholder="City or region..."]') as HTMLInputElement
    if (locationInput) {
      locationInput.value = ""
    }

    toast.info("Filters have been reset")
  }

  const handleAtsExport = async () => {
    try {
      if (!employee || !employee._id) {
        toast.error("You must be logged in to export candidates")
        return
      }

      setAtsIsExporting(true)
      toast.info("Preparing export, please wait...")

      // Get the IDs of all filtered resumes
      const candidateIds = atsFilteredResumes.map((resume) => resume._id)

      // Use the same robust fetch with timeout and retry logic
      const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 60000) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          })
          clearTimeout(id)
          return response
        } catch (error) {
          clearTimeout(id)
          throw error
        }
      }

      // Try up to 3 times with exponential backoff
      let response = null
      let attempt = 0
      const maxAttempts = 3

      while (attempt < maxAttempts) {
        try {
          response = await fetchWithTimeout(
            "/api/employee/candidates/export-multiple",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                candidateIds: candidateIds,
                employeeId: employee._id, // Add employee ID for data isolation
              }),
            },
            60000,
          ) // 60 second timeout

          if (response.ok) break

          // If response is not ok but is a JSON response, don't retry
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to export candidates")
          }

          // Otherwise, retry with backoff
          attempt++
          if (attempt < maxAttempts) {
            const backoffTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
            toast.info(`Export attempt ${attempt} failed. Retrying in ${backoffTime / 1000} seconds...`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error)
          attempt++

          if (attempt < maxAttempts) {
            const backoffTime = Math.pow(2, attempt) * 1000
            toast.info(`Export attempt ${attempt} failed. Retrying in ${backoffTime / 1000} seconds...`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
          } else {
            throw error
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error("Failed to export candidates after multiple attempts")
      }

      // Check if the response is a blob or JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to export candidates")
      }

      // Get the blob from the response
      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error("Received empty file from server")
      }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `candidates_export_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Successfully exported ${atsFilteredResumes.length} candidates`)
    } catch (error) {
      console.error("Error exporting candidates:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export candidates")
    } finally {
      setAtsIsExporting(false)
    }
  }

  // Handle column filter changes
  const handleCandidateNameFilter = (selectedValues: string[]) => {
    setCandidateNameFilter(selectedValues)
    applyAtsFilters()
  }

  const handlePositionFilter = (selectedValues: string[]) => {
    setPositionFilter(selectedValues)
    applyAtsFilters()
  }

  const handleStatusFilter = (selectedValues: string[]) => {
    setStatusFilter(selectedValues)
    applyAtsFilters()
  }

  const handleAppliedDateFilter = (selectedValues: string[]) => {
    setAppliedDateFilter(selectedValues)
    applyAtsFilters()
  }

  // Handle column sorting
  const handleCandidateNameSort = (direction: "asc" | "desc") => {
    setCandidateNameSort(direction)
    setPositionSort(null)
    setStatusSort(null)
    setAppliedDateSort(null)
    applyAtsFilters()
  }

  const handlePositionSort = (direction: "asc" | "desc") => {
    setPositionSort(direction)
    setCandidateNameSort(null)
    setStatusSort(null)
    setAppliedDateSort(null)
    applyAtsFilters()
  }

  const handleStatusSort = (direction: "asc" | "desc") => {
    setStatusSort(direction)
    setCandidateNameSort(null)
    setPositionSort(null)
    setAppliedDateSort(null)
    applyAtsFilters()
  }

  const handleAppliedDateSort = (direction: "asc" | "desc") => {
    setAppliedDateSort(direction)
    setCandidateNameSort(null)
    setPositionSort(null)
    setStatusSort(null)
    applyAtsFilters()
  }

  // Fetch ATS resumes on mount
  useEffect(() => {
    if (employee && employee._id) {
      fetchAtsResumes()
    }
  }, [employee, fetchAtsResumes])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/employee/dashboard?tab=${value}`, { scroll: false })
  }

  // Handle navigation to assessments dashboard
  const handleAssessmentsClick = () => {
    router.push("/employee/assessment/dashboard")
  }

  // After filteredCandidates state declaration:
  const handleFilterChange = useCallback((filtered: Candidate[]) => setFilteredCandidates(filtered), [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>Your session has expired or you are not logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/auth/employee/login")}
              className="w-full hover:bg-green-600 hover:text-black"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* <EmployeeNavbar /> */}

      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-black text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-white">Employer Dashboard</h1>
            <div className="relative w-64 ml-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search dashboard..."
                className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
              />
              {showSearchResults && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-2">
                    {searchResults.candidates.length === 0 &&
                    searchResults.jobs.length === 0 &&
                    searchResults.interviews.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 p-2">No results found</p>
                    ) : (
                      <>
                        {searchResults.candidates.length > 0 && (
                          <div className="mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                              Candidates
                            </h3>
                            {searchResults.candidates.slice(0, 3).map((candidate) => (
                              <div
                                key={candidate._id}
                                className="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                onClick={() => handleSearchResultClick("candidate", candidate._id)}
                              >
                                <p className="text-sm font-medium">{candidate.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{candidate.email}</p>
                              </div>
                            ))}
                            {searchResults.candidates.length > 3 && (
                              <p className="text-xs text-blue-500 px-2 pt-1">
                                +{searchResults.candidates.length - 3} more candidates
                              </p>
                            )}
                          </div>
                        )}

                        {searchResults.jobs.length > 0 && (
                          <div className="mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">Jobs</h3>
                            {searchResults.jobs.slice(0, 3).map((job) => (
                              <div
                                key={job._id}
                                className="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                onClick={() => handleSearchResultClick("job", job._id)}
                              >
                                <p className="text-sm font-medium">{job.jobTitle}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {job.department} • {job.jobLocation}
                                </p>
                              </div>
                            ))}
                            {searchResults.jobs.length > 3 && (
                              <p className="text-xs text-blue-500 px-2 pt-1">
                                +{searchResults.jobs.length - 3} more jobs
                              </p>
                            )}
                          </div>
                        )}

                        {searchResults.interviews.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                              Interviews
                            </h3>
                            {searchResults.interviews.slice(0, 3).map((interview) => (
                              <div
                                key={interview._id}
                                className="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                onClick={() => handleSearchResultClick("interview", interview._id)}
                              >
                                <p className="text-sm font-medium">{interview.candidate.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {interview.position} • {interview.date}
                                </p>
                              </div>
                            ))}
                            {searchResults.interviews.length > 3 && (
                              <p className="text-xs text-blue-500 px-2 pt-1">
                                +{searchResults.interviews.length - 3} more interviews
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Welcome, {employee.firstName} {employee.lastName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-black bg-blue-400 border-white hover:white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-2xl font-bold">{dashboardStats.activeCandidates}</p>
              <p className="text-sm opacity-80">Active Candidates</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Briefcase className="h-8 w-8 mb-2" />
              <p className="text-2xl font-bold">{dashboardStats.openPositions}</p>
              <p className="text-sm opacity-80">Open Positions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Calendar className="h-8 w-8 mb-2" />
              <p className="text-2xl font-bold">{dashboardStats.interviewsToday}</p>
              <p className="text-sm opacity-80">Interviews Today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <BarChart className="h-8 w-8 mb-2" />
              <p className="text-2xl font-bold">{dashboardStats.hiringSuccessRate}%</p>
              <p className="text-sm opacity-80">Hiring Success Rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-green-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-7 w-full max-w-3xl text-white mx-auto bg-gradient-to-br from-black to-black h-12 items-center">
            <TabsTrigger
              value="overview"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <User size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <Users size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              Candidates
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <Briefcase size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="interviews"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <Calendar size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              Interviews
            </TabsTrigger>
            <TabsTrigger
              value="ats"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <Search size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              ATS
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              onClick={handleAssessmentsClick}
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <span className="inline-flex items-center justify-center rounded-full w-8 h-8 mr-2">
                <ClipboardCheck size={22} strokeWidth={2.5} />
              </span>
              Assessments
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center justify-center data-[state=active]:text-purple-400 data-[state=active]:bg-black hover:bg-gray-800"
            >
              <Settings size={20} className="w-[20px] h-[20px] mr-2 flex-shrink-0" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <AvatarUpload
                      initialAvatarUrl={employee.avatar}
                      employeeId={employee._id}
                      onAvatarUpdate={handleAvatarUpdate}
                    />
                    <h3 className="mt-4 font-medium text-lg">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                    {employee.alternativeEmail && <p className="text-sm text-gray-500">{employee.alternativeEmail}</p>}
                  </div>
                  {employee.companyName && (
                    <div className="space-y-4">
                      <div>
                        <p>{employee.companyName}</p>
                      </div>
                      {employee.companyLocation && (
                        <div>
                          <p>{employee.companyLocation}</p>
                        </div>
                      )}
                      <div>
                        <p>{employee.designation || "Employee"}</p>
                      </div>
                    </div>
                  )}
                  {!employee.companyName && (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">Company profile not set up</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      className="bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => setActiveTab("settings")}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Candidates</CardTitle>
                  <CardDescription>Latest candidates who applied to your jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidates.length > 0 ? (
                      candidates.slice(0, 4).map((candidate) => (
                        <div
                          key={candidate._id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
                              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-sm text-gray-500">{candidate.role}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/employee/candidates/${candidate._id}/contact`)}
                              className="flex items-center"
                            >
                              <Send className="h-4 w-4 mr-1" />
                            </Button>
                            <Badge
                              className={
                                candidate.status === "Shortlisted"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : candidate.status === "Interview"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                    : candidate.status === "Rejected"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {candidate.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No candidates yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setActiveTab("candidates")}>
                          Add Candidates
                        </Button>
                      </div>
                    )}

                    {candidates.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full mt-2 bg-blue-500 text-white"
                        onClick={() => setActiveTab("candidates")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View All Candidates
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                  <CardDescription>Currently active job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobPostings.length > 0 ? (
                    <div className="space-y-4">
                      {jobPostings.slice(0, 3).map((job) => (
                        <div key={job._id} className="border rounded-lg p-4 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{job.jobTitle}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {job.department} • {job.jobType} • {job.jobLocation}
                              </p>
                              <div className="flex mt-2 space-x-4">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.applicants}</strong> Applicants
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.interviews}</strong> Interviews
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.daysLeft}</strong> Days Left
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-black text-white"
                                onClick={() => router.push(`/employee/jobs/${job._id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-black text-white"
                                onClick={() => router.push(`/employee/jobs/${job._id}/edit`)}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full bg-blue-500 text-white"
                        onClick={() => setActiveTab("jobs")}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        View All Jobs
                      </Button>
                    </div>
                  ) : (
                    <JobPostingForm onSubmit={handleCreateJobPosting} />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <CardTitle>Upcoming Interviews</CardTitle>
                  <CardDescription>Scheduled interviews for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interviews.length > 0 ? (
                      interviews.slice(0, 2).map((interview) => (
                        <div key={interview._id} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                          <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full mr-3">
                            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div>
                            <p className="font-medium">{interview.candidate.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{interview.position}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {interview.date} at {interview.time}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No upcoming interviews</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full bg-blue-500 text-white"
                      onClick={() => setActiveTab("interviews")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Candidates</CardTitle>
                    <CardDescription>Manage your candidate pipeline</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportSelectedCandidates}
                      disabled={isExporting || selectedCandidates.length === 0}
                      className="flex items-center bg-blue-500 text-white"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {isExporting ? "Exporting..." : "Export Selected"}
                    </Button>
                    <Button onClick={() => router.push("/employee/candidates/add")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                 <CandidatesFilterBar candidates={candidates} onFilterChange={handleFilterChange} />
                </div>

                {filteredCandidates.length > 0 ? (
                  <>
                    <div className="rounded-md border dark:border-gray-700">
                      <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-700 p-3 text-sm font-medium text-gray-500">
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            id="select-all"
                            checked={
                              selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked && selectedCandidates.length !== filteredCandidates.length) {
                                selectAllCandidates(filteredCandidates.map((c) => c._id))
                              } else if (!checked && selectedCandidates.length > 0) {
                                clearSelectedCandidates()
                              }
                            }}
                            className="mr-2"
                          />
                          <Label htmlFor="select-all" className="cursor-pointer text-white font-bold">
                            Select All
                          </Label>
                        </div>
                        <div className="col-span-2 text-white font-bold">Candidate</div>
                        <div className="text-white font-bold">Position</div>
                        <div className="text-white font-bold">Status</div>
                        <div className="text-white font-bold">Applied Date</div>
                        <div className="text-right col-span-2 text-white font-bold">Actions</div>
                      </div>

                      {paginateItems(filteredCandidates, currentCandidatesPage).map((candidate, index) => (
                        <div
                          key={candidate._id}
                          className={`grid grid-cols-8 border-t dark:border-gray-700 p-3 items-center ${
                            index % 2 === 0 ? "bg-gray-200 dark:bg-gray-200" : "bg-white"
                          }`}
                        >
                          <div className="col-span-1">
                            <Checkbox
                              id={`select-${candidate._id}`}
                              checked={isSelected(candidate._id)}
                              onCheckedChange={() => toggleCandidateSelection(candidate._id)}
                            />
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
                              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-xs text-black dark:text-black">{candidate.email}</p>
                            </div>
                          </div>
                          <div>{candidate.role}</div>
                          <div>
                            <Badge
                              className={
                                candidate.status === "Shortlisted"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : candidate.status === "Interview"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                    : candidate.status === "Rejected"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {candidate.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-black dark:text-black">{candidate.appliedDate}</div>
                          <div className="flex justify-end space-x-2 col-span-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-black text-white"
                              onClick={() => router.push(`/employee/candidates/${candidate._id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-white dark:text-white bg-black"
                              onClick={() => router.push(`/employee/candidates/${candidate._id}/contact`)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-600 text-white"
                              onClick={() => handleExportSingleCandidate(candidate._id, candidate.name)}
                              disabled={isSingleExporting === candidate._id}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {isSingleExporting === candidate._id ? "Exporting..." : "Export"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={currentCandidatesPage}
                      totalItems={filteredCandidates.length}
                      onPageChange={setCurrentCandidatesPage}
                    />
                  </>
                ) : (
                  <div className="text-center py-12 border rounded-lg dark:border-gray-700">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No candidates found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Try adjusting your filters or add new candidates
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/employee/candidates/add")}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Job Postings</CardTitle>
                    <CardDescription>Manage your active and closed job postings</CardDescription>
                  </div>
                  <Button onClick={() => router.push("/employee/jobs/add")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jobPostings.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {paginateItems(jobPostings, currentJobsPage).map((job, index) => (
                        <div
                          key={job._id}
                          className={`border rounded-lg p-4 dark:border-gray-700 ${
                            index % 2 === 0 ? "bg-gray-200" : "bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{job.jobTitle}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {job.department} • {job.jobType} • {job.jobLocation}
                              </p>
                              <div className="flex mt-2 space-x-4">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.applicants}</strong> Applicants
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.interviews}</strong> Interviews
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <strong>{job.daysLeft}</strong> Days Left
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-black text-white"
                                onClick={() => router.push(`/employee/jobs/${job._id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-black text-white"
                                onClick={() => router.push(`/employee/jobs/${job._id}/edit`)}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={currentJobsPage}
                      totalItems={jobPostings.length}
                      onPageChange={setCurrentJobsPage}
                    />
                  </>
                ) : (
                  <JobPostingForm onSubmit={handleCreateJobPosting} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Interview Schedule</CardTitle>
                    <CardDescription>Manage your upcoming interviews</CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/employee/interviews/schedule")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Today's Interviews Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Today's Interviews</h3>
                      <Button variant="outline" onClick={() => refreshData(true)} disabled={isRefreshing}>
                        {isRefreshing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {interviews
                        .filter((interview) => {
                          const interviewDate = new Date(interview.date)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const interviewDateOnly = new Date(interviewDate)
                          interviewDateOnly.setHours(0, 0, 0, 0)
                          return (
                            interviewDateOnly.getTime() === today.getTime() &&
                            interview.status !== "cancelled" &&
                            interview.status !== "expired"
                          )
                        })
                        .map((interview) => (
                          <div
                            key={interview._id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    {interview.candidate?.name?.charAt(0)?.toUpperCase() || "U"}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {interview.candidate.name}
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">{interview.position}</p>
                                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                                    {interview.date} at {interview.time}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/employee/interviews/${interview._id}`)}
                                  className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/employee/interviews/${interview._id}/reschedule`)}
                                  className="flex items-center hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Reschedule
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (interview.meetingLink) {
                                      window.open(interview.meetingLink, "_blank", "noopener,noreferrer")
                                    } else {
                                      window.open(`/interview/${interview._id}/join`, "_blank", "noopener,noreferrer")
                                    }
                                  }}
                                  className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Video className="h-4 w-4 mr-1" />
                                  Join Meeting
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                      {interviews.filter((interview) => {
                        const interviewDate = new Date(interview.date)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const interviewDateOnly = new Date(interviewDate)
                        interviewDateOnly.setHours(0, 0, 0, 0)
                        return (
                          interviewDateOnly.getTime() === today.getTime() &&
                          interview.status !== "cancelled" &&
                          interview.status !== "expired"
                        )
                      }).length === 0 && (
                        <div className="text-center py-8 border rounded-lg dark:border-gray-700">
                          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">No interviews scheduled for today</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Interviews Section */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Upcoming Interviews</h3>
                    {interviews.filter((interview) => {
                      const interviewDate = new Date(interview.date)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const interviewDateOnly = new Date(interviewDate)
                      interviewDateOnly.setHours(0, 0, 0, 0)
                      return (
                        interviewDateOnly.getTime() > today.getTime() &&
                        interview.status !== "cancelled" &&
                        interview.status !== "expired"
                      )
                    }).length > 0 ? (
                      <div className="space-y-4">
                        {interviews
                          .filter((interview) => {
                            const interviewDate = new Date(interview.date)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const interviewDateOnly = new Date(interviewDate)
                            interviewDateOnly.setHours(0, 0, 0, 0)
                            return (
                              interviewDateOnly.getTime() > today.getTime() &&
                              interview.status !== "cancelled" &&
                              interview.status !== "expired"
                            )
                          })
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((interview) => (
                            <div
                              key={interview._id}
                              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 cursor-pointer group"
                              onClick={() => router.push(`/employee/interviews/${interview._id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                    <span className="text-white font-semibold text-lg">
                                      {interview.candidate?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                      {interview.candidate.name}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{interview.position}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {interview.date}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {interview.time}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/employee/interviews/${interview._id}`)
                                    }}
                                    className="flex items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-lg dark:border-gray-700">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No upcoming interviews scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-center font-lg">Account Settings</CardTitle>
                <CardDescription className="text-center">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="flex flex-col items-center mb-6">
                    <AvatarUpload
                      initialAvatarUrl={employee.avatar}
                      employeeId={employee._id}
                      onAvatarUpdate={handleAvatarUpdate}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Primary)</Label>
                      <Input
                        id="email"
                        value={personalInfo.email}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternativeEmail">Alternative Email (Optional)</Label>
                      <Input
                        id="alternativeEmail"
                        value={personalInfo.alternativeEmail}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            alternativeEmail: e.target.value,
                          })
                        }
                        placeholder="Enter an alternative email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  <Button onClick={handleSavePersonalInfo} disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordInfo.currentPassword}
                        onChange={(e) =>
                          setPasswordInfo({
                            ...passwordInfo,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                      <Link
                        href="/auth/employee/forgot-password"
                        className="text-blue-600 hover:underline hover:text-opacity-85 text-base"
                      >
                        Forgot Password? Click Here
                      </Link>
                    </div>
                    <div></div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordInfo.newPassword}
                        onChange={(e) =>
                          setPasswordInfo({
                            ...passwordInfo,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordInfo.confirmPassword}
                        onChange={(e) =>
                          setPasswordInfo({
                            ...passwordInfo,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive email notifications for important updates
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailNotifications: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="emailNotifications">Enabled</Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Application Updates</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get notified when candidates apply to your jobs
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="applicationUpdates"
                          checked={notificationSettings.applicationUpdates}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              applicationUpdates: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="applicationUpdates">Enabled</Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Interview Reminders</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive reminders before scheduled interviews
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="interviewReminders"
                          checked={notificationSettings.interviewReminders}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              interviewReminders: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="interviewReminders">Enabled</Label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveNotificationSettings} disabled={isUpdatingNotifications}>
                    {isUpdatingNotifications ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                    {isDeletingAccount ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ats">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle>Applicant Tracking System</CardTitle>
                    {/* ATS AI Criteria Dropdown */}
                    <AtsCriteriaDropdown />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        placeholder="Search resumes..."
                        className="pl-8"
                        value={atsSearchTerm}
                        onChange={(e) => setAtsSearchTerm(e.target.value)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        console.log("🔄 Manual ATS refresh triggered...")
                        setAtsIsLoading(true)
                        fetchAtsResumes().finally(() => setAtsIsLoading(false))
                      }}
                      disabled={atsIsLoading}
                      title="Refresh candidates"
                    >
                      <RefreshCw className={`h-4 w-4 ${atsIsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Enhanced Debug Information */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Total: {atsResumes.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Total Candidates: {atsResumes.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">Filtered: {atsFilteredResumes.length}</span>
                    </div>
                    {atsSearchTerm && (
                      <div className="flex items-center gap-2">
                        <Search className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Searching: "{atsSearchTerm}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rest of existing ATS content */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {atsFilteredResumes.length} {atsFilteredResumes.length === 1 ? "resume" : "resumes"} found
                  </p>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAtsExport}
                      disabled={atsIsExporting || atsFilteredResumes.length === 0}
                      className="flex items-center bg-green-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {atsIsExporting ? "Exporting..." : "Export All"}
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="highlight-keywords"
                        checked={atsHighlightKeywords}
                        onCheckedChange={(checked) => setAtsHighlightKeywords(!!checked)}
                      />
                      <Label htmlFor="highlight-keywords">Highlight Keywords</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  {/* Filters Panel */}
                  <div className="space-y-4">
                    <FilterPanel
                      filters={atsFilters}
                      setFilters={setAtsFilters}
                      applyFilters={applyAtsFilters}
                      resetFilters={resetAtsFilters}
                    />
                  </div>

                  {/* Candidates Panel with Column Filters */}
                  <div className="space-y-4 flex flex-col h-full">
                    {/* Column Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <FilterDropdown
                        title="Candidate"
                        options={atsResumes
                          .map((r) => ({
                            value: `${r.firstName} ${r.lastName}`.trim(),
                            label: `${r.firstName} ${r.lastName}`.trim(),
                            checked: candidateNameFilter.includes(`${r.firstName} ${r.lastName}`.trim()),
                          }))
                          .filter(
                            (option, index, self) =>
                              index === self.findIndex((t) => t.value === option.value && t.value !== ""),
                          )}
                        onFilter={handleCandidateNameFilter}
                        onSort={handleCandidateNameSort}
                        canSort={true}
                      />

                      <FilterDropdown
                        title="Position"
                        options={[...new Set(atsResumes.map((r) => r.currentPosition))].filter(Boolean).map((pos) => ({
                          value: pos,
                          label: pos,
                          checked: positionFilter.includes(pos),
                        }))}
                        onFilter={handlePositionFilter}
                        onSort={handlePositionSort}
                        canSort={true}
                      />

                      <FilterDropdown
                        title="Status"
                        options={[...new Set(atsResumes.map((r) => r.status))].filter(Boolean).map((status) => ({
                          value: status,
                          label: status,
                          checked: statusFilter.includes(status),
                        }))}
                        onFilter={handleStatusFilter}
                        onSort={handleStatusSort}
                        canSort={true}
                      />

                      <FilterDropdown
                        title="Applied Date"
                        options={[...new Set(atsResumes.map((r) => r.appliedDate))].filter(Boolean).map((date) => ({
                          value: date,
                          label: date,
                          checked: appliedDateFilter.includes(date),
                        }))}
                        onFilter={handleAppliedDateFilter}
                        onSort={handleAppliedDateSort}
                        canSort={true}
                      />
                    </div>

                    {/* Candidates List with full height */}
                    <div className="flex-grow">
                      <CandidateList
                        candidates={atsFilteredResumes}
                        isLoading={atsIsLoading}
                        onSelectCandidate={(candidate) => {
                          setAtsSelectedResume(candidate as Candidate)
                        }}
                        selectedCandidateId={atsSelectedResume?._id || null}
                        showViewButton={true}
                        allCandidates={atsResumes}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle>Assessments Dashboard</CardTitle>
                <CardDescription>Manage and view candidate assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span>Assessment dashboard is loading</span>
                  <span className="flex">
                    <span className="animate-bounce [animation-delay:0s]">.</span>
                    <span className="animate-bounce [animation-delay:0.15s]">.</span>
                    <span className="animate-bounce [animation-delay:0.3s]">.</span>
                    <span className="animate-bounce [animation-delay:0.45s]">.</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the settings content.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Remove CandidateSelectionProvider from EmployeeDashboardWrapper
function EmployeeDashboardWrapper(props: any) {
  return (
    <EmployeeDashboard userData={props.userData || null} />
  )
}

// Export the wrapped component, but wrap with CandidateSelectionProvider at the export level
const WrappedDashboard = withAuth(EmployeeDashboardWrapper)

export default function DashboardPage(props: any) {
  return (
    <CandidateSelectionProvider>
      <WrappedDashboard {...props} />
    </CandidateSelectionProvider>
  )
}

// Add this component at the bottom of the file or in a suitable place
function AtsCriteriaDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-100 text-black rounded flex items-center border border-gray-300 hover:bg-gray-200"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        AI Scoring Criteria <ChevronDown className="h-3 w-3 ml-1" />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-72 right-0 bg-white border border-gray-200 rounded shadow-lg p-3 text-xs text-black">
          <div className="font-semibold mb-1">AI ATS Score is based on:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Number of skills</li>
            <li>Diversity of skills</li>
            <li>Relevant IT/HR keywords in skills</li>
            <li>Number of experience entries</li>
            <li>Recent experience (last 2 years)</li>
            <li>Number of education entries</li>
            <li>Bonus for Masters/PhD</li>
            <li>Number of certifications</li>
            <li>Profile completeness (summary, resume, photo, email, phone)</li>
          </ul>
          <div className="mt-2 text-gray-500">The higher the match, the higher the score.</div>
        </div>
      )}
    </div>
  );
}
