"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CandidateData {
  _id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  testsAssigned: number
  testsCompleted: number
  averageScore: number
}

export default function CandidatesDebugPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/assessment/candidates", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch candidates")
      }

      const data = await response.json()
      console.log("Debug - All candidates:", data)

      if (data.success) {
        setCandidates(data.candidates || [])
      }
    } catch (error) {
      console.error("Error fetching candidates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTestCandidate = async () => {
    try {
      const response = await fetch("/api/assessment/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Candidate",
          email: "test@example.com",
          phone: "1234567890",
        }),
      })

      if (response.ok) {
        fetchCandidates() // Refresh the list
      }
    } catch (error) {
      console.error("Error creating test candidate:", error)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Candidates Debug</h1>
        <Button onClick={createTestCandidate}>Create Test Candidate</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Candidates in Database</CardTitle>
          <CardDescription>Total: {candidates.length} candidates</CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length > 0 ? (
            <div className="space-y-4">
              {candidates.map((candidate, index) => (
                <div key={candidate._id} className="border p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Index:</strong> {index + 1} (candidate-{index + 1})
                    </div>
                    <div>
                      <strong>Database ID:</strong> {candidate._id}
                    </div>
                    <div>
                      <strong>Name:</strong> {candidate.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {candidate.email}
                    </div>
                    <div>
                      <strong>Status:</strong> {candidate.status}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(candidate.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button size="sm" asChild>
                      <a href={`/employee/assessment/candidates/candidate-${index + 1}`}>
                        View as candidate-{index + 1}
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="ml-2" asChild>
                      <a href={`/employee/assessment/candidates/${candidate._id}`}>View by ID</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No candidates found in database</p>
              <Button onClick={createTestCandidate}>Create Test Candidate</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
