"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { toast, Toaster } from "sonner"

const rejectionReasons = [
  { value: "", label: "Select a reason for rejection", disabled: true },
  { value: "incomplete_information", label: "Incomplete Information" },
  { value: "document_error", label: "Document Error or Invalid Documents" },
  { value: "company_verification_failed", label: "Company Verification Failed" },
  { value: "duplicate_account", label: "Duplicate Account" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "not_eligible", label: "Not Eligible for the Platform" },
  { value: "other", label: "Other" },
]

export default function RejectEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    reason: "",
    comments: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const employeeId = params.id as string

  // Minimal auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/admin/employee/${employeeId}`, { credentials: "include" })
        if (res.status === 401 || res.status === 403) {
          router.replace("/auth/employee/login")
        }
      } catch (e) {
        // Network error, do nothing
      }
    }
    if (employeeId) checkAuth()
  }, [employeeId, router])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.reason) {
      toast.error("Please select a rejection reason")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/verify-employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          employeeId,
          action: "reject",
          rejectionReason: formData.reason,
          rejectionComments: formData.comments,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || "Failed to reject employer")
      }

      toast.success("Employer rejected successfully")
      setTimeout(() => {
        router.push("/admin/employees")
      }, 2000)
    } catch (error) {
      console.error("Error rejecting employer:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`Failed to reject employer: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push(`/admin/verify-employee/${employeeId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <Toaster position="top-center" richColors />
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Employers Details
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-red-50 border-b">
            <CardTitle className="text-2xl text-red-700 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Reject Employer Application
            </CardTitle>
            <CardDescription>Please provide a reason for rejection and any additional comments</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {rejectionReasons.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Provide specific details about the rejection reason..."
                  rows={5}
                />
                <p className="text-sm text-gray-500">
                  These comments will be included in the rejection email sent to the applicant.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Important Note</h3>
                  <p className="text-amber-700 text-sm">
                    The applicant will be able to appeal this decision and resubmit their application.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-gray-50">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm Rejection"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
