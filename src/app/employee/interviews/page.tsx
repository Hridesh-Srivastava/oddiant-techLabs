"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function InterviewsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with interviews tab
    router.replace("/employee/dashboard?tab=interviews")
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900">Redirecting to dashboard...</h3>
      </div>
    </div>
  )
}