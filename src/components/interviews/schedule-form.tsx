"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, LinkIcon } from "lucide-react"

interface Candidate {
  id: string
  name: string
  role: string
}

interface Job {
  id: string
  title: string
}

interface ScheduleFormProps {
  candidates?: Candidate[]
  jobs?: Job[]
  preselectedCandidateId?: string
}

export function ScheduleForm({ candidates = [], jobs = [], preselectedCandidateId }: ScheduleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    candidateId: preselectedCandidateId || "",
    jobId: "",
    position: "",
    date: "",
    time: "",
    duration: "60",
    interviewers: "",
    meetingLink: "",
    notes: "",
  })

  useEffect(() => {
    if (preselectedCandidateId) {
      const candidate = candidates.find((c) => c.id === preselectedCandidateId)
      if (candidate) {
        setFormData((prev) => ({
          ...prev,
          candidateId: preselectedCandidateId,
          position: candidate.role || "",
        }))
      }
    }
  }, [preselectedCandidateId, candidates])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = e.target.value
    const candidate = candidates.find((c) => c.id === candidateId)

    setFormData((prev) => ({
      ...prev,
      candidateId,
      position: candidate?.role || prev.position,
    }))
  }

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = e.target.value
    const job = jobs.find((j) => j.id === jobId)

    setFormData((prev) => ({
      ...prev,
      jobId,
      position: job?.title || prev.position,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.candidateId || !formData.position || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/employee/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          interviewers: formData.interviewers
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to schedule interview")
      }

      toast.success("Interview scheduled successfully")
      router.push("/employee/dashboard?tab=interviews")
      router.refresh()
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast.error("Failed to schedule interview")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="candidateId">Select Candidate*</Label>
          <select
            id="candidateId"
            name="candidateId"
            value={formData.candidateId}
            onChange={handleCandidateChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
            required
          >
            <option value="">Select a candidate</option>
            {candidates.length > 0 ? (
              candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {candidate.role}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No candidates available
              </option>
            )}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobId">Select Job (Optional)</Label>
          <select
            id="jobId"
            name="jobId"
            value={formData.jobId}
            onChange={handleJobChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
          >
            <option value="">Select a job</option>
            {jobs.length > 0 ? (
              jobs.map((job) => (
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

        <div className="space-y-2">
          <Label htmlFor="position">Position*</Label>
          <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="e.g. Frontend Developer"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interviewers">Interviewers (comma separated)</Label>
          <Input
            id="interviewers"
            name="interviewers"
            value={formData.interviewers}
            onChange={handleChange}
            placeholder="e.g. Person 1, Person 2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date*</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time*</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">120 minutes</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meetingLink">Meeting Link (Google Meet/Zoom)</Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            id="meetingLink"
            name="meetingLink"
            type="url"
            value={formData.meetingLink}
            onChange={handleChange}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes about the interview"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              Scheduling...
            </>
          ) : (
            "Schedule Interview"
          )}
        </Button>
      </div>
    </form>
  )
}
