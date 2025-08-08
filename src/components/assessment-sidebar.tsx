"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, BarChart, Send, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/employee/assessment/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tests",
    href: "/employee/assessment/tests",
    icon: FileText,
  },
  {
    title: "Candidates",
    href: "/employee/assessment/candidates",
    icon: Users,
  },
  {
    title: "Results",
    href: "/employee/assessment/results",
    icon: BarChart,
  },
  {
    title: "Invitations",
    href: "/employee/assessment/invitations",
    icon: Send,
  },
]

export function AssessmentSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-emerald-50/80 to-emerald-100/70 backdrop-blur-sm border-r border-emerald-200/30 overflow-y-auto fixed left-0 top-0 pt-16">
      <div className="p-4 border-b border-emerald-200/30 bg-emerald-100/20">
        <h2 className="text-xl font-bold flex items-center text-emerald-800">
          <FileText className="mr-2 h-5 w-5 text-emerald-600" />
          Assessment Dashboard
        </h2>
      </div>
      <nav className="p-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-black text-white font-medium shadow-sm"
                      : "text-emerald-700/80 hover:bg-emerald-100/50 hover:text-emerald-800",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
