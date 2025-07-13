"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Calculator, X, Upload, Camera, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AdvancedCodeEditor } from "@/components/advanced-code-editor"
import { useCameraManager } from "@/hooks/useCameraManager"
import { CameraVideo } from "@/components/camera-video"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"

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
  instructions?: string
}

interface StepCompletion {
  systemCheck: boolean
  idVerification: boolean
  examRules: boolean
  instructions: boolean
}

// Add MCQ answer normalization helper (from take page)
function isMCQAnswerCorrect(userAnswer: any, correctAnswer: any, options?: string[]) {
  const normalize = (val: any) =>
    typeof val === 'string' ? val.trim().toLowerCase() : Array.isArray(val) ? val.map(v => String(v).trim().toLowerCase()).sort() : String(val).trim().toLowerCase();
  const ua = normalize(userAnswer);
  const ca = normalize(correctAnswer);
  if (Array.isArray(ua) && Array.isArray(ca)) {
    return JSON.stringify(ua) === JSON.stringify(ca);
  }
  if (ua === ca) return true;
  if (options && typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    const userIdx = options.findIndex(opt => normalize(opt) === ua);
    const correctIdx = options.findIndex(opt => normalize(opt) === ca);
    if (userIdx !== -1 && userIdx === correctIdx) return true;
  }
  return false;
}

export default function TestPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  // SINGLE CAMERA MANAGER - NO MORE CONFLICTS!
  const cameraManager = useCameraManager()

  // Core state
  const [isLoading, setIsLoading] = useState(true)
  const [test, setTest] = useState<TestData | null>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [activeTab, setActiveTab] = useState("instructions")

  // Step completion tracking
  const [stepCompletion, setStepCompletion] = useState<StepCompletion>({
    systemCheck: false,
    idVerification: false,
    examRules: false,
    instructions: false,
  })

  // Dialog states
  const [showSystemCheck, setShowSystemCheck] = useState(false)
  const [showIdVerification, setShowIdVerification] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)

  // System check states
  const [systemChecks, setSystemChecks] = useState({
    cameraAccess: false,
    fullscreenMode: false,
    compatibleBrowser: true,
    tabFocus: true,
  })

  // ID verification states
  const [idCardImage, setIdCardImage] = useState<string | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [studentId, setStudentId] = useState("")
  const [isCapturingFace, setIsCapturingFace] = useState(false)

  // Add this state to store coding test case results for each question
  const [codingResults, setCodingResults] = useState<Record<string, any[]>>({});

  // Add state to track if test cases have been run for each coding question
  const [hasRunTestCases, setHasRunTestCases] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add state for submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent infinite loop in instructions auto-complete effect
  const hasCompletedInstructions = useRef(false);

  // Update system checks when camera status changes
  useEffect(() => {
    setSystemChecks((prev) => {
      const newCameraAccess = cameraManager.status === "active";
      if (prev.cameraAccess === newCameraAccess) return prev;
      return {
        ...prev,
        cameraAccess: newCameraAccess,
      };
    });
  }, [cameraManager.status]);

  // Start camera when dialogs open - ONLY ONCE!
  useEffect(() => {
    if (showSystemCheck && cameraManager.status === "inactive") {
      console.log("📹 System check opened - starting camera")
      cameraManager.startCamera()
    }
  }, [showSystemCheck]) // Remove cameraManager from deps to prevent loops

  useEffect(() => {
    if (showCameraModal && cameraManager.status === "inactive") {
      console.log("📹 Camera modal opened - starting camera")
      cameraManager.startCamera()
    }
  }, [showCameraModal]) // Remove cameraManager from deps to prevent loops

  useEffect(() => {
    if (activeTab === "test" && cameraManager.status === "inactive") {
      console.log("📹 Test tab active - starting camera")
      cameraManager.startCamera()
    }
  }, [activeTab]) // Remove cameraManager from deps to prevent loops

  // Test monitoring states
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [testTerminated, setTestTerminated] = useState(false)
  const [permissionDialogActive, setPermissionDialogActive] = useState(false)
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0)

  // Calculator states
  const [calculatorDisplay, setCalculatorDisplay] = useState("0")
  const [calculatorMemory, setCalculatorMemory] = useState<number | null>(null)
  const [calculatorOperation, setCalculatorOperation] = useState<string | null>(null)
  const [calculatorWaitingForOperand, setCalculatorWaitingForOperand] = useState(false)
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>([])

  // Step completion functions
  const completeStep = (step: keyof StepCompletion) => {
    setStepCompletion((prev) => {
      const newState = { ...prev, [step]: true }
      console.log(`Step ${step} completed. New state:`, newState)
      return newState
    })
  }

  const canAccessStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "systemCheck":
        return true
      case "idVerification":
        return stepCompletion.systemCheck
      case "examRules":
        return stepCompletion.systemCheck && stepCompletion.idVerification
      case "instructions":
        return stepCompletion.systemCheck && stepCompletion.idVerification && stepCompletion.examRules
      default:
        return false
    }
  }

  const getNextStep = (currentStep: keyof StepCompletion): keyof StepCompletion | null => {
    switch (currentStep) {
      case "systemCheck":
        return "idVerification"
      case "idVerification":
        return "examRules"
      case "examRules":
        return "instructions"
      case "instructions":
        return null
      default:
        return null
    }
  }

  // Preview button handlers
  const handlePreviewSystemCheck = () => {
    setShowSystemCheck(true)
  }

  const handlePreviewIdVerification = () => {
    if (!canAccessStep("idVerification")) {
      toast.error("Please complete System Check first")
      return
    }
    setShowIdVerification(true)
  }

  const handlePreviewExamRules = () => {
    if (!canAccessStep("examRules")) {
      toast.error("Please complete System Check and ID Verification first")
      return
    }
    setShowRules(true)
  }

  // Tab change handler
  const handleTabChange = (value: string) => {
    if (value === "instructions") {
      if (!canAccessStep("instructions")) {
        toast.error("Please complete all preview steps first: System Check → ID Verification → Exam Rules")
        return
      }
    }
    setActiveTab(value)
  }

  // Auto-complete instructions when accessing with all prerequisites
  useEffect(() => {
    if (
      !hasCompletedInstructions.current &&
      stepCompletion.systemCheck &&
      stepCompletion.idVerification &&
      stepCompletion.examRules &&
      activeTab === "instructions" &&
      !stepCompletion.instructions
    ) {
      console.log("Auto-completing instructions step");
      completeStep("instructions");
      hasCompletedInstructions.current = true;
    }
    // Reset the ref if user goes back to a previous step
    if (
      hasCompletedInstructions.current &&
      (!stepCompletion.systemCheck || !stepCompletion.idVerification || !stepCompletion.examRules)
    ) {
      hasCompletedInstructions.current = false;
    }
  }, [
    stepCompletion.systemCheck,
    stepCompletion.idVerification,
    stepCompletion.examRules,
    activeTab,
    stepCompletion.instructions,
  ]);

  // SIMPLIFIED image capture
  const captureImage = useCallback(async () => {
    console.log("📸 Capturing image...")

    if (!canvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    if (cameraManager.status !== "active" || !cameraManager.stream) {
      toast.error("Camera is not active")
      return
    }

    try {
      // Find the modal video element
      const modalVideo = document.querySelector('video[data-context="modal"]') as HTMLVideoElement
      if (!modalVideo || modalVideo.videoWidth === 0) {
        toast.error("Video not ready for capture")
        return
      }

      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      if (!context) {
        toast.error("Could not get canvas context")
        return
      }

      canvas.width = modalVideo.videoWidth
      canvas.height = modalVideo.videoHeight
      context.drawImage(modalVideo, 0, 0, canvas.width, canvas.height)

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      if (isCapturingFace) {
        setFaceImage(imageDataUrl)
      } else {
        setIdCardImage(imageDataUrl)
      }

      setShowCameraModal(false)
      await uploadImageToServer(imageDataUrl, isCapturingFace ? "face" : "id_card")
      toast.success(`${isCapturingFace ? "Face" : "ID Card"} captured successfully`)
    } catch (error) {
      console.error("Error capturing image:", error)
      toast.error("Failed to capture image")
    }
  }, [cameraManager.status, cameraManager.stream, isCapturingFace])

  // Open camera modal
  const openCameraModal = useCallback((forFace: boolean) => {
    console.log(`📷 Opening camera modal for ${forFace ? "face" : "ID card"}`)
    setIsCapturingFace(forFace)
    setShowCameraModal(true)
  }, [])

  const uploadImageToServer = async (imageDataUrl: string, type: "face" | "id_card") => {
    if (!testId) return

    try {
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append("image", blob, `${type}.jpg`)
      formData.append("token", testId)
      formData.append("type", type)
      formData.append("isPreview", "true")

      const uploadResponse = await fetch("/api/assessment/preview-verification/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.message || "Failed to upload image")
      }

      const data = await uploadResponse.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to upload image")
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
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit")
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string
        setIdCardImage(imageDataUrl)
        await uploadImageToServer(imageDataUrl, "id_card")
        toast.success("ID Card uploaded successfully")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload ID Card")
    }
  }

  const saveStudentId = async (id: string) => {
    if (!testId) return

    try {
      const response = await fetch("/api/assessment/preview-verification/student-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: testId,
          studentId: id,
          isPreview: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save student ID")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to save student ID")
      }
    } catch (error) {
      console.error("Error saving student ID:", error)
      toast.error("Failed to save student ID")
    }
  }

  const handleStudentIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value
    setStudentId(id)

    if (id.trim()) {
      await saveStudentId(id.trim())
    }
  }

  // Test functions
  const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));
  const fetchTest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/assessment/tests/${testId}`, {
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
        // Deep copy test data to avoid mutating original
        const testData = deepCopy(data.test);
        if (testData.settings.shuffleQuestions) {
          testData.sections = testData.sections.map((section: SectionData) => {
            // Always shuffle a new copy of the questions array
            const shuffledQuestions = shuffleArray([...section.questions]);
            return {
              ...section,
              questions: shuffledQuestions,
            };
          });
        }
        setTest(testData);
      } else {
        throw new Error(data.message || "Failed to fetch test");
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Failed to load test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const enableFullscreen = async () => {
    try {
      setPermissionDialogActive(true)

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
    } finally {
      setPermissionDialogActive(false)
    }
  }

  const handleStartTest = () => {
    if (!stepCompletion.instructions) {
      toast.error("Please complete all preview steps before starting the test")
      return
    }

    setActiveTab("test")
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion]
    if (currentQuestionData) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }))
    }
  }

  // For coding questions, store test case results (memoized, only update if changed)
  const handleCodingTestCaseResults = useCallback((questionId: string, results: any[]) => {
    setCodingResults((prev) => {
      if (JSON.stringify(prev[questionId]) === JSON.stringify(results)) return prev;
      return {
        ...prev,
        [questionId]: results,
      };
    });
    setHasRunTestCases((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  }, []);

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
    const currentSectionQuestions = test?.sections[currentSection].questions || []
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
    setIsSubmitting(true);
    try {
      let totalPoints = 0;
      const earnedPoints = 0;
      const allAnswers: any[] = [];
      test?.sections.forEach((section) => {
        section.questions.forEach((question) => {
          totalPoints += question.points;
          const questionKey = `${section.id}-${question.id}`;
          const userAnswer = answers[questionKey] || "";
          const answerObj: any = {
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            answer: userAnswer,
            options: question.options || [],
            correctAnswer: question.correctAnswer || null,
            codingTestResults: null,
          };
          if (question.type === "Coding") {
            const codeSubmissions = codingResults[question.id] || [];
            let codingTestResults = [];
            if (Array.isArray(codeSubmissions) && codeSubmissions.length > 0 && codeSubmissions[codeSubmissions.length - 1]?.results) {
              codingTestResults = codeSubmissions[codeSubmissions.length - 1].results;
            } else if (Array.isArray(question.testCases)) {
              // If never run, create default array for all test cases
              codingTestResults = question.testCases.map(tc => ({
                input: tc.input || '',
                expectedOutput: tc.expectedOutput || '',
                actualOutput: '',
                passed: false
              }));
            }
            answerObj.codingTestResults = codingTestResults;
          }
          allAnswers.push(answerObj);
        });
      });
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const status = score >= (test?.passingScore || 70) ? "Passed" : "Failed";
      const resultData = {
        testId: testId,
        testName: test?.name || "Preview Test",
        score: score,
        status: status,
        duration: Math.round(((test?.duration || 0) * 60 - timeLeft) / 60),
        answers: allAnswers,
        tabSwitchCount: tabSwitchCount,
        terminated: testTerminated,
      };
      const response = await fetch("/api/assessment/preview-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });
      let backendScore = score;
      let backendStatus = status;
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.score !== 'undefined' && typeof data.status !== 'undefined') {
          backendScore = data.score;
          backendStatus = data.status;
        }
        toast.success(`Test completed! Score: ${backendScore}% (${backendStatus}) - Preview Mode`);
      } else {
        toast.success(`Test completed! Score: ${backendScore}% (${backendStatus}) - Preview Mode (Result not saved)`);
      }
      router.push(`/employee/assessment/tests/${testId}`);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.success("Test submitted successfully (Preview Mode)");
      router.push(`/employee/assessment/tests/${testId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestTermination = () => {
    setTestTerminated(true)
    toast.error("Test terminated due to excessive tab switching violations!")
    setTimeout(() => {
      handleSubmitTest()
    }, 2000)
  }

  // Utility functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  const calculateProgress = () => {
    if (!test) return 0;
    let totalQuestions = 0;
    let currentIndex = 0;
    let found = false;
    test.sections.forEach((section, sIdx) => {
      section.questions.forEach((q, qIdx) => {
        if (!found && sIdx === currentSection && qIdx === currentQuestion) {
          found = true;
          currentIndex = totalQuestions;
        }
        totalQuestions++;
      });
    });
    // Progress is (currentIndex+1)/totalQuestions*100
    return totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Calculator functions
  const inputDigit = (digit: string) => {
    if (calculatorWaitingForOperand) {
      setCalculatorDisplay(digit)
      setCalculatorWaitingForOperand(false)
    } else {
      setCalculatorDisplay(calculatorDisplay === "0" ? digit : calculatorDisplay + digit)
    }
  }

  const inputDecimal = () => {
    if (calculatorWaitingForOperand) {
      setCalculatorDisplay("0.")
      setCalculatorWaitingForOperand(false)
    } else if (calculatorDisplay.indexOf(".") === -1) {
      setCalculatorDisplay(calculatorDisplay + ".")
    }
  }

  const clear = () => {
    setCalculatorDisplay("0")
    setCalculatorMemory(null)
    setCalculatorOperation(null)
    setCalculatorWaitingForOperand(false)
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = Number.parseFloat(calculatorDisplay)

    if (calculatorMemory === null) {
      setCalculatorMemory(inputValue)
    } else if (calculatorOperation) {
      const currentValue = calculatorMemory || 0
      const newValue = calculate(currentValue, inputValue, calculatorOperation)

      setCalculatorDisplay(String(newValue))
      setCalculatorMemory(newValue)

      setCalculatorHistory((prev) => [...prev, `${currentValue} ${calculatorOperation} ${inputValue} = ${newValue}`])
    }

    setCalculatorWaitingForOperand(true)
    setCalculatorOperation(nextOperation)
  }

  const calculate = (firstOperand: number, secondOperand: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstOperand + secondOperand
      case "-":
        return firstOperand - secondOperand
      case "*":
        return firstOperand * secondOperand
      case "/":
        return firstOperand / secondOperand
      case "=":
        return secondOperand
      case "^":
        return Math.pow(firstOperand, secondOperand)
      case "mod":
        return firstOperand % secondOperand
      default:
        return secondOperand
    }
  }

  const performFunction = (func: string) => {
    const inputValue = Number.parseFloat(calculatorDisplay)
    let result: number

    switch (func) {
      case "sin":
        result = Math.sin((inputValue * Math.PI) / 180)
        break
      case "cos":
        result = Math.cos((inputValue * Math.PI) / 180)
        break
      case "tan":
        result = Math.tan((inputValue * Math.PI) / 180)
        break
      case "log":
        result = Math.log10(inputValue)
        break
      case "ln":
        result = Math.log(inputValue)
        break
      case "sqrt":
        result = Math.sqrt(inputValue)
        break
      case "square":
        result = inputValue * inputValue
        break
      case "factorial":
        result = factorial(inputValue)
        break
      case "1/x":
        result = 1 / inputValue
        break
      case "pi":
        result = Math.PI
        break
      case "e":
        result = Math.E
        break
      default:
        return
    }

    setCalculatorDisplay(String(result))
    setCalculatorHistory((prev) => [...prev, `${func}(${inputValue}) = ${result}`])
    setCalculatorWaitingForOperand(true)
  }

  const factorial = (n: number): number => {
    if (n < 0) return Number.NaN
    if (n === 0 || n === 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  // Enhanced effects
  useEffect(() => {
    fetchTest()
  }, [])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      console.log("🖥️ Fullscreen changed:", !!document.fullscreenElement)
      setSystemChecks((prev) => ({
        ...prev,
        fullscreenMode: !!document.fullscreenElement,
      }))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Handle visibility changes for tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden || document.visibilityState === 'hidden') {
        if (activeTab === 'test' && !permissionDialogActive && !testTerminated && now - lastTabSwitchTime > 2000) {
          setLastTabSwitchTime(now);
          setTabSwitchCount((prev) => {
            const newCount = prev + 1;
            if (test?.settings.preventTabSwitching) {
              setShowTabWarning(true);
              if (newCount >= 4) {
                handleTestTermination();
              }
            }
            return newCount;
          });
        }
      }
    };
    const handleBlur = () => {
      const now = Date.now();
      if (activeTab === 'test' && !permissionDialogActive && !testTerminated && now - lastTabSwitchTime > 2000) {
        setLastTabSwitchTime(now);
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (test?.settings.preventTabSwitching) {
            setShowTabWarning(true);
            if (newCount >= 4) {
              handleTestTermination();
            }
          }
          return newCount;
        });
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTab === 'test' && !testTerminated) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab, permissionDialogActive, testTerminated, lastTabSwitchTime, test?.settings.preventTabSwitching]);

  useEffect(() => {
    if (test) {
      setTimeLeft(test.duration * 60)

      const initialAnswers: Record<string, string | string[]> = {}
      test.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const questionKey = `${section.id}-${question.id}`
          if (question.type === "Multiple Choice") {
            initialAnswers[questionKey] = ""
          } else {
            initialAnswers[questionKey] = ""
          }
        })
      })
      setAnswers(initialAnswers)
    }
  }, [test])

  useEffect(() => {
    if (timeLeft > 0 && activeTab === "test" && !testTerminated) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && activeTab === "test" && test?.settings.autoSubmit && !testTerminated) {
      handleSubmitTest()
    }
  }, [timeLeft, activeTab, test?.settings.autoSubmit, testTerminated])

  // Add this helper to compute code stats for the current coding question
  const getCurrentCodeStats = () => {
    const currentQuestionData = test?.sections[currentSection]?.questions[currentQuestion];
    if (!currentQuestionData || currentQuestionData.type !== "Coding") return { total: 0, executed: 0, passed: 0, failed: 0 };
    const codeSubmissions = codingResults[currentQuestionData.id] || [];
    let results: any[] = [];
    if (Array.isArray(codeSubmissions) && codeSubmissions.length > 0 && codeSubmissions[codeSubmissions.length - 1]?.results) {
      results = codeSubmissions[codeSubmissions.length - 1].results;
    } else if (Array.isArray(currentQuestionData.testCases)) {
      results = currentQuestionData.testCases.map(() => ({}));
    }
    const total = Array.isArray(currentQuestionData.testCases) ? currentQuestionData.testCases.length : 0;
    const hasRun = !!hasRunTestCases[currentQuestionData.id];
    const executed = hasRun ? total : 0;
    const passed = hasRun ? results.filter((r) => r.passed).length : 0;
    const failed = hasRun ? results.filter((r) => r.passed === false).length : 0;
    return { total, executed, passed, failed };
  };

  // Robust code execution handler for preview (matches production)
  const handleRunCode = async (code: string, language: string, input?: string) => {
    // Map language to pistonLang and version if needed (use same logic as production)
    // For now, assume language is correct for API
    const response = await fetch("/api/code/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language,
        version: undefined, // Add version if needed
        input: input || "",
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return { success: false, output: "", error: errorData.error || `HTTP ${response.status}` };
    }
    return await response.json();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" />
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Skeleton className="h-9 w-40" />
            </div>
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
      </div>
    )
  }

  // Render test not found
  if (!test) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" />
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold">Test Not Found</h1>
            </div>
            <Card>
              <CardContent className="py-10 text-center">
                <h2 className="text-xl font-medium mb-2">The requested test could not be found</h2>
                <p className="text-muted-foreground mb-6">
                  The test may have been deleted or you may not have access to it.
                </p>
                <Button onClick={() => router.push("/employee/assessment/tests")}>Go to Tests</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Render test terminated
  if (testTerminated) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" />
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
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
                <Button onClick={() => router.push(`/employee/assessment/tests/${testId}`)}>
                  Return to Test Overview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Test Preview: {test.name}</h1>
          </div>

          {/* Preview Steps Progress */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>Complete all steps in order:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={stepCompletion.systemCheck ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  System Check
                </span>
                <span className="hidden sm:inline">→</span>
                <span
                  className={stepCompletion.idVerification ? "text-green-600 font-medium" : "text-muted-foreground"}
                >
                  ID Verification
                </span>
                <span className="hidden sm:inline">→</span>
                <span className={stepCompletion.examRules ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  Exam Rules
                </span>
                <span className="hidden sm:inline">→</span>
                <span className={stepCompletion.instructions ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  Instructions
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={stepCompletion.systemCheck ? "default" : "outline"}
                onClick={handlePreviewSystemCheck}
                className={stepCompletion.systemCheck ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                size="sm"
              >
                {stepCompletion.systemCheck && <CheckCircle className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">Preview </span>System Check
              </Button>
              <Button
                variant={stepCompletion.idVerification ? "default" : "outline"}
                onClick={handlePreviewIdVerification}
                disabled={!canAccessStep("idVerification")}
                className={stepCompletion.idVerification ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                size="sm"
              >
                {stepCompletion.idVerification && <CheckCircle className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">Preview </span>ID Verification
              </Button>
              <Button
                variant={stepCompletion.examRules ? "default" : "outline"}
                onClick={handlePreviewExamRules}
                disabled={!canAccessStep("examRules")}
                className={stepCompletion.examRules ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                size="sm"
              >
                {stepCompletion.examRules && <CheckCircle className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">Preview </span>Exam Rules
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger
                value="instructions"
                disabled={!canAccessStep("instructions")}
                className={
                  stepCompletion.instructions ? "bg-green-100 text-green-800 data-[state=active]:bg-green-200" : ""
                }
              >
                {stepCompletion.instructions && <CheckCircle className="h-4 w-4 mr-2" />}
                Instructions
              </TabsTrigger>
              <TabsTrigger value="test" disabled={!stepCompletion.instructions}>
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
                          Switching tabs or leaving the test page is not allowed and will be recorded. After 4
                          violations, your test will be automatically terminated.
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
                    <Button
                      size="lg"
                      onClick={handleStartTest}
                      disabled={!stepCompletion.instructions}
                      className={
                        stepCompletion.instructions
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "opacity-50 cursor-not-allowed"
                      }
                    >
                      {stepCompletion.instructions ? "Start Test" : "Complete all preview steps first"}
                    </Button>
                    {!stepCompletion.instructions && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Please complete System Check → ID Verification → Exam Rules before starting
                      </p>
                    )}
                    {stepCompletion.instructions && (
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        ✓ All steps completed! Ready to start test.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                  <Card className="h-full">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <CardTitle className="text-lg sm:text-xl">
                            Section: {test.sections[currentSection]?.title}
                          </CardTitle>
                          <CardDescription>
                            Question {currentQuestion + 1} of {test.sections[currentSection]?.questions.length || 0}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
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
                    <CardContent className="pb-6">
                      {test.sections[currentSection]?.questions[currentQuestion] ? (
                        <div className="space-y-6">
                          {/* Coding Questions */}
                                                        {test.sections[currentSection]?.questions[currentQuestion]?.type === "Coding" && (
                            <div className="space-y-6">
                              {/* Coding Question Instructions (Markdown) */}
                              {test.sections[currentSection]?.questions[currentQuestion]?.instructions && (
                                <div className="mb-4 p-3 bg-muted/50 border rounded">
                                  <span className="text-lg font-bold mb-2 block">Instructions</span>
                                  <Separator className="mb-2" />
                                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{test.sections[currentSection]?.questions[currentQuestion]?.instructions}</ReactMarkdown>
                                </div>
                              )}
                              {/* Problem Description (Markdown) */}
                              <div className="p-4 border rounded-lg bg-muted/50 mb-4">
                                <h3 className="text-lg font-medium mb-2">Problem {currentQuestion + 1}:</h3>
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{test?.sections[currentSection]?.questions[currentQuestion]?.text}</ReactMarkdown>
                              </div>
                              {/* Test Case Feedback */}
                              {(() => {
                                const section = test?.sections?.[currentSection];
                                const question = section?.questions?.[currentQuestion];
                                const testCases = question?.testCases;
                                return testCases && testCases.length > 0;
                              })() && (
                                <div className="mt-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium">Test Cases:</span>
                                      <span className="inline-block px-2 py-1 rounded bg-red-600 text-white text-xs font-mono border border-red-600">
                                        {getCurrentCodeStats().executed}/{getCurrentCodeStats().total}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-block px-2 py-1 rounded bg-green-600 text-white text-xs font-mono border border-green-600">✓ {getCurrentCodeStats().passed}</span>
                                      <span className="inline-block px-2 py-1 rounded bg-red-600 text-white text-xs font-mono border border-red-600">✗ {getCurrentCodeStats().failed}</span>
                                    </div>
                                  </div>
                                  <h4 className="font-medium text-sm mb-3">Example Test Cases</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {test.sections[currentSection].questions[currentQuestion]?.testCases
                                      ?.filter((tc: any) => !tc.isHidden)
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
                              {/* Enhanced Code Editor with better responsive design */}
                              <div className="space-y-4">
                                {test.settings.allowCodeEditor ? (
                                  <div className="w-full overflow-hidden border rounded-lg">
                                    <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] w-full">
                                      <AdvancedCodeEditor
                                        value={
                                          (getCurrentAnswer() as string) ||
                                          test.sections[currentSection].questions[currentQuestion]?.codeTemplate ||
                                          ""
                                        }
                                        onChange={(value) => handleAnswer(getCurrentQuestionKey(), value)}
                                        language={
                                          test.sections[currentSection].questions[currentQuestion]?.codeLanguage ||
                                          "javascript"
                                        }
                                        showConsole={true}
                                        testCases={
                                          test.sections[currentSection].questions[currentQuestion]?.testCases || []
                                        }
                                        className="h-full w-full"
                                        questionId={test.sections[currentSection].questions[currentQuestion]?.id}
                                        onTestCaseResults={handleCodingTestCaseResults}
                                        onRunCode={handleRunCode}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border rounded-md overflow-hidden">
                                    <div className="bg-muted p-2 border-b">
                                      <span className="text-sm font-medium">Code Editor</span>
                                    </div>
                                    <textarea
                                      rows={20}
                                      placeholder="// Write your code here"
                                      className="w-full p-4 font-mono text-sm bg-slate-900 text-white resize-none border-none outline-none min-h-[400px]"
                                      value={
                                        (getCurrentAnswer() as string) ||
                                        test.sections[currentSection].questions[currentQuestion]?.codeTemplate ||
                                        ""
                                      }
                                      onChange={(e) => handleAnswer(getCurrentQuestionKey(), e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Non-Coding Questions */}
                          {test.sections[currentSection].questions[currentQuestion]?.type !== "Coding" && (
                            <div>
                              <div className="mb-2">
                                <span className="text-lg font-medium">{currentQuestion + 1}.</span>
                                <div className="mt-2">
                                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{test.sections[currentSection].questions[currentQuestion]?.text}</ReactMarkdown>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">
                                {test.sections[currentSection].questions[currentQuestion]?.points} points
                              </p>

                              {test.sections[currentSection].questions[currentQuestion]?.type === "Multiple Choice" && (
                                <div className="space-y-3">
                                  {test.sections[currentSection].questions[currentQuestion]?.options
                                    ?.filter((option) => option.trim() !== "")
                                    .map((option, index) => (
                                      <div
                                        key={index}
                                        className={`flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors ${getCurrentAnswer() === option ? 'bg-green-100 border-green-400' : ''}`}
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

                              {test.sections[currentSection].questions[currentQuestion]?.type === "Written Answer" && (
                                <textarea
                                  rows={5}
                                  placeholder="Type your answer here..."
                                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[120px]"
                                  value={(getCurrentAnswer() as string) || ""}
                                  onChange={(e) => handleAnswer(getCurrentQuestionKey(), e.target.value)}
                                />
                              )}
                            </div>
                          )}

                          <div className="flex justify-between pt-4 border-t">
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
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/employee/assessment/tests/${testId}/edit`)}
                          >
                            Edit Test
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="xl:col-span-1">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Progress</CardTitle>
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
                        </div>
                      </CardContent>
                    </Card>

                    {/* Test Webcam monitoring */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Webcam Monitoring</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <CameraVideo cameraManager={cameraManager as any} context="test" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Webcam:{" "}
                              {cameraManager.status === "active"
                                ? "Active"
                                : cameraManager.status === "requesting"
                                  ? "Starting..."
                                  : cameraManager.status === "error"
                                    ? "Error"
                                    : "Inactive"}
                            </p>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  cameraManager.status === "active"
                                    ? "bg-green-500"
                                    : cameraManager.status === "requesting"
                                      ? "bg-yellow-500 animate-pulse"
                                      : cameraManager.status === "error"
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                                }`}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={cameraManager.startCamera}
                            disabled={cameraManager.status === "requesting"}
                          >
                            {cameraManager.status === "active"
                              ? "Webcam Active"
                              : cameraManager.status === "requesting"
                                ? "Starting..."
                                : "Start Webcam"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {test.settings.allowCalculator && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Calculator</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" className="w-full" onClick={() => setShowCalculator(true)}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Open Scientific Calculator
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardContent className="pt-6">
                        <Button className="w-full" variant="destructive" onClick={handleSubmitTest} disabled={isSubmitting}>
                          {isSubmitting ? (
                            <span className="flex items-center justify-center"><svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Submitting...</span>
                          ) : (
                            "Submit Test"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          You won&apos;t be able to change your answers after submission.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Scientific Calculator Dialog */}
          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Scientific Calculator</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-black text-white p-4 rounded-md mb-4">
                  <div className="text-right text-2xl font-mono mb-2 break-words">{calculatorDisplay}</div>
                  {calculatorHistory.length > 0 && (
                    <div className="text-xs text-gray-400 max-h-20 overflow-y-auto">
                      {calculatorHistory.slice(-3).map((entry, index) => (
                        <div key={index} className="break-words">
                          {entry}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2 text-sm">
                  <Button variant="outline" size="sm" onClick={() => performFunction("sin")}>
                    sin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("cos")}>
                    cos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("tan")}>
                    tan
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("log")}>
                    log
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("ln")}>
                    ln
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => performFunction("sqrt")}>
                    √
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("square")}>
                    x²
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("^")}>
                    x^y
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("1/x")}>
                    1/x
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("factorial")}>
                    x!
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => performFunction("pi")}>
                    π
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performFunction("e")}>
                    e
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("mod")}>
                    mod
                  </Button>
                  <Button variant="outline" size="sm" onClick={clear}>
                    C
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalculatorDisplay(calculatorDisplay.slice(0, -1) || "0")}
                  >
                    ⌫
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => inputDigit("7")}>
                    7
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("8")}>
                    8
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("9")}>
                    9
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("/")}>
                    /
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("(")}>
                    (
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => inputDigit("4")}>
                    4
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("5")}>
                    5
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("6")}>
                    6
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("*")}>
                    ×
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation(")")}>
                    )
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => inputDigit("1")}>
                    1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("2")}>
                    2
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => inputDigit("3")}>
                    3
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("-")}>
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => performOperation("=")}
                    className="row-span-2 h-auto"
                  >
                    =
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => inputDigit("0")} className="col-span-2">
                    0
                  </Button>
                  <Button variant="outline" size="sm" onClick={inputDecimal}>
                    .
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => performOperation("+")}>
                    +
                  </Button>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setShowCalculator(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Tab Warning Dialog */}
          <Dialog open={showTabWarning} onOpenChange={setShowTabWarning}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-amber-600">Tab Switch Warning</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="font-medium">Tab switching detected!</p>
                    <p className="text-sm text-muted-foreground">
                      Warning {tabSwitchCount}/4 - Your test will be terminated after 4 violations.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Please stay on this tab during the test. Switching tabs or windows is not allowed and is being
                  monitored.
                </p>
                <div className="flex justify-end">
                  <Button onClick={() => setShowTabWarning(false)}>I Understand</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                    <CardDescription>
                      Complete system check and ID verification before starting the exam
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                      <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">System Check</div>
                      <div className="w-1/3 text-center text-muted-foreground p-2">ID Verification</div>
                      <div className="w-1/3 text-center text-muted-foreground p-2">Exam Rules</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="w-full">
                        <Progress value={systemChecks.cameraAccess ? 100 : 25} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          System check progress: {systemChecks.cameraAccess ? 100 : 25}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <CameraVideo cameraManager={cameraManager as any} context="system" />

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
                            <Button
                              size="sm"
                              onClick={cameraManager.startCamera}
                              disabled={cameraManager.status === "requesting"}
                            >
                              {cameraManager.status === "requesting" ? "Starting..." : "Allow"}
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

                    <div className="flex justify-between pt-4 border-t bg-background sticky bottom-0 mt-4">
                      <Button variant="outline" onClick={() => setShowSystemCheck(false)}>
                        Close Preview
                      </Button>
                      <Button
                        onClick={() => {
                          completeStep("systemCheck")
                          setShowSystemCheck(false)
                          const nextStep = getNextStep("systemCheck")
                          if (nextStep === "idVerification") {
                            setShowIdVerification(true)
                          }
                          toast.success("System Check completed!")
                        }}
                        disabled={!systemChecks.cameraAccess}
                      >
                        Complete & Next: ID Verification
                      </Button>
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
                    <CardDescription>
                      Complete system check and ID verification before starting the exam
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                      <div className="w-1/3 text-center text-muted-foreground p-2">
                        {stepCompletion.systemCheck ? (
                          <span className="text-green-600">✓ System Check</span>
                        ) : (
                          "System Check"
                        )}
                      </div>
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
                            onChange={handleStudentIdChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Upload ID Card</Label>
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
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Upload your ID card</p>
                              </div>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                              />
                              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
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

                    <div className="flex justify-between pt-4 border-t bg-background sticky bottom-0 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowIdVerification(false)
                          setShowSystemCheck(true)
                        }}
                      >
                        Back: System Check
                      </Button>
                      <Button
                        onClick={() => {
                          completeStep("idVerification")
                          setShowIdVerification(false)
                          const nextStep = getNextStep("idVerification")
                          if (nextStep === "examRules") {
                            setShowRules(true)
                          }
                          toast.success("ID Verification completed!")
                        }}
                        disabled={!studentId.trim() || !idCardImage || !faceImage}
                      >
                        Complete & Next: Exam Rules
                      </Button>
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
                    <CardDescription>
                      Complete system check and ID verification before starting the exam
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between border rounded-md p-2 bg-muted/30">
                      <div className="w-1/3 text-center text-muted-foreground p-2">
                        {stepCompletion.systemCheck ? (
                          <span className="text-green-600">✓ System Check</span>
                        ) : (
                          "System Check"
                        )}
                      </div>
                      <div className="w-1/3 text-center text-muted-foreground p-2">
                        {stepCompletion.idVerification ? (
                          <span className="text-green-600">✓ ID Verification</span>
                        ) : (
                          "ID Verification"
                        )}
                      </div>
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
                            <li className="text-amber-600">
                              The exam will be automatically submitted when time expires
                            </li>
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
                    </div>

                    <div className="flex justify-between pt-4 border-t bg-background sticky bottom-0 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRules(false)
                          setShowIdVerification(true)
                        }}
                      >
                        Back: ID Verification
                      </Button>
                      <Button
                        onClick={() => {
                          completeStep("examRules")
                          setShowRules(false)
                          toast.success("All preview steps completed! You can now access the Instructions tab.")
                        }}
                      >
                        Complete & Go to Instructions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          {/* Camera Modal */}
          <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{isCapturingFace ? "Capture Your Face" : "Capture Your ID Card"}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                  <video
                    data-context="modal"
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                    ref={(video) => {
                      if (video && cameraManager.stream) {
                        video.srcObject = cameraManager.stream
                      }
                    }}
                  />
                  {cameraManager.status !== "active" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                      <div className="text-center">
                        {cameraManager.status === "requesting" ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Starting camera...</p>
                          </>
                        ) : (
                          <>
                            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm">Camera not active</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="mt-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCameraModal(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={captureImage} disabled={cameraManager.status !== "active"}>
                    Capture
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}


