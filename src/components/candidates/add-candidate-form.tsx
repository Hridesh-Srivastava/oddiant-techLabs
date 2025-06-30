"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileSpreadsheet } from "lucide-react"

interface JobOption {
  id: string
  title: string
  location: string
}

export function AddCandidateForm({ jobs = [] }: { jobs?: JobOption[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bulkEmails, setBulkEmails] = useState("")
  const [selectedJobId, setSelectedJobId] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [jobOptions, setJobOptions] = useState<JobOption[]>([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setJobOptions(jobs)
  }, [jobs])

  // Find the selected job to get its location
  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = e.target.value
    setSelectedJobId(jobId)
    const job = jobs.find((job) => job.id === jobId)
    if (job) {
      setSelectedLocation(job.location)
    }
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an Excel file
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      ".xlsx",
      ".xls",
    ]

    const fileType = file.type
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (!validTypes.includes(fileType) && !validTypes.includes(`.${fileExtension}`)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setIsProcessingFile(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/employee/candidates/parse-excel", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to parse Excel file")
      }

      const data = await response.json()

      if (!data.emails || !Array.isArray(data.emails)) {
        throw new Error("Invalid response format")
      }

      // Combine with existing emails if any
      const existingEmails = bulkEmails.trim() ? bulkEmails.split(/[\s,;]+/).filter(Boolean) : []
      const newEmails = data.emails.filter(Boolean)
      const combinedEmails = [...new Set([...existingEmails, ...newEmails])]

      setBulkEmails(combinedEmails.join(", "))
      toast.success(`Successfully extracted ${newEmails.length} email(s) from Excel file`)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error parsing Excel file:", error)
      toast.error("Failed to parse Excel file. Please check the format.")
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bulkEmails.trim() || !selectedJobId) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate emails
    const emailList = bulkEmails.split(/[\s,;]+/).filter((email) => email.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(", ")}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/employee/candidates/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: emailList,
          jobId: selectedJobId,
          location: selectedLocation,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitations")
      }

      toast.success(`Invitations sent to ${emailList.length} candidates`)
      setBulkEmails("")
      setSelectedJobId("")
      setSelectedLocation("")

      // Redirect to candidates list
      router.push("/employee/dashboard?tab=candidates")
      router.refresh()
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast.error("Failed to send invitations")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bulkEmails">
            Candidate Emails*{" "}
            <span className="text-xs text-gray-500">(Separate multiple emails with commas or new lines)</span>
          </Label>
          <div className="mt-1.5 space-y-2">
            <Textarea
              id="bulkEmails"
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              rows={5}
              required
            />
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx,.xls"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessingFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-green-700 text-white"
                  disabled={isProcessingFile}
                >
                  {isProcessingFile ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Upload Excel
                    </>
                  )}
                </Button>
              </div>
              <span className="ml-3 text-xs text-gray-500">Upload an Excel file with candidate emails (column A)</span>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="jobId">Position Applied For*</Label>
          <select
            id="jobId"
            name="jobId"
            value={selectedJobId}
            onChange={handleJobChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
            required
          >
            <option value="">Select a position</option>
            {jobOptions.length > 0 ? (
              jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No jobs available
              </option>
            )}
          </select>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            placeholder="e.g. New York, NY"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              Sending Invitations...
            </>
          ) : (
            "Invite Candidates"
          )}
        </Button>
      </div>
    </form>
  )
}
