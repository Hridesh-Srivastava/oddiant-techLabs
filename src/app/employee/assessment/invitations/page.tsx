"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Search, Copy, Send, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AssessmentLayout } from "@/components/assessment-layout"
import * as XLSX from "xlsx"

interface InvitationData {
  _id: string
  email: string
  testId: string
  testName: string
  status: string
  createdAt: string
  expiresAt: string
}

interface TestData {
  _id: string
  name: string
}

export default function InvitationsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [invitations, setInvitations] = useState<InvitationData[]>([])
  const [filteredInvitations, setFilteredInvitations] = useState<InvitationData[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Available tests
  const [availableTests, setAvailableTests] = useState<TestData[]>([])

  // New invitation form
  const [selectedTest, setSelectedTest] = useState("")
  const [emails, setEmails] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Test links
  const [testLinks, setTestLinks] = useState<
    { id: string; testId: string; name: string; link: string; expiresIn: string }[]
  >([])
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  useEffect(() => {
    fetchInvitations()
    fetchAvailableTests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, invitations])

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/assessment/invitations", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }

      const data = await response.json()

      if (data.success) {
        setInvitations(data.invitations || [])
      } else {
        throw new Error(data.message || "Failed to fetch invitations")
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast.error("Failed to load invitations. Please try again.")
      setInvitations([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableTests = async () => {
    try {
      const response = await fetch("/api/assessment/tests?status=Active", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tests")
      }

      const data = await response.json()

      if (data.success) {
        setAvailableTests(data.tests || [])
      } else {
        throw new Error(data.message || "Failed to fetch tests")
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
      toast.error("Failed to load tests. Please try again.")
      setAvailableTests([])
    }
  }

  const applyFilters = () => {
    let filtered = [...invitations]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invitation) =>
          invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invitation.testName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredInvitations(filtered)
  }

  const handleSendInvitations = async () => {
    try {
      // Validate form
      if (!selectedTest) {
        toast.error("Please select a test")
        return
      }

      if (!emails.trim()) {
        toast.error("Please enter at least one email address")
        return
      }

      // Parse and validate emails
      const emailList = emails.split(/[\s,;]+/).filter(Boolean)
      const invalidEmails = emailList.filter((email) => !isValidEmail(email))

      if (invalidEmails.length > 0) {
        toast.error(`Invalid email format: ${invalidEmails.join(", ")}`)
        return
      }

      setIsSending(true)

      // Send to API
      const response = await fetch("/api/assessment/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest,
          emails: emailList,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send invitations")
      }

      const data = await response.json()

      toast.success(`Invitations sent to ${emailList.length} candidates`)

      // Reset form
      setSelectedTest("")
      setEmails("")

      // Refresh invitations
      fetchInvitations()
    } catch (error: any) {
      console.error("Error sending invitations:", error)
      toast.error(error.message || "Failed to send invitations")
    } finally {
      setIsSending(false)
    }
  }

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
  }

  const handleGenerateLink = async () => {
    if (!selectedTest) {
      toast.error("Please select a test")
      return
    }

    try {
      setIsGeneratingLink(true)

      // Send to API
      const response = await fetch("/api/assessment/invitations/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate link")
      }

      const data = await response.json()

      // Add to test links
      const selectedTestData = availableTests.find((test) => test._id === selectedTest)

      if (selectedTestData) {
        setTestLinks((prev) => [
          ...prev,
          {
            id: data.linkId,
            testId: selectedTest,
            name: selectedTestData.name,
            link: data.link,
            expiresIn: "7 days",
          },
        ])
      }

      toast.success("New invitation link generated")
    } catch (error: any) {
      console.error("Error generating link:", error)
      toast.error(error.message || "Failed to generate link")
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      // Send to API
      const response = await fetch(`/api/assessment/invitations/links/${linkId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete link")
      }

      // Remove from state
      setTestLinks((prev) => prev.filter((link) => link.id !== linkId))

      toast.success("Link deleted successfully")
    } catch (error: any) {
      console.error("Error deleting link:", error)
      toast.error(error.message || "Failed to delete link")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Assume the first sheet contains emails
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Extract emails from the data
        const extractedEmails: string[] = []

        jsonData.forEach((row: any) => {
          // Look for email in any field of the row
          Object.values(row).forEach((value) => {
            if (typeof value === "string" && isValidEmail(value)) {
              extractedEmails.push(value)
            }
          })
        })

        if (extractedEmails.length === 0) {
          toast.error("No valid email addresses found in the file")
          return
        }

        // Update the emails state with the extracted emails
        const uniqueEmails = [...new Set(extractedEmails)]
        setEmails(uniqueEmails.join(", "))

        toast.success(`${uniqueEmails.length} email addresses imported`)

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        console.error("Error processing Excel file:", error)
        toast.error("Failed to process the Excel file. Please check the format.")
      }
    }

    reader.onerror = () => {
      toast.error("Failed to read the file")
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <AssessmentLayout>
      <div className="container py-6">
        <Toaster position="top-center" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invitations</h1>
          <Button onClick={handleSendInvitations} disabled={isSending || !selectedTest || !emails.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send Invitations"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Invitations */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invitations</CardTitle>
                <p className="text-sm text-muted-foreground">Track and manage all test invitations</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search invitations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredInvitations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sent Date</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Expiry</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvitations.map((invitation) => (
                          <tr key={invitation._id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{invitation.email}</td>
                            <td className="py-3 px-4">{invitation.testName}</td>
                            <td className="py-3 px-4">{formatDate(invitation.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  invitation.status === "Completed"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : invitation.status === "Expired"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }
                              >
                                {invitation.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{formatDate(invitation.expiresAt)}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Resend invitation
                                  toast.info("Resending invitation...")
                                }}
                              >
                                Resend
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">No invitations found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? "Try adjusting your search term" : "Send your first invitation to get started"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Send Invitations & Links */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Invitations</CardTitle>
                <p className="text-sm text-muted-foreground">Invite candidates to take your assessment tests</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="test-select" className="block text-sm font-medium">
                      Select Test
                    </label>
                    <select
                      id="test-select"
                      value={selectedTest}
                      onChange={(e) => setSelectedTest(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    >
                      <option value="">Choose a test</option>
                      {availableTests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="emails" className="block text-sm font-medium">
                        Candidate Emails
                      </label>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={handleUploadClick}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Emails Excel
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls"
                        className="hidden"
                      />
                    </div>
                    <textarea
                      id="emails"
                      placeholder="Enter email addresses (separated by commas or new lines)"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Each candidate will receive a unique invitation link via email
                    </p>
                  </div>

                  <Button
                    onClick={handleSendInvitations}
                    disabled={isSending || !selectedTest || !emails.trim()}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-current rounded-full"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invitation Links</CardTitle>
                <p className="text-sm text-muted-foreground">Generate and share test invitation links</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="test-link-select" className="block text-sm font-medium">
                      Select Test
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="test-link-select"
                        value={selectedTest}
                        onChange={(e) => setSelectedTest(e.target.value)}
                        className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                      >
                        <option value="">Choose a test</option>
                        {availableTests.map((test) => (
                          <option key={test._id} value={test._id}>
                            {test.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        onClick={handleGenerateLink}
                        disabled={isGeneratingLink || !selectedTest}
                      >
                        {isGeneratingLink ? (
                          <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-current rounded-full"></div>
                        ) : (
                          "Generate Link"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {testLinks.map((link) => (
                      <div key={link.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{link.name}</h4>
                            <p className="text-xs text-muted-foreground">Expires in {link.expiresIn}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input value={link.link} readOnly className="flex-1 text-xs font-mono bg-muted" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyLink(link.link)}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {testLinks.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No invitation links generated yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AssessmentLayout>
  )
}
