"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import {
  User,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  Search,
  Building,
  MapPin,
  Clock,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Phone,
  Mail,
  Linkedin,
  Globe,
  Upload,
  PencilLine,
  X,
  GraduationCap,
  Award,
  Calendar,
  DollarSign,
  Timer,
  BriefcaseIcon,
  CalendarIcon,
  Hash,
  SlidersHorizontal,
  Download,
  AlertCircle,
  FileCheck,
  CreditCard,
  Laptop,
  Video,
  Music,
  ImageIcon,
  Info,
  MessageSquare,
  Layers,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { MapPinIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface StudentData {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  alternativePhone?: string;
  profileCompleted: boolean;
  salutation?: string;
  gender?: string;
  dob?: string;
  currentCity?: string;
  currentState?: string;
  pincode?: string;
  permanentAddress?: string;
  skills?: string[];
  education?: Array<{
    level?: string;
    degree?: string;
    institution?: string;
    school?: string;
    field?: string;
    grade?: string;
    percentage?: string;
    startingYear?: string;
    endingYear?: string;
    mode?: string;
  }>;
  certifications?:
    | string[]
    | Array<{
        name: string;
        issuingOrganization: string;
        issueDate: string;
        expiryDate?: string;
        credentialId?: string;
        credentialUrl?: string;
      }>;
  experience?: Array<{
    title: string;
    companyName: string;
    department?: string;
    location?: string;
    tenure?: string;
    currentlyWorking?: boolean;
    professionalSummary?: string;
    summary?: string;
    currentSalary?: string;
    expectedSalary?: string;
    noticePeriod?: string;
    totalExperience?: string;
    yearsOfExperience?: string;
  }>;

  totalExperience?: string;
  yearsOfExperience?: string;
  shiftPreference?: string | string[];
  preferenceCities?: string[];
  preferredCities?: string[];
  profileOutline?: string;
  onlinePresence?: {
    portfolio?: string;
    linkedin?: string;
    github?: string;
    socialMedia?: string;
  };
  portfolioLink?: string;
  socialMediaLink?: string;
  linkedIn?: string;
  coverLetter?: string;
  additionalInfo?: string;
  documents?: {
    resume?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
    photograph?: {
      url?: string;
      public_id?: string;
      name?: string;
      uploadDate?: string;
    };
    videoResume?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
    audioBiodata?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
  };
  assets?: {
    bike?: boolean;
    wifi?: boolean;
    laptop?: boolean;
    panCard?: boolean;
    aadhar?: boolean;
    bankAccount?: boolean;
    idProof?: boolean;
  };
  settings?: {
    profileVisibility: boolean;
    notifications: {
      email: boolean;
      jobRecommendations: boolean;
      applicationUpdates: boolean;
    };
    preferredJobTypes: string[];
    preferredLocations: string[];
    shiftPreference: string;
    alternativeEmail?: string;
  };
  avatar?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;

  // Add candidates collection field mappings
  dateOfBirth?: string; // candidates use this instead of dob
  workExperience?: Array<{
    title: string;
    companyName: string;
    department?: string;
    location?: string;
    tenure?: string;
    currentlyWorking?: boolean;
    professionalSummary?: string;
    summary?: string;
    currentSalary?: string;
    expectedSalary?: string;
    noticePeriod?: string;
    totalExperience?: string;
    yearsOfExperience?: string;
  }>;

  // Document field mappings for candidates
  resumeUrl?: string;
  videoResumeUrl?: string;
  audioBiodataUrl?: string;
  photographUrl?: string;

  // Other candidates fields
  availableAssets?: string[];
  identityDocuments?: string[];

  // Add source field to track collection
  source?: string;
}

interface JobPosting {
  _id: string;
  jobTitle: string;
  jobLocation: string;
  experienceRange: string;
  jobType: string;
  salaryRange: string;
  companyName: string;
  skills: string[];
  status: string;
  createdAt: string;
  daysLeft: number;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  hasApplied?: boolean;
}

interface Application {
  _id: string;
  jobId: string;
  status: string;
  appliedDate: string;
  job: {
    jobTitle: string;
    companyName: string;
    jobLocation: string;
    jobType: string;
  };
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not specified";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid date";
  }
};

const formatUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
};

// Helper function to format full name properly (FIXED)
const getFullName = (student: StudentData): string => {
  const parts: string[] = [];

  if (student.salutation) {
    parts.push(student.salutation);
  }

  if (student.firstName) {
    parts.push(student.firstName);
  }

  // Only add middleName if it exists and is not "noMid"
  if (student.middleName && student.middleName.toLowerCase() !== "nomid") {
    parts.push(student.middleName);
  }

  if (student.lastName) {
    parts.push(student.lastName);
  }

  return parts.join(" ");
};

// Helper function to safely get experience array from either collection
const getExperienceArray = (student: StudentData): Array<any> => {
  // Try experience field first (students collection)
  if (student.experience && Array.isArray(student.experience)) {
    return student.experience;
  }

  // Try workExperience field (candidates collection)
  if (student.workExperience && Array.isArray(student.workExperience)) {
    return student.workExperience;
  }

  // Return empty array as fallback
  return [];
};

// Helper function to get date of birth from either collection
const getDateOfBirth = (student: StudentData): string => {
  return student.dob || student.dateOfBirth || "";
};

// Helper function to get documents safely
const getDocuments = (student: StudentData) => {
  return {
    resume: {
      url: student.documents?.resume?.url || student.resumeUrl || "",
      filename: student.documents?.resume?.filename || "",
      uploadDate: student.documents?.resume?.uploadDate || "",
    },
    videoResume: {
      url: student.documents?.videoResume?.url || student.videoResumeUrl || "",
      filename: student.documents?.videoResume?.filename || "",
      uploadDate: student.documents?.videoResume?.uploadDate || "",
    },
    audioBiodata: {
      url:
        student.documents?.audioBiodata?.url || student.audioBiodataUrl || "",
      filename: student.documents?.audioBiodata?.filename || "",
      uploadDate: student.documents?.audioBiodata?.uploadDate || "",
    },
    photograph: {
      url:
        student.documents?.photograph?.url ||
        student.photographUrl ||
        student.avatar ||
        "",
      name: student.documents?.photograph?.name || "",
      uploadDate: student.documents?.photograph?.uploadDate || "",
    },
  };
};

// Helper function to get available assets
const getAvailableAssets = (student: StudentData): string[] => {
  if (student.availableAssets && student.availableAssets.length > 0) {
    return student.availableAssets;
  }

  if (student.assets) {
    const assets: string[] = [];
    if (student.assets.bike) assets.push("Bike / Car");
    if (student.assets.wifi) assets.push("WiFi");
    if (student.assets.laptop) assets.push("Laptop");
    return assets;
  }

  return [];
};

// Helper function to get identity documents
const getIdentityDocuments = (student: StudentData): string[] => {
  if (student.identityDocuments && student.identityDocuments.length > 0) {
    return student.identityDocuments;
  }

  if (student.assets) {
    const documents: string[] = [];
    if (student.assets.panCard) documents.push("PAN Card");
    if (student.assets.aadhar) documents.push("Aadhar");
    if (student.assets.bankAccount) documents.push("Bank Account");
    if (student.assets.idProof)
      documents.push("Voter ID / Passport / DL (Any)");
    return documents;
  }

  return [];
};

// Helper function to safely get preferred cities from either collection
const getPreferredCities = (student: StudentData): string[] => {
  // Try preferenceCities field first (students collection)
  if (student.preferenceCities && Array.isArray(student.preferenceCities)) {
    return student.preferenceCities;
  }

  // Try preferredCities field (candidates collection)
  if (student.preferredCities && Array.isArray(student.preferredCities)) {
    return student.preferredCities;
  }

  // Return empty array as fallback
  return [];
};

const getTotalExperience = (student: StudentData): string => {
  // First check direct properties
  if (student.totalExperience) return student.totalExperience;
  if (student.yearsOfExperience) return student.yearsOfExperience;

  // Get experience array safely
  const experienceArray = getExperienceArray(student);

  if (experienceArray.length > 0) {
    // First check if any experience entry has totalExperience or yearsOfExperience
    for (const exp of experienceArray) {
      if (exp.totalExperience) return exp.totalExperience;
      if (exp.yearsOfExperience) return exp.yearsOfExperience;
    }

    // Then try to calculate from tenure
    let totalYears = 0;
    experienceArray.forEach((exp) => {
      if (exp.tenure) {
        const yearMatch = exp.tenure.match(/(\d+)\s*years?/i);
        if (yearMatch && yearMatch[1]) {
          totalYears += Number.parseInt(yearMatch[1], 10);
        }
      }
    });

    if (totalYears > 0) return `${totalYears} years`;
  }

  return "Not specified";
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "jobs";

  const [student, setStudent] = useState<StudentData | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterJobType, setFilterJobType] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StudentData["settings"] | null>(
    null
  );
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const [alternativeEmail, setAlternativeEmail] = useState("");
  const [currentAlternativeEmail, setCurrentAlternativeEmail] = useState("");
  const [alternativeEmailError, setAlternativeEmailError] = useState("");
  const [isUpdatingAlternativeEmail, setIsUpdatingAlternativeEmail] =
    useState(false);
  const [isRemovingAlternativeEmail, setIsRemovingAlternativeEmail] =
    useState(false);

  const [primaryEmail, setPrimaryEmail] = useState("");
  const [isUpdatingPrimaryEmail, setIsUpdatingPrimaryEmail] = useState(false);
  const [primaryEmailError, setPrimaryEmailError] = useState("");

  // New filters for My Applications section
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [applicationFilterLocation, setApplicationFilterLocation] =
    useState("");
  const [applicationFilterStatus, setApplicationFilterStatus] = useState("");
  const [applicationFilterJobTitle, setApplicationFilterJobTitle] =
    useState("");
  const [applicationFilterCompany, setApplicationFilterCompany] = useState("");
  const [applicationFilterJobId, setApplicationFilterJobId] = useState("");
  const [applicationDateFrom, setApplicationDateFrom] = useState("");
  const [applicationDateTo, setApplicationDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [showRecentApplicationsOnly, setShowRecentApplicationsOnly] =
    useState(false);

  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{
    jobs: JobPosting[];
    applications: Application[];
  }>({
    jobs: [],
    applications: [],
  });

  // Add these state variables for job filters
  const [jobFilters, setJobFilters] = useState({
    searchTerm: "",
    location: "",
    jobType: "",
    recentOnly: false, // New filter for recent jobs
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  // Store all jobs for filtering
  const [allJobs, setAllJobs] = useState<JobPosting[]>([]);

  // Add pagination info state
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 6,
  });

  // Add pagination state for applications
  const [currentApplicationPage, setCurrentApplicationPage] = useState(1);
  const applicationsPerPage = 6;

  // Store all applications for filtering
  const [allApplications, setAllApplications] = useState<Application[]>([]);

  // Add pagination info state for applications
  const [applicationPaginationInfo, setApplicationPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 6,
  });

  const [isAssessmentsLoading, setIsAssessmentsLoading] = useState(false);

  const handleAssessmentsClick = () => {
    setIsAssessmentsLoading(true);
    setTimeout(() => {
      setIsAssessmentsLoading(false);
      router.push("/student/dashboard/assessments");
    }, 800); // mimic loading
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user data from API instead of relying on props
        const response = await fetch("/api/student/profile", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }

        if (!response.ok) {
          if (response.status === 404) {
            setError(
              "Student profile not found. Please complete your registration."
            );
          } else {
            setError("Failed to load profile data. Please try again later.");
          }
          return;
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to load profile data");
          return;
        }

        // Log the student data for debugging
        console.log("Student data:", data.student);

        setStudent(data.student);

        // Fetch settings
        fetchSettings();
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/student/settings", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
          if (data.alternativeEmail) {
            setCurrentAlternativeEmail(data.alternativeEmail);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchJobs = async (page = currentPage, search = searchTerm, location = filterLocation, jobType = filterJobType, recentOnly = jobFilters.recentOnly) => {
    try {
      setIsLoadingJobs(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: jobsPerPage.toString(),
      });

      if (search) {
        params.append("search", search);
      }
      if (location) {
        params.append("location", location);
      }
      if (jobType) {
        params.append("jobType", jobType);
      }
      if (recentOnly) {
        params.append("recentOnly", "true");
      }

      const response = await fetch(`/api/jobs/available?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch jobs:", response.status);
        // Use mock data if API fails
        const mockJobs = [
          {
            _id: "1",
            jobTitle: "Frontend Developer",
            jobLocation: "Remote",
            experienceRange: "1-3 years",
            jobType: "Full-time",
            salaryRange: "$60,000 - $80,000",
            companyName: "Tech Solutions Inc.",
            skills: ["React", "JavaScript", "CSS"],
            status: "open",
            createdAt: new Date().toISOString(),
            daysLeft: 30,
          },
          {
            _id: "2",
            jobTitle: "Backend Developer",
            jobLocation: "New York",
            experienceRange: "2-5 years",
            jobType: "Full-time",
            salaryRange: "$80,000 - $100,000",
            companyName: "Data Systems LLC",
            skills: ["Node.js", "Express", "MongoDB"],
            status: "open",
            createdAt: new Date().toISOString(),
            daysLeft: 25,
          },
        ];
        setJobs(mockJobs);
        setAllJobs(mockJobs); // Store all jobs for filtering
        setPaginationInfo({
          currentPage: 1,
          totalPages: 1,
          totalJobs: 2,
          hasNextPage: false,
          hasPrevPage: false,
          limit: jobsPerPage,
        });
        return;
      }

      const data = await response.json();
      console.log("Fetched jobs:", data.jobs);
      console.log("Pagination info:", data.pagination);
      
      setJobs(data.jobs || []);
      setAllJobs(data.jobs || []); // Store all jobs for filtering
      
      // Update pagination info
      if (data.pagination) {
        setPaginationInfo(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Use mock data if API fails
      const mockJobs = [
        {
          _id: "1",
          jobTitle: "Frontend Developer",
          jobLocation: "Remote",
          experienceRange: "1-3 years",
          jobType: "Full-time",
          salaryRange: "$60,000 - $80,000",
          companyName: "Tech Solutions Inc.",
          skills: ["React", "JavaScript", "CSS"],
          status: "open",
          createdAt: new Date().toISOString(),
          daysLeft: 30,
        },
        {
          _id: "2",
          jobTitle: "Backend Developer",
          jobLocation: "New York",
          experienceRange: "2-5 years",
          jobType: "Full-time",
          salaryRange: "$80,000 - $100,000",
          companyName: "Data Systems LLC",
          skills: ["Node.js", "Express", "MongoDB"],
          status: "open",
          createdAt: new Date().toISOString(),
          daysLeft: 25,
        },
      ];
      setJobs(mockJobs);
      setAllJobs(mockJobs); // Store all jobs for filtering
      setPaginationInfo({
        currentPage: 1,
        totalPages: 1,
        totalJobs: 2,
        hasNextPage: false,
        hasPrevPage: false,
        limit: jobsPerPage,
      });
    } finally {
      setIsLoadingJobs(false);
    }
  };
  const fetchApplications = async (page = currentApplicationPage, search = applicationSearchTerm, location = applicationFilterLocation, status = applicationFilterStatus, jobTitle = applicationFilterJobTitle, company = applicationFilterCompany, jobId = applicationFilterJobId, dateFrom = applicationDateFrom, dateTo = applicationDateTo, recentOnly = showRecentApplicationsOnly) => {
    try {
      setIsLoadingApplications(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: applicationsPerPage.toString(),
      });

      if (search) {
        params.append("search", search);
      }
      if (location) {
        params.append("location", location);
      }
      if (status) {
        params.append("status", status);
      }
      if (jobTitle) {
        params.append("jobTitle", jobTitle);
      }
      if (company) {
        params.append("company", company);
      }
      if (jobId) {
        params.append("jobId", jobId);
      }
      if (dateFrom) {
        params.append("dateFrom", dateFrom);
      }
      if (dateTo) {
        params.append("dateTo", dateTo);
      }
      if (recentOnly) {
        params.append("recentOnly", "true");
      }

      const response = await fetch(`/api/student/applications?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch applications:", response.status);
        setApplications([]);
        return;
      }

      const data = await response.json();
      console.log("Fetched applications:", data.applications);
      setApplications(data.applications || []);
      setAllApplications(data.applications || []);
      
      if (data.pagination) {
        setApplicationPaginationInfo(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (!isLoading && student) {
      fetchJobs(currentPage, searchTerm, filterLocation, filterJobType, jobFilters.recentOnly);
      fetchApplications(currentApplicationPage, applicationSearchTerm, applicationFilterLocation, applicationFilterStatus, applicationFilterJobTitle, applicationFilterCompany, applicationFilterJobId, applicationDateFrom, applicationDateTo, showRecentApplicationsOnly);
    }
  }, [isLoading, student, currentPage, searchTerm, filterLocation, filterJobType, jobFilters.recentOnly, currentApplicationPage, applicationSearchTerm, applicationFilterLocation, applicationFilterStatus, applicationFilterJobTitle, applicationFilterCompany, applicationFilterJobId, applicationDateFrom, applicationDateTo, showRecentApplicationsOnly]);

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }
    };
  }, []);

  // This effect ensures the tab content is updated when the URL parameter changes
  useEffect(() => {
    // Force re-render when tab changes in URL
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchJobs(currentPage, searchTerm, filterLocation, filterJobType, jobFilters.recentOnly), 
      fetchApplications(currentApplicationPage, applicationSearchTerm, applicationFilterLocation, applicationFilterStatus, applicationFilterJobTitle, applicationFilterCompany, applicationFilterJobId, applicationDateFrom, applicationDateTo, showRecentApplicationsOnly)
    ]);
    setIsRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.push("/auth/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const handleTabChange = (value: string) => {
    router.push(`/student/dashboard?tab=${value}`);
  };

  const handleSearchResultClick = (type: string, id?: string) => {
    // Clear the search
    setGlobalSearch("");

    if (type === "job" && id) {
      // Redirect to specific job details
      router.push(`/jobs/${id}`);
    } else if (type === "application" && id) {
      // Redirect to specific application details
      router.push(`/student/applications/${id}`);
    } else if (type === "profile") {
      // Switch to profile tab
      handleTabChange("profile");
    } else if (type === "settings") {
      // Switch to settings tab
      handleTabChange("settings");
    } else if (type === "jobs") {
      // Switch to jobs tab
      handleTabChange("jobs");
    } else if (type === "applications") {
      // Switch to applications tab
      handleTabChange("applications");
    }
  };

  const handleAvatarEdit = () => {
    setIsEditingAvatar(true);
  };

  const filterRecentApplications = (applications: Application[]) => {
    if (!showRecentApplicationsOnly) return applications;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return applications.filter((app) => {
      const appliedDate = new Date(app.appliedDate);
      return appliedDate >= oneWeekAgo;
    });
  };

  const handleAvatarUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add this search function with your other functions
  const handleSearchInput = (term: string) => {
    setGlobalSearch(term);

    if (!term.trim()) {
      setSearchResults({ jobs: [], applications: [] });
      return;
    }

    const searchTerm = term.toLowerCase();

    // Search in jobs
    const matchedJobs = jobs.filter(
      (job) =>
        job.jobTitle.toLowerCase().includes(searchTerm) ||
        job.companyName.toLowerCase().includes(searchTerm) ||
        job.jobLocation.toLowerCase().includes(searchTerm) ||
        job.skills.some((skill) => skill.toLowerCase().includes(searchTerm))
    );

    // Search in applications
    const matchedApplications = applications.filter(
      (app) =>
        app.job.jobTitle.toLowerCase().includes(searchTerm) ||
        app.job.companyName.toLowerCase().includes(searchTerm) ||
        app.status.toLowerCase().includes(searchTerm)
    );

    setSearchResults({
      jobs: matchedJobs,
      applications: matchedApplications,
    });
  };

  // New function to handle job search (for backend pagination)
  const handleJobSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    // The useEffect will automatically fetch with new search term
  };

  // Debounced search function to avoid too many API calls
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);
  
  const handleDebouncedJobSearch = (term: string) => {
    // Immediately update searchTerm for visual feedback
    setSearchTerm(term);
    
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }
    
    debouncedSearch.current = setTimeout(() => {
      handleJobSearch(term);
    }, 500); // 500ms delay
  };


  // New function to handle location filter
  const handleLocationFilter = (location: string) => {
    setFilterLocation(location);
    setCurrentPage(1); // Reset to first page when filtering
    // The useEffect will automatically fetch with new filter
  };

  // New function to handle job type filter
  const handleJobTypeFilter = (jobType: string) => {
    setFilterJobType(jobType);
    setCurrentPage(1); // Reset to first page when filtering
    // The useEffect will automatically fetch with new filter
  };

  // Update this function to work with backend pagination
  const filterRecentJobs = (days = 7) => {
    setJobFilters({ ...jobFilters, recentOnly: true });
    setCurrentPage(1); // Reset to first page when filtering
    // The useEffect will automatically fetch with recentOnly filter

    toast.success(`Showing newly available jobs`);
  };

  // Update this function to work with your data structure
  const resetJobFilters = () => {
    setSearchTerm("");
    setFilterLocation("");
    setFilterJobType("");
    setJobFilters({ ...jobFilters, recentOnly: false });
    setCurrentPage(1); // Reset to first page when resetting filters
    // The useEffect will automatically fetch with reset filters

    toast.success("All job filters have been reset");
  };

  // Application search and filter handlers
  const handleApplicationSearch = (term: string) => {
    setApplicationSearchTerm(term);
    setCurrentApplicationPage(1);
  };

  const handleApplicationLocationFilter = (location: string) => {
    setApplicationFilterLocation(location);
    setCurrentApplicationPage(1);
  };

  const handleApplicationStatusFilter = (status: string) => {
    setApplicationFilterStatus(status);
    setCurrentApplicationPage(1);
  };

  const handleApplicationJobTitleFilter = (jobTitle: string) => {
    setApplicationFilterJobTitle(jobTitle);
    setCurrentApplicationPage(1);
  };

  const handleApplicationCompanyFilter = (company: string) => {
    setApplicationFilterCompany(company);
    setCurrentApplicationPage(1);
  };

  const handleApplicationJobIdFilter = (jobId: string) => {
    setApplicationFilterJobId(jobId);
    setCurrentApplicationPage(1);
  };

  const handleApplicationDateFromFilter = (dateFrom: string) => {
    setApplicationDateFrom(dateFrom);
    setCurrentApplicationPage(1);
  };

  const handleApplicationDateToFilter = (dateTo: string) => {
    setApplicationDateTo(dateTo);
    setCurrentApplicationPage(1);
  };

  const handleApplicationRecentFilter = () => {
    setShowRecentApplicationsOnly(!showRecentApplicationsOnly);
    setCurrentApplicationPage(1);
  };

  const paginateApplications = (pageNumber: number) => {
    setCurrentApplicationPage(pageNumber);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      toast.loading("Uploading avatar...");

      // Create form data
      const formData = new FormData();
      formData.append("avatar", file);

      // Send to server
      const response = await fetch("/api/student/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const data = await response.json();

      // Update student state with new avatar URL from server
      setStudent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          avatar: data.avatarUrl,
          documents: {
            ...prev.documents,
            photograph: {
              url: data.avatarUrl,
              uploadDate: new Date().toISOString(),
              name: file.name,
            },
          },
        };
      });

      toast.dismiss();
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.dismiss();
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      setIsEditingAvatar(false);
    }
  };

  const handleCancelAvatarEdit = () => {
    setIsEditingAvatar(false);
  };

  const handleExportToPDF = async () => {
    if (!student) return;

    try {
      setIsGeneratingPDF(true);
      toast.loading("Generating PDF resume...");

      // Create a hidden div to render the PDF content
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.top = "-9999px";
      document.body.appendChild(pdfContainer);

      // Get experience array safely
      const experienceArray = getExperienceArray(student);
      const preferredCities = getPreferredCities(student);

      // Create the PDF content with proper styling
      pdfContainer.innerHTML = `
        <div id="pdf-content" style="width: 210mm; padding: 20mm; font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; color: #000; margin-bottom: 5px;">${getFullName(
            student
          )} - Resume</h1>
            <p style="color: #666; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <!-- Personal Information Section -->
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Personal Information</h2>
            <div style="display: flex; flex-wrap: wrap;">
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Full Name</p>
              <p style="font-size: 16px; margin-top: 0;">${getFullName(
                student
              )}</p>
              </div>
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Gender</p>
                <p style="font-size: 16px; margin-top: 0;">${
                  student.gender || "Not specified"
                }</p>
              </div>
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Date of Birth</p>
                <p style="font-size: 16px; margin-top: 0;">${formatDate(
                  student.dob
                )}</p>
              </div>
              ${
                student.pincode
                  ? `
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Pincode</p>
                <p style="font-size: 16px; margin-top: 0;">${student.pincode}</p>
              </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Contact Information Section -->
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Contact Information</h2>
            <div style="display: flex; flex-wrap: wrap;">
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Email</p>
                <p style="font-size: 16px; margin-top: 0;">${student.email}</p>
              </div>
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Phone</p>
                <p style="font-size: 16px; margin-top: 0;">${
                  student.phone || "Not provided"
                }</p>
              </div>
              ${
                student.alternativePhone
                  ? `
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Alternative Phone</p>
                <p style="font-size: 16px; margin-top: 0;">${student.alternativePhone}</p>
              </div>
              `
                  : ""
              }
              <div style="width: 50%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Current Location</p>
                <p style="font-size: 16px; margin-top: 0;">${
                  student.currentCity && student.currentState
                    ? `${student.currentCity}, ${student.currentState}`
                    : "Not provided"
                }</p>
              </div>
              ${
                student.permanentAddress
                  ? `
              <div style="width: 100%; margin-bottom: 10px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Permanent Address</p>
                <p style="font-size: 16px; margin-top: 0;">${student.permanentAddress}</p>
              </div>
              `
                  : ""
              }
            </div>

            <!-- Online Presence -->
            ${
              student.onlinePresence?.linkedin ||
              student.linkedIn ||
              student.onlinePresence?.portfolio ||
              student.portfolioLink ||
              student.onlinePresence?.github ||
              student.onlinePresence?.socialMedia ||
              student.socialMediaLink
                ? `
            <div style="margin-top: 10px;">
              <h3 style="font-size: 16px; color: #4b5563; margin-bottom: 8px;">Online Presence</h3>
              <div style="display: flex; flex-wrap: wrap;">
                ${
                  student.onlinePresence?.linkedin || student.linkedIn
                    ? `
                <div style="width: 50%; margin-bottom: 10px;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 2px;">LinkedIn</p>
                  <p style="font-size: 16px; margin-top: 0; color: #2563eb;">${
                    student.onlinePresence?.linkedin || student.linkedIn
                  }</p>
                </div>
                `
                    : ""
                }
                ${
                  student.onlinePresence?.portfolio || student.portfolioLink
                    ? `
                <div style="width: 50%; margin-bottom: 10px;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Portfolio</p>
                  <p style="font-size: 16px; margin-top: 0; color: #2563eb;">${
                    student.onlinePresence?.portfolio || student.portfolioLink
                  }</p>
                </div>
                `
                    : ""
                }
                ${
                  student.onlinePresence?.github
                    ? `
                <div style="width: 50%; margin-bottom: 10px;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 2px;">GitHub</p>
                  <p style="font-size: 16px; margin-top: 0; color: #2563eb;">${student.onlinePresence.github}</p>
                </div>
                `
                    : ""
                }
                ${
                  student.onlinePresence?.socialMedia || student.socialMediaLink
                    ? `
                <div style="width: 50%; margin-bottom: 10px;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 2px;">Social Media</p>
                  <p style="font-size: 16px; margin-top: 0; color: #2563eb;">${
                    student.onlinePresence?.socialMedia ||
                    student.socialMediaLink
                  }</p>
                </div>
                `
                    : ""
                }
              </div>
            </div>
            `
                : ""
            }
          </div>

          <!-- Profile Summary Section -->
          ${
            student.profileOutline
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Profile Summary</h2>
            <p style="font-size: 16px; line-height: 1.5; white-space: pre-line;">${student.profileOutline}</p>
          </div>
          `
              : ""
          }

          <!-- Skills Section -->
          ${
            student.skills && student.skills.length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Skills</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${student.skills
                .map(
                  (skill) =>
                    `<span style="display: inline-block; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 8px; font-size: 14px;">${skill}</span>`
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Professional Experience Summary Section -->
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Professional Experience Summary</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              <div style="background-color: #eff6ff; border-radius: 6px; padding: 15px; text-align: center; flex: 1;">
                <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Total Experience</p>
                <p style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 0;">${getTotalExperience(
                  student
                )}</p>
              </div>
              ${
                student.currentSalary ||
                (experienceArray.length > 0 &&
                  experienceArray[0]?.currentSalary)
                  ? `
              <div style="background-color: #ecfdf5; border-radius: 6px; padding: 15px; text-align: center; flex: 1;">
                <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Current Salary</p>
                <p style="font-size: 18px; font-weight: bold; color: #059669; margin: 0;">${
                  student.currentSalary ||
                  experienceArray[0]?.currentSalary ||
                  "Not specified"
                }</p>
              </div>
              `
                  : ""
              }
              ${
                student.expectedSalary ||
                (experienceArray.length > 0 &&
                  experienceArray[0]?.expectedSalary)
                  ? `
              <div style="background-color: #f5f3ff; border-radius: 6px; padding: 15px; text-align: center; flex: 1;">
                <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Expected Salary</p>
                <p style="font-size: 18px; font-weight: bold; color: #7c3aed; margin: 0;">${
                  student.expectedSalary ||
                  experienceArray[0]?.expectedSalary ||
                  "Not specified"
                }</p>
              </div>
              `
                  : ""
              }
              ${
                student.noticePeriod ||
                (experienceArray.length > 0 && experienceArray[0]?.noticePeriod)
                  ? `
              <div style="background-color: #fffbeb; border-radius: 6px; padding: 15px; text-align: center; flex: 1;">
                <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Notice Period</p>
                <p style="font-size: 18px; font-weight: bold; color: #d97706; margin: 0;">${
                  student.noticePeriod ||
                  experienceArray[0]?.noticePeriod ||
                  "Not specified"
                }</p>
              </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Shift Preference Section -->
          ${
            student.shiftPreference ||
            (student.settings?.shiftPreference &&
              student.settings.shiftPreference !== "flexible")
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Shift Preference</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${
                Array.isArray(student.shiftPreference)
                  ? student.shiftPreference
                      .map(
                        (shift) =>
                          `<span style="display: inline-block; background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 4px; padding: 4px 8px; font-size: 14px; color: #1e40af;">${shift}</span>`
                      )
                      .join("")
                  : `<span style="display: inline-block; background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 4px; padding: 4px 8px; font-size: 14px; color: #1e40af;">${
                      student.shiftPreference ||
                      student.settings?.shiftPreference ||
                      "Flexible"
                    }</span>`
              }
            </div>
          </div>
          `
              : ""
          }

          <!-- Preferred Cities Section -->
          ${
            preferredCities.length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Preferred Cities</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${preferredCities
                .slice(0, 5)
                .map(
                  (city) =>
                    `<span style="display: inline-block; background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 4px 8px; font-size: 14px; color: #065f46;">${city}</span>`
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Education Section -->
          ${
            student.education && student.education.length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Education</h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
              ${student.education
                .map(
                  (edu) => `
                <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <h3 style="font-size: 16px; margin: 0;">Degree/Course: ${
                      edu.degree || "Not specified"
                    }</h3>
                    <span style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 6px; font-size: 14px;">%age/CGPA: ${
                      edu.percentage || edu.grade || "Not specified"
                    }</span>
                  </div>
                  <p style="font-size: 15px; color: #4b5563; margin: 5px 0;">School/College/Univ.: ${
                    edu.institution || edu.school || "Not specified"
                  }</p>
                  ${
                    edu.field
                      ? `<p style="font-size: 15px; color: #4b5563; margin: 5px 0;">Field of Study: ${edu.field}</p>`
                      : ""
                  }
                  <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                    <span style="margin-right: 5px;">📅</span>
                    ${edu.startingYear || "Not provided"} - ${
                    edu.endingYear || "Present"
                  }
                  </p>
                  ${
                    edu.level || edu.mode
                      ? `
                  <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 14px;">
                    ${
                      edu.level
                        ? `
                    <div>
                      <span style="color: #6b7280;">Level: </span>
                      <span>${edu.level}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      edu.mode
                        ? `
                    <div>
                      <span style="color: #6b7280;">Mode: </span>
                      <span>${edu.mode}</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                  `
                      : ""
                  }
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Work Experience Section -->
          ${
            experienceArray.length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">
              Work Experience
              <span style="display: inline-block; background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; font-size: 14px; color: #1e40af; margin-left: 10px;">Total: ${getTotalExperience(
                student
              )}</span>
            </h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
              ${experienceArray
                .map(
                  (exp) => `
                <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <h3 style="font-size: 16px; margin: 0;">Title: ${
                      exp.title || "Not specified"
                    }</h3>
                    ${
                      exp.currentlyWorking
                        ? `<span style="background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 2px 6px; font-size: 14px; color: #065f46;">Current</span>`
                        : ""
                    }
                  </div>
                  <p style="font-size: 15px; color: #4b5563; margin: 5px 0;">Company: ${
                    exp.companyName || "Not specified"
                  }</p>
                  ${
                    exp.department
                      ? `<p style="font-size: 15px; margin: 5px 0;">Department: ${exp.department}</p>`
                      : ""
                  }
                  ${
                    exp.location
                      ? `<p style="font-size: 14px; color: #6b7280; margin: 5px 0;">${exp.location}</p>`
                      : ""
                  }
                  ${
                    exp.tenure
                      ? `
                  <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                    <span style="margin-right: 5px;">⏱️</span>
                    Tenure: ${exp.tenure}
                  </p>
                  `
                      : ""
                  }
                  ${
                    exp.professionalSummary || exp.summary
                      ? `
                  <p style="font-size: 14px; margin: 10px 0; white-space: pre-line;">
                    <strong>Professional Summary:</strong> ${
                      exp.professionalSummary || exp.summary
                    }
                  </p>
                  `
                      : ""
                  }
                  <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; font-size: 14px;">
                    ${
                      exp.currentSalary
                        ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: #6b7280; margin-right: 5px;">💰 Current:</span>
                      <span>${exp.currentSalary}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      exp.expectedSalary
                        ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: #6b7280; margin-right: 5px;">💰 Expected:</span>
                      <span>${exp.expectedSalary}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      exp.noticePeriod
                        ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: #6b7280; margin-right: 5px;">⏱️ Notice Period:</span>
                      <span>${exp.noticePeriod}</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Certifications Section -->
          ${
            student.certifications &&
            Array.isArray(student.certifications) &&
            student.certifications.length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Certifications</h2>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${getCertificationNames(student)
                .map(
                  (cert) => `
                <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;">
                  <h3 style="font-size: 16px; margin: 0;">${cert}</h3>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Available Assets Section -->
          ${
            getAvailableAssets(student).length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Available Assets</h2>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${getAvailableAssets(student)
                .map(
                  (asset) => `
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 8px; color: #6b7280;">✓</span>
                  <span>${asset.replace(/_/g, " ")}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Identity Documents Section -->
          ${
            getIdentityDocuments(student).length > 0
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Identity Documents</h2>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${getIdentityDocuments(student)
                .map(
                  (doc) => `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center;">
                    <span style="margin-right: 8px; color: #6b7280;">📄</span>
                    <span>${doc.replace(/_/g, " ")}</span>
                  </div>
                  <span style="background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 2px 6px; font-size: 14px; color: #065f46;">Verified</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Cover Letter Section -->
          ${
            student.coverLetter
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Cover Letter</h2>
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.5; white-space: pre-line;">${student.coverLetter}</p>
            </div>
          </div>
          `
              : ""
          }

          <!-- Additional Information Section -->
          ${
            student.additionalInfo
              ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">Additional Information</h2>
            <p style="font-size: 15px; line-height: 1.5; white-space: pre-line;">${student.additionalInfo}</p>
          </div>
          `
              : ""
          }

         <!-- Documents Section -->
<div style="margin-bottom: 20px;">
  <h2>Documents</h2>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    
    <!-- Resume -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px;">📄</span>
        <span>Resume</span>
      </div>
      ${
        getDocuments(student).resume.url
          ? `<a href="${
              getDocuments(student).resume.url
            }" style="color: #2563eb; text-decoration: underline;">${
              getDocuments(student).resume.url
            }</a>`
          : `<span style="color: #b91c1c;">Not uploaded</span>`
      }
    </div>

    <!-- Video Resume -->
    ${
      getDocuments(student).videoResume.url
        ? `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px;">🎥</span>
        <span>Video Resume</span>
      </div>
      <a href="${
        getDocuments(student).videoResume.url
      }" style="color: #2563eb; text-decoration: underline;">${
            getDocuments(student).videoResume.url
          }</a>
    </div>
    `
        : ""
    }

    <!-- Audio Biodata -->
    ${
      getDocuments(student).audioBiodata.url
        ? `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px;">🎵</span>
        <span>Audio Bio</span>
      </div>
      <a href="${
        getDocuments(student).audioBiodata.url
      }" style="color: #2563eb; text-decoration: underline;">${
            getDocuments(student).audioBiodata.url
          }</a>
    </div>
    `
        : ""
    }

    <!-- Photograph -->
    ${
      getDocuments(student).photograph.url
        ? `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px;">🖼️</span>
        <span>Profile Photo</span>
      </div>
      <a href="${
        getDocuments(student).photograph.url
      }" style="color: #2563eb; text-decoration: underline;">${
            getDocuments(student).photograph.url
          }</a>
    </div>
    `
        : ""
    }

  </div>
</div>

          <!-- Footer -->
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This document was generated from the candidate profile on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>© ${new Date().getFullYear()} Oddiant Techlabs - All Rights Reserved</p>
          </div>
        </div>
      `;

      // Wait for the content to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the content element
      const content = document.getElementById("pdf-content");
      if (!content) {
        throw new Error("PDF content element not found");
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Capture the content as an image
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Add the image to the PDF
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If the image is taller than the page, split it into multiple pages
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 1;

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = -pdfHeight * pageCount;
        pageCount++;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save the PDF
      pdf.save(`${getFullName(student).replace(/\s+/g, "_")}_Resume.pdf`);

      // Clean up
      document.body.removeChild(pdfContainer);

      toast.dismiss();
      toast.success("PDF resume generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF resume");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Helper function to get certification names
  const getCertificationNames = (student: StudentData) => {
    if (!student.certifications || student.certifications.length === 0) {
      return [];
    }

    // If certifications is an array of strings, return it directly
    if (typeof student.certifications[0] === "string") {
      return student.certifications as string[];
    }

    // If certifications is an array of objects, extract the name property
    return (student.certifications as Array<{ name: string }>).map(
      (cert) => cert.name
    );
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsUpdatingSettings(true);
    try {
      const response = await fetch("/api/student/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/student/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || "Failed to apply for job");
        return;
      }

      const data = await response.json();
      toast.success("Application submitted successfully");

      // Update jobs list to mark this job as applied
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === jobId
            ? {
                ...job,
                hasApplied: true,
              }
            : job
        )
      );

      // Refresh applications list
      fetchApplications();
    } catch (error) {
      console.error("Error applying for job:", error);
      toast.error("An error occurred while applying for the job");
    }
  };

  // Since we're now doing backend pagination, we don't need client-side filtering
  // The backend handles all filtering and pagination
  const currentJobs = jobs;

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // The useEffect will automatically fetch the new page
  };

  // Filter applications based on all filter criteria
  const filteredApplications = applications.filter((application) => {
    // Main search term (searches across multiple fields)
    const matchesMainSearch = !applicationSearchTerm
      ? true
      : (application.job?.jobTitle &&
          application.job.jobTitle
            .toLowerCase()
            .includes(applicationSearchTerm.toLowerCase())) ||
        (application.job?.companyName &&
          application.job.companyName
            .toLowerCase()
            .includes(applicationSearchTerm.toLowerCase())) ||
        (application._id &&
          application._id
            .toLowerCase()
            .includes(applicationSearchTerm.toLowerCase())) ||
        (application.jobId &&
          application.jobId
            .toLowerCase()
            .includes(applicationSearchTerm.toLowerCase()));

    // Location filter
    const matchesLocation = !applicationFilterLocation
      ? true
      : application.job?.jobLocation &&
        application.job.jobLocation
          .toLowerCase()
          .includes(applicationFilterLocation.toLowerCase());

    // Status filter
    const matchesStatus = !applicationFilterStatus
      ? true
      : application.status.toLowerCase() ===
        applicationFilterStatus.toLowerCase();

    // Job title filter (advanced)
    const matchesJobTitle = !applicationFilterJobTitle
      ? true
      : application.job?.jobTitle &&
        application.job.jobTitle
          .toLowerCase()
          .includes(applicationFilterJobTitle.toLowerCase());

    // Company filter (advanced)
    const matchesCompany = !applicationFilterCompany
      ? true
      : application.job?.companyName &&
        application.job.companyName
          .toLowerCase()
          .includes(applicationFilterCompany.toLowerCase());

    // Job ID filter (advanced)
    const matchesJobId = !applicationFilterJobId
      ? true
      : (application.jobId &&
          application.jobId
            .toLowerCase()
            .includes(applicationFilterJobId.toLowerCase())) ||
        (application._id &&
          application._id
            .toLowerCase()
            .includes(applicationFilterJobId.toLowerCase()));

    // Date range filter (advanced)
    let matchesDateRange = true;
    if (applicationDateFrom || applicationDateTo) {
      const appliedDate = new Date(application.appliedDate);

      if (applicationDateFrom) {
        const fromDate = new Date(applicationDateFrom);
        if (appliedDate < fromDate) {
          matchesDateRange = false;
        }
      }

      if (applicationDateTo) {
        const toDate = new Date(applicationDateTo);
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        if (appliedDate > toDate) {
          matchesDateRange = false;
        }
      }
    }

    return (
      matchesMainSearch &&
      matchesLocation &&
      matchesStatus &&
      matchesJobTitle &&
      matchesCompany &&
      matchesJobId &&
      matchesDateRange
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>;
      case "shortlisted":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Shortlisted</Badge>
        );
      case "interview":
        return (
          <Badge className="bg-purple-100 text-purple-800">Interview</Badge>
        );
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "hired":
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Format date helper function
  const formatUrlOriginal = (url: string | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Reset all application filters
  const resetApplicationFilters = () => {
    setApplicationSearchTerm("");
    setApplicationFilterLocation("");
    setApplicationFilterStatus("");
    setApplicationFilterJobTitle("");
    setApplicationFilterCompany("");
    setApplicationFilterJobId("");
    setApplicationDateFrom("");
    setApplicationDateTo("");
    setShowAdvancedFilters(false);
    setShowRecentApplicationsOnly(false);
    setCurrentApplicationPage(1); // Reset to first page when filters are cleared
  };

  const handleSaveAlternativeEmail = async () => {
    if (!alternativeEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alternativeEmail)) {
      setAlternativeEmailError("Please enter a valid email address");
      return;
    }

    // Check if same as primary email
    if (student && student.email === alternativeEmail) {
      setAlternativeEmailError(
        "Alternative email cannot be the same as your primary email"
      );
      return;
    }

    setAlternativeEmailError("");
    setIsUpdatingAlternativeEmail(true);

    try {
      const response = await fetch("/api/student/alternative-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alternativeEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save alternative email");
      }

      setCurrentAlternativeEmail(alternativeEmail);
      setAlternativeEmail("");
      toast.success("Alternative email saved successfully");
    } catch (error) {
      console.error("Error saving alternative email:", error);
      setAlternativeEmailError(
        error instanceof Error
          ? error.message
          : "Failed to save alternative email"
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save alternative email"
      );
    } finally {
      setIsUpdatingAlternativeEmail(false);
    }
  };

  const handleRemoveAlternativeEmail = async () => {
    if (!currentAlternativeEmail) return;

    if (
      !confirm(
        "Are you sure you want to remove your alternative email? You will no longer be able to use it to sign in."
      )
    ) {
      return;
    }

    setIsRemovingAlternativeEmail(true);

    try {
      const response = await fetch("/api/student/alternative-email", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove alternative email");
      }

      setCurrentAlternativeEmail("");
      toast.success("Alternative email removed successfully");
    } catch (error) {
      console.error("Error removing alternative email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove alternative email"
      );
    } finally {
      setIsRemovingAlternativeEmail(false);
    }
  };

  const handleSavePrimaryEmail = async () => {
    if (!primaryEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryEmail)) {
      setPrimaryEmailError("Please enter a valid email address");
      return;
    }

    // Check if same as alternative email
    if (currentAlternativeEmail && primaryEmail === currentAlternativeEmail) {
      setPrimaryEmailError(
        "Primary email cannot be the same as your alternative email"
      );
      return;
    }

    setPrimaryEmailError("");
    setIsUpdatingPrimaryEmail(true);

    try {
      const response = await fetch("/api/student/primary-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ primaryEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save primary email");
      }

      // Update student state with new email
      setStudent((prev) => (prev ? { ...prev, email: primaryEmail } : prev));
      toast.success("Primary email updated successfully");
    } catch (error) {
      console.error("Error saving primary email:", error);
      setPrimaryEmailError(
        error instanceof Error ? error.message : "Failed to save primary email"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to save primary email"
      );
    } finally {
      setIsUpdatingPrimaryEmail(false);
    }
  };

  useEffect(() => {
    if (student) {
      setPrimaryEmail(student.email || "");
    }
  }, [student]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was a problem loading your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push("/auth/login")}
              >
                Go to Login
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              Your session has expired or you are not logged in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full hover:bg-green-600 hover:text-black"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <header className="bg-black shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              Candidate Dashboard
            </h1>

            {/* Search Bar - RIGHT NEXT TO Candidate Dashboard text */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Dashboard..."
                className="pl-10 h-9 bg-white text-black w-full"
                value={globalSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
              />

              {/* Search Results Dropdown */}
              {globalSearch.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <p className="text-sm">
                      Found {searchResults.jobs.length} jobs and{" "}
                      {searchResults.applications.length} applications matching
                      "{globalSearch}"
                    </p>
                  </div>

                  {/* Jobs section */}
                  {searchResults.jobs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Jobs
                      </p>
                      {searchResults.jobs.slice(0, 3).map((job) => (
                        <div
                          key={job._id}
                          className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          onClick={() =>
                            handleSearchResultClick("job", job._id)
                          }
                        >
                          <div className="flex items-center">
                            <Briefcase className="h-3 w-3 mr-2 text-blue-500" />
                            <span>
                              {job.jobTitle} - {job.companyName}
                            </span>
                          </div>
                        </div>
                      ))}
                      {searchResults.jobs.length > 3 && (
                        <div
                          className="px-2 py-1 text-xs text-blue-600 hover:underline cursor-pointer"
                          onClick={() => handleSearchResultClick("jobs")}
                        >
                          View all {searchResults.jobs.length} jobs
                        </div>
                      )}
                    </div>
                  )}

                  {/* Applications section */}
                  {searchResults.applications.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Applications
                      </p>
                      {searchResults.applications.slice(0, 3).map((app) => (
                        <div
                          key={app._id}
                          className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          onClick={() =>
                            handleSearchResultClick("application", app._id)
                          }
                        >
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-2 text-green-500" />
                            <span>
                              {app.job?.jobTitle || "Unknown Job"} ({app.status}
                              )
                            </span>
                          </div>
                        </div>
                      ))}
                      {searchResults.applications.length > 3 && (
                        <div
                          className="px-2 py-1 text-xs text-blue-600 hover:underline cursor-pointer"
                          onClick={() =>
                            handleSearchResultClick("applications")
                          }
                        >
                          View all {searchResults.applications.length}{" "}
                          applications
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick links section */}
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Quick Links
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      <div
                        className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        onClick={() => handleSearchResultClick("profile")}
                      >
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-2 text-purple-500" />
                          <span>My Profile</span>
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        onClick={() => handleSearchResultClick("settings")}
                      >
                        <div className="flex items-center">
                          <Settings className="h-3 w-3 mr-2 text-gray-500" />
                          <span>Settings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-white">
              Welcome, {getFullName(student)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-transparent text-white border-white hover:bg-white hover:text-black"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!student.profileCompleted && (
          <Card className="mb-8 border-yellow-300 bg-yellow-50">
            <CardContent className="p-4 flex items-center">
              <svg
                className="h-6 w-6 text-yellow-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Your profile is incomplete. Please complete your profile to
                  access all features.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                onClick={() => router.push("/student/profile/edit")}
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-6">

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Main Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => handleTabChange("jobs")}
              className={`px-4 py-2 font-medium ${
                activeTab === "jobs"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Briefcase className="h-4 w-4 inline mr-2" />
              Job Openings
            </button>
            <button
              onClick={() => handleTabChange("applications")}
              className={`px-4 py-2 font-medium ${
                activeTab === "applications"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              My Applications
            </button>
            <button
              onClick={() => handleTabChange("profile")}
              className={`px-4 py-2 font-medium ${
                activeTab === "profile"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              My Profile
            </button>
            {/* New Assessments Tab */}
            <button
              onClick={handleAssessmentsClick}
              className={`px-4 py-2 font-medium text-gray-500 hover:text-gray-700 flex items-center`}
            >
              {isAssessmentsLoading ? (
                <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
              ) : (
                <Award className="h-4 w-4 inline mr-2" />
              )}
              Assessments
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className={`px-4 py-2 font-medium ${
                activeTab === "settings"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Job Openings Tab */}
        {activeTab === "jobs" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Latest Job Openings</CardTitle>
                <CardDescription>
                  Browse through the latest job opportunities that match your
                  skills and experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search jobs by title, company, skills, or job ID..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => handleDebouncedJobSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="relative w-full md:w-40">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Location"
                          className="pl-10"
                          value={filterLocation}
                          onChange={(e) => handleLocationFilter(e.target.value)}
                        />
                      </div>
                      <div className="relative w-full md:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <select
                          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
                          value={filterJobType}
                          onChange={(e) => handleJobTypeFilter(e.target.value)}
                        >
                          <option value="">Job Type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                      <Button
                        variant={jobFilters.recentOnly ? "default" : "outline"}
                        className="whitespace-nowrap"
                        onClick={() => filterRecentJobs(7)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        New Job Openings
                      </Button>

                      {/* Reset Button */}
                      <Button
                        variant="ghost"
                        onClick={resetJobFilters}
                        className="whitespace-nowrap bg-red-600 text-white hover:bg-red-900 hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                {isLoadingJobs ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No job openings found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterLocation || filterJobType
                        ? "Try adjusting your search filters"
                        : "Check back later for new opportunities"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentJobs.map((job) => (
                      <Card
                        key={job._id}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-0">
                          <div className="p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold">
                                    {job.jobTitle}
                                  </h3>
                                  <Badge variant="outline" className="text-xs bg-gray-50">
                                    ID: {job._id}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-2">
                                  {job.companyName}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {job.jobLocation}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {job.jobType}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Building className="h-4 w-4 mr-1" />
                                    {job.experienceRange}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {job.skills
                                    .slice(0, 3)
                                    .map((skill, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-50"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  {job.skills.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-gray-50"
                                    >
                                      +{job.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="mb-2 bg-green-100 text-green-800">
                                  {job.daysLeft} days left
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  Posted on{" "}
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                              <p className="text-sm font-medium text-gray-900">
                                {job.salaryRange || "Salary not disclosed"}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    router.push(`/jobs/${job._id}`)
                                  }
                                >
                                  View Details
                                </Button>
                                {job.hasApplied ? (
                                  <Button variant="outline" disabled>
                                    Applied
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleApplyToJob(job._id)}
                                  >
                                    Apply Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination UI */}
                    {paginationInfo.totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={!paginationInfo.hasPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        {Array.from(
                          { length: paginationInfo.totalPages },
                          (_, i) => i + 1
                        ).map((number) => (
                          <Button
                            key={number}
                            variant={
                              currentPage === number ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => paginate(number)}
                            className={`w-8 ${
                              currentPage === number
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {number}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={!paginationInfo.hasNextPage}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>
                  Track the status of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Main Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by job title, company, job ID, or application ID..."
                        className="pl-10"
                        value={applicationSearchTerm}
                        onChange={(e) =>
                          handleApplicationSearch(e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant={
                        showRecentApplicationsOnly ? "default" : "outline"
                      }
                      onClick={handleApplicationRecentFilter}
                      className="whitespace-nowrap"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {showRecentApplicationsOnly
                        ? "All Applications"
                        : "Recent Applications"}
                    </Button>
                    <div className="flex gap-4">
                      <div className="relative w-full md:w-40">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Location"
                          className="pl-10"
                          value={applicationFilterLocation}
                          onChange={(e) =>
                            handleApplicationLocationFilter(e.target.value)
                          }
                        />
                      </div>
                      <div className="relative w-full md:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <select
                          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
                          value={applicationFilterStatus}
                          onChange={(e) =>
                            handleApplicationStatusFilter(e.target.value)
                          }
                        >
                          <option value="">Status</option>
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters Toggle */}
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedFilters(!showAdvancedFilters)
                      }
                      className="text-blue-600"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {showAdvancedFilters
                        ? "Hide Advanced Filters"
                        : "Show Advanced Filters"}
                    </Button>

                    {(applicationSearchTerm ||
                      applicationFilterLocation ||
                      applicationFilterStatus ||
                      applicationFilterJobTitle ||
                      applicationFilterCompany ||
                      applicationFilterJobId ||
                      applicationDateFrom ||
                      applicationDateTo) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetApplicationFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <Label
                          htmlFor="job-title"
                          className="text-sm font-medium mb-1 block"
                        >
                          Job Title
                        </Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="job-title"
                            placeholder="Filter by job title"
                            className="pl-10"
                            value={applicationFilterJobTitle}
                            onChange={(e) =>
                              handleApplicationJobTitleFilter(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="company"
                          className="text-sm font-medium mb-1 block"
                        >
                          Company
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="company"
                            placeholder="Filter by company"
                            className="pl-10"
                            value={applicationFilterCompany}
                            onChange={(e) =>
                              handleApplicationCompanyFilter(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="job-id"
                          className="text-sm font-medium mb-1 block"
                        >
                          Job ID
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="job-id"
                            placeholder="Filter by job ID"
                            className="pl-10"
                            value={applicationFilterJobId}
                            onChange={(e) =>
                              handleApplicationJobIdFilter(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="date-from"
                          className="text-sm font-medium mb-1 block"
                        >
                          Applied From
                        </Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="date-from"
                            type="date"
                            className="pl-10"
                            value={applicationDateFrom}
                            onChange={(e) =>
                              handleApplicationDateFromFilter(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="date-to"
                          className="text-sm font-medium mb-1 block"
                        >
                          Applied To
                        </Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="date-to"
                            type="date"
                            className="pl-10"
                            value={applicationDateTo}
                            onChange={(e) =>
                              handleApplicationDateToFilter(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isLoadingApplications ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No applications yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      You haven't applied to any jobs yet
                    </p>
                    <Button onClick={() => handleTabChange("jobs")}>
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                        <Card
                          key={application._id}
                          className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold">
                                    {application.job?.jobTitle || "Unknown Job"}
                                  </h3>
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    App ID: {application._id}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-2">
                                  {application.job?.companyName ||
                                    "Unknown Company"}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {application.job?.jobLocation ||
                                    "Unknown Location"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Job ID: {application.jobId || application._id}
                                </div>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(application.status)}
                                <p className="text-xs text-gray-500 mt-1">
                                  Applied on{" "}
                                  {new Date(
                                    application.appliedDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end mt-4">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/student/applications/${application._id}`
                                  )
                                }
                              >
                                View Application
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {/* Applications Pagination UI */}
                    {applicationPaginationInfo.totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            paginateApplications(applicationPaginationInfo.currentPage - 1)
                          }
                          disabled={!applicationPaginationInfo.hasPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        {Array.from(
                          { length: applicationPaginationInfo.totalPages },
                          (_, i) => i + 1
                        ).map((number) => (
                          <Button
                            key={number}
                            variant={
                              applicationPaginationInfo.currentPage === number ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => paginateApplications(number)}
                            className={`w-8 ${
                              applicationPaginationInfo.currentPage === number
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {number}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            paginateApplications(applicationPaginationInfo.currentPage + 1)
                          }
                          disabled={!applicationPaginationInfo.hasNextPage}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  View and manage your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-32 w-32 mb-4">
                        <AvatarImage
                          src={
                            student.avatar ||
                            student.documents?.photograph?.url ||
                            student.photographUrl ||
                            "/placeholder.svg?height=128&width=128" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={getFullName(student)}
                        />
                        <AvatarFallback className="text-3xl">
                          {student.firstName?.charAt(0)}
                          {student.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {isEditingAvatar ? (
                        <div className="absolute -bottom-2 right-0 flex space-x-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-white"
                            onClick={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                          >
                            {isUploadingAvatar ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-white"
                            onClick={handleCancelAvatarEdit}
                            disabled={isUploadingAvatar}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute -bottom-2 right-0 h-8 w-8 rounded-full bg-white"
                          onClick={handleAvatarEdit}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-center">
                      {getFullName(student)}
                    </h3>
                    <p className="text-gray-500 text-center mb-4">
                      {student.email}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => router.push("/student/profile/edit")}
                    >
                      Edit Profile
                    </Button>
                    {(student.documents?.resume?.url || student.resumeUrl) && (
                      <Button variant="outline" className="w-full mb-2" asChild>
                        <a
                          href={
                            student.documents?.resume?.url || student.resumeUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resume
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center"
                      onClick={handleExportToPDF}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export to PDF
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="md:w-2/3" ref={pdfContentRef}>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p>{getFullName(student)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p>{student.gender || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Date of Birth
                            </p>
                            <p>{formatDate(getDateOfBirth(student))}</p>
                          </div>
                          {student.pincode && (
                            <div>
                              <p className="text-sm text-gray-500">Pincode</p>
                              <p>{student.pincode}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p>{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p>{student.phone || "Not provided"}</p>
                            </div>
                          </div>
                          {student.alternativePhone && (
                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  Alternative Phone
                                </p>
                                <p>{student.alternativePhone}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Current Location
                              </p>
                              <p>
                                {student.currentCity && student.currentState
                                  ? `${student.currentCity}, ${student.currentState}`
                                  : "Not provided"}
                              </p>
                            </div>
                          </div>
                          {(student.onlinePresence?.linkedin ||
                            student.linkedIn) && (
                            <div className="flex items-start gap-2">
                              <Linkedin className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  LinkedIn
                                </p>
                                <a
                                  href={formatUrlOriginal(
                                    student.onlinePresence?.linkedin ||
                                      student.linkedIn
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {(
                                    student.onlinePresence?.linkedin ||
                                    student.linkedIn ||
                                    ""
                                  ).replace(/^https?:\/\/(www\.)?/, "")}
                                </a>
                              </div>
                            </div>
                          )}
                          {(student.onlinePresence?.portfolio ||
                            student.portfolioLink) && (
                            <div className="flex items-start gap-2">
                              <Globe className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  Portfolio
                                </p>
                                <a
                                  href={formatUrlOriginal(
                                    student.onlinePresence?.portfolio ||
                                      student.portfolioLink
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {(
                                    student.onlinePresence?.portfolio ||
                                    student.portfolioLink ||
                                    ""
                                  ).replace(/^https?:\/\/(www\.)?/, "")}
                                </a>
                              </div>
                            </div>
                          )}
                          {(student.onlinePresence?.socialMedia ||
                            student.socialMediaLink) && (
                            <div className="flex items-start gap-2">
                              <Globe className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  Social Media
                                </p>
                                <a
                                  href={formatUrlOriginal(
                                    student.onlinePresence?.socialMedia ||
                                      student.socialMediaLink
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {(
                                    student.onlinePresence?.socialMedia ||
                                    student.socialMediaLink ||
                                    ""
                                  ).replace(/^https?:\/\/(www\.)?/, "")}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Profile Summary
                        </h4>
                        <p className="whitespace-pre-line">
                          {student.profileOutline ||
                            "No profile summary provided. Add a summary to tell employers about yourself."}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Skills
                        </h4>
                        {student.skills && student.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {student.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No skills added yet</p>
                        )}
                      </div>

                      {/* Professional Experience Summary */}
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-2" />
                          Professional Experience Summary
                        </h4>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded-md flex flex-col items-center">
                            <span className="text-sm text-gray-500">
                              Total Experience
                            </span>
                            <span className="text-lg font-semibold text-blue-700">
                              {getTotalExperience(student)}
                            </span>
                          </div>

                          {(student.currentSalary ||
                            (getExperienceArray(student).length > 0 &&
                              getExperienceArray(student)[0]
                                ?.currentSalary)) && (
                            <div className="bg-green-50 p-3 rounded-md flex flex-col items-center">
                              <span className="text-sm text-gray-500">
                                Current Salary
                              </span>
                              <span className="text-lg font-semibold text-green-700">
                                {student.currentSalary ||
                                  getExperienceArray(student)[0]
                                    ?.currentSalary ||
                                  "Not specified"}
                              </span>
                            </div>
                          )}

                          {(student.expectedSalary ||
                            (getExperienceArray(student).length > 0 &&
                              getExperienceArray(student)[0]
                                ?.expectedSalary)) && (
                            <div className="bg-purple-50 p-3 rounded-md flex flex-col items-center">
                              <span className="text-sm text-gray-500">
                                Expected Salary
                              </span>
                              <span className="text-lg font-semibold text-purple-700">
                                {student.expectedSalary ||
                                  getExperienceArray(student)[0]
                                    ?.expectedSalary ||
                                  "Not specified"}
                              </span>
                            </div>
                          )}

                          {(student.noticePeriod ||
                            (getExperienceArray(student).length > 0 &&
                              getExperienceArray(student)[0]
                                ?.noticePeriod)) && (
                            <div className="bg-amber-50 p-3 rounded-md flex flex-col items-center">
                              <span className="text-sm text-gray-500">
                                Notice Period
                              </span>
                              <span className="text-lg font-semibold text-amber-700">
                                {student.noticePeriod ||
                                  getExperienceArray(student)[0]
                                    ?.noticePeriod ||
                                  "Not specified"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shift Preference */}
                      {(student.shiftPreference ||
                        (student.settings?.shiftPreference &&
                          student.settings.shiftPreference !== "flexible")) && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Shift Preference
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Array.isArray(student.shiftPreference) ? (
                                student.shiftPreference.map((shift, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-800"
                                  >
                                    {shift}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-800"
                                >
                                  {student.shiftPreference ||
                                    student.settings?.shiftPreference ||
                                    "Flexible"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Preferred Cities */}
                      {getPreferredCities(student).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-2" />
                              Preferred Cities (Max 5)
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getPreferredCities(student)
                                .slice(0, 5)
                                .map((city, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-green-50 text-green-800"
                                  >
                                    {city}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </>
                      )}

                      {student.education && student.education.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Education
                            </h4>
                            <div className="space-y-4">
                              {student.education.map((edu, index) => (
                                <div
                                  key={index}
                                  className="border rounded-md p-3"
                                >
                                  <div className="flex justify-between">
                                    <h5 className="font-medium">
                                      Degree/Course: {edu.degree}
                                    </h5>
                                    <Badge variant="outline">
                                      %age/CGPA:{" "}
                                      {edu.percentage ||
                                        edu.grade ||
                                        "Not specified"}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600">
                                    School/College/Univ.:{" "}
                                    {edu.institution ||
                                      edu.school ||
                                      "Not specified"}
                                  </p>
                                  <div className="flex justify-between mt-1">
                                    <p className="text-sm text-gray-500">
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {edu.startingYear || "Not provided"} -{" "}
                                      {edu.endingYear || "Present"}
                                    </p>
                                  </div>
                                  {(edu.level || edu.mode) && (
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm justify-between">
                                      {edu.level && (
                                        <div>
                                          <span className="text-gray-500">
                                            Level:{" "}
                                          </span>
                                          {edu.level}
                                        </div>
                                      )}
                                      {edu.mode && (
                                        <div className="ml-auto">
                                          <span className="text-gray-500">
                                            Mode:{" "}
                                          </span>
                                          {edu.mode}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {getExperienceArray(student).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <Briefcase className="h-4 w-4 mr-2" />
                              Work Experience
                              <Badge
                                variant="outline"
                                className="ml-2 bg-blue-50 text-blue-800"
                              >
                                Total: {getTotalExperience(student)}
                              </Badge>
                            </h4>
                            <div className="space-y-4">
                              {getExperienceArray(student).map((exp, index) => (
                                <div
                                  key={index}
                                  className="border rounded-md p-3"
                                >
                                  <div className="flex justify-between">
                                    <h5 className="font-medium">
                                      Title: {exp.title}
                                    </h5>
                                    {exp.currentlyWorking && (
                                      <Badge className="bg-green-100 text-green-800">
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-600">
                                    Company: {exp.companyName}
                                  </p>
                                  {exp.department && (
                                    <p>Department: {exp.department}</p>
                                  )}
                                  {exp.location && (
                                    <p className="text-sm text-gray-500">
                                      {exp.location}
                                    </p>
                                  )}
                                  {exp.tenure && (
                                    <p className="text-sm text-gray-500">
                                      <Timer className="h-3 w-3 inline mr-1" />
                                      Tenure: {exp.tenure}
                                    </p>
                                  )}
                                  {(exp.professionalSummary || exp.summary) && (
                                    <p className="text-sm mt-2 whitespace-pre-line">
                                      <strong>Professional Summary:</strong>{" "}
                                      {exp.professionalSummary || exp.summary}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                    {exp.currentSalary && (
                                      <div className="flex items-center">
                                        <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                                        Current: {exp.currentSalary}
                                      </div>
                                    )}
                                    {exp.expectedSalary && (
                                      <div className="flex items-center">
                                        <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                                        Expected: {exp.expectedSalary}
                                      </div>
                                    )}
                                    {exp.noticePeriod && (
                                      <div className="flex items-center">
                                        <Timer className="h-3 w-3 mr-1 text-gray-500" />
                                        Notice Period: {exp.noticePeriod}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {student.certifications &&
                        Array.isArray(student.certifications) &&
                        student.certifications.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                                <Award className="h-4 w-4 mr-2" />
                                Certifications
                              </h4>
                              <div className="space-y-2">
                                {getCertificationNames(student).map(
                                  (cert, index) => (
                                    <div
                                      key={index}
                                      className="border rounded-md p-3"
                                    >
                                      <h5 className="font-medium">{cert}</h5>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </>
                        )}

                      {getAvailableAssets(student).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <Laptop className="h-4 w-4 mr-2" />
                              Available Assets
                            </h4>
                            <div className="space-y-2">
                              {getAvailableAssets(student).map(
                                (asset, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <span className="mr-2 text-green-600">
                                      ✓
                                    </span>
                                    <span>{asset.replace(/_/g, " ")}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {getIdentityDocuments(student).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Identity Documents
                            </h4>
                            <div className="space-y-2">
                              {getIdentityDocuments(student).map(
                                (doc, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center"
                                  >
                                    <div className="flex items-center">
                                      <FileCheck className="h-4 w-4 mr-2 text-gray-500" />
                                      <span>{doc.replace(/_/g, " ")}</span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                      Verified
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {student.coverLetter && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Cover Letter
                            </h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="whitespace-pre-line">
                                {student.coverLetter}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {student.additionalInfo && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Additional Information
                            </h4>
                            <p className="whitespace-pre-line">
                              {student.additionalInfo}
                            </p>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <Layers className="h-4 w-4 mr-2" />
                          Documents
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-500" />
                              <span>Resume</span>
                            </div>
                            {getDocuments(student).resume.url ? (
                              <a
                                href={getDocuments(student).resume.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-red-600">Not uploaded</span>
                            )}
                          </div>

                          {getDocuments(student).videoResume.url && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Video className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Video Resume</span>
                              </div>
                              <a
                                href={getDocuments(student).videoResume.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            </div>
                          )}

                          {getDocuments(student).audioBiodata.url && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Music className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Audio Bio</span>
                              </div>
                              <a
                                href={getDocuments(student).audioBiodata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Listen
                              </a>
                            </div>
                          )}

                          {getDocuments(student).photograph.url && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Profile Photo</span>
                              </div>
                              <a
                                href={getDocuments(student).photograph.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Email Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Email Settings
                    </h4>
                    <div className="space-y-4">
                      {/* Primary Email */}
                      <div>
                        <Label
                          htmlFor="primary-email"
                          className="text-sm font-medium"
                        >
                          Primary Email
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="primary-email"
                            type="email"
                            value={primaryEmail}
                            onChange={(e) => setPrimaryEmail(e.target.value)}
                            placeholder="Enter your primary email"
                          />
                          <Button
                            onClick={handleSavePrimaryEmail}
                            disabled={
                              isUpdatingPrimaryEmail ||
                              !primaryEmail ||
                              primaryEmail === student?.email
                            }
                          >
                            {isUpdatingPrimaryEmail ? "Updating..." : "Update"}
                          </Button>
                        </div>
                        {primaryEmailError && (
                          <p className="text-sm text-red-600 mt-1">
                            {primaryEmailError}
                          </p>
                        )}
                      </div>

                      {/* Alternative Email */}
                      <div>
                        <Label
                          htmlFor="alternative-email"
                          className="text-sm font-medium"
                        >
                          Alternative Email
                        </Label>
                        {currentAlternativeEmail ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={currentAlternativeEmail}
                              disabled
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleRemoveAlternativeEmail}
                              disabled={isRemovingAlternativeEmail}
                            >
                              {isRemovingAlternativeEmail
                                ? "Removing..."
                                : "Remove"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="alternative-email"
                              type="email"
                              value={alternativeEmail}
                              onChange={(e) =>
                                setAlternativeEmail(e.target.value)
                              }
                              placeholder="Enter alternative email"
                            />
                            <Button
                              onClick={handleSaveAlternativeEmail}
                              disabled={
                                isUpdatingAlternativeEmail || !alternativeEmail
                              }
                            >
                              {isUpdatingAlternativeEmail ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        )}
                        {alternativeEmailError && (
                          <p className="text-sm text-red-600 mt-1">
                            {alternativeEmailError}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          You can use this email to sign in to your account
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Password Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Password Settings
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Change Password
                          </Label>
                          <p className="text-xs text-gray-500">
                            Update your password to keep your account secure
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/student/change-password")}
                        >
                          Change Password
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Forgot Password
                          </Label>
                          <p className="text-xs text-gray-500">
                            Reset your password if you've forgotten it
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/student/forgot-password")}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Profile Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Profile Settings
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Profile Visibility
                          </Label>
                          <p className="text-xs text-gray-500">
                            Make your profile visible to employers
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.profileVisibility || false}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              notifications: {
                                email: false,
                                jobRecommendations: false,
                                applicationUpdates: false,
                              },
                              preferredJobTypes: [],
                              preferredLocations: [],
                              shiftPreference: "flexible",
                              ...prev,
                              profileVisibility: e.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Notification Settings
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Email Notifications
                          </Label>
                          <p className="text-xs text-gray-500">
                            Receive notifications via email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings?.notifications?.email || false}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              profileVisibility: false,
                              preferredJobTypes: [],
                              preferredLocations: [],
                              shiftPreference: "flexible",
                              ...prev,
                              notifications: {
                                jobRecommendations: false,
                                applicationUpdates: false,
                                ...prev?.notifications,
                                email: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Job Recommendations
                          </Label>
                          <p className="text-xs text-gray-500">
                            Get personalized job recommendations
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={
                            settings?.notifications?.jobRecommendations || false
                          }
                          onChange={(e) =>
                            setSettings((prev) => ({
                              profileVisibility: false,
                              preferredJobTypes: [],
                              preferredLocations: [],
                              shiftPreference: "flexible",
                              ...prev,
                              notifications: {
                                email: prev?.notifications?.email || false,
                                applicationUpdates:
                                  prev?.notifications?.applicationUpdates ||
                                  false,
                                jobRecommendations: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Application Updates
                          </Label>
                          <p className="text-xs text-gray-500">
                            Get updates on your job applications
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={
                            settings?.notifications?.applicationUpdates || false
                          }
                          onChange={(e) =>
                            setSettings((prev) => ({
                              profileVisibility: false,
                              preferredJobTypes: [],
                              preferredLocations: [],
                              shiftPreference: "flexible",
                              ...prev,
                              notifications: {
                                email: prev?.notifications?.email || false,
                                jobRecommendations:
                                  prev?.notifications?.jobRecommendations ||
                                  false,
                                applicationUpdates: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Job Preferences */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Job Preferences
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="shift-preference"
                          className="text-sm font-medium"
                        >
                          Shift Preference
                        </Label>
                        <select
                          id="shift-preference"
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-1"
                          value={settings?.shiftPreference || "flexible"}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              profileVisibility: false,
                              notifications: {
                                email: false,
                                jobRecommendations: false,
                                applicationUpdates: false,
                              },
                              preferredJobTypes: [],
                              preferredLocations: [],
                              ...prev,
                              shiftPreference: e.target.value,
                            }))
                          }
                        >
                          <option value="flexible">Flexible</option>
                          <option value="day">Day Shift</option>
                          <option value="night">Night Shift</option>
                          <option value="rotational">Rotational</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isUpdatingSettings}
                    >
                      {isUpdatingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
