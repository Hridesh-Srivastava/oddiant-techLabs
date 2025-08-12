"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Search, Send, Upload, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [totalInvitations, setTotalInvitations] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const totalPages = Math.ceil(totalInvitations / itemsPerPage)

  // Available tests
  const [availableTests, setAvailableTests] = useState<TestData[]>([])

  // New invitation form
  const [selectedTest, setSelectedTest] = useState("")
  const [emails, setEmails] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Resend invitation state
  const [resendingInvitations, setResendingInvitations] = useState<Set<string>>(new Set())

  // Test links
  const [testLinks, setTestLinks] = useState<
    { id: string; testId: string; name: string; link: string; expiresIn: string }[]
  >([])
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  // Search state for test dropdown
  const [testSearch, setTestSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const page = parseInt(new URLSearchParams(window.location.search).get("page") || "1", 10)
    setCurrentPage(page)
    fetchInvitations(page)
    fetchAvailableTests()
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1)
    }, 500) // Debounce search term changes

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchInvitations(currentPage);
  }, [currentPage, searchTerm]);

  const fetchInvitations = async (page = 1) => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("page", page.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await fetch(`/api/assessment/invitations?${params.toString()}`, {
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
        setTotalInvitations(data.total || 0)
        setCurrentPage(data.page || 1)
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
      const response = await fetch("/api/assessment/tests?status=Active&limit=1000", {
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      const params = new URLSearchParams(window.location.search)
      params.set("page", newPage.toString())
      router.replace(`${window.location.pathname}?${params.toString()}`)
    }
  }

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1)
  }

  const handleNextPage = () => {
    handlePageChange(currentPage + 1)
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

  // FIXED: Implement proper resend invitation functionality
  const handleResendInvitation = async (invitationId: string) => {
    try {
      // Add to resending set to show loading state
      setResendingInvitations((prev) => new Set(prev).add(invitationId))

      const response = await fetch(`/api/assessment/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to resend invitation")
      }

      const data = await response.json()
      if (data.success) {
        toast.success("Invitation resent successfully")
        // Refresh invitations to get updated data
        fetchInvitations()
      } else {
        throw new Error(data.message || "Failed to resend invitation")
      }
    } catch (error: any) {
      console.error("Error resending invitation:", error)
      toast.error(error.message || "Failed to resend invitation")
    } finally {
      // Remove from resending set
      setResendingInvitations((prev) => {
        const newSet = new Set(prev)
        newSet.delete(invitationId)
        return newSet
      })
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

  // Handle suggestion click
  const handleSuggestionClick = (test: TestData) => {
    setSelectedTest(test._id);
    setTestSearch(test.name);
    setShowSuggestions(false);
  };

  // Filtered tests for dropdown
  const filteredTests = testSearch
    ? availableTests.filter((test) => 
        test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        test._id.toLowerCase().includes(testSearch.toLowerCase())
      )
    : availableTests;

  return (
    <AssessmentLayout>
      <div className="container py-6">
        <Toaster position="top-center" />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invitations</h1>
          <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={handleSendInvitations} disabled={isSending || !selectedTest || !emails.trim()}>
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
                      placeholder="Search invitations by email, test name, or ID..."
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
                ) : invitations.length > 0 ? (
                  <>
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
                          {invitations.map((invitation) => (
                            <tr key={invitation._id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 border-l-4 border-l-red-500">
                                <div>
                                  <div className="font-medium">{invitation.email}</div>
                                  <div className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                    ID: {invitation._id}
                                  </div>
                                </div>
                              </td>
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
                                  onClick={() => handleResendInvitation(invitation._id)}
                                  disabled={resendingInvitations.has(invitation._id)}
                                >
                                  {resendingInvitations.has(invitation._id) ? (
                                    <>
                                      <div className="animate-spin mr-2 h-3 w-3 border-2 border-t-transparent border-current rounded-full"></div>
                                      Resending...
                                    </>
                                  ) : (
                                    "Resend"
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing page {currentPage} of {totalPages} ({totalInvitations} total invitations)
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="flex items-center bg-transparent"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center bg-transparent"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
            <Card className="border-l-4 border-l-pink-500 rounded-md overflow-hidden">
              <CardHeader>
                <CardTitle>Send Invitations</CardTitle>
                <p className="text-sm text-muted-foreground">Invite candidates to take your assessment tests</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2" style={{ position: 'relative' }}>
                    <label htmlFor="test-search" className="block text-sm font-medium">
                      Search Test
                    </label>
                    <Input
                      id="test-search"
                      type="text"
                      placeholder="Search tests by name or ID..."
                      value={testSearch}
                      onChange={(e) => {
                        setTestSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-input rounded-md mb-2"
                    />
                   {showSuggestions && testSearch && filteredTests.length > 0 && (
                     <ul style={{
                       position: 'absolute',
                       zIndex: 10,
                       background: 'white',
                       border: '1px solid #e5e7eb',
                       borderRadius: '0.375rem',
                       width: '100%',
                       maxHeight: '180px',
                       overflowY: 'auto',
                       marginTop: '-0.5rem',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                     }}>
                       {filteredTests.map(test => (
                         <li
                           key={test._id}
                           style={{
                             padding: '8px 12px',
                             cursor: 'pointer',
                             borderBottom: '1px solid #f3f4f6',
                             fontSize: '14px'
                           }}
                           onMouseDown={() => handleSuggestionClick(test)}
                           className="hover:bg-gray-50"
                         >
                           <div className="font-medium">{test.name}</div>
                           <div className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                             ID: {test._id}
                           </div>
                         </li>
                       ))}
                     </ul>
                   )}
                    <label htmlFor="test-select" className="block text-sm font-medium">
                      Select Test
                    </label>
                    <select
                      id="test-select"
                      value={selectedTest}
                      onChange={(e) => {
                        setSelectedTest(e.target.value);
                        const found = availableTests.find(t => t._id === e.target.value);
                        if (found) setTestSearch(found.name);
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    >
                      <option value="">Choose a test</option>
                      {filteredTests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.name} (ID: {test._id})
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
                    className="w-full bg-black text-white hover:text-black hover:bg-green-600"
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
          </div>
        </div>
        {/* Hide suggestions when clicking outside */}
        <div
          tabIndex={-1}
          style={{ position: 'fixed', inset: 0, zIndex: 9, display: showSuggestions ? 'block' : 'none' }}
          onMouseDown={() => setShowSuggestions(false)}
        />
      </div>
    </AssessmentLayout>
  )
}
