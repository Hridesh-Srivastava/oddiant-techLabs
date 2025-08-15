"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import PersonalDetailsForm from "./register-steps/personal-details"
import EducationalQualificationsForm from "./register-steps/educational-qualifications"
import ProfessionalExperienceForm from "./register-steps/professional-experience"
import AssetsForm from "./register-steps/assets"
import AdditionalDetailsForm from "./register-steps/additional-details"
import AccountSetupForm from "./register-steps/account-setup"

export type FormData = {
  // Personal Details
  salutation: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  alternativePhone: string
  dob: string
  gender: string
  currentCity: string
  currentState: string
  pincode: string
  profileOutline: string

  // Educational Qualifications
  education: Array<{
    level: string
    mode: string
    degree: string
    school: string
    startingYear: string
    endingYear: string
    percentage: string
  }>
  certifications: string[]

  // Professional Experience
  professionalSummary: string
  totalExperience: string
  experience: Array<{
    title: string
    department: string
    companyName: string
    tenure: string
    professionalSummary: string
  }>
  currentSalary: string
  expectedSalary: string
  noticePeriod: string
  shiftPreference: string[]
  preferenceCities: string[]

  // Assets
  assets: {
    bike: boolean
    wifi: boolean
    laptop: boolean
    panCard: boolean
    aadhar: boolean
    bankAccount: boolean
    idProof: boolean
  }

  // Additional Details
  skills: string[]
  portfolioLink: string
  socialMediaLink: string
  resume: File | null
  videoResume: File | null
  audioBiodata: File | null
  photograph: File | null

  // Account Setup
  password: string
  confirmPassword: string
}

const initialFormData: FormData = {
  // Personal Details
  salutation: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  alternativePhone: "",
  dob: "",
  gender: "",
  currentCity: "",
  currentState: "",
  pincode: "",
  profileOutline: "",

  // Educational Qualifications
  education: [{ level: "", mode: "", degree: "", school: "", startingYear: "", endingYear: "", percentage: "" }],
  certifications: [], // Changed from [""] to []

  // Professional Experience
  professionalSummary: "",
  totalExperience: "", // This will be filled by the user
  experience: [{ title: "", department: "", companyName: "", tenure: "", professionalSummary: "" }],
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "",
  shiftPreference: [],
  preferenceCities: [],

  // Assets
  assets: {
    bike: false,
    wifi: false,
    laptop: false,
    panCard: false,
    aadhar: false,
    bankAccount: false,
    idProof: false,
  },

  // Additional Details
  skills: [], // Changed from [""] to []
  portfolioLink: "",
  socialMediaLink: "",
  resume: null,
  videoResume: null,
  audioBiodata: null,
  photograph: null,

  // Account Setup
  password: "",
  confirmPassword: "",
}

const steps = [
  { id: "account", label: "Account" },
  { id: "personal", label: "Personal" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Experience" },
  { id: "assets", label: "Assets" },
  { id: "additional", label: "Additional" },
]

export default function RegisterForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (stepData: Partial<FormData>) => {
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

      // Add basic text fields
      formDataObj.append("salutation", formData.salutation)
      formDataObj.append("firstName", formData.firstName)
      formDataObj.append("middleName", formData.middleName || "")
      formDataObj.append("lastName", formData.lastName)
      formDataObj.append("email", formData.email)
      formDataObj.append("password", formData.password)
      formDataObj.append("phone", formData.phone)
      formDataObj.append("alternativePhone", formData.alternativePhone || "")
      formDataObj.append("dob", formData.dob)
      formDataObj.append("gender", formData.gender)
      formDataObj.append("currentCity", formData.currentCity)
      formDataObj.append("currentState", formData.currentState)
      formDataObj.append("pincode", formData.pincode)
      formDataObj.append("profileOutline", formData.profileOutline || "")

      // Add array and object fields with proper JSON stringification
      formDataObj.append("education", JSON.stringify(formData.education))
      formDataObj.append("certifications", JSON.stringify(formData.certifications.filter((cert) => cert !== "")))
      formDataObj.append("experience", JSON.stringify(formData.experience))
      formDataObj.append("skills", JSON.stringify(formData.skills.filter((skill) => skill !== "")))

      // FIXED: Ensure assets is properly structured as a separate object
      formDataObj.append("assets", JSON.stringify(formData.assets))

      // Explicitly ensure totalExperience is properly set
      // Make sure it's a string and not empty
      const totalExp = formData.totalExperience ? formData.totalExperience.toString() : "0"
      formDataObj.append("totalExperience", totalExp)

      // Add other professional fields
      formDataObj.append("professionalSummary", formData.professionalSummary || "")
      formDataObj.append("currentSalary", formData.currentSalary || "")
      formDataObj.append("expectedSalary", formData.expectedSalary || "")
      formDataObj.append("noticePeriod", formData.noticePeriod || "")
      formDataObj.append("shiftPreference", JSON.stringify(formData.shiftPreference))
      formDataObj.append("preferenceCities", JSON.stringify(formData.preferenceCities))

      // Add additional text fields
      formDataObj.append("portfolioLink", formData.portfolioLink || "")
      formDataObj.append("socialMediaLink", formData.socialMediaLink || "")

      // Add file fields - these will be stored in the documents object
      if (formData.resume) formDataObj.append("resume", formData.resume)
      if (formData.videoResume) formDataObj.append("videoResume", formData.videoResume)
      if (formData.audioBiodata) formDataObj.append("audioBiodata", formData.audioBiodata)
      if (formData.photograph) formDataObj.append("photograph", formData.photograph)

      // Log the form data for debugging
      console.log("Submitting form data:", {
        certifications: formData.certifications.filter((cert) => cert !== ""),
        totalExperience: totalExp, // Log the actual value being sent
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        noticePeriod: formData.noticePeriod,
        shiftPreference: formData.shiftPreference,
        preferenceCities: formData.preferenceCities,
        assets: formData.assets, // Log the assets object
        skills: formData.skills.filter((skill) => skill !== ""),
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formDataObj,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      toast.success("Registration successful! Please verify your email.")
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed")
      console.error("Registration error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AccountSetupForm formData={formData} updateFormData={updateFormData} />
      case 1:
        return <PersonalDetailsForm formData={formData} updateFormData={updateFormData} />
      case 2:
        return <EducationalQualificationsForm formData={formData} updateFormData={updateFormData} />
      case 3:
        return <ProfessionalExperienceForm formData={formData} updateFormData={updateFormData} />
      case 4:
        return <AssetsForm formData={formData} updateFormData={updateFormData} />
      case 5:
        return <AdditionalDetailsForm formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress indicator with clickable steps */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-start sm:justify-between">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`text-xs sm:text-sm font-medium cursor-pointer px-2 py-1 rounded-md transition-colors ${
                index === currentStep
                  ? "bg-blue-100 text-blue-700"
                  : index < currentStep
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-gray-400 hover:text-gray-500"
              }`}
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSubmitting}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={isSubmitting} className="w-full sm:w-auto">
            Next
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto hover:bg-green-600 hover:text-black"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </div>
    </div>
  )
}
