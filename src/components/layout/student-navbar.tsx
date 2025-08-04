"use client"

import { useRouter, usePathname } from "next/navigation"
import { RefreshCw, Briefcase, FileText, User, Award, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudentNavbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  onAssessmentsClick?: () => void
  isAssessmentsLoading?: boolean
}

export function StudentNavbar({ 
  onRefresh, 
  isRefreshing = false, 
  onAssessmentsClick,
  isAssessmentsLoading = false 
}: StudentNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleTabChange = (value: string) => {
    switch (value) {
      case "jobs":
        router.push("/student/dashboard?tab=jobs")
        break
      case "applications":
        router.push("/student/dashboard?tab=applications")
        break
      case "profile":
        router.push("/student/dashboard?tab=profile")
        break
      case "settings":
        router.push("/student/dashboard?tab=settings")
        break
      default:
        break
    }
  }

  const handleAssessmentsClick = () => {
    if (onAssessmentsClick) {
      onAssessmentsClick()
    } else {
      router.push("/student/dashboard?tab=assessments")
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center border-b">
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="mb-2 mr-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        )}
        
        <div className="flex space-x-2 justify-center flex-1">
          <button
            onClick={() => handleTabChange("jobs")}
            className={`px-4 py-2 font-medium ${
              pathname.includes("/student/dashboard") && !pathname.includes("?tab=")
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
              pathname.includes("/student/applications") || pathname.includes("?tab=applications")
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
              pathname.includes("?tab=profile")
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            My Profile
          </button>
          <button
            onClick={handleAssessmentsClick}
            className={`px-4 py-2 font-medium text-gray-500 hover:text-gray-700 flex items-center`}
          >
            {isAssessmentsLoading ? (
              <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
            ) : (
              <Award className="h-4 w-4 inline mr-2" />
            )}
            Assessments
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`px-4 py-2 font-medium ${
              pathname.includes("?tab=settings")
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </button>
        </div>
      </div>
    </div>
  )
} 