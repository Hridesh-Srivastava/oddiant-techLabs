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
    <div className="w-full shadow-sm mb-6">
      <div className="max-w-7xl mx-auto ">
        <nav className="flex overflow-x-auto ml-72 mr-72 bg-gradient-to-br from-black to-black">
          {navItems.map((item) => {
            const isActive = item.label.toLowerCase() === currentTab || (item.label === "Assessments" && isAssessments)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-white hover:underline",
                )}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
