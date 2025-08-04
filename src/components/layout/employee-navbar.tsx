"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Users, Briefcase, Calendar, Settings, Search, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Overview",
    href: "/employee/dashboard",
    icon: User,
  },
  {
    label: "Candidates",
    href: "/employee/dashboard?tab=candidates",
    icon: Users,
  },
  {
    label: "Jobs",
    href: "/employee/dashboard?tab=jobs",
    icon: Briefcase,
  },
  {
    label: "Interviews",
    href: "/employee/dashboard?tab=interviews",
    icon: Calendar,
  },
  {
    label: "ATS",
    href: "/employee/dashboard?tab=ats",
    icon: Search,
  },
  {
    label: "Assessments",
    href: "/employee/assessment/dashboard",
    icon: ClipboardCheck,
  },
  {
    label: "Settings",
    href: "/employee/dashboard?tab=settings",
    icon: Settings,
  },
]

export function EmployeeNavbar() {
  const pathname = usePathname()
  const currentTab = pathname.includes("/employee/dashboard") ? pathname.split("?tab=")[1] || "overview" : ""
  const isAssessments = pathname.includes("/employee/assessment")

  return (
    <div className="w-full bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 justify-center">
          {navItems.map((item) => {
            const isActive = item.label.toLowerCase() === currentTab || (item.label === "Assessments" && isAssessments)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
