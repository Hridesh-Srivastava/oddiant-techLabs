"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { ArrowLeft, Plus, Trash2, Save, Eye, Edit, Code, FileText, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdvancedCodeEditor } from "@/components/advanced-code-editor"
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
  status: string
  createdAt: string
  updatedAt: string
}

interface SectionData {
  id: string
  title: string
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
  explanation?: string
  // Coding question specific fields
  codeLanguage?: string
  codeTemplate?: string
  expectedOutput?: string
  testCases?: TestCase[]
  instructions?: string
  // Written answer specific fields
  maxWords?: number
  sampleAnswer?: string
  timestamp?: number
}

interface TestCase {
  input: string
  expectedOutput: string
  description?: string
  isHidden?: boolean
  id?: string
}

export default function EditTestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [test, setTest] = useState<TestData | null>(null)
  const [showDeleteSectionDialog, setShowDeleteSectionDialog] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)

  // Question form state
  const [questionForm, setQuestionForm] = useState<QuestionData>({
    id: "",
    text: "",
    type: "Multiple Choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    explanation: "",
  })

  const fetchTest = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/assessment/tests/${testId}`, {
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
        // FIXED: Ensure settings have proper boolean values to prevent undefined issues
        const testData = {
          ...data.test,
          settings: {
            shuffleQuestions: Boolean(data.test.settings?.shuffleQuestions),
            preventTabSwitching: Boolean(data.test.settings?.preventTabSwitching),
            allowCalculator: Boolean(data.test.settings?.allowCalculator),
            allowCodeEditor: Boolean(data.test.settings?.allowCodeEditor),
            autoSubmit: Boolean(data.test.settings?.autoSubmit),
          },
        }
        setTest(testData)
        console.log("Fetched test data:", testData) // Debug log
      } else {
        throw new Error(data.message || "Failed to fetch test")
      }
    } catch (error) {
      console.error("Error fetching test:", error)
      toast.error("Failed to load test. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [testId])

  useEffect(() => {
    fetchTest()
  }, [fetchTest])

  // FIXED: Remove test dependency to prevent infinite loops
  const handleInputChange = useCallback((field: string, value: string | number | boolean) => {
    if (field.startsWith("settings.")) {
      const settingField = field.split(".")[1]
      setTest((prev) =>
        prev
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                [settingField]: value,
              },
            }
          : prev,
      )
    } else {
      setTest((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : prev,
      )
    }
  }, [])

  // FIXED: Enhanced settings change handler with proper state management
  const handleTestSettingsChange = useCallback((setting: string, value: boolean) => {
    console.log(`Changing setting ${setting} to ${value}`) // Debug log
    setTest((prev) => {
      if (!prev) return prev
      const updatedTest = {
        ...prev,
        settings: {
          ...prev.settings,
          [setting]: value,
        },
      }
      console.log("Updated test state:", updatedTest) // Debug log
      return updatedTest
    })
  }, [])

  const handleSectionChange = useCallback((sectionIndex: number, field: string, value: string | number) => {
    setTest((prev) => {
      if (!prev) return prev
      const updatedSections = [...prev.sections]
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        [field]: value,
      }
      return {
        ...prev,
        sections: updatedSections,
      }
    })
  }, [])

  const handleAddSection = useCallback(() => {
    setTest((prev) => {
      if (!prev) return prev
      const newSection: SectionData = {
        id: `section-${Date.now()}`,
        title: `Section ${prev.sections.length + 1}`,
        questionType: "Multiple Choice",
        questions: [],
      }
      return {
        ...prev,
        sections: [...prev.sections, newSection],
      }
    })
  }, [])

  const handleDeleteSection = useCallback((sectionId: string) => {
    setSectionToDelete(sectionId)
    setShowDeleteSectionDialog(true)
  }, [])

  const confirmDeleteSection = useCallback(() => {
    if (!sectionToDelete) return
    setTest((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.filter((section) => section.id !== sectionToDelete),
      }
    })
    setShowDeleteSectionDialog(false)
    setSectionToDelete(null)
  }, [sectionToDelete])

  const handleAddQuestion = useCallback(
    (sectionIndex: number) => {
      setCurrentSectionIndex(sectionIndex)
      setEditingQuestion(null)
      setEditingQuestionIndex(null)

      const section = test?.sections[sectionIndex]
      const questionType = section?.questionType || "Multiple Choice"

      // Initialize question form based on section type
      if (questionType === "Multiple Choice") {
        setQuestionForm({
          id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${sectionIndex}`,
          text: "",
          type: "Multiple Choice",
          options: ["", ""],
          correctAnswer: "",
          points: 10,
          explanation: "",
          timestamp: Date.now(),
        })
      } else if (questionType === "Coding") {
        setQuestionForm({
          id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${sectionIndex}`,
          text: "",
          type: "Coding",
          points: 20,
          codeLanguage: "javascript",
          codeTemplate: `// Write your solution here
function solution() {
    // Your code here
    return "Hello World";
}`,
          instructions: "",
          expectedOutput: "",
          testCases: [
            {
              id: "1",
              input: "",
              expectedOutput: "Hello World",
              isHidden: false,
            },
          ],
          timestamp: Date.now(),
        })
      } else if (questionType === "Written Answer") {
        setQuestionForm({
          id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${sectionIndex}`,
          text: "",
          type: "Written Answer",
          points: 15,
          maxWords: 500,
          sampleAnswer: "",
          explanation: "",
          timestamp: Date.now(),
        })
      }

      setShowQuestionDialog(true)
    },
    [test],
  )

  const handleEditQuestion = useCallback(
    (sectionIndex: number, questionIndex: number) => {
      const question = test?.sections[sectionIndex]?.questions[questionIndex]
      if (!question) return

      setCurrentSectionIndex(sectionIndex)
      setEditingQuestion(question)
      setEditingQuestionIndex(questionIndex)

      // Ensure proper structure for different question types
      const formData = JSON.parse(JSON.stringify(question))
      if (question.type === "Multiple Choice" && !formData.options) {
        formData.options = ["", ""]
      }

      // CRITICAL: Ensure correctAnswer is properly set for MCQ when editing
      if (question.type === "Multiple Choice") {
        formData.correctAnswer = question.correctAnswer || ""
        console.log("Editing MCQ with correctAnswer:", formData.correctAnswer)
      }

      if (question.type === "Coding") {
        if (!formData.testCases) {
          formData.testCases = [
            {
              id: "1",
              input: "",
              expectedOutput: "",
              isHidden: false,
            },
          ]
        }
        // Ensure test cases have proper structure
        formData.testCases = formData.testCases.map((tc: TestCase, index: number) => ({
          ...tc,
          id: tc.id || (index + 1).toString(),
          isHidden: tc.isHidden || false,
        }))
      }

      setQuestionForm(formData)
      setShowQuestionDialog(true)
    },
    [test],
  )

  const handleDeleteQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    setTest((prev) => {
      if (!prev) return prev
      const updatedSections = [...prev.sections]
      updatedSections[sectionIndex].questions.splice(questionIndex, 1)
      return {
        ...prev,
        sections: updatedSections,
      }
    })
    toast.success("Question deleted successfully")
  }, [])

  // FIXED: Enhanced code template change handler
  const handleCodeTemplateChange = useCallback((value: string) => {
    setQuestionForm((prev) => ({
      ...prev,
      codeTemplate: value,
    }))
  }, [])

  const saveQuestionInProgress = useRef(false);

  const handleSaveQuestion = useCallback(() => {
    console.log('handleSaveQuestion called'); // Debug: check if called more than once per click
    if (saveQuestionInProgress.current) return;
    saveQuestionInProgress.current = true;
    setTimeout(() => { saveQuestionInProgress.current = false; }, 500); // reset after short delay

    if (!test || currentSectionIndex === null) return;

    // Validate question
    if (!questionForm.text.trim()) {
      toast.error("Question text is required")
      return
    }

    if (questionForm.type === "Multiple Choice") {
      const validOptions = questionForm.options?.filter((opt) => opt.trim()) || []
      if (validOptions.length < 2) {
        toast.error("At least 2 options are required for multiple choice questions")
        return
      }
      if (
        !questionForm.correctAnswer ||
        (typeof questionForm.correctAnswer === "string"
          ? !questionForm.correctAnswer.trim()
          : !questionForm.correctAnswer)
      ) {
        toast.error("Please select a correct answer by clicking the radio button")
        return
      }
      const correctAnswerStr =
        typeof questionForm.correctAnswer === "string"
          ? questionForm.correctAnswer
          : Array.isArray(questionForm.correctAnswer)
            ? questionForm.correctAnswer[0] || ""
            : ""
      if (!validOptions.includes(correctAnswerStr)) {
        toast.error("The selected correct answer is not valid. Please select from the available options.")
        return
      }
      console.log("MCQ Edit Validation passed:")
      console.log("- Question:", questionForm.text)
      console.log("- Options:", validOptions)
      console.log("- Correct Answer:", questionForm.correctAnswer)
    }

    if (questionForm.type === "Coding") {
      if (!questionForm.codeLanguage) {
        toast.error("Programming language is required")
        return
      }
      if (!questionForm.codeTemplate?.trim()) {
        toast.error("Code template is required for coding questions")
        return
      }
      if (!questionForm.testCases || questionForm.testCases.length === 0) {
        toast.error("At least one test case is required")
        return
      }
      for (const testCase of questionForm.testCases) {
        if (!testCase.input.trim() && !testCase.expectedOutput.trim()) {
          toast.error("Test cases must have input or expected output")
          return
        }
      }
    }

    setTest((prev) => {
      if (!prev) return prev
      // Deep clone sections and questions
      const updatedSections = prev.sections.map((section, idx) => ({
        ...section,
        questions: [...section.questions],
      }))

      if (editingQuestionIndex !== null) {
        // Update existing question
        const updatedQuestion = {
          ...questionForm,
          options:
            questionForm.type === "Multiple Choice"
              ? questionForm.options?.filter((opt) => opt.trim() !== "")
              : questionForm.options,
          correctAnswer:
            questionForm.type === "Multiple Choice" ? questionForm.correctAnswer : questionForm.correctAnswer || "",
          codeTemplate: questionForm.type === "Coding" ? questionForm.codeTemplate : undefined,
        }
        updatedSections[currentSectionIndex].questions[editingQuestionIndex] = updatedQuestion
        toast.success("Question updated successfully")
      } else {
        // Add new question - use the ID from questionForm (do not generate a new one)
        const questionToAdd = {
          ...questionForm,
          options:
            questionForm.type === "Multiple Choice"
              ? questionForm.options?.filter((opt) => opt.trim() !== "")
              : questionForm.options,
          correctAnswer:
            questionForm.type === "Multiple Choice" ? questionForm.correctAnswer : questionForm.correctAnswer || "",
          codeTemplate: questionForm.type === "Coding" ? questionForm.codeTemplate : undefined,
        }
        // Prevent duplicate by ID
        const alreadyExists = updatedSections[currentSectionIndex].questions.some(q => q.id === questionToAdd.id)
        if (!alreadyExists) {
          updatedSections[currentSectionIndex].questions = [
            ...updatedSections[currentSectionIndex].questions,
            questionToAdd
          ]
          toast.success("Question added successfully")
        } else {
          toast.error("Duplicate question detected. Not adding.")
        }
      }
      // Reset dialog and form state immediately after add
      setShowQuestionDialog(false)
      setCurrentSectionIndex(null)
      setEditingQuestion(null)
      setEditingQuestionIndex(null)
      setQuestionForm({
        id: "",
        text: "",
        type: "Multiple Choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        explanation: "",
      })
      return {
        ...prev,
        sections: updatedSections,
      }
    })
  }, [test, currentSectionIndex, questionForm, editingQuestionIndex])

  const handleSaveTest = useCallback(async () => {
    try {
      if (!test) return

      setIsSaving(true)

      // Validate test data
      if (!test.name) {
        toast.error("Test name is required")
        return
      }

      if (test.duration <= 0) {
        toast.error("Test duration must be greater than 0")
        return
      }

      if (test.passingScore < 0 || test.passingScore > 100) {
        toast.error("Passing score must be between 0 and 100")
        return
      }

      // Validate sections
      for (const section of test.sections) {
        if (!section.title) {
          toast.error("Section title is required")
          return
        }
      }

      // FIXED: Prepare the data to be sent - ensure settings are properly structured
      const testDataToSave = {
        ...test,
        settings: {
          shuffleQuestions: Boolean(test.settings.shuffleQuestions),
          preventTabSwitching: Boolean(test.settings.preventTabSwitching),
          allowCalculator: Boolean(test.settings.allowCalculator),
          allowCodeEditor: Boolean(test.settings.allowCodeEditor),
          autoSubmit: Boolean(test.settings.autoSubmit),
        },
      }

      console.log("Saving test data:", testDataToSave) // Debug log

      const response = await fetch(`/api/assessment/tests/${testId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testDataToSave),
      })

      const data = await response.json()
      console.log("Save response:", data) // Debug log

      if (response.ok && data.success) {
        toast.success("Test updated successfully")
        // Force a refresh of the test data to ensure we have the latest from the database
        await fetchTest()
        // Navigate back to the test overview
        router.push(`/employee/assessment/tests/${testId}`)
      } else {
        throw new Error(data.message || "Failed to update test")
      }
    } catch (error) {
      console.error("Error saving test:", error)
      toast.error((error as Error).message || "Failed to save test. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [test, testId, fetchTest, router])

  // Memoized calculations to prevent unnecessary re-renders
  const totalQuestions = useMemo(() => {
    return test?.sections.reduce((total, section) => total + section.questions.length, 0) || 0
  }, [test?.sections])

  const renderQuestionForm = useCallback(() => {
    if (questionForm.type === "Multiple Choice") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text *</Label>
            <Textarea
              id="question-text"
              value={questionForm.text}
              onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              placeholder="Enter your question"
              rows={3}
            />
          </div>
          <div>
            <Label>Options *</Label>
            <div className="space-y-2">
              {questionForm.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(questionForm.options || [])]
                      const oldValue = newOptions[index]
                      newOptions[index] = e.target.value

                      const currentCorrectAnswer =
                        typeof questionForm.correctAnswer === "string"
                          ? questionForm.correctAnswer
                          : Array.isArray(questionForm.correctAnswer)
                            ? questionForm.correctAnswer[0] || ""
                            : ""

                      if (currentCorrectAnswer === oldValue && e.target.value !== oldValue) {
                        setQuestionForm({
                          ...questionForm,
                          options: newOptions,
                          correctAnswer: "",
                        })
                      } else {
                        setQuestionForm({
                          ...questionForm,
                          options: newOptions,
                        })
                      }
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={
                      (typeof questionForm.correctAnswer === "string"
                        ? questionForm.correctAnswer
                        : Array.isArray(questionForm.correctAnswer)
                          ? questionForm.correctAnswer[0] || ""
                          : "") === option && option.trim() !== ""
                    }
                    onChange={() =>
                      option.trim() &&
                      setQuestionForm({
                        ...questionForm,
                        correctAnswer: option,
                      })
                    }
                    className="mt-3"
                    disabled={option.trim() === ""}
                  />
                  {questionForm.options && questionForm.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (questionForm.options && questionForm.options.length <= 2) {
                          toast.error("At least 2 options are required")
                          return
                        }
                        const newOptions = questionForm.options?.filter((_, i) => i !== index) || []
                        const currentCorrectAnswer =
                          typeof questionForm.correctAnswer === "string"
                            ? questionForm.correctAnswer
                            : Array.isArray(questionForm.correctAnswer)
                              ? questionForm.correctAnswer[0] || ""
                              : ""
                        const correctAnswer = currentCorrectAnswer === option ? "" : questionForm.correctAnswer
                        setQuestionForm({
                          ...questionForm,
                          options: newOptions,
                          correctAnswer,
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(questionForm.options || []), ""]
                  setQuestionForm({ ...questionForm, options: newOptions })
                }}
              >
                + Add Option
              </Button>
              <p className="text-sm text-muted-foreground mt-1">Select the radio button next to the correct answer</p>
              {questionForm.correctAnswer && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-700">
                    Correct answer selected: "
                    <strong>
                      {typeof questionForm.correctAnswer === "string"
                        ? questionForm.correctAnswer
                        : Array.isArray(questionForm.correctAnswer)
                          ? questionForm.correctAnswer[0] || ""
                          : ""}
                    </strong>
                    "
                  </p>
                </div>
              )}
              {!questionForm.correctAnswer && questionForm.options?.some((opt) => opt.trim()) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-700">Please select the correct answer by clicking a radio button</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: Number.parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
        </div>
      )
    }

    if (questionForm.type === "Coding") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Problem Statement *</Label>
            <Textarea
              id="question-text"
              value={questionForm.text}
              onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              placeholder="Describe the coding problem (supports Markdown & HTML)"
              rows={4}
            />
            {/* Markdown Preview for Coding Question Text */}
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <span className="text-xs text-muted-foreground mb-1 block">Preview:</span>
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{questionForm.text || ""}</ReactMarkdown>
            </div>
          </div>
          <div>
            <Label htmlFor="coding-instructions">Instructions *</Label>
            <Textarea
              id="coding-instructions"
              value={questionForm.instructions || ""}
              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  instructions: e.target.value,
                })
              }
              placeholder="Provide specific instructions for the coding task. You can use Markdown for formatting and images (e.g. ![alt](url)). Or <img src='image-address' alt='graph' width='xxx' height='xxx' />"
              rows={3}
            />
            {/* Markdown Preview */}
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <span className="text-xs text-muted-foreground mb-1 block">Preview:</span>
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{questionForm.instructions || ""}</ReactMarkdown>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code-language">Programming Language *</Label>
              <select
                id="code-language"
                value={questionForm.codeLanguage || "javascript"}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    codeLanguage: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="php">PHP</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>
            <div>
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: Number.parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="code-template">Code Template</Label>
            <div className="mt-2">
              <AdvancedCodeEditor
                value={questionForm.codeTemplate || ""}
                onChange={handleCodeTemplateChange}
                language={questionForm.codeLanguage || "javascript"}
                showConsole={false}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Test Cases *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTestCase = {
                    id: ((questionForm.testCases?.length || 0) + 1).toString(),
                    input: "",
                    expectedOutput: "",
                    isHidden: false,
                  }
                  const newTestCases = [...(questionForm.testCases || []), newTestCase]
                  setQuestionForm({ ...questionForm, testCases: newTestCases })
                }}
              >
                + Add Test Case
              </Button>
            </div>
            <div className="space-y-3">
              {questionForm.testCases?.map((testCase, index) => (
                <div key={index} className="border p-4 rounded-md bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Test Case {index + 1}</span>
                    {questionForm.testCases && questionForm.testCases.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          const newTestCases = questionForm.testCases?.filter((_, i) => i !== index) || []
                          setQuestionForm({
                            ...questionForm,
                            testCases: newTestCases,
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label htmlFor={`input-${index}`}>Input</Label>
                      <Textarea
                        id={`input-${index}`}
                        value={testCase.input}
                        onChange={(e) => {
                          const newTestCases = [...(questionForm.testCases || [])]
                          newTestCases[index].input = e.target.value
                          setQuestionForm({
                            ...questionForm,
                            testCases: newTestCases,
                          })
                        }}
                        placeholder="Test input"
                        rows={2}
                        className="text-sm font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`output-${index}`}>Expected Output</Label>
                      <Textarea
                        id={`output-${index}`}
                        value={testCase.expectedOutput}
                        onChange={(e) => {
                          const newTestCases = [...(questionForm.testCases || [])]
                          newTestCases[index].expectedOutput = e.target.value
                          setQuestionForm({
                            ...questionForm,
                            testCases: newTestCases,
                          })
                        }}
                        placeholder="Expected output"
                        rows={2}
                        className="text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (questionForm.type === "Written Answer") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text *</Label>
            <Textarea
              id="question-text"
              value={questionForm.text}
              onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              placeholder="Enter your question"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-words">Maximum Words</Label>
              <Input
                id="max-words"
                type="number"
                min="50"
                value={questionForm.maxWords || 500}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    maxWords: Number.parseInt(e.target.value) || 500,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: Number.parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
          </div>
        </div>
      )
    }

    return null
  }, [questionForm, handleCodeTemplateChange])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Test Not Found</h1>
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
          <h1 className="text-3xl font-bold">Edit Test</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/employee/assessment/tests/${testId}/preview`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveTest} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Basic information about the test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-name">Test Name</Label>
                  <Input
                    id="test-name"
                    value={test.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter test name"
                  />
                </div>
                <div>
                  <Label htmlFor="test-description">Description</Label>
                  <Textarea
                    id="test-description"
                    value={test.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter test description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-type">Test Type</Label>
                    <select
                      id="test-type"
                      value={test.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="QA">QA</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Data">Data</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="test-duration">Test Duration (minutes)</Label>
                    <Input
                      id="test-duration"
                      type="number"
                      min="1"
                      value={test.duration}
                      onChange={(e) => handleInputChange("duration", Number.parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Total time for the complete assessment</p>
                  </div>
                  <div>
                    <Label htmlFor="test-passing-score">Passing Score (%)</Label>
                    <Input
                      id="test-passing-score"
                      type="number"
                      min="0"
                      max="100"
                      value={test.passingScore}
                      onChange={(e) => handleInputChange("passingScore", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="test-instructions">Test Instructions</Label>
                  <Textarea
                    id="test-instructions"
                    value={test.instructions}
                    onChange={(e) => handleInputChange("instructions", e.target.value)}
                    placeholder="Enter instructions for test takers"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Sections</CardTitle>
                <CardDescription>Organize your test into sections</CardDescription>
              </div>
              <Button onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {test.sections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No sections added yet. Add a section to get started.</p>
                    <Button onClick={handleAddSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                ) : (
                  test.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Section {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                          <Input
                            id={`section-title-${index}`}
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, "title", e.target.value)}
                            placeholder="Enter section title"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`section-type-${index}`}>Question Type</Label>
                          <select
                            id={`section-type-${index}`}
                            value={section.questionType}
                            onChange={(e) => handleSectionChange(index, "questionType", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="Multiple Choice">Multiple Choice</option>
                            <option value="Written Answer">Written Answer</option>
                            <option value="Coding">Coding</option>
                          </select>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm font-medium">Questions: </span>
                              <span className="text-sm text-muted-foreground">
                                {section.questions.length} questions in this section
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleAddQuestion(index)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </div>
                          {section.questions.length > 0 && (
                            <div className="space-y-2">
                              {section.questions.map((question, qIndex) => (
                                <div
                                  key={`${section.id}-${question.id}-${qIndex}-${question.text.substring(0, 10)}`}
                                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                                >
                                  <div className="flex items-center gap-3">
                                    {question.type === "Multiple Choice" && <CheckSquare className="h-4 w-4" />}
                                    {question.type === "Coding" && <Code className="h-4 w-4" />}
                                    {question.type === "Written Answer" && <FileText className="h-4 w-4" />}
                                    <div>
                                      <p className="text-sm font-medium">
                                        Q{qIndex + 1}:{" "}
                                        {question.text.length > 50
                                          ? `${question.text.substring(0, 50)}...`
                                          : question.text}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {question.type} • {question.points} points
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(index, qIndex)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteQuestion(index, qIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Settings</CardTitle>
              <CardDescription>Configure how the test behaves</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="shuffle-questions" className="block text-sm font-medium text-gray-700">
                      Shuffle Questions
                    </label>
                    <p className="text-xs text-gray-500">Randomize question order for each candidate</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="shuffle-questions"
                      checked={Boolean(test.settings.shuffleQuestions)}
                      onChange={(e) => handleTestSettingsChange("shuffleQuestions", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="prevent-tab-switching" className="block text-sm font-medium text-gray-700">
                      Prevent Tab Switching
                    </label>
                    <p className="text-xs text-gray-500">Alert when candidate tries to switch tabs</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="prevent-tab-switching"
                      checked={Boolean(test.settings.preventTabSwitching)}
                      onChange={(e) => handleTestSettingsChange("preventTabSwitching", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="allow-calculator" className="block text-sm font-medium text-gray-700">
                      Allow Calculator
                    </label>
                    <p className="text-xs text-gray-500">Provide a calculator tool for candidates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="allow-calculator"
                      checked={Boolean(test.settings.allowCalculator)}
                      onChange={(e) => handleTestSettingsChange("allowCalculator", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="allow-code-editor" className="block text-sm font-medium text-gray-700">
                      Allow Code Editor
                    </label>
                    <p className="text-xs text-gray-500">Enable advanced code editor for coding questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="allow-code-editor"
                      checked={Boolean(test.settings.allowCodeEditor)}
                      onChange={(e) => handleTestSettingsChange("allowCodeEditor", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="auto-submit" className="block text-sm font-medium text-gray-700">
                      Auto Submit
                    </label>
                    <p className="text-xs text-gray-500">Submit test when time expires</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="auto-submit"
                      checked={Boolean(test.settings.autoSubmit)}
                      onChange={(e) => handleTestSettingsChange("autoSubmit", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>Overview of test configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Duration:</span>
                  <span className="font-medium">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sections:</span>
                  <span className="font-medium">{test.sections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passing Score:</span>
                  <span className="font-medium">{test.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shuffle Questions:</span>
                  <span className="font-medium">{test.settings.shuffleQuestions ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tab Switching:</span>
                  <span className="font-medium">{test.settings.preventTabSwitching ? "Blocked" : "Allowed"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calculator:</span>
                  <span className="font-medium">{test.settings.allowCalculator ? "Allowed" : "Not Allowed"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Code Editor:</span>
                  <span className="font-medium">{test.settings.allowCodeEditor ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Submit:</span>
                  <span className="font-medium">{test.settings.autoSubmit ? "Yes" : "No"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSaveTest} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Delete Section Dialog */}
      <Dialog open={showDeleteSectionDialog} onOpenChange={setShowDeleteSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This will also delete all questions in this section. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteSectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSection}>
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={(open) => {
        if (!open) setShowQuestionDialog(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              {questionForm.type === "Multiple Choice" && "Create a multiple choice question with options"}
              {questionForm.type === "Coding" && "Create a coding problem with test cases"}
              {questionForm.type === "Written Answer" && "Create a written answer question"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">{renderQuestionForm()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)} type="button">
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} type="button">{editingQuestion ? "Update Question" : "Add Question"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
