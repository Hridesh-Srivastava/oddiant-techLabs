"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
  input: string
}

interface CodeSubmission {
  code: string
  language: string
  timestamp: Date
  results: TestCaseResult[]
  allPassed: boolean
  passedCount: number
  totalCount: number
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
  questionId?: string
  onTestCaseResults?: (questionId: string, results: CodeSubmission[]) => void
  initialTestCaseResults?: CodeSubmission[]
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

  // Store all code submissions for this question
  const [codeSubmissions, setCodeSubmissions] = useState<CodeSubmission[]>(initialTestCaseResults)
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(questionId || null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // FIXED: Memoize current language configuration to prevent recalculation
  const currentLang = useMemo(
    () => SUPPORTED_LANGUAGES.find((lang) => lang.value === currentLanguage) || SUPPORTED_LANGUAGES[0],
    [currentLanguage],
  )

  // FIXED: Memoize execution stats to prevent recalculation
  const executionStats = useMemo(() => {
    const latestSubmission = codeSubmissions[codeSubmissions.length - 1]
    return latestSubmission
      ? {
          total: latestSubmission.totalCount,
          passed: latestSubmission.passedCount,
          failed: latestSubmission.totalCount - latestSubmission.passedCount,
          allPassed: latestSubmission.allPassed,
        }
      : {
          total: testCases.length,
          passed: 0,
          failed: 0,
          allPassed: false,
        }
  }, [codeSubmissions, testCases.length])

  // FIXED: Initialize with template only once when component mounts
  useEffect(() => {
    if (!value && !code) {
      const template = currentLang.template
      setCode(template)
      if (onChange) {
        onChange(template)
      }
    }
  }, []) // Empty dependency array - only run once

  // FIXED: Sync with parent value prop when it changes (but prevent loops)
  useEffect(() => {
    if (value !== undefined && value !== code) {
      setCode(value)
    }
  }, [value]) // Only depend on value, not code

  // FIXED: Handle question changes properly without causing loops
  useEffect(() => {
    if (questionId !== currentQuestionId) {
      setCurrentQuestionId(questionId || null)

      if (questionId) {
        // Only update if initialTestCaseResults is different
        setCodeSubmissions((prev) => {
          const newResults = initialTestCaseResults || []
          // Compare arrays to prevent unnecessary updates
          if (JSON.stringify(prev) !== JSON.stringify(newResults)) {
            return [...newResults]
          }
          return prev
        })
        setExecutionResult(null)
      } else {
        setCodeSubmissions([])
        setExecutionResult(null)
      }
    }
  }, [questionId, currentQuestionId]) // Removed initialTestCaseResults from deps

  // FIXED: Update initial test case results only when they actually change
  useEffect(() => {
    if (questionId && JSON.stringify(initialTestCaseResults) !== JSON.stringify(codeSubmissions)) {
      setCodeSubmissions([...initialTestCaseResults])
    }
  }, [questionId, initialTestCaseResults]) // Only depend on the full array

  // FIXED: Persist code submissions with proper dependency management
  useEffect(() => {
    if (questionId && onTestCaseResults && codeSubmissions.length > 0 && questionId === currentQuestionId) {
      // Use a timeout to prevent immediate re-renders
      const timeoutId = setTimeout(() => {
        onTestCaseResults(questionId, [...codeSubmissions])
      }, 0)

      return () => clearTimeout(timeoutId)
    }
  }, [questionId, onTestCaseResults, currentQuestionId, codeSubmissions]) // Only depend on the full array

  // FIXED: Update line numbers with proper dependency management
  useEffect(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      const lines = code.split("\n").length
      const lineNumbersContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n")

      // Only update if content actually changed
      if (lineNumbersRef.current.textContent !== lineNumbersContent) {
        lineNumbersRef.current.textContent = lineNumbersContent
      }
    }
  }, [code.split("\n").length]) // Only depend on line count, not full code

  // FIXED: Sync scroll between textarea and line numbers
  useEffect(() => {
    const textarea = textareaRef.current
    const lineNumbersDiv = lineNumbersRef.current
    if (!textarea || !lineNumbersDiv) return

    const handleScroll = () => {
      lineNumbersDiv.scrollTop = textarea.scrollTop
    }

    textarea.addEventListener("scroll", handleScroll)
    return () => textarea.removeEventListener("scroll", handleScroll)
  }, [lineNumbers]) // Only re-attach when lineNumbers setting changes

  // FIXED: Memoize keyboard shortcut handlers
  const handleDownload = useCallback(() => {
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
  }, [code, currentLang.extension])

  const handleRunCode = useCallback(async () => {
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
        // Execute ALL test cases with the same code
        const allResults: TestCaseResult[] = []
        let lastRawResult: ExecutionResult | null = null

        // Execute the same code against ALL test cases
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]

          let rawResult: ExecutionResult
          if (onRunCode) {
            rawResult = await onRunCode(code, currentLanguage, testCase.input)
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
            testCaseId: testCase.id,
            passed: rawResult.output?.trim() === testCase.expectedOutput.trim(),
            actualOutput: rawResult.output || "",
            expectedOutput: testCase.expectedOutput,
            executionTime: rawResult.executionTime || 0,
            input: testCase.input,
          }

          allResults.push(result)
        }

        // Create a new code submission record
        const submission: CodeSubmission = {
          code: code,
          language: currentLanguage,
          timestamp: new Date(),
          results: allResults,
          allPassed: allResults.every((r) => r.passed),
          passedCount: allResults.filter((r) => r.passed).length,
          totalCount: allResults.length,
        }

        // Add to submissions history
        setCodeSubmissions((prev) => [...prev, submission])

        // Set the last execution result for the Output tab
        if (lastRawResult) {
          setExecutionResult(lastRawResult)
        }

        const passedCount = allResults.filter((r) => r.passed).length
        toast.success(`Code executed against all test cases: ${passedCount}/${testCases.length} passed`)

        // Switch to test cases tab to show results
        setActiveTab("testcases")
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
    }
  }, [code, currentLanguage, customInput, testCases, onRunCode, currentLang.pistonLang, currentLang.version])

  // FIXED: Handle keyboard shortcuts with proper dependencies
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
  }, [handleDownload, handleRunCode, code, onChange])

  // FIXED: Memoize language change handler
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
    [currentLang.template, code, onChange, onLanguageChange],
  )

  // FIXED: Memoize code change handler
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      if (onChange) {
        onChange(newCode)
      }
    },
    [onChange],
  )

  // FIXED: Memoize other handlers
  const handleStopExecution = useCallback(() => {
    setIsRunning(false)
    toast.info("Execution stopped")
  }, [])

  const handleReset = useCallback(() => {
    const template = currentLang.template
    setCode(template)
    if (onChange) {
      onChange(template)
    }
    setExecutionResult(null)
    setCustomInput("")
    setCodeSubmissions([])
    toast.success("Code reset to template")
  }, [currentLang.template, onChange])

  const handleResetTestCases = useCallback(() => {
    setCodeSubmissions([])
    toast.success("Test case progress reset")
  }, [])

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [onChange],
  )

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }, [code])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // FIXED: Memoize fullscreen styles
  const fullscreenStyles = useMemo(
    () =>
      isFullscreen
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
        : {},
    [isFullscreen],
  )

  // FIXED: Memoize card height calculation
  const cardHeight = useMemo(() => {
    if (isFullscreen) return "calc(100vh - 2rem)"
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) return "800px"
      if (window.innerWidth >= 640) return "700px"
    }
    return "600px"
  }, [isFullscreen])

  return (
    <div className={className} style={fullscreenStyles}>
      <Card className="w-full h-full flex flex-col overflow-hidden" style={{ height: cardHeight }}>
        <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Code Editor</span>
              <span className="sm:hidden">Editor</span>
              {questionId && (
                <Badge variant="outline" className="text-xs">
                  Q: {questionId}
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                    <span className="hidden sm:inline">Run All Tests</span>
                    <span className="sm:hidden">Run</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={readOnly}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>

              {testCases.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTestCases}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
                >
                  <TestTube className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden md:inline">Reset Tests</span>
                  <span className="md:hidden">Reset</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Save</span>
              </Button>

              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
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

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Test Case Status Summary */}
          {testCases.length > 0 && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Test Cases:</span>
                    <Badge variant="outline">
                      {executionStats.passed}/{executionStats.total}
                    </Badge>
                  </div>
                  {isRunning && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running all test cases...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      ✓ {executionStats.passed}
                    </Badge>
                    <Badge variant="destructive">✗ {executionStats.failed}</Badge>
                  </div>
                  {codeSubmissions.length > 0 && (
                    <Badge variant={executionStats.allPassed ? "default" : "secondary"}>
                      {executionStats.allPassed ? "All Passed" : "Some Failed"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show sample test cases (non-hidden ones) */}
              {testCases.filter((tc) => !tc.isHidden).length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Sample Test Cases:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {testCases
                      .filter((tc) => !tc.isHidden)
                      .slice(0, 2)
                      .map((testCase, index) => (
                        <div
                          key={`testcase-${testCase.id || index}-${index}`}
                          className="p-3 bg-background rounded border"
                        >
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
                height: showConsole
                  ? typeof window !== "undefined" && window.innerWidth >= 1024
                    ? "100%"
                    : "60%"
                  : "100%",
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
                      fontSize: `${Math.max(12, fontSize - (typeof window !== "undefined" && window.innerWidth < 640 ? 2 : 0))}px`,
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
                  height: typeof window !== "undefined" && window.innerWidth >= 1024 ? "100%" : "35%",
                  minHeight: "250px",
                  width: typeof window !== "undefined" && window.innerWidth >= 1024 ? "45%" : "100%",
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
                            Test Results ({executionStats.passed}/{executionStats.total})
                          </span>
                          <span className="sm:hidden">
                            Tests ({executionStats.passed}/{executionStats.total})
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
                              <span>Executing code against all test cases...</span>
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
                              Click "Run All Tests" to execute your code against all test cases
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    {testCases.length > 0 && (
                      <TabsContent value="testcases" className="m-0 h-full">
                        <ScrollArea className="h-full">
                          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
                            {codeSubmissions.length === 0 ? (
                              <div className="text-muted-foreground text-xs sm:text-sm text-center py-6 sm:py-8">
                                No code submissions yet. Click "Run All Tests" to execute your code against all test
                                cases.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {codeSubmissions.map((submission, submissionIndex) => (
                                  <div
                                    key={`submission-${submissionIndex}-${submission.timestamp.getTime()}`}
                                    className="border rounded-md p-3 sm:p-4 bg-muted/50"
                                  >
                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                      <h3 className="font-semibold text-sm sm:text-base">
                                        Submission #{submissionIndex + 1}
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={submission.allPassed ? "default" : "secondary"}>
                                          {submission.passedCount}/{submission.totalCount} Passed
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(submission.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-2 sm:space-y-3">
                                      {submission.results.map((result, resultIndex) => (
                                        <div
                                          key={`result-${result.testCaseId}-${resultIndex}-${submissionIndex}`}
                                          className="border rounded-md p-2 sm:p-3 bg-background"
                                        >
                                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                            <span className="font-medium text-xs sm:text-sm">
                                              Test Case {resultIndex + 1}
                                            </span>
                                            <Badge
                                              variant={result.passed ? "default" : "destructive"}
                                              className="text-xs"
                                            >
                                              {result.passed ? "✓ Passed" : "✗ Failed"}
                                            </Badge>
                                          </div>

                                          <div className="space-y-2 text-xs">
                                            {!testCases[resultIndex]?.isHidden && (
                                              <>
                                                <div>
                                                  <span className="font-medium">Input:</span>
                                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24">
                                                    {result.input === "" ? "(empty input)" : result.input}
                                                  </pre>
                                                </div>
                                                <div>
                                                  <span className="font-medium">Expected Output:</span>
                                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24">
                                                    {result.expectedOutput}
                                                  </pre>
                                                </div>
                                              </>
                                            )}
                                            <div>
                                              <span className="font-medium">Your Output:</span>
                                              <pre
                                                className={`mt-1 p-2 rounded text-xs overflow-x-auto border max-h-16 sm:max-h-24 ${
                                                  result.passed
                                                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                                }`}
                                              >
                                                {result.actualOutput === "" ? "(empty output)" : result.actualOutput}
                                              </pre>
                                            </div>
                                            {result.executionTime && (
                                              <div className="text-xs text-muted-foreground">
                                                Execution time: {result.executionTime}ms
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                    Tests: {executionStats.passed}/{executionStats.total}
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
