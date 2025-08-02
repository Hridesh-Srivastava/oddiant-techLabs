"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EmployeeFormData } from "@/app/auth/employee/register/page"
import { Upload, File } from "lucide-react"

interface DocumentsFormProps {
  formData: EmployeeFormData
  updateFormData: (data: Partial<EmployeeFormData>) => void
}

export default function EmployeeDocuments({ formData, updateFormData }: DocumentsFormProps) {
  const [errors, setErrors] = useState({
    kycDocument: "",
    kycNumber: "",
    documentType: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, kycDocument: "File size should not exceed 5MB" }))
        return
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, kycDocument: "Only PDF, JPEG, and PNG files are allowed" }))
        return
      }

      // Clear error if validation passes
      setErrors((prev) => ({ ...prev, kycDocument: "" }))

      updateFormData({ kycDocument: file })
    }
  }

  const handleKycNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, kycNumber: "KYC number is required" }))
    } else {
      setErrors((prev) => ({ ...prev, kycNumber: "" }))
    }

    updateFormData({ kycNumber: value })
  }

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value

    if (!value) {
      setErrors((prev) => ({ ...prev, documentType: "Document type is required" }))
    } else {
      setErrors((prev) => ({ ...prev, documentType: "" }))
    }

    console.log("Selected document type:", value)
    updateFormData({ documentType: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">KYC Documents</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please upload your KYC documents for verification. This helps us ensure the security of our platform.
        </p>

        <div className="space-y-4">
          {/* Document Type Selection - Using standard HTML select */}
          <div className="space-y-2">
            <Label htmlFor="documentType">
              Document Type <span className="text-red-500">*</span>
            </Label>
            <select
              id="documentType"
              value={formData.documentType || ""}
              onChange={handleDocumentTypeChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.documentType ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            >
              <option value="" disabled>  
                Select document type
              </option>
              <option value="gst">GST Certificate</option>
              <option value="pan">PAN Card</option>
              <option value="incorporation_certificate">Incorporation Certificate</option>
            </select>
            {errors.documentType && <p className="text-sm text-red-500">{errors.documentType}</p>}
          </div>

          {/* Document Number Input */}
          <div className="space-y-2">
            <Label htmlFor="documentNumber">
              Document Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kycNumber"
              type="text"
              value={formData.kycNumber || ""}
              onChange={handleKycNumberChange}
              placeholder="Enter your document number"
              className={errors.kycNumber ? "border-red-300" : ""}
            />
            {errors.kycNumber && <p className="text-sm text-red-500">{errors.kycNumber}</p>}
          </div>

          {/* KYC Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="kycDocument">
              KYC Document <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <Input
                id="kycDocument"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.avif,.svg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="kycDocument"
                className={`flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 ${
                  errors.kycDocument ? "border-red-300" : "border-gray-300"
                } border-dashed rounded-md appearance-none cursor-pointer hover:border-purple-400 focus:outline-none`}
              >
                {formData.kycDocument ? (
                  <div className="flex items-center space-x-2">
                    <File className="w-8 h-8 text-purple-500" />
                    <span className="font-medium text-gray-700">{formData.kycDocument.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="font-medium text-gray-600">Click to upload KYC document</span>
                    <span className="text-xs text-gray-500">(PDF, JPEG, PNG, JPG up to 5MB)</span>
                  </div>
                )}
              </label>
            </div>
            {errors.kycDocument && <p className="text-sm text-red-500">{errors.kycDocument}</p>}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Note</h4>
        <p className="text-sm text-yellow-700">
          By submitting this form, you confirm that all information provided is accurate and that you are authorized to
          register as an employer of Oddiant Techlabs. Your account will be verified by our Legal department before
          activation.
        </p>
      </div>
    </div>
  )
}
