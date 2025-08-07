"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Loader2, User } from "lucide-react"
import { toast } from "sonner"

interface StudentAvatarUploadProps {
  initialAvatarUrl?: string
  studentId: string
  studentName?: string
  onAvatarUpdate: (url: string) => void
}

export default function StudentAvatarUpload({ 
  initialAvatarUrl, 
  studentId, 
  studentName = "",
  onAvatarUpdate 
}: StudentAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [initials, setInitials] = useState("ST")

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl)
    
    // Generate initials from student name
    if (studentName) {
      const nameParts = studentName.trim().split(' ')
      if (nameParts.length >= 2) {
        setInitials(nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase())
      } else if (nameParts.length === 1) {
        setInitials(nameParts[0][0].toUpperCase() + nameParts[0][1]?.toUpperCase() || 'S')
      }
    }
  }, [initialAvatarUrl, studentName])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    try {
      setIsUploading(true)

      // Create form data for the upload
      const formData = new FormData()
      formData.append("avatar", file)

      // Upload to server using student-specific endpoint
      const response = await fetch("/api/student/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to upload avatar")
      }

      const data = await response.json()
      setAvatarUrl(data.avatarUrl)
      onAvatarUpdate(data.avatarUrl)
      toast.success("Profile picture updated successfully")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload profile picture")
    } finally {
      setIsUploading(false)
      // Clear the input to allow re-selecting the same file
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Profile Picture</h4>
      
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
          <AvatarImage 
            src={avatarUrl || "/placeholder.svg"} 
            alt="Profile Picture" 
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute -bottom-2 -right-2">
          <label htmlFor="student-avatar-upload" className="cursor-pointer">
            <div className="rounded-full bg-black p-2 text-white shadow-lg hover:bg-gray-800 transition-colors duration-200 border-2 border-white">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </div>
            <input
              id="student-avatar-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
      
      {isUploading ? (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading profile picture...</span>
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Click the pencil icon to upload a new profile picture. Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
        </p>
      )}
    </div>
  )
}
