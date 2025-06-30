"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Briefcase, Download, Send, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Candidate {
  _id: string
  firstName: string
  lastName: string
  email: string
  currentPosition: string
  location: string
  yearsOfExperience: number
  skills: string[]
  matchScore: number
  geminiFeedback?: string
}

interface CandidateListProps {
  candidates: Candidate[]
  isLoading: boolean
  onSelectCandidate: (candidate: Candidate) => void
  selectedCandidateId: string | null
  showViewButton?: boolean
  allCandidates?: Candidate[]
}

export function CandidateList({
  candidates,
  isLoading,
  onSelectCandidate,
  selectedCandidateId,
  showViewButton = true,
  allCandidates = [],
}: CandidateListProps) {
  const router = useRouter()
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [viewingCandidate, setViewingCandidate] = useState<string | null>(null)

  const handleCheckboxChange = (candidateId: string) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId)
      } else {
        return [...prev, candidateId]
      }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(candidates.map((candidate) => candidate._id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleExportSelected = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate to export")
      return
    }

    try {
      setIsExporting(true)
      const response = await fetch("/api/employee/candidates/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to export candidates")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `candidates_export_${new Date().toLocaleDateString()}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Successfully exported ${selectedCandidates.length} candidates`)
    } catch (error) {
      console.error("Error exporting candidates:", error)
      toast.error("Failed to export candidates")
    } finally {
      setIsExporting(false)
    }
  }

  const handleContactCandidate = (candidateId: string) => {
    router.push(`/employee/candidates/${candidateId}/contact`)
  }

  const handleViewCandidate = (candidateId: string) => {
    setViewingCandidate(candidateId)
    // Open candidate details in a new tab
    window.open(`/employee/candidates/${candidateId}`, "_blank")
    // Reset viewing state after a short delay
    setTimeout(() => setViewingCandidate(null), 1000)
  }

  return (
    <Card className="border rounded-md h-full flex flex-col">
      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedCandidates.length === candidates.length && candidates.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="font-medium cursor-pointer">
            Candidates ({candidates.length})
          </label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportSelected}
          disabled={isExporting || selectedCandidates.length === 0}
          className="flex items-center gap-1 bg-blue-500 text-white"
        >
          <Download className="h-4 w-4 mr-1" />
          {isExporting ? "Exporting..." : "Export Selected"}
        </Button>
      </div>

      <div className="divide-y overflow-y-auto flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No candidates match your criteria
            <div className="mt-4 text-left max-w-xl mx-auto">
              <h4 className="font-semibold mb-2">AI Feedback for All Candidates:</h4>
              {allCandidates && allCandidates.length > 0 ? (
                <ul className="space-y-2">
                  {allCandidates.map((c) => (
                    <li key={c._id} className="border-b pb-2">
                      <span className="font-medium">{c.firstName} {c.lastName}:</span>
                      <span className="ml-2 text-xs text-gray-500 italic">{c.geminiFeedback || "No feedback available."}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-400">No candidate data available.</span>
              )}
            </div>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div
              key={candidate._id}
              className={`candidate-card p-4 hover:bg-gray-50 transition-colors border-l-2 ${
                selectedCandidateId === candidate._id
                  ? "bg-gray-100 border-l-blue-500"
                  : "border-l-transparent"
              }`}
            >
              <div className="flex items-start">
                <Checkbox
                  id={`candidate-${candidate._id}`}
                  checked={selectedCandidates.includes(candidate._id)}
                  onCheckedChange={() => handleCheckboxChange(candidate._id)}
                  className="mt-1 mr-3"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 cursor-pointer" onClick={() => onSelectCandidate(candidate)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-blue-600">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {candidate.currentPosition || "No position specified"}
                      </p>
                      {candidate.geminiFeedback && (
                        <p className="text-xs font-medium mt-1 ai-feedback-text">AI Feedback: {candidate.geminiFeedback}</p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{candidate.location}</span>
                        <span className="mx-2">•</span>
                        <Briefcase className="h-3 w-3 mr-1" />
                        <span>{candidate.yearsOfExperience || 2} years</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.isArray(candidate.skills) &&
                      candidate.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={`${candidate._id}-skill-${index}`} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    {Array.isArray(candidate.skills) && candidate.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex ml-2 space-x-1">
                  {showViewButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewCandidate(candidate._id)
                      }}
                      disabled={viewingCandidate === candidate._id}
                      className="flex items-center bg-black text-white"
                    >
                      {viewingCandidate === candidate._id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-current rounded-full"></div>
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      <span className="ml-1">View</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContactCandidate(candidate._id)
                    }}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Contact</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

<style jsx global>{`
  .ai-feedback-text {
    color: #111 !important;
    background: none;
    transition: background 0.2s;
    border-radius: 4px;
    padding: 2px 0;
  }
  .candidate-card:hover .ai-feedback-text {
    background: #f3f4f6 !important;
    color: #111 !important;
  }
`}</style>
