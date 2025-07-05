"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LogOut,
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface Question {
  id: string
  question: string
  type: string
  options: string[]
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
  explanation: string
  points: number
  timeSpent: number
}

interface CategoryBreakdown {
  [key: string]: {
    correct: number
    total: number
    percentage: number
  }
}

interface DetailedResult {
  id: string
  testId: string
  testTitle: string
  description: string
  status: string
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  duration: number
  timeTaken: number
  completedAt: string
  startedAt: string
  difficulty: string
  category: string
  grade: string
  passingScore: number
  questions: Question[]
  categoryBreakdown: CategoryBreakdown
  recommendations: string[]
}

export default function TestResultPage() {
  const params = useParams()
  const router = useRouter()
  const [result, setResult] = useState<DetailedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState(false)

  const handleLogout = () => {
    console.log("Logout clicked")
  }

  const fetchResultDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/results/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setResult(data.result)
      } else {
        console.error("Failed to fetch result details")
      }
    } catch (error) {
      console.error("Error fetching result details:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchResultDetails()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getGradeColor = (grade: string) => {
    if (grade?.includes("A")) return "text-green-600"
    if (grade?.includes("B")) return "text-blue-600"
    if (grade?.includes("C")) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore + 20) return "text-green-600"
    if (score >= passingScore + 10) return "text-blue-600"
    if (score >= passingScore) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-black shadow fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-white">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">Welcome, Student</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-transparent text-white border-white hover:bg-white hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading result details...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-black shadow fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-white">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">Welcome, Student</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-transparent text-white border-white hover:bg-white hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Result not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Navbar */}
      <header className="bg-black shadow fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">Student Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white">Welcome, Student</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-transparent text-white border-white hover:bg-white hover:text-black"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.push("/student/dashboard/assessments")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{result.testTitle}</h2>
          <p className="text-gray-600">{result.description}</p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Final Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(result.score, result.passingScore)}`}>
                {result.score}%
              </div>
              <div className={`text-lg font-semibold ${getGradeColor(result.grade)} mt-1`}>Grade: {result.grade}</div>
              <Progress value={result.score} className="mt-3 h-2" />
              <p className="text-sm text-gray-500 mt-2">Passing Score: {result.passingScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <p className="text-sm text-gray-500 mt-1">Correct Answers</p>
              <div className="flex gap-2 mt-3">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{result.correctAnswers}</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{result.incorrectAnswers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatDuration(result.timeTaken)}</div>
              <p className="text-sm text-gray-500 mt-1">of {formatDuration(result.duration)} allowed</p>
              <Progress value={(result.timeTaken / result.duration) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Test Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Difficulty:</span>
                  <Badge className="text-xs">{result.difficulty}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {result.category}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="text-xs text-gray-500">{formatDate(result.completedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance by Category
            </CardTitle>
            <CardDescription>Your performance across different topic areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(result.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-gray-600">
                      {data.correct}/{data.total}
                    </span>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                  <p className="text-sm text-gray-500">{data.percentage.toFixed(1)}% correct</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <CardDescription>Areas for improvement and next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Question Review</CardTitle>
                <CardDescription>Review your answers and explanations</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? "Hide" : "Show"} Detailed Answers
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAnswers ? (
              <div className="space-y-6">
                {result.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-lg">Question {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        {question.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm text-gray-500">{question.timeSpent}s</span>
                      </div>
                    </div>

                    <p className="text-gray-800 mb-4">{question.question}</p>

                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded border ${
                            option === question.correctAnswer
                              ? "bg-green-50 border-green-200"
                              : option === question.userAnswer && !question.isCorrect
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {option === question.correctAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {option === question.userAnswer && !question.isCorrect && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                      <span>Points: {question.points}</span>
                      <span>Your Answer: {question.userAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click "Show Detailed Answers" to review questions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
