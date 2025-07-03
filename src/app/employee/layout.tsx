import type React from "react"
import { Toaster } from "sonner"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {children}
    </div>
  )
}
