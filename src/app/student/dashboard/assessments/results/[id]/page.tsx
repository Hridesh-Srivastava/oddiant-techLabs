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
  Briefcase,
  User,
  Award,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
// REMOVE: import { AssessmentLayout } from "@/components/assessment-layout"
import { Navbar } from "@/components/layout/navbar"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import { toast, Toaster } from "sonner"

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
  codingTestResults?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }[];
  // For Coding questions: final submitted code and language
  code?: string;
  language?: string;
  // For Coding questions: submission history
  codeSubmissions?: Array<{
    code: string;
    language: string;
    timestamp: string | Date;
    allPassed?: boolean;
    passedCount?: number;
    totalCount?: number;
    results?: Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
    }>;
  }>;
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
  type: string
  publishedAt: string
}

export default function TestResultPage() {
  const params = useParams()
  const router = useRouter()
  const [result, setResult] = useState<DetailedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState(true)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Navbar />
        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col">
            {/* Student Dashboard Sub-Navbar */}
            <div className="mb-8">
              <div className="flex space-x-2 border-b">
                <button onClick={() => router.push('/student/dashboard?tab=jobs')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Briefcase className="h-4 w-4 inline mr-2" />Job Openings</button>
                <button onClick={() => router.push('/student/dashboard?tab=applications')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><FileText className="h-4 w-4 inline mr-2" />My Applications</button>
                <button onClick={() => router.push('/student/dashboard?tab=profile')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><User className="h-4 w-4 inline mr-2" />My Profile</button>
                <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600"><Award className="h-4 w-4 inline mr-2" />Assessments</button>
                <button onClick={() => router.push('/student/dashboard?tab=settings')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Settings className="h-4 w-4 inline mr-2" />Settings</button>
              </div>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading result details...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col">
            {/* Student Dashboard Sub-Navbar */}
            <div className="mb-8">
              <div className="flex space-x-2 border-b">
                <button onClick={() => router.push('/student/dashboard?tab=jobs')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Briefcase className="h-4 w-4 inline mr-2" />Job Openings</button>
                <button onClick={() => router.push('/student/dashboard?tab=applications')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><FileText className="h-4 w-4 inline mr-2" />My Applications</button>
                <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600"><Award className="h-4 w-4 inline mr-2" />Assessments</button>
                <button onClick={() => router.push('/student/dashboard?tab=profile')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><User className="h-4 w-4 inline mr-2" />My Profile</button>
                <button onClick={() => router.push('/student/dashboard?tab=settings')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Settings className="h-4 w-4 inline mr-2" />Settings</button>
              </div>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500">Result not found</p>
              <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
  <Navbar />
  <Toaster position="top-center" />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col">
          {/* Student Dashboard Sub-Navbar */}
          <div className="mb-8">
            <div className="flex space-x-2 border-b justify-center">
              <button onClick={() => router.push('/student/dashboard?tab=jobs')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Briefcase className="h-4 w-4 inline mr-2" />Job Openings</button>
              <button onClick={() => router.push('/student/dashboard?tab=applications')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><FileText className="h-4 w-4 inline mr-2" />My Applications</button>
              <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600"><Award className="h-4 w-4 inline mr-2" />Assessments</button>
              <button onClick={() => router.push('/student/dashboard?tab=profile')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><User className="h-4 w-4 inline mr-2" />My Profile</button>
              <button onClick={() => router.push('/student/dashboard?tab=settings')} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700"><Settings className="h-4 w-4 inline mr-2" />Settings</button>
            </div>
          </div>
          {/* Back Button - left aligned, natural width */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/student/dashboard/assessments")}
              className="flex items-center px-3 py-2 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{result.testTitle}</h2>
            <p className="text-gray-600">{result.description}</p>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  Final Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {result.score}%
                </div>
                <div className="text-lg font-semibold text-white mt-1">Grade: {result.grade}</div>
                <Progress value={result.score} className="mt-3 h-2" />
                <p className="text-sm text-white mt-2">Passing Score: {result.passingScore}%</p>
              </CardContent>
            </Card>

            <Card className="bg-green-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-green-300" />
                  Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {result.correctAnswers}/{result.totalQuestions}
                </div>
                <p className="text-sm text-white mt-1">Correct Answers</p>
                <div className="flex gap-2 mt-3">
                  <div className="flex items-center gap-1 text-white">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">{result.correctAnswers}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{result.incorrectAnswers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-purple-300" />
                  Time Taken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatDuration(result.timeTaken)}</div>
                <p className="text-sm text-white mt-1">of {formatDuration(result.duration)} allowed</p>
                <Progress value={(result.timeTaken / result.duration) * 100} className="mt-3 h-2" />
              </CardContent>
            </Card>

            {/* Test Info Card (replace old fields) */}
            <Card className="bg-orange-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-orange-300" />
                  Test Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Result ID:</span>
                    <span className="text-xs text-white">{result.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Type:</span>
                    <Badge variant="outline" className="text-xs bg-white text-orange-600">{result.type || "-"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Result Published:</span>
                    <span className="text-xs text-white">{formatDate(result.publishedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="mb-8 border-l-4 border-l-purple-500">
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* REMOVE Recommendations Card */}

          {/* Question Review */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Question Review</CardTitle>
                  <CardDescription>Review your answers</CardDescription>
                </div>
                <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" onClick={() => setShowAnswers(!showAnswers)}>
                  {showAnswers ? "Hide Detailed Answers" : "Show Detailed Answers"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAnswers ? (
                <div className="space-y-6">
                  {result.questions.map((question, index) => (
                    <div key={`${question.id}-${index}`} className="border rounded-lg p-4 border-l-4 border-l-red-500">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-lg">Question {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          {question.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      {/* Render question text with markdown and HTML support */}
                      <div className="mb-4">
                        <div className="prose max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{question.question}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="inline-block w-full md:w-auto">
                          {question.type !== 'Coding' && (
                            <div className="bg-blue-50 border border-blue-200 rounded px-4 py-2 text-blue-800 text-sm font-medium">
                              Your Answer: {question.userAnswer || <span className="italic text-gray-400">No answer</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coding: Final Submitted Code and Submission History */}
                      {question.type === 'Coding' && (
                        <div className="space-y-3 mb-4">
                          {!question.code && (
                            <div className="p-3 border rounded-md bg-muted text-xs italic text-muted-foreground">
                              Legacy result: source code was not captured for this submission.
                            </div>
                          )}
                          {question.code && (
                            <div className="p-3 border rounded-md bg-white/80 dark:bg-slate-900/20">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Final Submitted Code{question.language ? ` (${question.language})` : ''}</span>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(String(question.code || '')).then(() => toast.success('Code copied')).catch(() => toast.error('Copy failed')); }}
                                  className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-green-600 hover:text-black transition-colors"
                                >Copy</button>
                              </div>
                              <pre className="mt-1 p-3 rounded bg-black/90 text-xs sm:text-sm font-mono text-white overflow-auto max-h-[60vh]">
{String(question.code || '')}
                              </pre>
                            </div>
                          )}
                          {Array.isArray(question.codeSubmissions) && question.codeSubmissions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm font-medium text-muted-foreground mb-2">Submission History ({question.codeSubmissions.length})</div>
                              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {question.codeSubmissions.slice().reverse().map((sub, idx) => {
                                  const indexFromEnd = question.codeSubmissions!.length - idx;
                                  return (
                                    <div key={idx} className="border rounded-md p-3 bg-white/80 dark:bg-slate-900/20">
                                      <div className="flex flex-wrap justify-between gap-2 items-center mb-2 text-xs">
                                        <div className="font-medium">
                                          Attempt #{indexFromEnd}{' '}
                                          <span className={sub.allPassed ? 'text-green-600' : 'text-red-500'}>
                                            {sub.passedCount}/{sub.totalCount} passed
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <span className="text-muted-foreground">{new Date(sub.timestamp).toLocaleString()}</span>
                                          <button
                                            onClick={() => { navigator.clipboard.writeText(sub.code).then(() => toast.success('Copied')).catch(() => toast.error('Copy failed')); }}
                                            className="px-2 py-0.5 border rounded text-xs bg-black text-white hover:bg-green-600 hover:text-black transition-colors"
                                          >Copy</button>
                                          <button
                                            onClick={() => {
                                              const blob = new Blob([sub.code], { type: 'text/plain' });
                                              const a = document.createElement('a');
                                              a.href = URL.createObjectURL(blob);
                                              a.download = `submission_${question.id}_${indexFromEnd}.${(sub.language||'txt').toLowerCase()}`;
                                              a.click();
                                              URL.revokeObjectURL(a.href);
                                              toast.success('Download started');
                                            }}
                                            className="px-2 py-0.5 border rounded text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600 transition-colors"
                                          >Download</button>
                                        </div>
                                      </div>
                                      <pre className="p-3 text-xs sm:text-[13px] rounded bg-black/90 font-mono text-white overflow-auto leading-relaxed whitespace-pre max-h-[50vh]">
{sub.code}
                                      </pre>
                                      {Array.isArray(sub.results) && sub.results.length > 0 && (
                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                          {sub.results.map((r, rIdx) => (
                                            <div key={rIdx} className="border rounded p-2 text-[10px] bg-muted/30">
                                              <div className="flex justify-between mb-1">
                                                <span className="font-medium">Case {rIdx+1}</span>
                                                <span className={r.passed ? 'text-green-600' : 'text-red-500'}>{r.passed ? 'PASS' : 'FAIL'}</span>
                                              </div>
                                              <div className="grid grid-cols-3 gap-1">
                                                <div><span className="font-medium">In:</span><div className="truncate">{r.input||''}</div></div>
                                                <div><span className="font-medium">Exp:</span><div className="truncate">{r.expectedOutput||''}</div></div>
                                                <div><span className="font-medium">Act:</span><div className="truncate">{r.actualOutput||''}</div></div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show coding test case results if this is a coding question */}
                      {question.type === 'Coding' && Array.isArray(question.codingTestResults) && question.codingTestResults.length > 0 && (
                        <div className="mb-4">
                          <div className="font-semibold mb-2">Test Case Results:</div>
                          <div className="space-y-2">
                            {question.codingTestResults.map((tc, tcIdx) => (
                              <div key={tcIdx} className={`p-2 rounded border flex items-center gap-3 ${tc.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {/* Icon badge */}
                                {tc.passed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <div className="flex-1">
                                  <div className="font-semibold mb-1">Test Case {tcIdx + 1}</div>
                                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                                    <div><span className="font-medium">Input:</span> <span className="font-mono">{tc.input}</span></div>
                                    <div><span className="font-medium">Expected Output:</span> <span className="font-mono">{tc.expectedOutput}</span></div>
                                    <div><span className="font-medium">Your Output:</span> <span className="font-mono">{tc.actualOutput}</span></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 mb-4">
                        {question.options.filter(option => option && option.trim() !== "").map((option, optionIndex) => (
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
        </div>
      </div>
    </div>
  )
}
