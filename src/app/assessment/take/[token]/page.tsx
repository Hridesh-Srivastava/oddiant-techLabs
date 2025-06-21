"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
}

export default function TakeTestPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

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

  // Refs for visibility tracking
  const visibilityRef = useRef(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const webcamInitializedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
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
      // Stop camera if active
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [token, activeTab, test?.settings.preventTabSwitching, testTerminated, lastTabSwitchTime])

  useEffect(() => {
    if (invitation && invitation.status === "Completed") {
      setTestCompleted(true)
      fetchResult()
    }
  }, [invitation])

  useEffect(() => {
    if (test) {
      // Initialize timer
      setTimeLeft(test.duration * 60)

      // Shuffle questions if enabled
      if (test.settings.shuffleQuestions) {
        const shuffledTest = {
          ...test,
          sections: test.sections.map((section) => ({
            ...section,
            questions: shuffleArray([...section.questions]),
          })),
        }
        setTest(shuffledTest)
      }

      // Initialize answers with unique keys
      const initialAnswers: Record<string, string | string[]> = {}
      test.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const questionKey = `${section.id}-${question.id}`
          initialAnswers[questionKey] = question.type === "Multiple Choice" ? "" : ""
        })
      })
      setAnswers(initialAnswers)

      // Start webcam monitoring if not already started and verification is complete
      if (!webcamInitializedRef.current && verificationComplete) {
        startWebcam()
      }
    }
  }, [test, verificationComplete])

  useEffect(() => {
    if (timeLeft > 0 && activeTab === "test" && !testCompleted && !testTerminated) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      // Auto submit when time expires if enabled
      if (timeLeft === 1 && test?.settings.autoSubmit) {
        handleSubmitTest()
      }

      return () => clearTimeout(timer)
    }
  }, [timeLeft, activeTab, testCompleted, test?.settings.autoSubmit, testTerminated])

  const handleTestTermination = () => {
    setTestTerminated(true)
    toast.error("Test terminated due to excessive tab switching violations!")
    setTimeout(() => {
      handleSubmitTest()
    }, 2000)
  }

  const startWebcam = async () => {
    try {
      if (!videoRef.current) return

      // Stop any existing stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        mediaStreamRef.current = stream

        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err)
              toast.error("Failed to start webcam. Please check your camera permissions.")
            })
          }
        }

        webcamInitializedRef.current = true

        // Update system checks if in system check mode
        if (showSystemCheck) {
          setSystemChecks((prev) => ({
            ...prev,
            cameraAccess: true,
          }))
        }
      }
    } catch (error) {
      console.error("Error starting webcam:", error)
      toast.error("Failed to access webcam. Please ensure camera permissions are granted.")

      // Update system checks if in system check mode
      if (showSystemCheck) {
        setSystemChecks((prev) => ({
          ...prev,
          cameraAccess: false,
        }))
      }
    }
  }

  const fetchInvitation = async () => {
    try {
      setIsLoading(true)

      // If in preview mode, create a mock invitation
      if (isPreviewMode) {
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

      const response = await fetch(`/api/assessment/invitations/validate/${token}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to validate invitation")
      }

      const data = await response.json()

      if (data.success) {
        setInvitation(data.invitation)

        // If invitation is valid and not completed, fetch the test
        if (data.invitation.status !== "Completed" && data.invitation.status !== "Expired") {
          await fetchTest(data.invitation.testId)
        }
      } else {
        throw new Error(data.message || "Invalid or expired invitation")
      }
    } catch (error) {
      console.error("Error validating invitation:", error)
      toast.error("This invitation link is invalid or has expired.")
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
      })

      if (!response.ok) {
        throw new Error("Failed to fetch test")
      }

      const data = await response.json()

      if (data.success) {
        setTest(data.test)
      } else {
        throw new Error(data.message || "Failed to fetch test")
      }
    } catch (error) {
      console.error("Error fetching test:", error)
      toast.error("Failed to load test. Please try again.")
    }
  }

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

    setActiveTab("test")
    setStartTime(new Date())

    // Ensure webcam is started
    if (!webcamInitializedRef.current) {
      startWebcam()
    }
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    // Use the current section and question to create a unique key
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    if (currentQuestionData) {
      const questionKey = `${test.sections[currentSection].id}-${currentQuestionData.id}`
      setAnswers((prev) => ({
        ...prev,
        [questionKey]: answer,
      }))
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
    return answers[questionKey] || ""
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

  const handleSubmitTest = async () => {
    try {
      if (!test || !invitation) return

      setIsSubmitting(true)

      // Calculate test duration in minutes
      const endTime = new Date()
      const durationInMinutes = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0

      // Calculate score
      let totalPoints = 0
      let earnedPoints = 0
      const answersWithDetails: any[] = []

      test.sections.forEach((section) => {
        section.questions.forEach((question) => {
          totalPoints += question.points
          const questionKey = `${section.id}-${question.id}`
          const userAnswer = answers[questionKey]
          let isCorrect = false

          if (question.type === "Multiple Choice" && userAnswer === question.correctAnswer) {
            isCorrect = true
            earnedPoints += question.points
          }

          answersWithDetails.push({
            questionId: question.id,
            answer: userAnswer,
            isCorrect,
            points: isCorrect ? question.points : 0,
          })
        })
      })

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
    } finally {
      setIsSubmitting(false)
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
  const openCameraModal = (forFace: boolean) => {
    setIsCapturingFace(forFace)
    setShowCameraModal(true)

    // Small delay to ensure the modal is rendered before starting webcam
    setTimeout(() => {
      startWebcam()
    }, 500)
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !mediaStreamRef.current) {
      toast.error("Camera not initialized properly")
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        toast.error("Could not get canvas context")
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

      // Stop camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Upload to server
      await uploadImageToServer(imageDataUrl, isCapturingFace ? "face" : "id_card")

      toast.success(`${isCapturingFace ? "Face" : "ID Card"} captured successfully`)
    } catch (error) {
      console.error("Error capturing image:", error)
      toast.error("Failed to capture image")
    }
  }

  const uploadImageToServer = async (imageDataUrl: string, type: "face" | "id_card") => {
    if (!token) return

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

      // Upload to server
      const endpoint = isPreviewMode
        ? "/api/assessment/preview-verification/upload"
        : "/api/assessment/verification/upload"

      const uploadResponse = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error("Upload error response:", errorData)
        throw new Error(errorData.message || "Failed to upload image")
      }

      const data = await uploadResponse.json()

      if (!data.success) {
        throw new Error(data.message || "Upload failed")
      }

      return data.imageUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

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
    if (!studentId || !idCardImage || !faceImage) {
      toast.error("Please complete all ID verification steps")
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

  // Helper function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

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
    <div className="container mx-auto py-6">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {isPreviewMode ? "Test Preview: " : ""}
          {test.name}
        </h1>

        {isPreviewMode && (
          <div className="mb-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setVerificationStep("system")
                setShowSystemCheck(true)
              }}
            >
              Preview System Check
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setVerificationStep("id")
                setShowIdVerification(true)
              }}
            >
              Preview ID Verification
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setVerificationStep("rules")
                setShowRules(true)
              }}
            >
              Preview Exam Rules
            </Button>
          </div>
        )}

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

          <TabsContent value="test">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Section: {test.sections[currentSection]?.title}</CardTitle>
                        <CardDescription>
                          Question {currentQuestion + 1} of {test.sections[currentSection]?.questions.length || 0}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-mono ${timeLeft < 300 ? "text-red-500" : ""}`}>
                          {formatTime(timeLeft)}
                        </span>
                        {tabSwitchCount > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{tabSwitchCount}/4</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {test.sections[currentSection]?.questions[currentQuestion] ? (
                      <div className="space-y-6">
                        {/* Coding Question Layout */}
                        {test.sections[currentSection].questions[currentQuestion].type === "Coding" && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Problem Description Panel */}
                            <div className="space-y-4">
                              <div className="p-4 border rounded-lg bg-muted/50">
                                <h3 className="text-lg font-medium mb-4">
                                  Problem {currentQuestion + 1}:{" "}
                                  {test.sections[currentSection].questions[currentQuestion].text}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm">Description</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Solve the given problem using{" "}
                                      {test.sections[currentSection].questions[currentQuestion].codeLanguage}.
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-sm">Points</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {test.sections[currentSection].questions[currentQuestion].points} points
                                    </p>
                                  </div>

                                  {test.sections[currentSection].questions[currentQuestion].testCases &&
                                    test.sections[currentSection].questions[currentQuestion].testCases!.length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-2">Example Test Cases</h4>
                                        <div className="space-y-2">
                                          {test.sections[currentSection].questions[currentQuestion]
                                            .testCases!.filter((tc: any) => !tc.isHidden)
                                            .slice(0, 2)
                                            .map((testCase: any, index: number) => (
                                              <div key={index} className="p-2 bg-background rounded border text-xs">
                                                <div className="grid grid-cols-2 gap-2">
                                                  <div>
                                                    <span className="font-medium">Input:</span>
                                                    <pre className="mt-1 text-muted-foreground">
                                                      {testCase.input || "No input"}
                                                    </pre>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium">Output:</span>
                                                    <pre className="mt-1 text-muted-foreground">
                                                      {testCase.expectedOutput}
                                                    </pre>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  <div>
                                    <h4 className="font-medium text-sm">Constraints</h4>
                                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                      <li>• Time limit: 5 seconds</li>
                                      <li>• Memory limit: 512 MB</li>
                                      <li>• Use standard input/output</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Code Editor Panel */}
                            <div className="space-y-4">
                              {test.settings.allowCodeEditor ? (
                                <div className="h-[600px] overflow-hidden">
                                  <AdvancedCodeEditor
                                    value={
                                      (getCurrentAnswer() as string) ||
                                      test.sections[currentSection].questions[currentQuestion].codeTemplate ||
                                      ""
                                    }
                                    onChange={(value) => handleAnswer(getCurrentQuestionKey(), value)}
                                    language={
                                      test.sections[currentSection].questions[currentQuestion].codeLanguage ||
                                      "javascript"
                                    }
                                    height="100%"
                                    showConsole={true}
                                    testCases={test.sections[currentSection].questions[currentQuestion].testCases || []}
                                  />
                                </div>
                              ) : (
                                <div className="border rounded-md overflow-hidden">
                                  <div className="bg-muted p-2 border-b">
                                    <span className="text-sm font-medium">Code Editor</span>
                                  </div>
                                  <textarea
                                    rows={20}
                                    placeholder="// Write your code here"
                                    className="w-full p-2 font-mono text-sm bg-black text-white resize-none"
                                    value={
                                      (getCurrentAnswer() as string) ||
                                      test.sections[currentSection].questions[currentQuestion].codeTemplate ||
                                      ""
                                    }
                                    onChange={(e) => handleAnswer(getCurrentQuestionKey(), e.target.value)}
                                  ></textarea>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Regular Question Layout for Non-Coding Questions */}
                        {test.sections[currentSection].questions[currentQuestion].type !== "Coding" && (
                          <div>
                            <h3 className="text-lg font-medium mb-4">
                              {currentQuestion + 1}. {test.sections[currentSection].questions[currentQuestion].text}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {test.sections[currentSection].questions[currentQuestion].points} points
                            </p>

                            {test.sections[currentSection].questions[currentQuestion].type === "Multiple Choice" && (
                              <div className="space-y-3">
                                {test.sections[currentSection].questions[currentQuestion].options
                                  ?.filter((option) => option.trim() !== "")
                                  .map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`option-${index}`}
                                        name={`question-${getCurrentQuestionKey()}`}
                                        value={option}
                                        checked={getCurrentAnswer() === option}
                                        onChange={() => handleAnswer(getCurrentQuestionKey(), option)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-input"
                                      />
                                      <label htmlFor={`option-${index}`} className="text-sm font-medium">
                                        {option}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {test.sections[currentSection].questions[currentQuestion].type === "Written Answer" && (
                              <textarea
                                rows={5}
                                placeholder="Type your answer here..."
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                value={(getCurrentAnswer() as string) || ""}
                                onChange={(e) => handleAnswer(getCurrentQuestionKey(), e.target.value)}
                              ></textarea>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={handlePrevQuestion}
                            disabled={currentSection === 0 && currentQuestion === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={handleNextQuestion}
                            disabled={
                              currentSection === test.sections.length - 1 &&
                              currentQuestion === test.sections[currentSection].questions.length - 1
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Questions Found</h3>
                        <p className="text-muted-foreground mb-4">
                          This section doesn't have any questions yet. Add questions in the test editor.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Completion</span>
                          <span>{calculateProgress()}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Question Navigator</h4>
                        {test.sections.map((section, sIndex) => (
                          <div key={section.id} className="space-y-1">
                            <h5 className="text-xs font-medium text-muted-foreground">{section.title}</h5>
                            <div className="flex flex-wrap gap-1">
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
                                    className={`w-6 h-6 text-xs flex items-center justify-center rounded-sm ${
                                      currentSection === sIndex && currentQuestion === qIndex
                                        ? "bg-primary text-primary-foreground"
                                        : isAnswered
                                          ? "bg-green-100 text-green-800"
                                          : "bg-muted"
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

                      {/* Webcam monitoring */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Webcam Monitoring</h4>
                        <div className="aspect-video bg-black rounded-md overflow-hidden">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your webcam is active for proctoring purposes
                        </p>
                        {!webcamInitializedRef.current && (
                          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={startWebcam}>
                            Start Webcam
                          </Button>
                        )}
                      </div>

                      {test.settings.allowCalculator && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Calculator</h4>
                          <Button variant="outline" className="w-full" onClick={() => setShowCalculator(true)}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Open Scientific Calculator
                          </Button>
                        </div>
                      )}

                      <div className="pt-6">
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={handleSubmitTest}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span> Submitting...
                            </>
                          ) : (
                            "Submit Test"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          You won&apos;t be able to change your answers after submission.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* System Check Dialog */}
        <Dialog open={showSystemCheck} onOpenChange={setShowSystemCheck}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>System Check</DialogTitle>
            </DialogHeader>
            <div className="py-4 max-h-[80vh] overflow-y-auto">
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
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {!systemChecks.cameraAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                            <p>Camera access denied</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={startWebcam}
                              className="mt-2 bg-white text-black hover:bg-gray-200"
                            >
                              Try Again
                            </Button>
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
                          <Button size="sm" onClick={startWebcam}>
                            Allow
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

                  <div className="flex justify-between pt-4">
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>ID Verification</DialogTitle>
            </DialogHeader>
            <div className="py-4 max-h-[80vh] overflow-y-auto">
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

                  <div className="flex justify-between pt-4">
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Exam Rules</DialogTitle>
            </DialogHeader>
            <div className="py-4 max-h-[80vh] overflow-y-auto">
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

                  <div className="flex justify-between pt-4">
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
        <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isCapturingFace ? "Capture Your Face" : "Capture ID Card"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {isCapturingFace && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-white rounded-full w-48 h-48 opacity-50"></div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCameraModal(false)
                    if (mediaStreamRef.current) {
                      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={captureImage}>Capture</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  <Button variant="outline" onClick={() => handleCalculatorOperation("log")}>
                    logₓy
                  </Button>
                  <Button variant="outline" onClick={handleCalculatorEquals}>
                    =
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  )
}
