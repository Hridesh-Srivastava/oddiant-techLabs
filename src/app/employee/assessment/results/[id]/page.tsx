"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Mail, Calendar, Download, Edit, Save } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import withAuth from "@/components/auth/withAuth";

interface ResultData {
  _id: string
  candidateName: string
  candidateEmail: string
  testName: string
  score: number
  status: string
  duration: number
  completedAt: string
  answers: AnswerData[]
  tabSwitchCount?: number
  terminated?: boolean
  resultsDeclared: boolean
  manualEvaluation?: ManualEvaluation[]
  completionDate: string
}

interface AnswerData {
  questionId: string
  questionText: string
  questionType: string
  answer: string | string[]
  correctAnswer?: string | string[]
  isCorrect: boolean
  points: number
  maxPoints: number
  codingTestResults?: CodingTestResult[]
  manualPoints?: number
  manualFeedback?: string
  aiFeedback?: string
  aiScore?: number
  options?: string[]
}

interface CodingTestResult {
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
}

interface ManualEvaluation {
  questionId: string
  points: number
  feedback: string
  evaluatedBy: string
  evaluatedAt: string
}

interface TestData {
  _id: string
  name: string
  description: string
  totalQuestions: number
  passingScore: number
}

function Page() {
  const router = useRouter()
  const params = useParams()
  const resultId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<ResultData | null>(null)
  const [test, setTest] = useState<TestData | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationData, setEvaluationData] = useState<Record<string, { points: number; feedback: string }>>({})
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchResult()
  }, [resultId])

  const fetchResult = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/assessment/results/${resultId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch result")
      }

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
        setTest(data.test)

        // Initialize evaluation data for written answers
        const evalData: Record<string, { points: number; feedback: string }> = {}
        data.result.answers?.forEach((answer: AnswerData) => {
          if (answer.questionType === "Written Answer") {
            evalData[answer.questionId] = {
              points: answer.manualPoints || 0,
              feedback: answer.manualFeedback || "",
            }
          }
        })
        setEvaluationData(evalData)
      } else {
        throw new Error(data.message || "Failed to fetch result")
      }
    } catch (error) {
      console.error("Error fetching result:", error)
      toast.error("Failed to load result. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEvaluation = () => {
    setIsEvaluating(true)
    setShowEvaluationDialog(true)
  }

  const handleSaveEvaluation = async () => {
    try {
      setIsSaving(true)

      // Calculate new score
      let totalPoints = 0
      let earnedPoints = 0

      const updatedAnswers =
        result?.answers.map((answer) => {
          totalPoints += answer.maxPoints

          if (answer.questionType === "Written Answer") {
            const evaluation = evaluationData[answer.questionId]
            const manualPoints = evaluation?.points || 0
            earnedPoints += manualPoints

            return {
              ...answer,
              manualPoints,
              manualFeedback: evaluation?.feedback || "",
              points: manualPoints,
              isCorrect: manualPoints > 0,
            }
          } else {
            earnedPoints += answer.points
            return answer
          }
        }) || []

      const newScore = Math.round((earnedPoints / totalPoints) * 100)
      const newStatus = newScore >= (test?.passingScore || 70) ? "Passed" : "Failed"

      const updateData = {
        answers: updatedAnswers,
        score: newScore,
        status: newStatus,
        resultsDeclared: true,
        manualEvaluation: Object.entries(evaluationData).map(([questionId, evaluation]) => ({
          questionId,
          points: evaluation.points,
          feedback: evaluation.feedback,
          evaluatedBy: "current-user", // This should be the actual user ID
          evaluatedAt: new Date().toISOString(),
        })),
      }

      const response = await fetch(`/api/assessment/results/${resultId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to save evaluation")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Evaluation saved successfully")
        setShowEvaluationDialog(false)
        setIsEvaluating(false)
        await fetchResult() // Refresh the data
      } else {
        throw new Error(data.message || "Failed to save evaluation")
      }
    } catch (error) {
      console.error("Error saving evaluation:", error)
      toast.error("Failed to save evaluation. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEvaluationChange = (questionId: string, field: "points" | "feedback", value: string | number) => {
    setEvaluationData((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return "text-green-600"
    if (score >= passingScore * 0.8) return "text-yellow-600"
    return "text-red-600"
  }

  const hasWrittenAnswers = result?.answers.some((answer) => answer.questionType === "Written Answer") || false
  const writtenAnswersEvaluated =
    result?.answers
      .filter((answer) => answer.questionType === "Written Answer")
      .every((answer) => answer.manualPoints !== undefined) || false

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Result Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-medium mb-2">The requested result could not be found</h2>
            <p className="text-muted-foreground mb-6">
              The result may have been deleted or you may not have access to it.
            </p>
            <Button onClick={() => router.push("/employee/assessment/results")}>Go to Results</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Test Result Details</h1>
            <p className="text-muted-foreground">{result.candidateName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email Candidate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{result.candidateName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">{result.candidateEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Completion Date</Label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(result.completionDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {result.duration} minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question-wise Analysis */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Question-wise Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of answers for each question</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.answers.map((answer, index) => (
                  <div key={answer.questionId} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Question {index + 1}</h3>
                      <div className="flex items-center gap-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {answer.points}/{answer.maxPoints} points
                        </span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-3">{answer.questionText}</p>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Candidate Answer:</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md">
                          {answer.questionType === "Multiple Choice" && Array.isArray(answer.options)
                            ? answer.options.find(opt => String(opt).trim().toLowerCase() === String(answer.answer).trim().toLowerCase()) || answer.answer || "No answer provided"
                            : Array.isArray(answer.answer)
                              ? answer.answer.join(", ")
                              : answer.answer || "No answer provided"}
                        </div>
                      </div>

                      {answer.questionType === "Multiple Choice" && answer.correctAnswer && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Correct Answer:</Label>
                          <div className="mt-1 p-3 bg-green-50 text-green-800 rounded-md">{answer.correctAnswer}</div>
                        </div>
                      )}

                      {answer.questionType === "Coding" && answer.codingTestResults && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Test Case Results:</Label>
                          <div className="mt-1 space-y-2">
                            {answer.codingTestResults.map((testResult, testIndex) => (
                              <div key={testIndex} className="p-3 border rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium">Test Case {testIndex + 1}</span>
                                  <Badge variant={testResult.passed ? "default" : "destructive"}>
                                    {testResult.passed ? "Passed" : "Failed"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">Input:</span>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {testResult.input || "No input"}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="font-medium">Expected:</span>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {testResult.expectedOutput}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="font-medium">Actual:</span>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {testResult.actualOutput}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {answer.questionType === "Written Answer" && answer.manualFeedback && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Evaluator Feedback:</Label>
                          <div className="mt-1 p-3 bg-blue-50 text-blue-800 rounded-md">{answer.manualFeedback}</div>
                        </div>
                      )}

                      {answer.questionType === "Written Answer" && answer.aiFeedback && (
                        <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded p-2">
                          <div><b>AI Feedback:</b> {answer.aiFeedback}</div>
                          <div><b>AI Score:</b> {answer.aiScore}/100</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Test Score */}
          <Card>
            <CardHeader>
              <CardTitle>Test Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl font-bold mb-2">
                <span className={getScoreColor(result.score, test?.passingScore || 70)}>{result.score}%</span>
              </div>
              <Badge className={getStatusColor(result.status)} variant="secondary">
                {result.status}
              </Badge>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Correct Answers:</span>
                  <span className="font-medium">
                    {result.answers.filter((a) => a.isCorrect).length}/{result.answers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-medium">{test?.passingScore || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Result:</span>
                  <span className={`font-medium ${result.status === "Passed" ? "text-green-600" : "text-red-600"}`}>
                    {result.status === "Passed" ? "PASSED" : "FAILED"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Candidate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Evaluation Dialog */}
      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Evaluation - Written Answers</DialogTitle>
            <DialogDescription>
              Evaluate the written answers and assign points based on the quality and correctness of the responses.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {result?.answers
              .filter((answer) => answer.questionType === "Written Answer")
              .map((answer, index) => (
                <div key={answer.questionId} className="border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Question {index + 1}</h3>
                    <p className="text-muted-foreground mb-3">{answer.questionText}</p>

                    <div className="mb-4">
                      <Label className="text-sm font-medium text-muted-foreground">Candidate Answer:</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                        {answer.answer || "No answer provided"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`points-${answer.questionId}`}>Points (Max: {answer.maxPoints})</Label>
                        <Input
                          id={`points-${answer.questionId}`}
                          type="number"
                          min="0"
                          max={answer.maxPoints}
                          value={evaluationData[answer.questionId]?.points || 0}
                          onChange={(e) =>
                            handleEvaluationChange(
                              answer.questionId,
                              "points",
                              Math.min(Number(e.target.value), answer.maxPoints),
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor={`feedback-${answer.questionId}`}>Feedback (Optional)</Label>
                      <Textarea
                        id={`feedback-${answer.questionId}`}
                        value={evaluationData[answer.questionId]?.feedback || ""}
                        onChange={(e) => handleEvaluationChange(answer.questionId, "feedback", e.target.value)}
                        placeholder="Provide feedback on the answer quality, areas for improvement, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvaluationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvaluation} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Evaluation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(Page, "employee");