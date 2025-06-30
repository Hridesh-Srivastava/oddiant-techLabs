"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function withAuth(Component: React.ComponentType<any>, role = "employee") {
  return function WithAuth(props: any) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [userData, setUserData] = useState(null)

    useEffect(() => {
      async function checkAuth() {
        try {
          const response = await fetch(`/api/${role}/profile`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (response.status === 401) {
            router.push(`/auth/${role}/login`)
            return
          }

          if (!response.ok) {
            throw new Error("Failed to fetch user data")
          }

          const data = await response.json()
          setUserData(data[role])
        } catch (error) {
          console.error("Authentication error:", error)
          router.push(`/auth/${role}/login`)
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [router, role])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )
    }

    return <Component {...props} userData={userData} />
  }
}

export default withAuth
