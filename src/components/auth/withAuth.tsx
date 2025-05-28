"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

interface WithAuthProps {
  userType?: string
}

export default function withAuth<P extends object>(Component: React.ComponentType<P>, requiredUserType?: string) {
  return function WithAuth(props: P & WithAuthProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      async function checkAuth() {
        try {
          const response = await fetch("/api/auth/check", {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (!response.ok) {
            throw new Error("Not authenticated")
          }

          const data = await response.json()

          // Check if user type matches required type
          if (requiredUserType && data.userType !== requiredUserType) {
            throw new Error("Unauthorized access")
          }

          setUser(data.user)
          setIsAuthorized(true)
        } catch (error) {
          console.error("Authentication error:", error)

          // Check if current route is in employee portal area
          const isEmployeeRoute =
            pathname.includes("/employee") ||
            pathname.includes("/admin") ||
            requiredUserType === "employee" ||
            requiredUserType === "admin"

          // Redirect to appropriate login page based on route
          if (isEmployeeRoute) {
            router.push("/auth/employee/login")
          } else {
            router.push("/auth/login")
          }

          toast.error("Please log in to access this page")
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [router, pathname])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    return isAuthorized ? <Component {...props} user={user} /> : null
  }
}
