"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Trash2, Eye, Edit } from "lucide-react"
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

interface JobActionsProps {
  jobId: string
  currentStatus?: "open" | "hold" | "closed"
}

export function JobActions({ jobId, currentStatus = "open" }: JobActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleView = () => {
    router.push(`/employee/jobs/${jobId}`)
  }

  const handleEdit = () => {
    router.push(`/employee/jobs/${jobId}/edit`)
  }

  const handleViewApplicants = () => {
    router.push(`/employee/jobs/${jobId}/applicants`)
  }

  const handleShare = () => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(jobUrl)
    toast.success("Job URL copied to clipboard")
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate job")
      }

      const data = await response.json()
      toast.success("Job duplicated successfully")
      router.push(`/employee/jobs/${data.jobId}`)
      router.refresh()
    } catch (error) {
      console.error("Error duplicating job:", error)
      toast.error("Failed to duplicate job")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete job")
      }

      toast.success("Job deleted successfully")
      router.push("/employee/dashboard?tab=jobs")
      router.refresh()
    } catch (error) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const updateJobStatus = async (status: "open" | "hold" | "closed") => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update job status")
      }

      toast.success(`Job status updated to ${status}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating job status:", error)
      toast.error("Failed to update job status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>

        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>

        <Button variant="outline" size="sm" onClick={handleViewApplicants}>
          <Eye className="h-4 w-4 mr-2" />
          View Applicants
        </Button>

        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <Button variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        <div className="relative">
          <select
            value={currentStatus}
            onChange={(e) => updateJobStatus(e.target.value as "open" | "hold" | "closed")}
            disabled={isUpdatingStatus}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm flex items-center"
          >
            <option value="open">Open</option>
            <option value="hold">Hold</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
