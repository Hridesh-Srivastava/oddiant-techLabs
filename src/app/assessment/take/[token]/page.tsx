"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Clock, CheckCircle, AlertCircle, Calculator, AlertTriangle, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AdvancedCodeEditor } from "@/components/advanced-code-editor"
import { CameraModal } from "@/components/camera-modal"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"

interface InvitationData {
  _id: string
  email: string
  testId: string
  testName: string
  companyName: string
  token: string
  status: string
  expiresAt: string
}

interface TestData {
  _id: string
  name: string
  description: string
  duration: number
  passingScore: number
  instructions: string
  type: string
  _shuffled?: boolean
  settings: {
    shuffleQuestions: boolean
    preventTabSwitching: boolean
    allowCalculator: boolean
    allowCodeEditor: boolean
    autoSubmit: boolean
  }
  sections: SectionData[]
}

interface SectionData {
  id: string
  title: string
  duration: number
  questionType: string
  questions: QuestionData[]
}

interface QuestionData {
  id: string
  text: string
  type: string
  options?: string[]
  correctAnswer?: string | string[]
  points: number
  codeLanguage?: string
  codeTemplate?: string
  testCases?: any[]
  maxWords?: number
  instructions?: string
}

// FIXED: Updated interface for code submissions
interface CodeSubmission {
  code: string
  language: string
  timestamp: Date
  results: any[]
  allPassed: boolean
  passedCount: number
  totalCount: number
}

// FIXED: Store code submissions per question instead of individual test case results
const questionCodeSubmissions: Record<string, CodeSubmission[]> = {}
const testSessionKey = typeof window !== "undefined" ? window.location.pathname : "default"

export default function TakeTestPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [codes, setCodes] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [test, setTest] = useState<TestData | null>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [activeTab, setActiveTab] = useState("instructions")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testResult, setTestResult] = useState<{
    score: number
    status: string
    duration: number
    resultsDeclared: boolean
  } | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Tab switching detection with improved logic
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [testTerminated, setTestTerminated] = useState(false)
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0)

  // Scientific Calculator
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorValue, setCalculatorValue] = useState("0")
  const [calculatorMemory, setCalculatorMemory] = useState<number | null>(null)
  const [calculatorOperation, setCalculatorOperation] = useState<string | null>(null)
  const [calculatorClearNext, setCalculatorClearNext] = useState(false)
  const [calculatorDegreeMode, setCalculatorDegreeMode] = useState(true)
  const [calculatorInverseMode, setCalculatorInverseMode] = useState(false)

  // Pre-exam verification states
  const [showSystemCheck, setShowSystemCheck] = useState(false)
  const [showIdVerification, setShowIdVerification] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [verificationStep, setVerificationStep] = useState<"system" | "id" | "rules" | "complete">("system")
  const [systemChecks, setSystemChecks] = useState({
    cameraAccess: false,
    fullscreenMode: false,
    compatibleBrowser: true,
    tabFocus: true,
  })
  const [studentId, setStudentId] = useState("")
  const [idCardImage, setIdCardImage] = useState<string | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [acceptedRules, setAcceptedRules] = useState(false)
  const [isCapturingFace, setIsCapturingFace] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Enhanced webcam states with better error handling
  const [webcamStatus, setWebcamStatus] = useState<"inactive" | "requesting" | "active" | "error">("inactive")
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [webcamRetryCount, setWebcamRetryCount] = useState(0)
  const [webcamEnabled, setWebcamEnabled] = useState(true)

  // Refs for visibility tracking with better cleanup
  const visibilityRef = useRef(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const webcamInitializedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const webcamRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const componentMountedRef = useRef(true)

  // Enhanced webcam management with separate refs for different contexts
  const mainVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalVideoRef = useRef<HTMLVideoElement | null>(null)
  const systemCheckVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalStreamRef = useRef<MediaStream | null>(null)

  // Add state for current code test case results
  const [currentCodeStats, setCurrentCodeStats] = useState({ passed: 0, failed: 0, total: 0 })

  // Cleanup function to stop all webcam streams
  const cleanupWebcam = useCallback(() => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        mediaStreamRef.current = null
      }
      if (modalStreamRef.current) {
        modalStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        modalStreamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = null
      }
      if (systemCheckVideoRef.current) {
        systemCheckVideoRef.current.srcObject = null
      }
      if (webcamRetryTimeoutRef.current) {
        clearTimeout(webcamRetryTimeoutRef.current)
        webcamRetryTimeoutRef.current = null
      }
      setWebcamStatus("inactive")
      webcamInitializedRef.current = false
      setWebcamError(null)
    } catch (error) {
      console.error("Error during webcam cleanup:", error)
    }
  }, [])

  // FIXED: Updated function to handle code submissions instead of individual test case results
  const handleCodeSubmissions = useCallback(
    (questionId: string, submissions: CodeSubmission[]) => {
      console.log(`Storing code submissions for question ${questionId}:`, submissions)
      const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
      if (currentQuestionData && currentQuestionData.id === questionId) {
        const questionKey = `${test.sections[currentSection].id}-${questionId}`
        const sessionQuestionKey = `${testSessionKey}-${questionKey}`

        // Store submissions
        questionCodeSubmissions[sessionQuestionKey] = [...submissions]
        questionCodeSubmissions[questionKey] = [...submissions]
        questionCodeSubmissions[questionId] = [...submissions]

        // Also store in localStorage as backup
        try {
          localStorage.setItem(`submissions_${sessionQuestionKey}`, JSON.stringify(submissions))
        } catch (e) {
          console.warn("Failed to store in localStorage:", e)
        }

        // Update current code stats for counter and badges
        if (submissions && submissions.length > 0) {
          const latest = submissions[submissions.length - 1]
          setCurrentCodeStats({
            passed: latest.passedCount,
            failed: latest.totalCount - latest.passedCount,
            total: latest.totalCount,
          })
        } else {
          setCurrentCodeStats({ passed: 0, failed: 0, total: 0 })
        }
      }
    },
    [test, currentSection, currentQuestion],
  )

  const handleSubmitTest = useCallback(async () => {
    try {
      if (!test || !invitation) return

      setIsSubmitting(true)

      // FIXED: Updated validation for coding questions - check if code has been executed
      const codingQuestionsValidation = test.sections.some((section) => {
        return section.questions.some((question) => {
          if (question.type === "Coding") {
            const questionKey = `${section.id}-${question.id}`
            const sessionQuestionKey = `${testSessionKey}-${questionKey}`

            let storedSubmissions =
              questionCodeSubmissions[sessionQuestionKey] ||
              questionCodeSubmissions[questionKey] ||
              questionCodeSubmissions[question.id]

            // Fallback to localStorage if not in memory
            if (!storedSubmissions || storedSubmissions.length === 0) {
              try {
                const stored = localStorage.getItem(`submissions_${sessionQuestionKey}`)
                if (stored) {
                  storedSubmissions = JSON.parse(stored)
                }
              } catch (e) {
                console.warn("Failed to load from localStorage during submission:", e)
              }
            }

            // Check if user has written code but not executed it
            const userCode = answers[questionKey] as string
            const hasCode = userCode && userCode.trim() !== "" && userCode.trim() !== question.codeTemplate?.trim()

            if (hasCode && (!storedSubmissions || storedSubmissions.length === 0)) {
              toast.error(
                `Please run your code for coding questions to execute test cases before submitting. Check Question: "${question.text.substring(0, 50)}..."`,
              )
              return true // Found unexecuted coding question
            }
          }
          return false
        })
      })

      if (codingQuestionsValidation) {
        setIsSubmitting(false)
        return // Stop submission
      }

      // Disable webcam functionality when submitting
      setWebcamEnabled(false)
      cleanupWebcam()

      // Calculate test duration in minutes
      const endTime = new Date()
      const durationInMinutes = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0

      // Calculate score with proper handling for all question types
      let totalPoints = 0
      let earnedPoints = 0
      const answersWithDetails: any[] = []

      test.sections.forEach((section) => {
        section.questions.forEach((question) => {
          totalPoints += question.points
          const questionKey = `${section.id}-${question.id}`
          const userAnswer = answers[questionKey]

          let isCorrect = false
          let codingTestResults:
            | { input: string; expectedOutput: string; actualOutput: string; passed: boolean }[]
            | null = null

          // Enhanced scoring logic for different question types
          if (question.type === "Multiple Choice") {
            const userAnswerStr = String(userAnswer || "").trim()
            const correctAnswerStr = String(question.correctAnswer || "").trim()

            console.log(`=== MCQ Evaluation for Question ${question.id} ===`)
            console.log(`Question Text: "${question.text}"`)
            console.log(`User Answer String: "${userAnswerStr}"`)
            console.log(`Correct Answer String: "${correctAnswerStr}"`)

            if (userAnswerStr && userAnswerStr.length > 0 && correctAnswerStr && correctAnswerStr.length > 0) {
              if (userAnswerStr === correctAnswerStr) {
                isCorrect = true
                earnedPoints += question.points
                console.log(`✅ EXACT MATCH - ${question.points} points awarded`)
              } else if (userAnswerStr.toLowerCase() === correctAnswerStr.toLowerCase()) {
                isCorrect = true
                earnedPoints += question.points
                console.log(`✅ CASE-INSENSITIVE MATCH - ${question.points} points awarded`)
              } else {
                const userOptionIndex = question.options?.findIndex((opt) => opt.trim() === userAnswerStr)
                const correctOptionIndex = question.options?.findIndex((opt) => opt.trim() === correctAnswerStr)
                if (userOptionIndex !== -1 && correctOptionIndex !== -1 && userOptionIndex === correctOptionIndex) {
                  isCorrect = true
                  earnedPoints += question.points
                  console.log(`✅ OPTION INDEX MATCH - ${question.points} points awarded`)
                } else {
                  console.log(`❌ NO MATCH FOUND - 0 points`)
                }
              }
            } else {
              console.log(`❌ EMPTY ANSWER - 0 points`)
            }
          } else if (question.type === "Coding") {
            // FIXED: For coding questions, get the latest submission results
            const questionKey = `${section.id}-${question.id}`
            const sessionQuestionKey = `${testSessionKey}-${questionKey}`

            let storedSubmissions =
              questionCodeSubmissions[sessionQuestionKey] ||
              questionCodeSubmissions[questionKey] ||
              questionCodeSubmissions[question.id]

            // Fallback to localStorage if not in memory
            if (!storedSubmissions || storedSubmissions.length === 0) {
              try {
                const stored = localStorage.getItem(`submissions_${sessionQuestionKey}`)
                if (stored) {
                  storedSubmissions = JSON.parse(stored)
                }
              } catch (e) {
                console.warn("Failed to load from localStorage during submission:", e)
              }
            }

            if (storedSubmissions && storedSubmissions.length > 0) {
              // Get the latest submission (most recent)
              const latestSubmission = storedSubmissions[storedSubmissions.length - 1]

              // Convert submission results to the expected format
              codingTestResults = latestSubmission.results.map((result: any) => ({
                input: result.input || "",
                expectedOutput: result.expectedOutput || "",
                actualOutput: result.actualOutput || "",
                passed: result.passed || false,
              }))

              // Award points if all test cases pass in the latest submission
              if (latestSubmission.allPassed) {
                isCorrect = true
                earnedPoints += question.points
              }

              console.log(
                `Coding Question ${question.id}: Using latest submission - ${latestSubmission.passedCount}/${latestSubmission.totalCount} test cases passed`,
              )
            } else {
              // Fallback: create placeholder results if no submissions
              codingTestResults =
                question.testCases?.map((testCase) => ({
                  input: testCase.input,
                  expectedOutput: testCase.expectedOutput,
                  actualOutput: "Not executed",
                  passed: false,
                })) || null
              console.log(`Coding Question ${question.id}: No submissions found, using placeholder`)
            }
          } else if (question.type === "Written Answer") {
            // Written answers are not automatically graded
            isCorrect = false // Manual evaluation required
          }

          // Store detailed answer information
          answersWithDetails.push({
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            answer: userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            points: isCorrect ? question.points : 0,
            maxPoints: question.points,
            codingTestResults: codingTestResults, // Store test case results
          })

          console.log(
            `Question ${question.id} (${question.type}): ${isCorrect ? "CORRECT" : "INCORRECT"} - ${
              isCorrect ? question.points : 0
            }/${question.points}`,
          )
        })
      })

      console.log(`Total scoring: ${earnedPoints}/${totalPoints} points`)

      const score = Math.round((earnedPoints / totalPoints) * 100)
      const status = score >= test.passingScore ? "Passed" : "Failed"

      // Prepare result data
      const resultData = {
        invitationId: invitation._id,
        testId: test._id,
        testName: test.name,
        candidateName: invitation.email.split("@")[0],
        candidateEmail: invitation.email,
        score,
        status,
        duration: durationInMinutes,
        answers: answersWithDetails,
        tabSwitchCount: tabSwitchCount,
        terminated: testTerminated,
        resultsDeclared: false,
        isPreview: isPreviewMode,
      }

      // Submit result - use different endpoint for preview
      const endpoint = isPreviewMode ? "/api/assessment/preview-results" : "/api/assessment/results"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit test")
      }

      const data = await response.json()

      if (data.success) {
        setTestCompleted(true)
        setTestResult({
          score: 0, // Don't show actual score yet
          status: "Pending", // Don't show actual status yet
          duration: durationInMinutes,
          resultsDeclared: false,
        })
        toast.success("Test submitted successfully")
      } else {
        throw new Error(data.message || "Failed to submit test")
      }
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Failed to submit test. Please try again.")
      setWebcamEnabled(true) // Re-enable webcam on error
    } finally {
      setIsSubmitting(false)
    }
  }, [test, invitation, startTime, answers, tabSwitchCount, testTerminated, isPreviewMode, cleanupWebcam])

  // Enhanced webcam functions with better error handling and video element checks
  const isVideoElementAvailable = useCallback(
    (videoElement: HTMLVideoElement | null): boolean => {
      return !!(
        videoElement &&
        videoElement.parentNode &&
        document.contains(videoElement) &&
        componentMountedRef.current &&
        webcamEnabled &&
        !testCompleted &&
        !testTerminated
      )
    },
    [webcamEnabled, testCompleted, testTerminated],
  )

  const startWebcamForModal = useCallback(
    async (targetVideoRef: React.RefObject<HTMLVideoElement>) => {
      if (!webcamEnabled || testCompleted || testTerminated || !componentMountedRef.current) {
        return
      }

      try {
        setWebcamStatus("requesting")
        setWebcamError(null)
        // Stop any existing modal stream
        if (modalStreamRef.current) {
          modalStreamRef.current.getTracks().forEach((track) => track.stop())
          modalStreamRef.current = null
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access is not supported in this browser")
        }

        const constraints = {
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: "user",
          },
          audio: false,
        }

        console.log("Requesting camera access for modal...")
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        // Check if component is still mounted and webcam is still enabled
        if (!componentMountedRef.current || !webcamEnabled || testCompleted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        modalStreamRef.current = stream

        // Wait for video element to be available with timeout
        let retryCount = 0
        const maxRetries = 20
        while (!targetVideoRef.current && retryCount < maxRetries && componentMountedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          retryCount++
        }

        if (!isVideoElementAvailable(targetVideoRef.current)) {
          throw new Error("Video element not available or component unmounted")
        }

        const video = targetVideoRef.current!

        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        video.autoplay = true

        // Wait for video to load and play with proper error handling
        await new Promise<void>((resolve, reject) => {
          if (!componentMountedRef.current || !webcamEnabled) {
            reject(new Error("Component unmounted or webcam disabled"))
            return
          }

          const timeoutId = setTimeout(() => {
            reject(new Error("Video loading timed out"))
          }, 15000)

          const onLoadedMetadata = async () => {
            clearTimeout(timeoutId)
            try {
              if (!componentMountedRef.current || !webcamEnabled) {
                reject(new Error("Component unmounted during video load"))
                return
              }

              await video.play()
              console.log("Modal webcam started successfully")
              resolve()
            } catch (err) {
              console.error("Error playing video:", err)
              reject(err)
            }
          }

          const onError = (error: any) => {
            clearTimeout(timeoutId)
            console.error("Video element error:", error)
            reject(new Error("Video element error"))
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })
          video.addEventListener("error", onError, { once: true })

          // If video is already loaded
          if (video.readyState >= 1) {
            onLoadedMetadata()
          }
        })

        if (componentMountedRef.current && webcamEnabled) {
          setWebcamStatus("active")
          setWebcamRetryCount(0)
          toast.success("Camera started successfully")
        }
      } catch (error) {
        if (!componentMountedRef.current || !webcamEnabled) {
          return // Don't show errors if component is unmounted or webcam disabled
        }

        console.error("Error starting modal webcam:", error)
        let errorMessage = "Failed to access webcam"
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            errorMessage = "Camera permission denied. Please allow camera access and try again."
          } else if (error.name === "NotFoundError") {
            errorMessage = "No camera found. Please connect a camera and try again."
          } else if (error.name === "NotReadableError") {
            errorMessage = "Camera is already in use by another application."
          } else if (error.name === "OverconstrainedError") {
            errorMessage = "Camera constraints could not be satisfied."
          } else {
            errorMessage = error.message || "Unknown webcam error"
          }
        }

        setWebcamError(errorMessage)
        setWebcamStatus("error")
        toast.error(errorMessage)

        // Clean up on error
        if (modalStreamRef.current) {
          modalStreamRef.current.getTracks().forEach((track) => track.stop())
          modalStreamRef.current = null
        }
      }
    },
    [webcamEnabled, testCompleted, testTerminated, isVideoElementAvailable],
  )

  const uploadImageToServer = useCallback(
    async (imageDataUrl: string, type: "face" | "id_card") => {
      if (!token) {
        toast.error("No token available for upload")
        return
      }

      try {
        // Convert data URL to blob
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()

        // Create form data
        const formData = new FormData()
        formData.append("image", blob, `${type}.jpg`)
        formData.append("token", token)
        formData.append("type", type)
        formData.append("isPreview", isPreviewMode.toString())

        // Try multiple upload endpoints
        const endpoints = [
          isPreviewMode ? "/api/assessment/preview-verification/upload" : "/api/assessment/verification/upload",
          "/api/assessment/verification/upload", // Fallback
          "/api/assessment/preview-verification/upload", // Second fallback
        ]

        let uploadResponse = null
        let lastError = null

        for (const endpoint of endpoints) {
          try {
            uploadResponse = await fetch(endpoint, {
              method: "POST",
              body: formData,
            })

            if (uploadResponse.ok) {
              break // Success, exit loop
            } else {
              const errorData = await uploadResponse.json().catch(() => ({}))
              lastError = errorData.message || `HTTP ${uploadResponse.status}`
              console.log(`Upload failed for ${endpoint}:`, lastError)
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : "Network error"
            console.log(`Network error for ${endpoint}:`, lastError)
          }
        }

        if (!uploadResponse || !uploadResponse.ok) {
          // If all endpoints fail, just return success to not block the user
          console.warn("All upload endpoints failed, but continuing...")
          toast.warning("Image captured but upload failed. You can continue with the test.")
          return null
        }

        const data = await uploadResponse.json()
        if (!data.success) {
          console.warn("Upload response indicates failure, but continuing...")
          toast.warning("Image captured but upload failed. You can continue with the test.")
          return null
        }

        return data.imageUrl
      } catch (error) {
        console.error("Error uploading image:", error)
        // Don't throw error, just warn and continue
        toast.warning("Image captured but upload failed. You can continue with the test.")
        return null
      }
    },
    [token, isPreviewMode],
  )

  // Updated openCameraModal function
  const openCameraModal = useCallback(
    (forFace: boolean) => {
      if (!webcamEnabled || testCompleted || testTerminated) {
        return
      }

      setIsCapturingFace(forFace)
      setShowCameraModal(true)
      // Start webcam after modal is rendered
      setTimeout(() => {
        if (componentMountedRef.current && webcamEnabled) {
          startWebcamForModal(modalVideoRef)
        }
      }, 300)
    },
    [startWebcamForModal, webcamEnabled, testCompleted, testTerminated],
  )

  // Updated captureImage function
  const captureImage = useCallback(async () => {
    if (!modalVideoRef.current || !canvasRef.current || !modalStreamRef.current || !webcamEnabled) {
      toast.error("Camera not initialized properly")
      return
    }

    try {
      const video = modalVideoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        toast.error("Could not get canvas context")
        return
      }

      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error("Video not ready. Please wait a moment and try again.")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      // Save image based on what we're capturing
      if (isCapturingFace) {
        setFaceImage(imageDataUrl)
      } else {
        setIdCardImage(imageDataUrl)
      }

      // Close camera modal
      setShowCameraModal(false)

      // Stop modal camera
      if (modalStreamRef.current) {
        modalStreamRef.current.getTracks().forEach((track) => track.stop())
        modalStreamRef.current = null
      }

      // Try to upload to server (but don't fail if it doesn't work)
      try {
        await uploadImageToServer(imageDataUrl, isCapturingFace ? "face" : "id_card")
        toast.success(`${isCapturingFace ? "Face" : "ID Card"} captured and uploaded successfully`)
      } catch (uploadError) {
        console.warn("Upload failed but image captured:", uploadError)
        toast.success(`${isCapturingFace ? "Face" : "ID Card"} captured successfully`)
      }
    } catch (error) {
      console.error("Error capturing image:", error)
      toast.error("Failed to capture image")
    }
  }, [isCapturingFace, uploadImageToServer, webcamEnabled])

  // Update the startWebcam function for main video with better error handling
  const startWebcam = useCallback(async () => {
    if (!webcamEnabled || testCompleted || testTerminated || !componentMountedRef.current) {
      return
    }

    if (webcamStatus === "requesting" || webcamStatus === "active") {
      return
    }

    try {
      setWebcamStatus("requesting")
      setWebcamError(null)

      // Stop any existing stream first
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      const constraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user",
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Check if component is still mounted and webcam is still enabled
      if (!componentMountedRef.current || !webcamEnabled || testCompleted) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      mediaStreamRef.current = stream

      // Determine which video element to use
      const targetVideo = systemCheckVideoRef.current || videoRef.current

      if (!targetVideo) {
        // Wait for video element to be available
        let retryCount = 0
        const maxRetries = 10
        while (!videoRef.current && retryCount < maxRetries && componentMountedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          retryCount++
        }

        if (!videoRef.current) {
          console.warn("Video element still not available, skipping webcam start")
          return
        }

        if (!isVideoElementAvailable(videoRef.current)) {
          throw new Error("Video element not available after waiting")
        }
      }

      const video = targetVideo || videoRef.current!

      if (!isVideoElementAvailable(video)) {
        throw new Error("Video element not available")
      }

      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      video.autoplay = true

      // Wait for video to load and play
      await new Promise<void>((resolve, reject) => {
        if (!componentMountedRef.current || !webcamEnabled) {
          reject(new Error("Component unmounted or webcam disabled"))
          return
        }

        const timeoutId = setTimeout(() => {
          reject(new Error("Video loading timed out"))
        }, 10000)

        const onLoadedMetadata = async () => {
          clearTimeout(timeoutId)
          try {
            if (!componentMountedRef.current || !webcamEnabled) {
              reject(new Error("Component unmounted during video load"))
              return
            }

            await video.play()
            resolve()
          } catch (err) {
            reject(err)
          }
        }

        const onError = () => {
          clearTimeout(timeoutId)
          reject(new Error("Video element error"))
        }

        video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })
        video.addEventListener("error", onError, { once: true })

        // If video is already loaded
        if (video.readyState >= 1) {
          onLoadedMetadata()
        }
      })

      if (componentMountedRef.current && webcamEnabled) {
        setWebcamStatus("active")
        webcamInitializedRef.current = true
        setWebcamRetryCount(0)

        // Update system checks if in system check mode
        if (showSystemCheck) {
          setSystemChecks((prev) => ({
            ...prev,
            cameraAccess: true,
          }))
        }

        toast.success("Webcam started successfully")
      }
    } catch (error) {
      if (!componentMountedRef.current || !webcamEnabled) {
        return // Don't show errors if component is unmounted or webcam disabled
      }

      console.error("Error starting webcam:", error)
      let errorMessage = "Failed to access webcam"
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application."
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Camera constraints could not be satisfied."
        } else {
          errorMessage = error.message || "Unknown webcam error"
        }
      }

      setWebcamError(errorMessage)
      setWebcamStatus("error")
      setWebcamRetryCount((prev) => prev + 1)

      // Update system checks if in system check mode
      if (showSystemCheck) {
        setSystemChecks((prev) => ({
          ...prev,
          cameraAccess: false,
        }))
      }

      toast.error(errorMessage)

      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      // Auto-retry with exponential backoff (max 3 retries) only if webcam is still enabled
      if (webcamRetryCount < 3 && webcamEnabled && !testCompleted && !testTerminated) {
        const retryDelay = Math.min(2000 * Math.pow(2, webcamRetryCount), 8000)
        webcamRetryTimeoutRef.current = setTimeout(() => {
          if (componentMountedRef.current && webcamEnabled) {
            console.log(`Retrying webcam start (attempt ${webcamRetryCount + 1})`)
            startWebcam()
          }
        }, retryDelay)
      }
    }
  }, [
    webcamStatus,
    webcamRetryCount,
    showSystemCheck,
    webcamEnabled,
    testCompleted,
    testTerminated,
    isVideoElementAvailable,
  ])

  // Load persisted code when question changes - FIXED to prevent infinite loop
  useEffect(() => {
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    if (currentQuestionData?.type === "Coding" && test) {
      const questionKey = `${test.sections[currentSection].id}-${currentQuestionData.id}`
      const enhancedStorageKey = `${testSessionKey}-${questionKey}`
      const template = currentQuestionData.codeTemplate || ""

      let loadedCode: string | null = null

      // First try localStorage with enhanced key
      try {
        const stored = localStorage.getItem(`code_${enhancedStorageKey}`)
        if (stored !== null) {
          loadedCode = stored
        }
      } catch (e) {}

      // If no localStorage, try codes state
      if (loadedCode === null) {
        const currentAnswer = codes[questionKey]
        if (currentAnswer !== undefined && currentAnswer !== null) {
          loadedCode = currentAnswer
        }
      }

      // If loadedCode is empty, only whitespace, or matches the template, use template
      if (!loadedCode || loadedCode.trim() === "" || loadedCode.trim() === template.trim()) {
        loadedCode = template
      }

      // Only update if different
      setCodes((prev) => {
        if (prev[questionKey] !== loadedCode) {
          return { ...prev, [questionKey]: loadedCode || "" }
        }
        return prev
      })
    } else {
      if (codes !== {}) {
        setCodes({})
      }
    }
  }, [currentSection, currentQuestion, test?.sections])

  const handleAnswer = useCallback(
    (questionKey: string, answer: string | string[]) => {
      const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
      if (currentQuestionData) {
        setCodes((prev) => {
          if (prev[questionKey] === answer) return prev
          return { ...prev, [questionKey]: answer as string }
        })
        // Persist code to localStorage for coding questions
        if (currentQuestionData.type === "Coding" && typeof answer === "string") {
          try {
            const enhancedStorageKey = `${testSessionKey}-${questionKey}`
            localStorage.setItem(`code_${enhancedStorageKey}`, answer)
          } catch (e) {
            console.warn("Failed to store code in localStorage:", e)
          }
        }
      }
    },
    [test, currentSection, currentQuestion, testSessionKey],
  )

  useEffect(() => {
    // Set component as mounted
    componentMountedRef.current = true

    // Check if this is a preview mode (employee testing the system)
    const isPreview = window.location.pathname.includes("/preview/") || window.location.search.includes("preview=true")
    setIsPreviewMode(isPreview)

    fetchInvitation()

    // Check if user completed the pre-exam verification
    const verificationStatus = localStorage.getItem(`verification_${token}`)
    if (!verificationStatus && token) {
      // Show system check first if verification not completed
      setVerificationStep("system")
      setShowSystemCheck(true)
    } else {
      setVerificationComplete(true)
      setVerificationStep("complete")
    }

    // Enhanced tab switching detection with proper debouncing
    const handleVisibilityChange = () => {
      const now = Date.now()
      if (document.hidden && activeTab === "test" && !testTerminated && now - lastTabSwitchTime > 2000) {
        setLastTabSwitchTime(now)
        setTabSwitchCount((prev) => {
          const newCount = prev + 1
          if (test?.settings.preventTabSwitching) {
            setShowTabWarning(true)
            if (newCount >= 4) {
              handleTestTermination()
            }
          }
          return newCount
        })
      }
    }

    const handleWindowBlur = () => {
      const now = Date.now()
      if (activeTab === "test" && !testTerminated && now - lastTabSwitchTime > 2000) {
        setLastTabSwitchTime(now)
        setTabSwitchCount((prev) => {
          const newCount = prev + 1
          if (test?.settings.preventTabSwitching) {
            setShowTabWarning(true)
            if (newCount >= 4) {
              handleTestTermination()
            }
          }
          return newCount
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)

    return () => {
      // Mark component as unmounted
      componentMountedRef.current = false
      // Stop all camera streams
      cleanupWebcam()
      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [token, activeTab, test?.settings.preventTabSwitching, testTerminated, lastTabSwitchTime, cleanupWebcam])

  useEffect(() => {
    if (invitation && invitation.status === "Completed") {
      setTestCompleted(true)
      setWebcamEnabled(false) // Disable webcam when test is completed
      cleanupWebcam()
      fetchResult()
    }
  }, [invitation, cleanupWebcam])

  useEffect(() => {
    if (test) {
      // Only initialize timer once when test is first loaded
      setTimeLeft(test.duration * 60)
      // Initialize answers with unique keys - only once
      const initialAnswers: Record<string, string | string[]> = {}
      test.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const questionKey = `${section.id}-${question.id}`
          initialAnswers[questionKey] = question.type === "Multiple Choice" ? "" : ""
        })
      })
      setAnswers(initialAnswers)
    }
  }, [test?._id])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (timeLeft > 0 && activeTab === "test" && !testCompleted && !testTerminated) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && activeTab === "test" && test?.settings.autoSubmit && !testTerminated) {
      handleSubmitTest()
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [timeLeft, activeTab, testCompleted, testTerminated, test?.settings.autoSubmit, handleSubmitTest])

  // Disable webcam when test is completed or terminated
  useEffect(() => {
    if (testCompleted || testTerminated) {
      setWebcamEnabled(false)
      cleanupWebcam()
    }
  }, [testCompleted, testTerminated, cleanupWebcam])

  const handleTestTermination = () => {
    setTestTerminated(true)
    setWebcamEnabled(false)
    cleanupWebcam()
    toast.error("Test terminated due to excessive tab switching violations!")
    setTimeout(() => {
      handleSubmitTest()
    }, 2000)
  }

  const fetchInvitation = async () => {
    try {
      setIsLoading(true)
      // Check if this is a preview mode (employee testing the system)
      const isPreview =
        window.location.pathname.includes("/preview/") || window.location.search.includes("preview=true")
      setIsPreviewMode(isPreview)

      // If in preview mode, create a mock invitation
      if (isPreview) {
        const mockInvitation = {
          _id: "preview-invitation-id",
          email: "preview@oddiant.com",
          testId: token || "preview-test-id",
          testName: "Preview Test",
          companyName: "Oddiant Techlabs",
          token: token || "preview-token",
          status: "Active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        setInvitation(mockInvitation)
        await fetchTest(mockInvitation.testId)
        setIsLoading(false)
        return
      }

      // For real invitations, validate the token
      const response = await fetch(`/api/assessment/invitations/validate/${token}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        // If validation fails, try to fetch test directly using token as testId
        console.log("Invitation validation failed, trying direct test access...")
        await fetchTest(token)
        // Create a mock invitation for direct test access
        const mockInvitation = {
          _id: `direct-${token}`,
          email: "direct-access@test.com",
          testId: token,
          testName: "Direct Test Access",
          companyName: "Oddiant Techlabs",
          token: token,
          status: "Active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        setInvitation(mockInvitation)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      if (data.success) {
        setInvitation(data.invitation)
        // If invitation is valid and not completed, fetch the test
        if (data.invitation.status !== "Completed" && data.invitation.status !== "Expired") {
          await fetchTest(data.invitation.testId)
        }
      } else {
        // Fallback to direct test access
        console.log("Invitation data invalid, trying direct test access...")
        await fetchTest(token)
        const mockInvitation = {
          _id: `direct-${token}`,
          email: "direct-access@test.com",
          testId: token,
          testName: "Direct Test Access",
          companyName: "Oddiant Techlabs",
          token: token,
          status: "Active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        setInvitation(mockInvitation)
      }
    } catch (error) {
      console.error("Error validating invitation:", error)
      // Final fallback - try direct test access
      try {
        console.log("Final fallback: trying direct test access...")
        await fetchTest(token)
        const mockInvitation = {
          _id: `direct-${token}`,
          email: "direct-access@test.com",
          testId: token,
          testName: "Direct Test Access",
          companyName: "Oddiant Techlabs",
          token: token,
          status: "Active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        setInvitation(mockInvitation)
        toast.success("Test loaded successfully")
      } catch (testError) {
        console.error("Failed to load test:", testError)
        toast.error("This invitation link is invalid or has expired.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/assessment/tests/public/${testId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch test");
      }

      const data = await response.json();
      if (data.success) {
        let testData = data.test;
        // SHUFFLE IMMEDIATELY after fetch, before setTest
        if (testData.settings?.shuffleQuestions) {
          // Generate a consistent seed based on test ID and current time
          const shuffleSeed = testData._id.charCodeAt(0) + Date.now() % 10000;
          
          testData = {
            ...testData,
            sections: testData.sections.map((section: any, sectionIndex: number) => ({
              ...section,
              questions: shuffleArray([...section.questions], shuffleSeed + sectionIndex),
            })),
          };
        }
        setTest(testData);
      } else {
        throw new Error(data.message || "Failed to fetch test");
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Failed to load test. Please try again.");
    }
  };

  const fetchResult = async () => {
    try {
      if (!invitation) return

      const response = await fetch(`/api/assessment/results/by-invitation/${invitation._id}`, {
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
        setTestResult(data.result)
      } else {
        throw new Error(data.message || "Failed to fetch result")
      }
    } catch (error) {
      console.error("Error fetching result:", error)
      toast.error("Failed to load test result. Please try again.")
    }
  }

  const handleStartTest = () => {
    // Only allow starting the test if verification is complete
    if (!verificationComplete) {
      setVerificationStep("system")
      setShowSystemCheck(true)
      return
    }

    // Clear code and code submission localStorage for this test session
    try {
      const prefix = `${testSessionKey}-`;
      for (let key in localStorage) {
        if (key.startsWith('code_' + prefix) || key.startsWith('submissions_' + prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) { /* ignore */ }

    setActiveTab("test")
    setStartTime(new Date())
    // Ensure webcam is started only if enabled
    if (!webcamInitializedRef.current && webcamEnabled) {
      startWebcam()
    }
  }

  const getCurrentQuestionKey = () => {
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    if (currentQuestionData) {
      return `${test.sections[currentSection].id}-${currentQuestionData.id}`
    }
    return ""
  }

  const getCurrentAnswer = () => {
    const questionKey = getCurrentQuestionKey()
    let answer = codes[questionKey] || ""

    // For coding questions, try to load from localStorage if answer is empty
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    if (currentQuestionData?.type === "Coding" && (answer === "" || answer === null || answer === undefined)) {
      try {
        const enhancedStorageKey = `${testSessionKey}-${questionKey}`
        const stored = localStorage.getItem(`code_${enhancedStorageKey}`)
        if (stored) {
          answer = stored
          // Update the codes state with the loaded code
          setCodes((prev) => ({
            ...prev,
            [questionKey]: stored,
          }))
        }
      } catch (e) {
        console.warn("Failed to load code from localStorage:", e)
      }
    }

    return answer
  }

  const getCurrentQuestionId = () => {
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    return currentQuestionData?.id || ""
  }

  const handleNextQuestion = () => {
    const currentSectionQuestions = test?.sections[currentSection]?.questions || []
    if (currentQuestion < currentSectionQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else if (currentSection < (test?.sections.length || 0) - 1) {
      setCurrentSection(currentSection + 1)
      setCurrentQuestion(0)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      setCurrentQuestion((test?.sections[currentSection - 1].questions.length || 1) - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  const calculateProgress = () => {
    if (!test) return 0
    let totalQuestions = 0
    let answeredQuestions = 0

    test.sections.forEach((section) => {
      totalQuestions += section.questions.length
      section.questions.forEach((question) => {
        const questionKey = `${section.id}-${question.id}`
        const answer = answers[questionKey]
        if (answer && (typeof answer === "string" ? answer.trim() !== "" : answer.length > 0)) {
          answeredQuestions++
        }
      })
    })

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  // System check functions
  const enableFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setSystemChecks((prev) => ({
          ...prev,
          fullscreenMode: true,
        }))
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
      toast.error("Failed to enable fullscreen mode")
    }
  }

  // ID verification functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit")
        return
      }

      // Read file as data URL
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string
        setIdCardImage(imageDataUrl)
        // Upload to server
        await uploadImageToServer(imageDataUrl, "id_card")
        toast.success("ID Card uploaded successfully")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload ID Card")
    }
  }

  // Verification flow functions
  const completeSystemCheck = () => {
    const allChecksPass = Object.values(systemChecks).every((check) => check)
    if (allChecksPass) {
      setVerificationStep("id")
      setShowSystemCheck(false)
      setShowIdVerification(true)
    } else {
      toast.error("Please complete all system checks before proceeding")
    }
  }

  const completeIdVerification = () => {
    if (!studentId) {
      toast.error("Please enter your student ID")
      return
    }
    if (!idCardImage && !faceImage) {
      toast.error("Please capture at least your face or upload an ID card")
      return
    }

    setVerificationStep("rules")
    setShowIdVerification(false)
    setShowRules(true)
  }

  const completeRules = () => {
    if (!acceptedRules) {
      toast.error("Please accept the exam rules")
      return
    }

    setVerificationStep("complete")
    setShowRules(false)
    setVerificationComplete(true)
    // Store verification status
    localStorage.setItem(`verification_${token}`, "complete")
    // Start the test
    setActiveTab("test")
    setStartTime(new Date())
  }

  // Scientific Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (calculatorClearNext) {
      setCalculatorValue(value)
      setCalculatorClearNext(false)
      return
    }

    if (calculatorValue === "0") {
      setCalculatorValue(value)
    } else {
      setCalculatorValue(calculatorValue + value)
    }
  }

  const handleCalculatorOperation = (operation: string) => {
    setCalculatorMemory(Number.parseFloat(calculatorValue))
    setCalculatorOperation(operation)
    setCalculatorClearNext(true)
  }

  const handleCalculatorEquals = () => {
    if (calculatorOperation && calculatorMemory !== null) {
      const currentValue = Number.parseFloat(calculatorValue)
      let result = 0

      switch (calculatorOperation) {
        case "+":
          result = calculatorMemory + currentValue
          break
        case "-":
          result = calculatorMemory - currentValue
          break
        case "*":
          result = calculatorMemory * currentValue
          break
        case "/":
          result = calculatorMemory / currentValue
          break
        case "^":
          result = Math.pow(calculatorMemory, currentValue)
          break
        case "root":
          result = Math.pow(calculatorMemory, 1 / currentValue)
          break
        case "log":
          result = Math.log(currentValue) / Math.log(calculatorMemory)
          break
      }

      setCalculatorValue(result.toString())
      setCalculatorMemory(null)
      setCalculatorOperation(null)
      setCalculatorClearNext(true)
    }
  }

  const handleCalculatorClear = () => {
    setCalculatorValue("0")
    setCalculatorMemory(null)
    setCalculatorOperation(null)
  }

  const handleCalculatorFunction = (func: string) => {
    const value = Number.parseFloat(calculatorValue)
    let result = 0

    switch (func) {
      case "sin":
        if (calculatorInverseMode) {
          result = calculatorDegreeMode ? (Math.asin(value) * 180) / Math.PI : Math.asin(value)
        } else {
          result = calculatorDegreeMode ? Math.sin((value * Math.PI) / 180) : Math.sin(value)
        }
        break
      case "cos":
        if (calculatorInverseMode) {
          result = calculatorDegreeMode ? (Math.acos(value) * 180) / Math.PI : Math.acos(value)
        } else {
          result = calculatorDegreeMode ? Math.cos((value * Math.PI) / 180) : Math.cos(value)
        }
        break
      case "tan":
        if (calculatorInverseMode) {
          result = calculatorDegreeMode ? (Math.atan(value) * 180) / Math.PI : Math.atan(value)
        } else {
          result = calculatorDegreeMode ? Math.tan((value * Math.PI) / 180) : Math.tan(value)
        }
        break
      case "sqrt":
        result = Math.sqrt(value)
        break
      case "log10":
        result = Math.log10(value)
        break
      case "ln":
        result = Math.log(value)
        break
      case "exp":
        result = Math.exp(value)
        break
      case "pi":
        result = Math.PI
        break
      case "e":
        result = Math.E
        break
      case "square":
        result = value * value
        break
      case "cube":
        result = value * value * value
        break
      case "1/x":
        result = 1 / value
        break
      case "+/-":
        result = -value
        break
      case "%":
        result = value / 100
        break
      case "fact":
        if (value < 0 || !Number.isInteger(value)) {
          toast.error("Factorial only works with positive integers")
          return
        }
        result = factorial(value)
        break
    }

    setCalculatorValue(result.toString())
    setCalculatorClearNext(true)
  }

  // Helper function for factorial
  const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1
    return n * factorial(n - 1)
  }

  // Helper function to shuffle array (Fisher-Yates algorithm) with seed for consistency
  const shuffleArray = <T,>(array: T[], seed?: number): T[] => {
    const newArray = [...array]
    
    // Use a simple seeded random number generator for consistency
    let currentSeed = seed || Math.floor(Math.random() * 1000000)
    const seededRandom = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280
      return currentSeed / 233280
    }
    
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup function to prevent memory leaks
      if (webcamRetryTimeoutRef.current) {
        clearTimeout(webcamRetryTimeoutRef.current)
      }
      // Clean up shuffle localStorage when component unmounts
      if (test?._id) {
        localStorage.removeItem(`shuffled_${test._id}`)
      }
    }
  }, [test?._id])

  // Test termination check
  if (testTerminated) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-10 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-red-600 mb-2">Test Terminated</h1>
              <p className="text-muted-foreground mb-4">
                Your test has been terminated due to excessive tab switching violations ({tabSwitchCount}/4).
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Your current progress has been saved and submitted automatically.
              </p>
              <Button onClick={() => router.push("/")}>Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-9 w-64 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-32 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!invitation && !isPreviewMode) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Invalid Invitation</h1>
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-medium mb-2">This invitation link is invalid or has expired</h2>
              <p className="text-muted-foreground mb-6">
                Please contact the person who sent you this invitation for a new link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (invitation && invitation.status === "Expired" && !isPreviewMode) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Invitation Expired</h1>
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-medium mb-2">This invitation has expired</h2>
              <p className="text-muted-foreground mb-6">
                Please contact {invitation.companyName} for a new invitation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (testCompleted) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Completed</h1>
          <Card>
            <CardHeader>
              <CardTitle>{invitation?.testName || "Test"}</CardTitle>
              <CardDescription>
                Assessment completed for {invitation?.companyName || "Oddiant Techlabs"}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6 text-center">
              {testResult ? (
                <div className="space-y-6">
                  <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Test Submitted Successfully</h2>
                  <p className="text-muted-foreground">
                    Your test has been submitted and is being evaluated. Results will be declared soon.
                  </p>
                  <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto text-center">
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-1">Time Taken</h4>
                      <p className="text-2xl font-bold">{testResult.duration} min</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-6">
                    Thank you for completing this assessment. The results have been submitted to{" "}
                    {invitation?.companyName || "Oddiant Techlabs"}. You will be notified when your results are
                    declared.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p>Loading your submission status...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6">
        <Toaster position="top-center" />
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Not Found</h1>
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-medium mb-2">The requested test could not be found</h2>
              <p className="text-muted-foreground mb-6">
                Please contact {invitation?.companyName || "Oddiant Techlabs"} for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {isPreviewMode ? "Test Preview: " : ""}
            {test.name}
          </h1>
          {isPreviewMode && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVerificationStep("system")
                  setShowSystemCheck(true)
                }}
              >
                Preview System Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVerificationStep("id")
                  setShowIdVerification(true)
                }}
              >
                Preview ID Verification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVerificationStep("rules")
                  setShowRules(true)
                }}
              >
                Preview Exam Rules
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="instructions" disabled={activeTab === "test"}>
              Instructions
            </TabsTrigger>
            <TabsTrigger value="test" disabled={activeTab === "instructions"}>
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>{test.name}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Test Instructions</h3>
                  <div className="p-4 border rounded-md bg-muted">
                    {test.instructions ? (
                      <p>{test.instructions}</p>
                    ) : (
                      <p className="text-muted-foreground">No instructions provided for this test.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Duration</h4>
                    <p className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {test.duration} minutes
                    </p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Passing Score</h4>
                    <p className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      {test.passingScore}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-1">Sections</h4>
                    <p className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      {test.sections.length} sections
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Important Notes</h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Once you start the test, the timer will begin and cannot be paused.</li>
                    <li>Answer all questions to the best of your ability.</li>
                    <li>Your webcam will remain active during the test for proctoring purposes.</li>
                    {test.settings.preventTabSwitching && (
                      <li className="text-amber-600">
                        Switching tabs or leaving the test page is not allowed and will be recorded. After 4 violations,
                        your test will be automatically terminated.
                      </li>
                    )}
                    {test.settings.autoSubmit && (
                      <li>The test will be automatically submitted when the time expires.</li>
                    )}
                    {test.settings.shuffleQuestions && <li>Questions are presented in random order.</li>}
                    {test.settings.allowCalculator && (
                      <li>A scientific calculator tool is available during the test.</li>
                    )}
                    {test.settings.allowCodeEditor && (
                      <li>
                        An advanced code editor with compile and run functionality is available for coding questions.
                      </li>
                    )}
                  </ul>
                </div>

                <Separator />

                <div className="text-center">
                  <Button size="lg" onClick={handleStartTest}>
                    Start Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
              {/* Main Content Area */}
              <div className="xl:col-span-3 order-2 xl:order-1">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          Section: {test.sections[currentSection]?.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Question {currentQuestion + 1} of {test.sections[currentSection]?.questions.length || 0}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={`font-mono text-sm sm:text-base ${timeLeft < 300 ? "text-red-500" : ""}`}>
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                        {tabSwitchCount > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{tabSwitchCount}/4</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {test.sections[currentSection]?.questions[currentQuestion] ? (
                      <div className="space-y-6">
                        {/* Coding Question Layout - Enhanced with Better Heights */}
                        {test.sections[currentSection].questions[currentQuestion].type === "Coding" && (
                          <div className="space-y-6">
                            {/* Coding Question Instructions (Markdown) */}
                            {test.sections[currentSection].questions[currentQuestion].instructions && (
                              <div className="mb-4 p-3 bg-muted/50 border rounded">
                                <span className="text-sm font-medium mb-1 block">Instructions:</span>
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{test.sections[currentSection].questions[currentQuestion].instructions}</ReactMarkdown>
                              </div>
                            )}
                            {/* Problem Description - Improved Layout */}
                            <div className="w-full">
                              <Card className="bg-muted/50">
                                <CardContent className="p-4 sm:p-6">
                                  <h3 className="text-lg sm:text-xl font-medium mb-4">
                                    Problem {currentQuestion + 1}:{" "}
                                    {test.sections[currentSection].questions[currentQuestion].text}
                                  </h3>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    <div>
                                      <h4 className="font-medium text-sm mb-1">Language</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {test.sections[currentSection].questions[currentQuestion].codeLanguage}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm mb-1">Points</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {test.sections[currentSection].questions[currentQuestion].points} points
                                      </p>
                                    </div>
                                  </div>

                                  {/* Test Cases - Enhanced Display */}
                                  {test.sections[currentSection].questions[currentQuestion].testCases &&
                                    test.sections[currentSection].questions[currentQuestion].testCases!.length > 0 && (
                                      <div className="mt-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium">Test Cases:</span>
                                            <span className="inline-block px-2 py-1 rounded bg-red-600 text-white text-xs font-mono border border-red-600">
                                              {currentCodeStats.passed + currentCodeStats.failed}/
                                              {(test.sections[currentSection].questions[currentQuestion].testCases?.filter((tc: any) => !tc.isHidden)?.length ?? 0)}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-block px-2 py-1 rounded bg-green-600 text-white text-xs font-mono border border-green-600">✓ {currentCodeStats.passed}</span>
                                            <span className="inline-block px-2 py-1 rounded bg-red-600 text-white text-xs font-mono border border-red-600">✗ {currentCodeStats.failed}</span>
                                          </div>
                                        </div>
                                        <h4 className="font-medium text-sm mb-3">Example Test Cases</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {test.sections[currentSection].questions[currentQuestion]
                                            .testCases!.filter((tc: any) => !tc.isHidden)
                                            .map((testCase: any, index: number) => (
                                              <div key={index} className="p-3 bg-background rounded border">
                                                <div className="space-y-2">
                                                  <div>
                                                    <span className="font-medium text-xs">Input:</span>
                                                    <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto max-h-20">
                                                      {testCase.input || "No input"}
                                                    </pre>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium text-xs">Expected Output:</span>
                                                    <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto max-h-20">
                                                      {testCase.expectedOutput}
                                                    </pre>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            </div>

                            {/* Code Editor - Restored original responsive UI */}
                            <div className="w-full">
                              {test.settings.allowCodeEditor ? (
                                <div className="border rounded-lg overflow-hidden">
                                  <AdvancedCodeEditor
                                    key={`${currentSection}-${currentQuestion}-${getCurrentQuestionKey()}`}
                                    value={codes[getCurrentQuestionKey()] || ""}
                                    onChange={(value) => {
                                      if (value !== codes[getCurrentQuestionKey()]) {
                                        handleAnswer(getCurrentQuestionKey(), value)
                                      }
                                    }}
                                    language={test.sections[currentSection].questions[currentQuestion].codeLanguage || "javascript"}
                                    showConsole={true}
                                    testCases={test.sections[currentSection].questions[currentQuestion].testCases || []}
                                    className="w-full"
                                    questionId={getCurrentQuestionId()}
                                    onTestCaseResults={handleCodeSubmissions}
                                    initialTestCaseResults={(() => {
                                      const currentQuestionData = test.sections[currentSection].questions[currentQuestion]
                                      const questionKey = `${test.sections[currentSection].id}-${currentQuestionData.id}`
                                      return questionCodeSubmissions[questionKey] || []
                                    })()}
                                    template={test.sections[currentSection].questions[currentQuestion].codeTemplate || ""}
                                  />
                                </div>
                              ) : (
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Code Editor</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <textarea
                                      rows={20}
                                      placeholder="// Write your code here"
                                      className="w-full p-3 font-mono text-sm bg-slate-900 text-slate-100 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                      value={codes[getCurrentQuestionKey()] || ""}
                                      onChange={(e) => {
                                        if (e.target.value !== codes[getCurrentQuestionKey()]) {
                                          handleAnswer(getCurrentQuestionKey(), e.target.value)
                                        }
                                      }}
                                    />
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Regular Questions - Improved Layout */}
                        {test.sections[currentSection].questions[currentQuestion].type !== "Coding" && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg sm:text-xl font-medium mb-4">
                                {currentQuestion + 1}. {test.sections[currentSection].questions[currentQuestion].text}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6">
                                {test.sections[currentSection].questions[currentQuestion].points} points
                              </p>

                              {test.sections[currentSection].questions[currentQuestion].type === "Multiple Choice" && (
                                <div className="space-y-3">
                                  {test.sections[currentSection].questions[currentQuestion].options
                                    ?.filter((option) => option.trim() !== "")
                                    .map((option, index) => (
                                      <div
                                        key={index}
                                        className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                                      >
                                        <input
                                          type="radio"
                                          id={`option-${index}`}
                                          name={`question-${getCurrentQuestionKey()}`}
                                          value={option}
                                          checked={getCurrentAnswer() === option}
                                          onChange={() => handleAnswer(getCurrentQuestionKey(), option)}
                                          className="h-4 w-4 mt-0.5 text-primary focus:ring-primary border-input"
                                        />
                                        <label
                                          htmlFor={`option-${index}`}
                                          className="text-sm font-medium flex-1 cursor-pointer"
                                        >
                                          {option}
                                        </label>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {test.sections[currentSection].questions[currentQuestion].type === "Written Answer" && (
                                <div className="space-y-2">
                                  <textarea
                                    rows={window.innerWidth >= 768 ? 8 : 6}
                                    placeholder="Type your answer here..."
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    value={(getCurrentAnswer() as string) || ""}
                                    onChange={(e) => {
                                      const words = e.target.value
                                        .trim()
                                        .split(/\s+/)
                                        .filter((word) => word.length > 0)
                                      const maxWords =
                                        test.sections[currentSection].questions[currentQuestion].maxWords || 500
                                      if (words.length <= maxWords) {
                                        handleAnswer(getCurrentQuestionKey(), e.target.value)
                                      } else {
                                        toast.error(`Maximum ${maxWords} words allowed`)
                                      }
                                    }}
                                  />
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>
                                      Words:{" "}
                                      {
                                        ((getCurrentAnswer() as string) || "")
                                          .trim()
                                          .split(/\s+/)
                                          .filter((word) => word.length > 0).length
                                      }{" "}
                                      / {test.sections[currentSection].questions[currentQuestion].maxWords || 500}
                                    </span>
                                    <span>
                                      Max: {test.sections[currentSection].questions[currentQuestion].maxWords || 500}{" "}
                                      words
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                          <Button
                            variant="outline"
                            onClick={handlePrevQuestion}
                            disabled={currentSection === 0 && currentQuestion === 0}
                            className="w-full sm:w-auto bg-transparent"
                          >
                            Previous Question
                          </Button>
                          <Button
                            onClick={handleNextQuestion}
                            disabled={
                              currentSection === test.sections.length - 1 &&
                              currentQuestion === test.sections[currentSection].questions.length - 1
                            }
                            className="w-full sm:w-auto"
                          >
                            Next Question
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Questions Found</h3>
                        <p className="text-muted-foreground">This section doesn't have any questions yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Sidebar with Better Webcam Management */}
              <div className="xl:col-span-1 order-1 xl:order-2">
                <div className="sticky top-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2 text-sm">
                          <span>Completion</span>
                          <span className="font-medium">{calculateProgress()}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2" />
                      </div>

                      {/* Question Navigator */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Question Navigator</h4>
                        <div className="max-h-40 overflow-y-auto">
                          {test.sections.map((section, sIndex) => (
                            <div key={section.id} className="space-y-2 mb-3">
                              <h5 className="text-xs font-medium text-muted-foreground truncate">{section.title}</h5>
                              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1">
                                {section.questions.map((question, qIndex) => {
                                  const questionKey = `${section.id}-${question.id}`
                                  const isAnswered =
                                    answers[questionKey] &&
                                    (typeof answers[questionKey] === "string"
                                      ? (answers[questionKey] as string).trim() !== ""
                                      : (answers[questionKey] as string[]).length > 0)
                                  return (
                                    <button
                                      key={question.id}
                                      onClick={() => {
                                        setCurrentSection(sIndex)
                                        setCurrentQuestion(qIndex)
                                      }}
                                      className={`w-8 h-8 text-xs flex items-center justify-center rounded-md transition-colors ${
                                        currentSection === sIndex && currentQuestion === qIndex
                                          ? "bg-primary text-primary-foreground"
                                          : isAnswered
                                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                                            : "bg-muted hover:bg-muted/80"
                                      }`}
                                    >
                                      {qIndex + 1}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Webcam Monitoring - Only show if webcam is enabled */}
                      {webcamEnabled && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Webcam Monitoring</h4>
                          <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                              style={{ transform: "scaleX(-1)" }}
                            />
                            {/* Webcam Status Overlay */}
                            {webcamStatus !== "active" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-2">
                                <div className="space-y-2">
                                  {webcamStatus === "error" && webcamError ? (
                                    <>
                                      <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                                      <p className="text-xs">{webcamError}</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startWebcam}
                                        className="bg-white text-black hover:bg-gray-200 text-xs px-2 py-1"
                                      >
                                        Retry ({webcamRetryCount}/3)
                                      </Button>
                                    </>
                                  ) : webcamStatus === "requesting" ? (
                                    <>
                                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mx-auto"></div>
                                      <p className="text-xs">Starting webcam...</p>
                                    </>
                                  ) : (
                                    <>
                                      <Camera className="h-6 w-6 text-gray-400 mx-auto" />
                                      <p className="text-xs">Webcam inactive</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startWebcam}
                                        className="bg-white text-black hover:bg-gray-200 text-xs px-2 py-1"
                                      >
                                        Start Camera
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Webcam Status Indicator */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Status:{" "}
                              {webcamStatus === "active"
                                ? "Active"
                                : webcamStatus === "requesting"
                                  ? "Starting..."
                                  : webcamStatus === "error"
                                    ? "Error"
                                    : "Inactive"}
                            </p>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                webcamStatus === "active"
                                  ? "bg-green-500"
                                  : webcamStatus === ("requesting" as any)
                                    ? "bg-yellow-500 animate-pulse"
                                    : webcamStatus === "error"
                                      ? "bg-red-500"
                                      : "bg-gray-500"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Calculator */}
                      {test.settings.allowCalculator && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Calculator</h4>
                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => setShowCalculator(true)}
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Scientific Calculator
                          </Button>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="pt-4 border-t">
                        {/* FIXED: Updated validation warning for coding questions */}
                        {test.sections.some((section) =>
                          section.questions.some((q) => {
                            if (q.type === "Coding") {
                              const questionKey = `${section.id}-${q.id}`
                              const userCode = answers[questionKey] as string
                              const hasCode =
                                userCode && userCode.trim() !== "" && userCode.trim() !== q.codeTemplate?.trim()
                              const storedSubmissions =
                                questionCodeSubmissions[questionKey] || questionCodeSubmissions[q.id]
                              return hasCode && (!storedSubmissions || storedSubmissions.length === 0)
                            }
                            return false
                          }),
                        ) && (
                          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-xs text-amber-700">
                              ⚠️ Please run your code for all coding questions before submitting
                            </p>
                          </div>
                        )}
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={handleSubmitTest}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Submitting...
                            </>
                          ) : (
                            "Submit Test"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          You won't be able to change answers after submission.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* All existing dialogs remain the same but with enhanced styling */}
        {/* System Check Dialog */}
        <Dialog open={showSystemCheck} onOpenChange={setShowSystemCheck}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>System Check</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-Exam Verification</CardTitle>
                  <CardDescription>Complete system check and ID verification before starting the exam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                    <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">System Check</div>
                    <div className="w-1/3 text-center text-muted-foreground p-2">ID Verification</div>
                    <div className="w-1/3 text-center text-muted-foreground p-2">Exam Rules</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="w-full">
                      <Progress value={75} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">System check progress: 75%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                      <video
                        ref={systemCheckVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {webcamStatus !== "active" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                          <div className="flex flex-col items-center">
                            {webcamStatus === "requesting" ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                                <p>Starting camera...</p>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                                <p>{webcamError || "Camera access needed"}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={startWebcam}
                                  className="mt-2 bg-white text-black hover:bg-gray-200"
                                  disabled={webcamStatus === ("requesting" as any)}
                                >
                                  {webcamStatus === ("requesting" as any) ? "Starting..." : "Try Again"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          {systemChecks.cameraAccess ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>Camera Access</span>
                        </div>
                        {!systemChecks.cameraAccess && (
                          <Button size="sm" onClick={startWebcam} disabled={webcamStatus === "requesting"}>
                            {webcamStatus === "requesting" ? "Starting..." : "Allow"}
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          {systemChecks.fullscreenMode ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                          )}
                          <span>Fullscreen Mode</span>
                        </div>
                        {!systemChecks.fullscreenMode && (
                          <Button size="sm" onClick={enableFullscreen}>
                            Enable
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          {systemChecks.compatibleBrowser ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>Compatible Browser</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          {systemChecks.tabFocus ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>Tab Focus</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowSystemCheck(false)}>
                      Close Preview
                    </Button>
                    <Button onClick={completeSystemCheck}>Next: ID Verification</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* ID Verification Dialog */}
        <Dialog open={showIdVerification} onOpenChange={setShowIdVerification}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ID Verification</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-Exam Verification</CardTitle>
                  <CardDescription>Complete system check and ID verification before starting the exam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                    <div className="w-1/3 text-center text-muted-foreground p-2">System Check</div>
                    <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">ID Verification</div>
                    <div className="w-1/3 text-center text-muted-foreground p-2">Exam Rules</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-id">Student ID Number</Label>
                        <Input
                          id="student-id"
                          placeholder="Enter your student ID"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Upload ID Card</Label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                        {idCardImage ? (
                          <div className="relative border rounded-md overflow-hidden">
                            <img
                              src={idCardImage || "/placeholder.svg"}
                              alt="ID Card"
                              className="w-full h-auto max-h-[200px] object-contain"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 rounded-full"
                              onClick={() => setIdCardImage(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-2 mb-4">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Upload or capture your ID card</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                Upload
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openCameraModal(false)}>
                                <Camera className="h-4 w-4 mr-2" />
                                Capture
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Capture Your Face</Label>
                        {faceImage ? (
                          <div className="relative border rounded-md overflow-hidden">
                            <img
                              src={faceImage || "/placeholder.svg"}
                              alt="Face"
                              className="w-full h-auto max-h-[200px] object-contain"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 rounded-full"
                              onClick={() => setFaceImage(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-2 mb-4">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Capture your face using webcam</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openCameraModal(true)}>
                              <Camera className="h-4 w-4 mr-2" />
                              Capture Face
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowIdVerification(false)
                        setShowSystemCheck(true)
                      }}
                    >
                      Back
                    </Button>
                    <Button onClick={completeIdVerification}>Next: Exam Rules</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exam Rules Dialog */}
        <Dialog open={showRules} onOpenChange={setShowRules}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exam Rules</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-Exam Verification</CardTitle>
                  <CardDescription>Complete system check and ID verification before starting the exam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                    <div className="w-1/3 text-center text-muted-foreground p-2">System Check</div>
                    <div className="w-1/3 text-center text-muted-foreground p-2">ID Verification</div>
                    <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">Exam Rules</div>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h2 className="text-xl font-bold mb-2">{test.name}</h2>
                    <p className="text-muted-foreground">{test.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        <span>Passing score: {test.passingScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        <span>{test.sections?.length || 0} sections</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Exam Rules</h3>
                    <div className="space-y-2 p-4 border rounded-md">
                      <p className="font-medium">During this exam:</p>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>You must remain on the exam tab at all times</li>
                        <li>Your webcam must remain on throughout the exam</li>
                        <li>No other applications should be open on your device</li>
                        <li>No communication with others is allowed</li>
                        <li>You cannot copy or distribute exam content</li>
                        {test.settings?.preventTabSwitching && (
                          <li className="text-amber-600">Tab switching is not allowed and will be recorded</li>
                        )}
                        {test.settings?.autoSubmit && (
                          <li className="text-amber-600">The exam will be automatically submitted when time expires</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Test Instructions</h4>
                      <div className="text-muted-foreground">
                        {test.instructions ? (
                          <p>{test.instructions}</p>
                        ) : (
                          <p>No specific instructions provided for this test.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="accept-rules"
                        checked={acceptedRules}
                        onCheckedChange={(checked) => setAcceptedRules(checked === true)}
                      />
                      <Label htmlFor="accept-rules" className="text-sm">
                        I have read and agree to follow all exam rules and instructions
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRules(false)
                        setShowIdVerification(true)
                      }}
                    >
                      Back
                    </Button>
                    <Button onClick={completeRules} disabled={!acceptedRules}>
                      Start Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Camera Modal for Capturing Images */}
        <CameraModal
          isOpen={showCameraModal}
          onClose={() => {
            setShowCameraModal(false)
            if (modalStreamRef.current) {
              modalStreamRef.current.getTracks().forEach((track) => track.stop())
              modalStreamRef.current = null
            }
          }}
          onCapture={captureImage}
          isCapturingFace={isCapturingFace}
          videoRef={modalVideoRef}
          isUploading={false}
        />

        {/* Tab Switching Warning Dialog */}
        <Dialog open={showTabWarning} onOpenChange={setShowTabWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Warning: Tab Switching Detected</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>You have switched tabs or left the test window. This activity is recorded and may affect your test.</p>
              <p className="mt-2 font-medium">Tab switches detected: {tabSwitchCount}/4</p>
              {tabSwitchCount >= 3 && (
                <p className="mt-2 text-red-600 font-medium">
                  Warning: One more violation will result in automatic test termination!
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowTabWarning(false)}>Continue Test</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scientific Calculator Dialog */}
        {test?.settings.allowCalculator && (
          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogContent className="sm:max-w-[350px]">
              <DialogHeader>
                <DialogTitle>Scientific Calculator</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="border rounded-md p-2 mb-4 text-right font-mono text-xl h-12 flex items-center justify-end overflow-x-auto">
                  {calculatorValue}
                </div>

                <div className="flex justify-between mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalculatorDegreeMode(!calculatorDegreeMode)}
                    className={calculatorDegreeMode ? "bg-primary/20" : ""}
                  >
                    {calculatorDegreeMode ? "DEG" : "RAD"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalculatorInverseMode(!calculatorInverseMode)}
                    className={calculatorInverseMode ? "bg-primary/20" : ""}
                  >
                    INV
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-1 mb-2">
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("sin")}>
                    {calculatorInverseMode ? "sin⁻¹" : "sin"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("cos")}>
                    {calculatorInverseMode ? "cos⁻¹" : "cos"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("tan")}>
                    {calculatorInverseMode ? "tan⁻¹" : "tan"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("log10")}>
                    log
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("ln")}>
                    ln
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-1 mb-2">
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("pi")}>
                    π
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("e")}>
                    e
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("square")}>
                    x²
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("cube")}>
                    x³
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorOperation("^")}>
                    x^y
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-1 mb-2">
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("sqrt")}>
                    √x
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorOperation("root")}>
                    ʸ√x
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("1/x")}>
                    1/x
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("fact")}>
                    n!
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCalculatorFunction("+/-")}>
                    +/-
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  <Button variant="outline" onClick={handleCalculatorClear}>
                    C
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorFunction("%")}>
                    %
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorFunction("exp")}>
                    EXP
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorOperation("/")}>
                    ÷
                  </Button>

                  <Button variant="outline" onClick={() => handleCalculatorInput("7")}>
                    7
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("8")}>
                    8
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("9")}>
                    9
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorOperation("*")}>
                    ×
                  </Button>

                  <Button variant="outline" onClick={() => handleCalculatorInput("4")}>
                    4
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("5")}>
                    5
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("6")}>
                    6
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorOperation("-")}>
                    -
                  </Button>

                  <Button variant="outline" onClick={() => handleCalculatorInput("1")}>
                    1
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("2")}>
                    2
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput("3")}>
                    3
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorOperation("+")}>
                    +
                  </Button>

                  <Button variant="outline" onClick={() => handleCalculatorInput("0")}>
                    0
                  </Button>
                  <Button variant="outline" onClick={() => handleCalculatorInput(".")}>
                    .
                  </Button>
                  <Button variant="outline" onClick={handleCalculatorEquals}>
                    =
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
