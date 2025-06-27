"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Settings,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  Terminal,
  TestTube,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react"
import { toast } from "sonner"

interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isHidden?: boolean
}

interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  executionTime?: number
  memoryUsed?: number
  testCaseResults?: TestCaseResult[]
}

interface TestCaseResult {
  testCaseId: string
  passed: boolean
  actualOutput: string
  expectedOutput: string
  executionTime: number
}

interface TestCaseExecution {
  testCaseId: string
  testCaseIndex: number
  result: TestCaseResult
  timestamp: Date
}

interface CodeEditorProps {
  value?: string
  onChange?: (value: string) => void
  language?: string
  onLanguageChange?: (language: string) => void
  readOnly?: boolean
  showConsole?: boolean
  testCases?: TestCase[]
  onRunCode?: (code: string, language: string, input?: string) => Promise<ExecutionResult>
  className?: string
  // Add props for persistence
  questionId?: string
  onTestCaseResults?: (questionId: string, results: TestCaseExecution[]) => void
  initialTestCaseResults?: TestCaseExecution[]
}

const SUPPORTED_LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript",
    extension: "js",
    pistonLang: "javascript",
    version: "18.15.0",
    template: `// JavaScript Solution
function solution(input) {
    // Write your code here
    console.log("Hello World");
    return "Hello World";
}

// Test the function
solution("");`,
  },
  {
    value: "python",
    label: "Python",
    extension: "py",
    pistonLang: "python",
    version: "3.10.0",
    template: `# Python Solution
def solution(input_data):
    # Write your code here
    print("Hello World")
    return "Hello World"

# Test the function
if __name__ == "__main__":
    solution("")`,
  },
  {
    value: "java",
    label: "Java",
    extension: "java",
    pistonLang: "java",
    version: "15.0.2",
    template: `// Java Solution
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your code here
        System.out.println("Hello World");
    }
    
    public static String solution(String input) {
        // Write your solution here
        return "Hello World";
    }
}`,
  },
  {
    value: "cpp",
    label: "C++",
    extension: "cpp",
    pistonLang: "cpp",
    version: "10.2.0",
    template: `// C++ Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello World" << endl;
    return 0;
}`,
  },
  {
    value: "c",
    label: "C",
    extension: "c",
    pistonLang: "c",
    version: "10.2.0",
    template: `// C Solution
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your code here
    printf("Hello World\\n");
    return 0;
}`,
  },
  {
    value: "php",
    label: "PHP",
    extension: "php",
    pistonLang: "php",
    version: "8.2.3",
    template: `<?php
// PHP Solution
function solution($input) {
    // Write your code here
    echo "Hello World";
    return "Hello World";
}

// Test the function
solution("");
?>`,
  },
  {
    value: "rust",
    label: "Rust",
    extension: "rs",
    pistonLang: "rust",
    version: "1.68.2",
    template: `// Rust Solution
fn solution(input: &str) -> String {
    // Write your code here
    println!("Hello World");
    String::from("Hello World")
}

fn main() {
    // Test the function
    solution("");
}`,
  },
  {
    value: "go",
    label: "Go",
    extension: "go",
    pistonLang: "go",
    version: "1.16.2",
    template: `// Go Solution
package main

import "fmt"

func solution(input string) string {
    // Write your code here
    fmt.Println("Hello World")
    return "Hello World"
}

func main() {
    // Test the function
    solution("")
}`,
  },
]

export function AdvancedCodeEditor({
  value = "",
  onChange,
  language = "javascript",
  onLanguageChange,
  readOnly = false,
  showConsole = true,
  testCases = [],
  onRunCode,
  className = "",
  questionId,
  onTestCaseResults,
  initialTestCaseResults = [],
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [customInput, setCustomInput] = useState("")
  const [activeTab, setActiveTab] = useState("output")
  const [showSettings, setShowSettings] = useState(false)
  const [code, setCode] = useState(value)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const [lineNumbers, setLineNumbers] = useState(true)

  // Add this new state for question-specific test case storage
  const [questionTestCaseResults, setQuestionTestCaseResults] = useState<Record<string, TestCaseExecution[]>>({})

  // Enhanced state for persistent test case execution
  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState(0)
  const [testCaseExecutions, setTestCaseExecutions] = useState<TestCaseExecution[]>(initialTestCaseResults)
  const [executionMode, setExecutionMode] = useState<"single" | "all">("single")
  const [currentExecutingTestCase, setCurrentExecutingTestCase] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // Get current language configuration
  const currentLang = SUPPORTED_LANGUAGES.find((lang) => lang.value === currentLanguage) || SUPPORTED_LANGUAGES[0]

  // Initialize with template if no value provided
  useEffect(() => {
    if (!value && !code) {
      const template = currentLang.template
      setCode(template)
      if (onChange) {
        onChange(template)
      }
    }
  }, [])

  // Load initial test case results when component mounts or questionId changes
  useEffect(() => {
    if (questionId && initialTestCaseResults.length > 0) {
      setTestCaseExecutions(initialTestCaseResults)
    }
  }, [questionId, initialTestCaseResults])

  // Persist test case results when they change
  useEffect(() => {
    if (questionId && onTestCaseResults && testCaseExecutions.length > 0) {
      onTestCaseResults(questionId, testCaseExecutions)
    }
  }, [questionId, testCaseExecutions, onTestCaseResults])

  // Update line numbers when code changes
  useEffect(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      const lines = code.split("\n").length
      const lineNumbersContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n")
      lineNumbersRef.current.textContent = lineNumbersContent
    }
  }, [code])

  // Sync scroll between textarea and line numbers
  useEffect(() => {
    const textarea = textareaRef.current
    const lineNumbersDiv = lineNumbersRef.current

    if (!textarea || !lineNumbersDiv) return

    const handleScroll = () => {
      lineNumbersDiv.scrollTop = textarea.scrollTop
    }

    textarea.addEventListener("scroll", handleScroll)
    return () => textarea.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            handleDownload()
            break
          case "Enter":
            e.preventDefault()
            handleRunCode()
            break
        }
      }

      // Handle Tab key for indentation
     if (e.key === "Tab" && textareaRef.current === document.activeElement) {
  e.preventDefault()
  const textarea = textareaRef.current
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const spaces = "  " // 2 spaces

        const newValue = code.substring(0, start) + spaces + code.substring(end)
        setCode(newValue)
        if (onChange) {
          onChange(newValue)
        }

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [code, onChange])

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      const newLangConfig = SUPPORTED_LANGUAGES.find((lang) => lang.value === newLanguage)
      if (!newLangConfig) return

      setCurrentLanguage(newLanguage)

      if (onLanguageChange) {
        onLanguageChange(newLanguage)
      }

      // Change template if current code is empty or matches current template
      const currentTemplate = currentLang.template
      const newTemplate = newLangConfig.template

      if (!code.trim() || code === currentTemplate) {
        setCode(newTemplate)
        if (onChange) {
          onChange(newTemplate)
        }
        toast.success(`Switched to ${newLangConfig.label}`)
      }
    },
    [currentLanguage, code, onChange, onLanguageChange, currentLang.template],
  )

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    if (onChange) {
      onChange(newCode)
    }
  }

  const executeTestCase = async (testCaseIndex: number): Promise<TestCaseResult> => {
    const testCase = testCases[testCaseIndex]

    if (onRunCode) {
      const result = await onRunCode(code, currentLanguage, testCase.input)
      return {
        testCaseId: testCase.id,
        passed: result.output.trim() === testCase.expectedOutput.trim(),
        actualOutput: result.output,
        expectedOutput: testCase.expectedOutput,
        executionTime: result.executionTime || 0,
      }
    } else {
      const response = await fetch("/api/code/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: currentLang.pistonLang,
          version: currentLang.version,
          input: testCase.input,
          testCases: [testCase], // Only send current test case
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      return {
        testCaseId: testCase.id,
        passed: result.output?.trim() === testCase.expectedOutput.trim(),
        actualOutput: result.output || "",
        expectedOutput: testCase.expectedOutput,
        executionTime: result.executionTime || 0,
      }
    }
  }

  // Add this useEffect after the existing useEffects (around line 150)
  useEffect(() => {
    if (questionId) {
      const currentQuestionKey = questionId
      const currentQuestionResults = questionTestCaseResults[currentQuestionKey] || []
      setTestCaseExecutions(currentQuestionResults)
    }
  }, [questionId, questionTestCaseResults])

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first")
      return
    }

    setIsRunning(true)
    setActiveTab("testcases")

    try {
      if (testCases.length === 0) {
        // Run with custom input if no test cases
        let result: ExecutionResult

        if (onRunCode) {
          result = await onRunCode(code, currentLanguage, customInput)
        } else {
          const response = await fetch("/api/code/execute", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              language: currentLang.pistonLang,
              version: currentLang.version,
              input: customInput,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          result = await response.json()
        }

        setExecutionResult(result)
        setActiveTab("output")
      } else {
        // Get current question-specific results
        const currentQuestionKey = questionId || "default"
        const currentQuestionResults = questionTestCaseResults[currentQuestionKey] || []

        if (executionMode === "single") {
          // Execute current test case only
          setCurrentExecutingTestCase(currentTestCaseIndex)

          // Execute the specific test case
          let rawResult: ExecutionResult
          if (onRunCode) {
            rawResult = await onRunCode(code, currentLanguage, testCases[currentTestCaseIndex].input)
          } else {
            const response = await fetch("/api/code/execute", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code,
                language: currentLang.pistonLang,
                version: currentLang.version,
                input: testCases[currentTestCaseIndex].input,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
              throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            rawResult = await response.json()
          }

          // Set the raw execution result for the Output tab
          setExecutionResult(rawResult)

          // Create test case result for this specific test case
          const testCaseResult: TestCaseResult = {
            testCaseId: testCases[currentTestCaseIndex].id,
            passed: rawResult.output?.trim() === testCases[currentTestCaseIndex].expectedOutput.trim(),
            actualOutput: rawResult.output || "",
            expectedOutput: testCases[currentTestCaseIndex].expectedOutput,
            executionTime: rawResult.executionTime || 0,
          }

          // Create execution record
          const execution: TestCaseExecution = {
            testCaseId: testCases[currentTestCaseIndex].id,
            testCaseIndex: currentTestCaseIndex,
            result: testCaseResult,
            timestamp: new Date(),
          }

          // Update question-specific results
          const updatedQuestionResults = [
            ...currentQuestionResults.filter((exec) => exec.testCaseIndex !== currentTestCaseIndex),
            execution,
          ].sort((a, b) => a.testCaseIndex - b.testCaseIndex)

          setQuestionTestCaseResults((prev) => ({
            ...prev,
            [currentQuestionKey]: updatedQuestionResults,
          }))

          // Update the main testCaseExecutions for display
          setTestCaseExecutions(updatedQuestionResults)

          // Store results in parent component if available
          if (onChange && questionId) {
            // Create coding test results array for this question
            const codingResults = testCases.map((testCase, index) => {
              const execution = updatedQuestionResults.find((exec) => exec.testCaseIndex === index)
              if (execution) {
                return {
                  input: testCase.input,
                  expectedOutput: execution.result.expectedOutput,
                  actualOutput: execution.result.actualOutput,
                  passed: execution.result.passed,
                }
              }
              return {
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: "Not executed",
                passed: false,
              }
            })

            // Update the question's test case results
            if (typeof onChange === "function") {
              // This is a bit of a hack, but we need to store the results somewhere accessible
              // We'll store it in a global variable or pass it through a callback
              console.log(`Storing coding results for question ${questionId}:`, codingResults)
            }
          }

          // Move to next test case for next execution
          setCurrentTestCaseIndex((prev) => (prev + 1) % testCases.length)

          toast.success(
            `Test Case ${currentTestCaseIndex + 1} ${testCaseResult.passed ? "Passed" : "Failed"} - Next: Test Case ${((currentTestCaseIndex + 1) % testCases.length) + 1}`,
          )
        } else {
          // Execute all test cases
          const allResults: TestCaseResult[] = []
          let lastRawResult: ExecutionResult | null = null
          const newExecutions: TestCaseExecution[] = []

          for (let i = 0; i < testCases.length; i++) {
            setCurrentExecutingTestCase(i)

            // Get raw output for each test case
            let rawResult: ExecutionResult
            if (onRunCode) {
              rawResult = await onRunCode(code, currentLanguage, testCases[i].input)
            } else {
              const response = await fetch("/api/code/execute", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code,
                  language: currentLang.pistonLang,
                  version: currentLang.version,
                  input: testCases[i].input,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
              }

              rawResult = await response.json()
            }

            // Store the last execution result for the Output tab
            lastRawResult = rawResult

            const result: TestCaseResult = {
              testCaseId: testCases[i].id,
              passed: rawResult.output?.trim() === testCases[i].expectedOutput.trim(),
              actualOutput: rawResult.output || "",
              expectedOutput: testCases[i].expectedOutput,
              executionTime: rawResult.executionTime || 0,
            }

            allResults.push(result)

            // Add to execution history
            const execution: TestCaseExecution = {
              testCaseId: testCases[i].id,
              testCaseIndex: i,
              result,
              timestamp: new Date(),
            }

            newExecutions.push(execution)
          }

          // Update question-specific results
          setQuestionTestCaseResults((prev) => ({
            ...prev,
            [currentQuestionKey]: newExecutions,
          }))

          // Update display results
          setTestCaseExecutions(newExecutions)

          // Set the last execution result for the Output tab
          if (lastRawResult) {
            setExecutionResult(lastRawResult)
          }

          const passedCount = allResults.filter((r) => r.passed).length
          toast.success(`All test cases executed: ${passedCount}/${testCases.length} passed`)

          // Switch to test cases tab for "all" mode
          setActiveTab("testcases")
        }
      }
    } catch (error) {
      console.error("Execution error:", error)

      let errorMessage = "Failed to execute code. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      setExecutionResult({
        success: false,
        output: "",
        error: errorMessage,
      })
      toast.error("Code execution failed")
    } finally {
      setIsRunning(false)
      setCurrentExecutingTestCase(null)
    }
  }

  const handleStopExecution = () => {
    setIsRunning(false)
    setCurrentExecutingTestCase(null)
    toast.info("Execution stopped")
  }

  const handleReset = () => {
    const template = currentLang.template
    setCode(template)
    if (onChange) {
      onChange(template)
    }
    setExecutionResult(null)
    setCustomInput("")
    setTestCaseExecutions([])
    setCurrentTestCaseIndex(0)
    toast.success("Code reset to template")
  }

  const handleResetTestCases = () => {
    setTestCaseExecutions([])
    setCurrentTestCaseIndex(0)
    toast.success("Test case progress reset")
  }

  const handleDownload = () => {
    const filename = `solution.${currentLang.extension}`
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Code downloaded as ${filename}`)
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCode(content)
      if (onChange) {
        onChange(content)
      }
      toast.success("File uploaded successfully")
    }
    reader.readAsText(file)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const navigateTestCase = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentTestCaseIndex((prev) => (prev - 1 + testCases.length) % testCases.length)
    } else {
      setCurrentTestCaseIndex((prev) => (prev + 1) % testCases.length)
    }
  }

  const jumpToTestCase = (index: number) => {
    setCurrentTestCaseIndex(index)
  }

  // Get execution stats
  const executionStats = {
    total: testCases.length,
    executed: testCaseExecutions.length,
    passed: testCaseExecutions.filter((exec) => exec.result.passed).length,
    failed: testCaseExecutions.filter((exec) => exec.result.passed === false).length,
  }

  // Fullscreen styles with proper viewport dimensions
  const fullscreenStyles = isFullscreen
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "hsl(var(--background))",
        padding: "1rem",
      }
    : {}

  return (
    <div className={className} style={fullscreenStyles}>
      <Card
        className="w-full h-full flex flex-col overflow-hidden"
        style={{
          height: isFullscreen
            ? "calc(100vh - 2rem)"
            : window.innerWidth >= 1024
              ? "800px"
              : window.innerWidth >= 640
                ? "700px"
                : "600px",
        }}
      >
        <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Advanced Code Editor</span>
              <span className="sm:hidden">Code Editor</span>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {/* Make buttons smaller on mobile */}
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[100px] sm:min-w-[140px]"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>

              {/* Execution Mode Toggle */}
              {testCases.length > 0 && (
                <select
                  value={executionMode}
                  onChange={(e) => setExecutionMode(e.target.value as "single" | "all")}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="single">Single</option>
                  <option value="all">All Tests</option>
                </select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={isRunning ? handleStopExecution : handleRunCode}
                disabled={readOnly}
                className={`${isRunning ? "text-red-600" : "text-green-600"} text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2`}
              >
                {isRunning ? (
                  <>
                    <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">
                      {executionMode === "single" && testCases.length > 0
                        ? `Run Test ${currentTestCaseIndex + 1}`
                        : "Run"}
                    </span>
                    <span className="sm:hidden">Run</span>
                  </>
                )}
              </Button>

              {/* Rest of buttons with responsive sizing */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={readOnly}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>

              {testCases.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTestCases}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <RotateCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden md:inline">Reset Tests</span>
                  <span className="md:hidden">Reset</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Save</span>
              </Button>

              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Load</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="px-2 sm:px-3 py-1 sm:py-2"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="px-2 sm:px-3 py-1 sm:py-2">
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Test Case Navigation */}
          {testCases.length > 0 && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateTestCase("prev")} disabled={isRunning}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Test Case {currentTestCaseIndex + 1} of {testCases.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateTestCase("next")} disabled={isRunning}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {currentExecutingTestCase !== null && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing Test Case {currentExecutingTestCase + 1}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>Progress:</span>
                    <Badge variant="outline">
                      {executionStats.executed}/{executionStats.total}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      ✓ {executionStats.passed}
                    </Badge>
                    <Badge variant="destructive">✗ {executionStats.failed}</Badge>
                  </div>
                </div>
              </div>

              {/* Test Case Quick Navigation */}
              <div className="mt-3 flex flex-wrap gap-1">
                {testCases.map((_, index) => {
                  const execution = testCaseExecutions.find((exec) => exec.testCaseIndex === index)
                  const isActive = index === currentTestCaseIndex
                  const isExecuting = currentExecutingTestCase === index

                  return (
                    <Button
                      key={index}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => jumpToTestCase(index)}
                      disabled={isRunning}
                      className={`w-8 h-8 p-0 ${
                        execution
                          ? execution.result.passed
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : ""
                      } ${isExecuting ? "animate-pulse" : ""}`}
                    >
                      {isExecuting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : execution ? (
                        execution.result.passed ? (
                          "✓"
                        ) : (
                          "✗"
                        )
                      ) : (
                        index + 1
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {showSettings && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Font Size</Label>
                  <select
                    value={fontSize.toString()}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Line Numbers</Label>
                  <select
                    value={lineNumbers.toString()}
                    onChange={(e) => setLineNumbers(e.target.value === "true")}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">Show</option>
                    <option value="false">Hide</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Language Info</Label>
                  <div className="text-sm text-muted-foreground">
                    {currentLang.label} ({currentLang.version})
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-2 sm:p-4 min-h-0">
          <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0 overflow-hidden">
            {/* Code Editor Section */}
            <div
              className="border rounded-md overflow-hidden bg-slate-900 flex-1"
              style={{
                height: showConsole ? (window.innerWidth >= 1024 ? "100%" : "60%") : "100%",
                minHeight: "300px",
              }}
            >
              <div className="flex h-full">
                {/* Line Numbers */}
                {lineNumbers && (
                  <div
                    ref={lineNumbersRef}
                    className="bg-slate-800 text-slate-400 p-2 sm:p-4 text-sm font-mono select-none border-r border-slate-700 overflow-hidden"
                    style={{
                      width: "40px sm:60px",
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.5",
                      whiteSpace: "pre",
                    }}
                  />
                )}

                {/* Code Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    readOnly={readOnly}
                    className="w-full h-full p-2 sm:p-4 bg-slate-900 text-slate-100 font-mono resize-none border-none outline-none"
                    style={{
                      fontSize: `${Math.max(12, fontSize - (window.innerWidth < 640 ? 2 : 0))}px`,
                      lineHeight: "1.5",
                      tabSize: 2,
                    }}
                    placeholder="Start coding here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Console Section */}
            {showConsole && (
              <div
                className="border rounded-md overflow-hidden flex flex-col bg-background"
                style={{
                  height: window.innerWidth >= 1024 ? "100%" : "35%",
                  minHeight: "250px",
                  width: window.innerWidth >= 1024 ? "45%" : "100%",
                }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                  <div className="border-b flex-shrink-0 bg-muted/50">
                    <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                      <TabsTrigger
                        value="output"
                        className="rounded-none border-r data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4 py-2"
                      >
                        <Terminal className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Output</span>
                        <span className="sm:hidden">Out</span>
                      </TabsTrigger>
                      {testCases.length > 0 && (
                        <TabsTrigger
                          value="testcases"
                          className="rounded-none data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4 py-2"
                        >
                          <TestTube className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">
                            Test Cases ({executionStats.executed}/{executionStats.total})
                          </span>
                          <span className="sm:hidden">
                            Tests ({executionStats.executed}/{executionStats.total})
                          </span>
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="output" className="m-0 h-full">
                      <ScrollArea className="h-full">
                        <div className="p-2 sm:p-4 font-mono text-xs sm:text-sm">
                          {isRunning ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Executing code...</span>
                            </div>
                          ) : executionResult ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                  {executionResult.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={executionResult.success ? "text-green-600" : "text-red-600"}>
                                    {executionResult.success ? "Execution Successful" : "Execution Failed"}
                                  </span>
                                </div>
                                {executionResult.executionTime && (
                                  <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{executionResult.executionTime}ms</span>
                                    </div>
                                    {executionResult.memoryUsed && (
                                      <div className="flex items-center space-x-1">
                                        <MemoryStick className="h-3 w-3" />
                                        <span>{executionResult.memoryUsed}KB</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {executionResult.error && (
                                <div className="text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                                  <div className="text-sm font-medium mb-1">Error:</div>
                                  <pre className="whitespace-pre-wrap text-xs sm:text-sm overflow-x-auto">
                                    {executionResult.error}
                                  </pre>
                                </div>
                              )}

                              {executionResult.output && (
                                <div>
                                  <div className="text-sm font-medium mb-2">Output:</div>
                                  <pre className="whitespace-pre-wrap bg-muted p-3 rounded border text-xs sm:text-sm overflow-x-auto max-h-40 sm:max-h-60">
                                    {executionResult.output}
                                  </pre>
                                </div>
                              )}

                              {!executionResult.output && !executionResult.error && (
                                <div className="text-muted-foreground text-xs sm:text-sm">
                                  No output generated. Make sure your code produces output (e.g., console.log, print,
                                  etc.)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs sm:text-sm">
                              Click "Run" to execute your code or use Ctrl+Enter
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    {testCases.length > 0 && (
                      <TabsContent value="testcases" className="m-0 h-full">
                        <ScrollArea className="h-full">
                          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
                            {/* Current Test Case Display */}
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 sm:p-4">
                              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                                  Current Test Case {currentTestCaseIndex + 1}
                                </h3>
                                <Badge variant="outline" className="border-blue-300 text-xs">
                                  {executionMode === "single" ? "Next to Execute" : "Selected"}
                                </Badge>
                              </div>

                              <div className="space-y-3 text-xs sm:text-sm">
                                {!testCases[currentTestCaseIndex]?.isHidden && (
                                  <>
                                    <div>
                                      <span className="font-medium">Input:</span>
                                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border max-h-20 sm:max-h-32">
                                        {testCases[currentTestCaseIndex]?.input === ""
                                          ? "(empty input)"
                                          : testCases[currentTestCaseIndex]?.input}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="font-medium">Expected Output:</span>
                                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border max-h-20 sm:max-h-32">
                                        {testCases[currentTestCaseIndex]?.expectedOutput}
                                      </pre>
                                    </div>
                                  </>
                                )}

                                {testCases[currentTestCaseIndex]?.isHidden && (
                                  <div className="text-muted-foreground">
                                    🔒 This is a hidden test case. Input and expected output are not shown.
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Execution History */}
                            <div>
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Execution History</h3>
                              {testCaseExecutions.length === 0 ? (
                                <div className="text-muted-foreground text-xs sm:text-sm text-center py-6 sm:py-8">
                                  No test cases executed yet. Click "Run" to start testing.
                                </div>
                              ) : (
                                <div className="space-y-2 sm:space-y-3">
                                  {testCaseExecutions
                                    .sort((a, b) => a.testCaseIndex - b.testCaseIndex)
                                    .map((execution, index) => (
                                      <div
                                        key={`${execution.testCaseId}-${execution.timestamp.getTime()}`}
                                        className="border rounded-md p-2 sm:p-3 bg-muted/50"
                                      >
                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                          <span className="font-medium text-xs sm:text-sm">
                                            Test Case {execution.testCaseIndex + 1}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={execution.result.passed ? "default" : "destructive"}
                                              className="text-xs"
                                            >
                                              {execution.result.passed ? "✓ Passed" : "✗ Failed"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {execution.timestamp.toLocaleTimeString()}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                          {!testCases[execution.testCaseIndex]?.isHidden && (
                                            <>
                                              <div>
                                                <span className="font-medium">Input:</span>
                                                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24">
                                                  {testCases[execution.testCaseIndex]?.input === ""
                                                    ? "(empty input)"
                                                    : testCases[execution.testCaseIndex]?.input}
                                                </pre>
                                              </div>
                                              <div>
                                                <span className="font-medium">Expected Output:</span>
                                                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24">
                                                  {execution.result.expectedOutput}
                                                </pre>
                                              </div>
                                            </>
                                          )}

                                          <div>
                                            <span className="font-medium">Your Output:</span>
                                            <pre
                                              className={`mt-1 p-2 rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24 ${
                                                execution.result.passed
                                                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                              }`}
                                            >
                                              {execution.result.actualOutput === ""
                                                ? "(empty output)"
                                                : execution.result.actualOutput}
                                            </pre>
                                          </div>

                                          {execution.result.executionTime && (
                                            <div className="text-xs text-muted-foreground">
                                              Execution time: {execution.result.executionTime}ms
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    )}
                  </div>
                </Tabs>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          <div className="text-xs text-muted-foreground flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
                <span className="hidden sm:inline">Shortcuts: Ctrl+Enter (Run), Ctrl+S (Save), Tab (Indent)</span>
                <span className="sm:hidden">Ctrl+Enter: Run</span>
                <span>Lines: {code.split("\n").length}</span>
                <span className="hidden sm:inline">Characters: {code.length}</span>
                <span className="hidden md:inline">Language: {currentLang.label}</span>
                {testCases.length > 0 && (
                  <span>
                    Next: {currentTestCaseIndex + 1}/{testCases.length}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Cpu className="h-3 w-3" />
                <span>{isRunning ? "Running..." : "Ready"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".js,.ts,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.html,.css,.sql,.json,.xml,.yaml,.md,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
