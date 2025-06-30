"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CandidateFormProps {
  candidateId?: string
  isEditing?: boolean
  isSubmitting?: boolean
  onSubmit?: (data: any) => Promise<void>
}

// Define candidate statuses
const candidateStatuses = ["Applied", "Shortlisted", "Interview", "Hired", "Rejected"]

const CandidateForm: React.FC<CandidateFormProps> = ({
  candidateId,
  isEditing = false,
  isSubmitting = false,
  onSubmit,
}) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("Applied")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("")
  const [education, setEducation] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [notes, setNotes] = useState("")
  const [resume, setResume] = useState("")

  useEffect(() => {
    if (candidateId && isEditing) {
      fetchCandidateDetails()
    }
  }, [candidateId, isEditing])

  const fetchCandidateDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employee/candidates/${candidateId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch candidate details")
      }

      const data = await response.json()
      const candidate = data.candidate

      // Populate form fields with candidate data
      setName(candidate.name || "")
      setEmail(candidate.email || "")
      setPhone(candidate.phone || "")
      setRole(candidate.role || "")
      setStatus(candidate.status || "Applied")
      setLocation(candidate.location || "")
      setExperience(candidate.experience || "")
      setEducation(candidate.education || "")
      setSkills(candidate.skills || [])
      setNotes(candidate.notes || "")
      setResume(candidate.resume || "")
    } catch (error) {
      console.error("Error fetching candidate details:", error)
      toast.error("Failed to load candidate details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && skills.length < 10) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...skills]
    updatedSkills.splice(index, 1)
    setSkills(updatedSkills)
  }

  const validateForm = () => {
    if (!name) {
      toast.error("Name is required")
      return false
    }
    if (!email) {
      toast.error("Email is required")
      return false
    }
    if (!role) {
      toast.error("Position is required")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)

      const formData = {
        name,
        email,
        phone,
        role,
        status,
        location,
        experience,
        education,
        skills,
        notes,
        resume,
      }

      if (onSubmit) {
        // Use the provided onSubmit function if available
        await onSubmit(formData)
      } else {
        // Otherwise use the default implementation
        const url = isEditing ? `/api/employee/candidates/${candidateId}` : "/api/employee/candidates"
        const method = isEditing ? "PUT" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error(`Failed to ${isEditing ? "update" : "add"} candidate`)
        }

        toast.success(`Candidate ${isEditing ? "updated" : "added"} successfully!`)
        router.push("/employee/dashboard?tab=candidates")
        router.refresh()
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} candidate:`, error)
      toast.error(`Failed to ${isEditing ? "update" : "add"} candidate`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Candidate Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name*</Label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email*</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="oddiant@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (123) 456-7890"
          />
        </div>
        <div>
          <Label htmlFor="role">Position Applied For*</Label>
          <Input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Frontend Developer"
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
          >
            {candidateStatuses.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="New York, NY"
          />
        </div>
        <div>
          <Label htmlFor="experience">Experience</Label>
          <Input
            type="text"
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="5 years"
          />
        </div>
        <div>
          <Label htmlFor="education">Education</Label>
          <Input
            type="text"
            id="education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Bachelor's in Computer Science"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skills</Label>
        <div className="flex flex-wrap gap-2 min-h-10">
          {skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="px-2 py-1">
              {skill}
              <Button variant="ghost" size="sm" onClick={() => handleRemoveSkill(index)} className="ml-1 h-4 w-4 p-0">
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Add skill (e.g. React, JavaScript)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSkill()
              }
            }}
          />
          <Button type="button" size="sm" onClick={handleAddSkill} disabled={skills.length >= 10 || !newSkill.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="resume">Resume Link</Label>
        <Input
          type="url"
          id="resume"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="https://example.com/resume.pdf"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional notes about the candidate"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          variant="outline"
          onClick={() => router.push("/employee/dashboard?tab=candidates")}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-purple-700 hover:bg-purple-800 text-white"
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              {isEditing ? "Updating..." : "Adding..."}
            </>
          ) : isEditing ? (
            "Update Candidate"
          ) : (
            "Add Candidate"
          )}
        </Button>
      </div>
    </div>
  )
}

export default CandidateForm
