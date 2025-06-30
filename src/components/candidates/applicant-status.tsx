"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ApplicantStatusProps {
  applicantId: string
  currentStatus: string
  jobId: string
}

export function ApplicantStatus({ applicantId, currentStatus, jobId }: ApplicantStatusProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [comment, setComment] = useState("")
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || "Applied")
  const [status, setStatus] = useState(currentStatus || "Applied")

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "applied"

    switch (statusLower) {
      case "shortlisted":
      case "select":
        return "bg-green-100 text-green-800"
      case "interview":
        return "bg-blue-100 text-blue-800"
      case "hired":
        return "bg-purple-100 text-purple-800"
      case "rejected":
      case "reject":
        return "bg-red-100 text-red-800"
      case "hold":
        return "bg-yellow-100 text-yellow-800"
      case "applied":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setSelectedStatus(newStatus)
    setShowCommentDialog(true)
  }

  const submitStatusChange = async () => {
    setIsUpdating(true)
    try {
      // First update the job application status
      const applicationResponse = await fetch(`/api/job-applications/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: applicantId,
          jobId,
          status: selectedStatus,
          comment: comment.trim() || undefined,
        }),
      })

      if (!applicationResponse.ok) {
        throw new Error("Failed to update application status")
      }

      // Then update the candidate status
      const candidateResponse = await fetch(`/api/employee/candidates/${applicantId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          jobId,
          comment: comment.trim() || undefined,
        }),
      })

      if (!candidateResponse.ok) {
        console.log("Failed to update in candidates collection, trying students collection")

        // If that fails, try updating in the students collection
        const studentResponse = await fetch(`/api/student/${applicantId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            jobId,
            comment: comment.trim() || undefined,
          }),
        })

        if (!studentResponse.ok) {
          console.warn("Failed to update status in both collections, but application was updated")
        }
      }

      // Update local state
      setStatus(selectedStatus)
      toast.success("Applicant status updated successfully")
      setShowCommentDialog(false)
      setComment("")

      // Refresh the page to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error updating applicant status:", error)
      toast.error("Failed to update applicant status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <select
        value={status}
        onChange={handleStatusChange}
        className={`px-2 py-1 rounded-md text-sm ${getStatusColor(status)}`}
        disabled={isUpdating}
      >
        <option value="Applied">Applied</option>
        <option value="hold">Hold</option>
        <option value="select">Select</option>
        <option value="reject">Reject</option>
        <option value="Shortlisted">Shortlisted</option>
        <option value="Interview">Interview</option>
        <option value="Hired">Hired</option>
        <option value="Rejected">Rejected</option>
      </select>

      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Applicant Status</DialogTitle>
            <DialogDescription>
              You are changing the status to <Badge className={getStatusColor(selectedStatus)}>{selectedStatus}</Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Internal Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add an internal comment about this status change"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentDialog(false)
                setSelectedStatus(status) // Reset to original status
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitStatusChange} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
