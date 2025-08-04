"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast, Toaster } from "sonner"
import {
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Building,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  Link,
  AlertCircle,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Employee {
  _id: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone: string
  designation: string
  linkedinProfile?: string
  companyName: string
  companyLocation: string
  companyIndustry: string
  teamSize: string
  aboutCompany?: string
  companyWebsite?: string
  companyLinkedin?: string
  socialMediaLinks?: string[]
  documentType?: string
  kycNumber?: string
  kycDetails?: {
    documentType: string
    kycNumber: string
  }
  documents?: {
    kyc?: {
      url: string
      uploadedAt: Date
    }
  }
  verified: boolean
  rejected: boolean
  rejectionReason?: string
  rejectionComments?: string
  rejectedAt?: string
  appealReason?: string
  appealedAt?: string
}

export default function VerifyEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmailAccess, setIsEmailAccess] = useState(false)
  const employeeId = params.id as string

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setError(null)
        console.log("Fetching employer data for ID:", employeeId)

        const response = await fetch(`/api/admin/employee/${employeeId}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            pragma: "no-cache",
            "cache-control": "no-cache",
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        console.log("Employer fetch response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`)
        }

        const data = await response.json()
        console.log("Employer data received:", data)

        if (data.success && data.employee) {
          setEmployee(data.employee)
          setIsEmailAccess(data.isEmailAccess || false)
        } else {
          throw new Error("Invalid response format")
        }
      } catch (error: any) {
        console.error("Error loading employer data:", error)
        setError(error.message || "Failed to load employer data")

        // Show specific error messages
        if (error.message.includes("401")) {
          toast.error("Authentication failed. Please log in again.")
        } else if (error.message.includes("403")) {
          toast.error("Access denied. Admin privileges required.")
        } else if (error.message.includes("404")) {
          toast.error("Employer not found.")
        } else {
          toast.error(`Error loading employer: ${error.message}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (employeeId) {
      fetchEmployeeData()
    }
  }, [employeeId])

  const handleVerify = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/verify-employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          employeeId,
          action: "approve",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || "Failed to verify employer")
      }

      toast.success("Employer verified successfully")

      // Update employer state
      if (employee) {
        setEmployee({
          ...employee,
          verified: true,
          rejected: false,
        })
      }

      setTimeout(() => {
        if (isEmailAccess) {
          // For email access, show success message and stay on page
          toast.success("Employer has been approved successfully!")
        } else {
          router.push("/admin/employees")
        }
      }, 2000)
    } catch (error: any) {
      console.error("Error verifying employer:", error)
      toast.error(`Failed to verify employer: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = () => {
    router.push(`/admin/verify-employee/${employeeId}/reject`)
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/employee/${employeeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || "Failed to delete employer")
      }

      toast.success("Employer deleted successfully")
      setTimeout(() => {
        if (isEmailAccess) {
          toast.success("Employer has been deleted successfully!")
        } else {
          router.push("/admin/employees")
        }
      }, 2000)
    } catch (error: any) {
      console.error("Error deleting employer:", error)
      toast.error(`Failed to delete employer: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleBackToEmployees = () => {
    if (isEmailAccess) {
      // For email access, redirect to admin login
      window.location.href = "/auth/employee/login"
    } else {
      router.push("/admin/employees")
    }
  }

  // Function to format website URL properly
  const formatWebsiteUrl = (url: string) => {
    if (!url) return ""
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employer details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading Employer
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={handleBackToEmployees} className="flex-1">
              {isEmailAccess ? "Go to Login" : "Back to Employers"}
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Employer Not Found</CardTitle>
            <CardDescription>The employer you are looking for does not exist or has been removed.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleBackToEmployees} className="w-full">
              {isEmailAccess ? "Go to Login" : "Back to Employers"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <Toaster position="top-center" richColors />
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToEmployees} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isEmailAccess ? "Go to Login" : "Back to Employers"}
          </Button>
          {isEmailAccess && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                 You are accessing this page through an email link. Actions will be processed automatically.
              </p>
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-gray-800">Verify Employer Account</CardTitle>
                <CardDescription className="text-gray-600">
                  Review the information below and approve or reject this employer account
                </CardDescription>
              </div>
              <div className="bg-white px-3 py-1 rounded-full text-sm font-medium border shadow-sm">
                {employee.verified ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : employee.rejected ? (
                  <span className="text-red-600">✗ Rejected</span>
                ) : (
                  <span className="text-yellow-600">⏳ Pending</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <User className="mr-2 h-5 w-5 text-purple-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-gray-900">
                      {employee.firstName} {employee.middleName} {employee.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Employer ID</p>
                    <p className="text-gray-900 font-mono text-sm">
                      {employee._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      {employee.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="flex items-center text-gray-900">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      {employee.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Designation</p>
                    <p className="text-gray-900">{employee.designation}</p>
                  </div>
                  {employee.linkedinProfile && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">LinkedIn Profile</p>
                      <a
                        href={formatWebsiteUrl(employee.linkedinProfile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        {employee.linkedinProfile}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <Building className="mr-2 h-5 w-5 text-purple-500" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-gray-900">{employee.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="flex items-center text-gray-900">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {employee.companyLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Industry</p>
                    <p className="text-gray-900">{employee.companyIndustry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Team Size</p>
                    <p className="text-gray-900">{employee.teamSize}</p>
                  </div>
                  {employee.aboutCompany && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">About Company</p>
                      <p className="text-sm mt-1 text-gray-700">{employee.aboutCompany}</p>
                    </div>
                  )}
                  {employee.companyWebsite && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a
                        href={formatWebsiteUrl(employee.companyWebsite)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {employee.companyWebsite}
                      </a>
                    </div>
                  )}
                  {employee.companyLinkedin && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company LinkedIn</p>
                      <a
                        href={formatWebsiteUrl(employee.companyLinkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        {employee.companyLinkedin}
                      </a>
                    </div>
                  )}
                  {employee.socialMediaLinks && employee.socialMediaLinks.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Social Media</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {employee.socialMediaLinks.map((link: string, index: number) => (
                          <a
                            key={index}
                            href={formatWebsiteUrl(link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm bg-blue-50 px-2 py-1 rounded-md"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* KYC Documents */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <FileText className="mr-2 h-5 w-5 text-purple-500" />
                  KYC Documents
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Document Type</p>
                      <p className="capitalize text-gray-900">
                        {employee.documentType || employee.kycDetails?.documentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Document Number</p>
                      <p className="text-gray-900">{employee.kycNumber || employee.kycDetails?.kycNumber}</p>
                    </div>
                  </div>
                  {employee.documents?.kyc && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-500">Document</p>
                      <a
                        href={employee.documents.kyc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center mt-1"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Rejection Details */}
              {employee.rejected && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium text-red-600 mb-4">Previous Rejection Details</h3>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                        <p className="text-red-700">{employee.rejectionReason || "Not specified"}</p>
                      </div>
                      {employee.rejectionComments && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-500">Comments</p>
                          <p className="text-sm mt-1 text-gray-700">{employee.rejectionComments}</p>
                        </div>
                      )}
                      {employee.rejectedAt && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-500">Rejected On</p>
                          <p className="text-sm text-gray-700">{new Date(employee.rejectedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Appeal Information */}
              {employee.appealReason && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium text-blue-600 mb-4">Appeal Information</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Appeal Reason</p>
                        <p className="text-blue-700">{employee.appealReason || "Not specified"}</p>
                      </div>
                      {employee.appealedAt && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-500">Appealed On</p>
                          <p className="text-sm text-gray-700">{new Date(employee.appealedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-gray-50">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              {!isEmailAccess && (
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isProcessing}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Delete
                </Button>
              )}
            </div>
            <Button
              onClick={handleVerify}
              disabled={isProcessing || employee.verified}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : employee.verified ? "Already Approved" : "Approve Employer"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this employer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employer account and all associated data
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
