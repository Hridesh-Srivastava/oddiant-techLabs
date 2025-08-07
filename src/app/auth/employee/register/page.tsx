"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { Check, Briefcase, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import EmployeeAccountSetup from "@/components/auth/employee/account-setup"
import EmployeePersonalDetails from "@/components/auth/employee/personal-details"
import EmployeeCompanyDetails from "@/components/auth/employee/company-details"
import EmployeeDocuments from "@/components/auth/employee/documents"

export type EmployeeFormData = {
  // Account Setup
  email: string
  password: string
  confirmPassword: string

  // Personal Details
  firstName: string
  middleName: string
  lastName: string
  phone: string
  designation: string
  linkedinProfile: string

  // Company Details
  companyName: string
  companyLocation: string
  companyIndustry: string
  teamSize: string
  aboutCompany: string
  companyWebsite: string
  socialMediaLinks: string[]
  companyLinkedin: string

  // Documents
  kycDocument: File | null
  kycNumber: string
  documentType: string
}

const initialFormData: EmployeeFormData = {
  // Account Setup
  email: "",
  password: "",
  confirmPassword: "",

  // Personal Details
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  designation: "",
  linkedinProfile: "",

  // Company Details
  companyName: "",
  companyLocation: "",
  companyIndustry: "",
  teamSize: "",
  aboutCompany: "",
  companyWebsite: "",
  socialMediaLinks: [],
  companyLinkedin: "",

  // Documents
  kycDocument: null,
  kycNumber: "",
  documentType: "",
}

const steps = [
  { id: "account", label: "Account" },
  { id: "personal", label: "Personal" },
  { id: "company", label: "Company" },
  { id: "documents", label: "Documents" },
]

export default function EmployeeRegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (stepData: Partial<EmployeeFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Create FormData object for file uploads
      const formDataObj = new FormData()

      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "kycDocument" && key !== "socialMediaLinks") {
          if (value !== null) {
            formDataObj.append(key, value as string)
          }
        }
      })

      // Add social media links as JSON
      formDataObj.append("socialMediaLinks", JSON.stringify(formData.socialMediaLinks))

      // Add file fields
      if (formData.kycDocument) {
        formDataObj.append("kycDocument", formData.kycDocument)
      }

      const response = await fetch("/api/auth/employee/register", {
        method: "POST",
        body: formDataObj,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      toast.success("Registration successful! Please verify your email.")
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}&userType=employee`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <EmployeeAccountSetup formData={formData} updateFormData={updateFormData} />
      case 1:
        return <EmployeePersonalDetails formData={formData} updateFormData={updateFormData} />
      case 2:
        return <EmployeeCompanyDetails formData={formData} updateFormData={updateFormData} />
      case 3:
        return <EmployeeDocuments formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-16">
      <Toaster position="top-center" />
      <div className="w-full max-w-5xl">
        {/* Back button */}
        <div className="mb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-black hover:text-black p-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="w-full overflow-hidden flex flex-col md:flex-row">
        {/* Purple gradient card on the left */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-purple-700 to-purple-900 text-white p-8 flex flex-col justify-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Join Our Community</h2>
            <p className="text-purple-100">Create an account to access exclusive resources and opportunities.</p>

            <div className="space-y-4 mt-8">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-purple-300 mt-0.5" />
                <p>Personalized organization dashboard</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-purple-300 mt-0.5" />
                <p>Track your recruitment campaigns</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-purple-300 mt-0.5" />
                <p>Access exclusive talent pool</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-purple-300 mt-0.5" />
                <p>Post unlimited job opportunities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration form on the right */}
        <div className="w-full md:w-3/5 p-6">
          <CardHeader className="space-y-1 px-0 pt-0">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Organizations/Institution Register</CardTitle>
            <CardDescription className="text-center">Create your account to unlock opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            {/* Progress indicator with clickable steps */}
            <div className="space-y-2.5">
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`text-sm font-medium cursor-pointer ${
                      index <= currentStep ? "text-purple-600" : "text-gray-400"
                    } hover:text-purple-800 transition-colors`}
                    type="button"
                  >
                    {step.label}
                  </button>
                ))}
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Form steps */}
            <div className="mt-6">{renderStep()}</div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || isSubmitting}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-black hover:bg-green-600 hover:text-black"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-black hover:bg-green-600 hover:text-black"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center px-0">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/employee/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </div>
      </Card>
      </div>
    </div>
  )
}
