"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Settings,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  Terminal,
  TestTube,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

// CodeMirror imports
import { EditorView, basicSetup } from "codemirror"
import { EditorState, type Extension, Compartment } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { java } from "@codemirror/lang-java"
import { cpp } from "@codemirror/lang-cpp"
import { php } from "@codemirror/lang-php"
import { rust } from "@codemirror/lang-rust"
import { go } from "@codemirror/lang-go"
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  type CompletionContext,
  type CompletionResult,
  type Completion,
} from "@codemirror/autocomplete"
import { keymap } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"

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
  templateLanguage?: string // preferred base language when question allows 'any'
  onLanguageChange?: (language: string) => void
  readOnly?: boolean
  showConsole?: boolean
  testCases?: TestCase[]
  onRunCode?: (code: string, language: string, input?: string) => Promise<ExecutionResult>
  className?: string
  questionId?: string
  onTestCaseResults?: (questionId: string, results: CodeSubmission[]) => void
  initialTestCaseResults?: CodeSubmission[]
  template?: string
}

// Snippet interface for proper template handling
interface Snippet {
  label: string
  detail: string
  insertText: string
  type: string
  sortText?: string
}

// Language-specific snippets with proper insertText
const LANGUAGE_SNIPPETS = {
  javascript: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if (condition) {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "else",
      detail: "else statement",
      insertText: "else {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for (let i = 0; i < length; i++) {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "for...of",
      detail: "for...of loop",
      insertText: "for (const item of array) {\n    \n}",
      type: "keyword",
      sortText: "0004",
    },
    {
      label: "for...in",
      detail: "for...in loop",
      insertText: "for (const key in object) {\n    \n}",
      type: "keyword",
      sortText: "0005",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while (condition) {\n    \n}",
      type: "keyword",
      sortText: "0006",
    },
    {
      label: "function",
      detail: "function declaration",
      insertText: "function name(params) {\n    \n    return value;\n}",
      type: "function",
      sortText: "0007",
    },
    {
      label: "arrow",
      detail: "arrow function",
      insertText: "const name = (params) => {\n    \n    return value;\n};",
      type: "function",
      sortText: "0008",
    },
    {
      label: "const",
      detail: "const declaration",
      insertText: "const name = value;",
      type: "variable",
      sortText: "0009",
    },
    {
      label: "let",
      detail: "let declaration",
      insertText: "let name = value;",
      type: "variable",
      sortText: "0010",
    },
    {
      label: "console.log",
      detail: "console.log statement",
      insertText: "console.log(value);",
      type: "method",
      sortText: "0011",
    },
    {
      label: "console.error",
      detail: "console.error statement",
      insertText: "console.error(error);",
      type: "method",
      sortText: "0012",
    },
    {
      label: "console.warn",
      detail: "console.warn statement",
      insertText: "console.warn(warning);",
      type: "method",
      sortText: "0013",
    },
    {
      label: "try",
      detail: "try-catch block",
      insertText: "try {\n    \n} catch (error) {\n    \n}",
      type: "keyword",
      sortText: "0014",
    },
    {
      label: "class",
      detail: "class declaration",
      insertText:
        "class ClassName {\n    constructor(params) {\n        \n    }\n    \n    method() {\n        \n    }\n}",
      type: "class",
      sortText: "0015",
    },
  ],
  python: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if condition:\n    ",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "elif",
      detail: "elif statement",
      insertText: "elif condition:\n    ",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "else",
      detail: "else statement",
      insertText: "else:\n    ",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for item in iterable:\n    ",
      type: "keyword",
      sortText: "0004",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while condition:\n    ",
      type: "keyword",
      sortText: "0005",
    },
    {
      label: "def",
      detail: "function definition",
      insertText: 'def function_name(params):\n    """\n    Docstring\n    """\n    \n    return value',
      type: "function",
      sortText: "0006",
    },
    {
      label: "class",
      detail: "class definition",
      insertText:
        'class ClassName:\n    """\n    Class docstring\n    """\n    \n    def __init__(self, params):\n        \n    \n    def method(self):\n        ',
      type: "class",
      sortText: "0007",
    },
    {
      label: "print",
      detail: "print statement",
      insertText: "print(value)",
      type: "function",
      sortText: "0008",
    },
    {
      label: "try",
      detail: "try-except block",
      insertText: "try:\n    \nexcept Exception as e:\n    ",
      type: "keyword",
      sortText: "0009",
    },
    {
      label: "with",
      detail: "with statement",
      insertText: "with expression as variable:\n    ",
      type: "keyword",
      sortText: "0010",
    },
  ],
  java: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if (condition) {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "else",
      detail: "else statement",
      insertText: "else {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for (int i = 0; i < length; i++) {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "foreach",
      detail: "enhanced for loop",
      insertText: "for (Type item : collection) {\n    \n}",
      type: "keyword",
      sortText: "0004",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while (condition) {\n    \n}",
      type: "keyword",
      sortText: "0005",
    },
    {
      label: "method",
      detail: "method declaration",
      insertText: "public returnType methodName(params) {\n    \n    return value;\n}",
      type: "method",
      sortText: "0006",
    },
    {
      label: "main",
      detail: "main method",
      insertText: "public static void main(String[] args) {\n    \n}",
      type: "method",
      sortText: "0007",
    },
    {
      label: "class",
      detail: "class declaration",
      insertText:
        "public class ClassName {\n    \n    public ClassName() {\n        \n    }\n    \n    public void method() {\n        \n    }\n}",
      type: "class",
      sortText: "0008",
    },
    {
      label: "System.out.println",
      detail: "print line",
      insertText: "System.out.println(value);",
      type: "method",
      sortText: "0009",
    },
    {
      label: "try",
      detail: "try-catch block",
      insertText: "try {\n    \n} catch (Exception e) {\n    \n}",
      type: "keyword",
      sortText: "0010",
    },
  ],
  cpp: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if (condition) {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for (int i = 0; i < n; i++) {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while (condition) {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "function",
      detail: "function declaration",
      insertText: "returnType functionName(params) {\n    \n    return value;\n}",
      type: "function",
      sortText: "0004",
    },
    {
      label: "main",
      detail: "main function",
      insertText: "int main() {\n    \n    return 0;\n}",
      type: "function",
      sortText: "0005",
    },
    {
      label: "cout",
      detail: "cout statement",
      insertText: "std::cout << value << std::endl;",
      type: "method",
      sortText: "0006",
    },
    {
      label: "cin",
      detail: "cin statement",
      insertText: "std::cin >> variable;",
      type: "method",
      sortText: "0007",
    },
    {
      label: "class",
      detail: "class declaration",
      insertText:
        "class ClassName {\nprivate:\n    \n    \npublic:\n    ClassName() {\n        \n    }\n    \n    void method() {\n        \n    }\n};",
      type: "class",
      sortText: "0008",
    },
  ],
  c: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if (condition) {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for (int i = 0; i < n; i++) {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while (condition) {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "function",
      detail: "function declaration",
      insertText: "returnType functionName(params) {\n    \n    return value;\n}",
      type: "function",
      sortText: "0004",
    },
    {
      label: "main",
      detail: "main function",
      insertText: "int main() {\n    \n    return 0;\n}",
      type: "function",
      sortText: "0005",
    },
    {
      label: "printf",
      detail: "printf statement",
      insertText: 'printf("format\\n", args);',
      type: "function",
      sortText: "0006",
    },
    {
      label: "scanf",
      detail: "scanf statement",
      insertText: 'scanf("format", &variable);',
      type: "function",
      sortText: "0007",
    },
  ],
  php: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if (condition) {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for ($i = 0; $i < count; $i++) {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "foreach",
      detail: "foreach loop",
      insertText: "foreach ($array as $item) {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "function",
      detail: "function declaration",
      insertText: "function functionName($params) {\n    \n    return $value;\n}",
      type: "function",
      sortText: "0004",
    },
    {
      label: "class",
      detail: "class declaration",
      insertText:
        "class ClassName {\n    private $property;\n    \n    public function __construct($params) {\n        \n    }\n    \n    public function method() {\n        \n    }\n}",
      type: "class",
      sortText: "0005",
    },
    {
      label: "echo",
      detail: "echo statement",
      insertText: "echo $value;",
      type: "function",
      sortText: "0006",
    },
  ],
  rust: [
    {
      label: "if",
      detail: "if expression",
      insertText: "if condition {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for item in iterable {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "while",
      detail: "while loop",
      insertText: "while condition {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "fn",
      detail: "function definition",
      insertText: "fn function_name(params) -> ReturnType {\n    \n}",
      type: "function",
      sortText: "0004",
    },
    {
      label: "main",
      detail: "main function",
      insertText: "fn main() {\n    \n}",
      type: "function",
      sortText: "0005",
    },
    {
      label: "println!",
      detail: "println! macro",
      insertText: 'println!("format", args);',
      type: "macro",
      sortText: "0006",
    },
    {
      label: "let",
      detail: "let binding",
      insertText: "let name = value;",
      type: "keyword",
      sortText: "0007",
    },
    {
      label: "struct",
      detail: "struct definition",
      insertText: "struct StructName {\n    field: Type,\n}",
      type: "class",
      sortText: "0008",
    },
  ],
  go: [
    {
      label: "if",
      detail: "if statement",
      insertText: "if condition {\n    \n}",
      type: "keyword",
      sortText: "0001",
    },
    {
      label: "for",
      detail: "for loop",
      insertText: "for i := 0; i < n; i++ {\n    \n}",
      type: "keyword",
      sortText: "0002",
    },
    {
      label: "range",
      detail: "for range loop",
      insertText: "for index, value := range slice {\n    \n}",
      type: "keyword",
      sortText: "0003",
    },
    {
      label: "func",
      detail: "function declaration",
      insertText: "func functionName(params) returnType {\n    \n    return value\n}",
      type: "function",
      sortText: "0004",
    },
    {
      label: "main",
      detail: "main function",
      insertText: "func main() {\n    \n}",
      type: "function",
      sortText: "0005",
    },
    {
      label: "fmt.Println",
      detail: "fmt.Println",
      insertText: "fmt.Println(value)",
      type: "function",
      sortText: "0006",
    },
    {
      label: "struct",
      detail: "struct declaration",
      insertText: "type StructName struct {\n    Field Type\n}",
      type: "class",
      sortText: "0007",
    },
  ],
}

const SUPPORTED_LANGUAGES = [
  {
    value: "any",
    label: "Any Language",
    // defaulting extension/pistonLang to javascript for template until user selects a concrete one
    extension: "txt",
    pistonLang: "javascript",
    version: "18.15.0",
    template: `// Select your desired language from the dropdown if restricted\n// Provide your solution below\n`,
  },
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

// CodeMirror Editor Component
interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly: boolean
  fontSize: number
  lineNumbers: boolean
  onCopyPasteAttempt: () => void
}

function CodeMirrorEditor({
  value,
  onChange,
  language,
  readOnly,
  fontSize,
  lineNumbers,
  onCopyPasteAttempt,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isInitializedRef = useRef(false)

  // FIXED: Use Compartments for proper reconfiguration
  const themeCompartmentRef = useRef(new Compartment())
  const languageCompartmentRef = useRef(new Compartment())

  // FIXED: Create autocompletion compartment for dynamic updates
  const autocompletionCompartmentRef = useRef(new Compartment())

  // STABLE FUNCTIONS - No dependencies that change
  const getLanguageExtension = useCallback((lang: string) => {
    switch (lang) {
      case "javascript":
        return javascript()
      case "python":
        return python()
      case "java":
        return java()
      case "cpp":
      case "c":
        return cpp()
      case "php":
        return php()
      case "rust":
        return rust()
      case "go":
        return go()
      default:
        return javascript()
    }
  }, [])

  // Create proper completion source with exact matching - STABLE FUNCTION
  function createCompletionSource(lang: string) {
    const snippets = LANGUAGE_SNIPPETS[lang as keyof typeof LANGUAGE_SNIPPETS] || []
    return (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/\w*/)
      if (!word || (word.from === word.to && !context.explicit)) return null

      const typedText = word.text.toLowerCase()
      // Filter snippets that match the typed text
      const matchingSnippets = snippets.filter(
        (snippet) =>
          snippet.label.toLowerCase().startsWith(typedText) || snippet.label.toLowerCase().includes(typedText),
      )

      if (matchingSnippets.length === 0) return null

      const options: Completion[] = matchingSnippets.map((snippet) => ({
        label: snippet.label,
        detail: snippet.detail,
        apply: (view, completion, from, to) => {
          // Replace the typed text with the snippet
          view.dispatch({
            changes: {
              from,
              to,
              insert: snippet.insertText,
            },
            selection: { anchor: from + snippet.insertText.length },
          })
        },
        type: snippet.type,
        boost: snippet.label.toLowerCase().startsWith(typedText) ? 10 : 1,
      }))

      return {
        from: word.from,
        options: options.sort((a, b) => (b.boost || 0) - (a.boost || 0)),
      }
    }
  }

  // Copy/paste prevention
  const preventCopyPaste = useCallback(() => {
    return EditorView.domEventHandlers({
      copy: (event) => {
        event.preventDefault()
        onCopyPasteAttempt()
        return true
      },
      paste: (event) => {
        event.preventDefault()
        onCopyPasteAttempt()
        return true
      },
      cut: (event) => {
        event.preventDefault()
        onCopyPasteAttempt()
        return true
      },
    })
  }, [onCopyPasteAttempt])

  // Enhanced tab handling with proper auto-completion
  const tabHandling = useCallback(() => {
    return keymap.of([
      {
        key: "Tab",
        run: (view) => {
          const state = view.state
          const selection = state.selection.main

          // If there's a selection, just insert spaces
          if (selection.from !== selection.to) {
            view.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: "    ", // 4 spaces
              },
              selection: { anchor: selection.from + 4 },
            })
            return true
          }

          // Check if we're at the end of a word that could be completed
          const line = state.doc.lineAt(selection.head)
          const textBefore = line.text.slice(0, selection.head - line.from)
          const wordMatch = textBefore.match(/\w+$/)

          if (wordMatch) {
            // Try to find a matching snippet
            const snippets = LANGUAGE_SNIPPETS[language as keyof typeof LANGUAGE_SNIPPETS] || []
            const word = wordMatch[0].toLowerCase()

            // Find exact match first, then partial match
            let matchingSnippet = snippets.find((s) => s.label.toLowerCase() === word)
            if (!matchingSnippet) {
              // Find the best partial match (starts with the word)
              const partialMatches = snippets.filter((s) => s.label.toLowerCase().startsWith(word))
              if (partialMatches.length === 1) {
                matchingSnippet = partialMatches[0]
              } else if (partialMatches.length > 1) {
                // If multiple matches, trigger completion popup
                return false // Let autocompletion handle it
              }
            }

            if (matchingSnippet) {
              const wordStart = selection.head - wordMatch[0].length
              view.dispatch({
                changes: {
                  from: wordStart,
                  to: selection.head,
                  insert: matchingSnippet.insertText,
                },
                selection: { anchor: wordStart + matchingSnippet.insertText.length },
              })
              return true
            }
          }

          // Default: insert 4 spaces for indentation
          view.dispatch({
            changes: {
              from: selection.head,
              to: selection.head,
              insert: "    ",
            },
            selection: { anchor: selection.head + 4 },
          })
          return true
        },
      },
    ])
  }, [language])

  // FIXED: Create dynamic theme based on settings
  const createTheme = useCallback((fontSize: number, lineNumbers: boolean) => {
    return EditorView.theme({
      "&": {
        fontSize: `${fontSize}px`,
        height: "100%",
      },
      ".cm-content": {
        padding: "16px",
        minHeight: "100%",
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      },
      ".cm-focused": {
        outline: "none",
      },
      ".cm-editor": {
        height: "100%",
      },
      ".cm-scroller": {
        height: "100%",
      },
      ".cm-tooltip": {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        border: "1px solid #444",
        borderRadius: "6px",
        fontSize: "13px",
      },
      ".cm-tooltip-autocomplete": {
        "& > ul": {
          maxHeight: "200px",
          overflowY: "auto",
        },
        "& > ul > li": {
          padding: "4px 8px",
          cursor: "pointer",
        },
        "& > ul > li[aria-selected]": {
          backgroundColor: "rgba(255, 255, 255, 0.15)",
        },
      },
      // FIXED: Conditional line numbers styling
      ...(lineNumbers
        ? {}
        : {
            ".cm-lineNumbers": {
              display: "none",
            },
            ".cm-gutters": {
              display: "none",
            },
          }),
    })
  }, [])

  // FIXED: Initialize CodeMirror ONLY ONCE - No changing dependencies
  useEffect(() => {
    if (!editorRef.current || isInitializedRef.current) return

    const extensions: Extension[] = [
      basicSetup,
      languageCompartmentRef.current.of(getLanguageExtension(language)),
      oneDark,
      history(),
      themeCompartmentRef.current.of(createTheme(fontSize, lineNumbers)),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          if (newValue !== value) {
            onChange(newValue)
          }
        }
      }),
      autocompletionCompartmentRef.current.of(
        autocompletion({
          override: [createCompletionSource(language)],
          activateOnTyping: true,
          maxRenderedOptions: 8,
          defaultKeymap: true,
        }),
      ),
      keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
      tabHandling(),
      closeBrackets(),
      preventCopyPaste(),
      EditorState.readOnly.of(readOnly),
    ]

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view
    isInitializedRef.current = true

    return () => {
      view.destroy()
      viewRef.current = null
      isInitializedRef.current = false
    }
  }, []) // EMPTY DEPENDENCY ARRAY - Initialize only once

  // FIXED: Update document when value changes externally - STABLE
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
    }
  }, [value]) // Only value dependency

  // FIXED: Update language when it changes - STABLE
  useEffect(() => {
    if (viewRef.current && languageCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartmentRef.current.reconfigure(getLanguageExtension(language)),
      })
    }
  }, [language, getLanguageExtension])

  // FIXED: Update theme settings when they change - STABLE with proper reconfiguration
  useEffect(() => {
    if (viewRef.current && themeCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartmentRef.current.reconfigure(createTheme(fontSize, lineNumbers)),
      })
    }
  }, [fontSize, lineNumbers, createTheme])

  // FIXED: Update autocompletion when language changes - STABLE
  useEffect(() => {
    if (viewRef.current && autocompletionCompartmentRef.current) {
      viewRef.current.dispatch({
        effects: autocompletionCompartmentRef.current.reconfigure(
          autocompletion({
            override: [createCompletionSource(language)],
            activateOnTyping: true,
            maxRenderedOptions: 8,
            defaultKeymap: true,
          }),
        ),
      })
    }
  }, [language])

  return (
    <div ref={editorRef} style={{ height: "100%", width: "100%", overflow: "auto", minHeight: 200, borderRadius: 8 }} />
  )
}

export function AdvancedCodeEditor({
  value = "",
  onChange,
  language = "javascript",
  templateLanguage,
  onLanguageChange,
  readOnly = false,
  showConsole = true,
  testCases = [],
  onRunCode,
  className = "",
  questionId,
  onTestCaseResults,
  initialTestCaseResults = [],
  template = "",
}: CodeEditorProps) {
  // STABLE STATE - No complex dependencies
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [lastSetByPreset, setLastSetByPreset] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [customInput, setCustomInput] = useState("")
  const [activeTab, setActiveTab] = useState("output")
  const [showSettings, setShowSettings] = useState(false)
  const [lineNumbers, setLineNumbers] = useState(true)
  const [showCopyPasteWarning, setShowCopyPasteWarning] = useState(false)
  const [codeSubmissions, setCodeSubmissions] = useState<CodeSubmission[]>([])
  // Internal free language when parent supplies 'any'
  // When parent allows 'any' language, we track the user-chosen language separately.
  // Initialize with provided templateLanguage (fallback javascript)
  const [freeLang, setFreeLang] = useState(templateLanguage || 'javascript')
  const effectiveLanguage = language === 'any' ? freeLang : language

  // REFS - No re-render triggers
  const fileInputRef = useRef<HTMLInputElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)

  // STABLE MEMOIZED VALUES - Only depend on primitive props
  const currentLang = useMemo(
    () => SUPPORTED_LANGUAGES.find((lang) => lang.value === effectiveLanguage) || SUPPORTED_LANGUAGES[0],
    [effectiveLanguage],
  )

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
          total: testCases?.length || 0,
          passed: 0,
          failed: 0,
          allPassed: false,
        }
  }, [codeSubmissions, testCases?.length])

  // INITIALIZE SUBMISSIONS ONLY ONCE
  useEffect(() => {
    if (!isInitializedRef.current) {
      setCodeSubmissions(initialTestCaseResults || [])
      isInitializedRef.current = true
    }
  }, []) // Empty dependency array - runs only once

  // RESET ONLY WHEN QUESTION ID ACTUALLY CHANGES
  useEffect(() => {
    setCodeSubmissions(initialTestCaseResults || [])
    setExecutionResult(null)
  }, [questionId]) // Only questionId dependency

  // SETTINGS CLICK AWAY - STABLE
  useEffect(() => {
    if (!showSettings) return

    const handleClick = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showSettings])

  // STABLE HANDLERS - No dependencies that change
  const handleDownload = useCallback(() => {
    const filename = `solution.${currentLang.extension}`
    const blob = new Blob([value], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Code downloaded as ${filename}`)
  }, [value, currentLang.extension])

  const handleRunCode = useCallback(async () => {
    if (!value?.trim()) {
      toast.error("Please write some code first")
      return
    }

    // FIXED: Add language-specific syntax validation
    const validateLanguageSyntax = (code: string, lang: string): boolean => {
      switch (lang) {
        case "javascript":
          // Allow console.log, function, var, let, const, etc.
          return (
            /\b(console\.|function|var|let|const|=>|\.log|\.error|\.warn)\b/.test(code) ||
            /\b(if|for|while|return|class|import|export)\b/.test(code)
          )
        case "python":
          // Allow print, def, import, etc. - NO console.log
          return (
            /\b(print|def|import|class|if|for|while|return|__name__|__main__)\b/.test(code) && !/\bconsole\./.test(code)
          )
        case "php":
          // Allow echo, function, $, <?php - NO console.log or print() without $
          return (
            (/\b(echo|\$|function|<?php|<\?)\b/.test(code) || /\bprint\s*\(/.test(code)) && !/\bconsole\./.test(code)
          )
        case "java":
          // Allow System.out, public, class, etc. - NO console.log
          return /\b(System\.out|public|class|static|void|main|import)\b/.test(code) && !/\bconsole\./.test(code)
        case "cpp":
        case "c":
          // Allow std::cout, printf, #include, etc. - NO console.log
          return /\b(std::|printf|scanf|#include|cout|cin|int\s+main)\b/.test(code) && !/\bconsole\./.test(code)
        case "rust":
          // Allow println!, fn, let, etc. - NO console.log
          return /\b(println!|fn|let|mut|struct|impl|use)\b/.test(code) && !/\bconsole\./.test(code)
        case "go":
          // Allow fmt.Println, func, package, etc. - NO console.log
          return /\b(fmt\.|func|package|import|var|:=)\b/.test(code) && !/\bconsole\./.test(code)
        default:
          return true
      }
    }

    // Validate syntax before execution
    if (!validateLanguageSyntax(value, language)) {
      toast.error(`Invalid ${currentLang.label} syntax detected. Please use proper ${currentLang.label} syntax.`)
      return
    }

    setIsRunning(true)
    setActiveTab("testcases")

    try {
      if (!testCases || testCases.length === 0) {
        // Run with custom input if no test cases
        let result: ExecutionResult
        if (onRunCode) {
          result = await onRunCode(value, language, customInput)
        } else {
          // Real execution via API with proper language mapping
          const response = await fetch("/api/code/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: value,
              language: currentLang.pistonLang, // Use proper piston language mapping
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

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]
          let rawResult: ExecutionResult

          if (onRunCode) {
            rawResult = await onRunCode(value, effectiveLanguage, testCase.input)
          } else {
            // Real execution via API with proper language mapping
            const response = await fetch("/api/code/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: value,
                language: currentLang.pistonLang, // Use proper piston language mapping
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

        const submission: CodeSubmission = {
          code: value,
          language: effectiveLanguage,
          timestamp: new Date(),
          results: allResults,
          allPassed: allResults.every((r) => r.passed),
          passedCount: allResults.filter((r) => r.passed).length,
          totalCount: allResults.length,
        }

        setCodeSubmissions((prev) => {
          const updated = [...prev, submission];
          // Save to localStorage for robust persistence
          try {
            if (questionId) {
              // Try to get testSessionKey from window if available
              let testSessionKey = '';
              if (typeof window !== 'undefined') {
                testSessionKey = window.sessionStorage?.getItem('testSessionKey') || '';
              }
              const localKey = testSessionKey && questionId ? `submissions_${testSessionKey}-${questionId}` : `submissions_${questionId}`;
              localStorage.setItem(localKey, JSON.stringify(updated));
            }
          } catch (e) { /* ignore */ }
          return updated;
        });

        if (lastRawResult) {
          setExecutionResult(lastRawResult)
        }

        const passedCount = allResults.filter((r) => r.passed).length
        toast.success(`Code executed against all test cases: ${passedCount}/${testCases.length} passed`)
        setActiveTab("testcases")
      }
    } catch (error) {
      console.error("Execution error:", error)
      setExecutionResult({
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      toast.error("Code execution failed")
    } finally {
      setIsRunning(false)
    }
  }, [value, effectiveLanguage, customInput, testCases, onRunCode, currentLang.pistonLang, currentLang.version, questionId])

  const handleLanguageChange = useCallback((newLanguage: string) => {
    const newLangConfig = SUPPORTED_LANGUAGES.find((l) => l.value === newLanguage)
    if (!newLangConfig) return
    if (language === 'any') {
      const prevTemplate = currentLang.template
      if (!value?.trim() || value === prevTemplate) {
        onChange?.(newLangConfig.template)
      }
      setFreeLang(newLanguage)
      toast.success(`Switched to ${newLangConfig.label}`)
      return
    }
    onLanguageChange?.(newLanguage)
    const prevTemplate = currentLang.template
    if (!value?.trim() || value === prevTemplate) {
      onChange?.(newLangConfig.template)
      toast.success(`Switched to ${newLangConfig.label}`)
    }
  }, [language, value, currentLang.template, onChange, onLanguageChange])

  const handleReset = useCallback(() => {
    const resetTemplate = template || currentLang.template
    onChange?.(resetTemplate)
    setExecutionResult(null)
    setCustomInput("")
    setCodeSubmissions([])
    toast.success("Code reset to template")
  }, [template, currentLang.template, onChange])

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(value)
    toast.success("Code copied to clipboard")
  }, [value])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const handleCopyPasteAttempt = useCallback(() => {
    setShowCopyPasteWarning(true)
    setTimeout(() => setShowCopyPasteWarning(false), 3000)
  }, [])

  // KEYBOARD SHORTCUTS - STABLE
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
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleDownload, handleRunCode])

  // Ensure parent always receives latest test case results for badge/counter updates
  useEffect(() => {
    if (onTestCaseResults && questionId) {
      onTestCaseResults(questionId, codeSubmissions)
    }
  }, [codeSubmissions, onTestCaseResults, questionId])

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

  const cardHeight = useMemo(() => {
    if (isFullscreen) return "98vh"
    return "min(85vh, 1000px)"
  }, [isFullscreen])

  return (
    <div className={className} style={{ ...fullscreenStyles, maxWidth: "98vw", width: "100%", margin: "0 auto" }}>
      <Card
        className="w-full h-full flex flex-col overflow-hidden"
        style={{
          height: cardHeight,
          minHeight: isFullscreen ? "90vh" : "650px",
          maxHeight: isFullscreen ? "98vh" : "1000px",
          width: "100%",
        }}
      >
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
                value={language === 'any' ? freeLang : language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[100px] sm:min-w-[140px]"
              >
                {(language === 'any'
                  ? SUPPORTED_LANGUAGES.filter((l) => l.value !== 'any')
                  : SUPPORTED_LANGUAGES.filter((l) => l.value === language)
                ).map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCode}
                disabled={readOnly || isRunning}
                className="text-green-600 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-transparent"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Run</span>
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
              <div className="relative inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="px-2 sm:px-3 py-1 sm:py-2"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                {showSettings && (
                  <div
                    ref={settingsRef}
                    className="absolute right-0 mt-2 bg-white border border-border rounded-lg shadow-lg flex flex-col gap-4 z-50"
                    style={{
                      width: 280,
                      height: 280,
                      minWidth: 220,
                      minHeight: 220,
                      maxWidth: 320,
                      maxHeight: 320,
                      overflow: "auto",
                      padding: 20,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-base">Show Line Numbers</span>
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={() => setLineNumbers((prev) => !prev)}
                        className="form-checkbox h-5 w-5 text-primary"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-base block mb-2">Font Size</label>
                      <div className="flex flex-wrap gap-2">
                        {[10, 12, 14, 16, 18, 20, 22, 24].map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`px-2 py-1 rounded border ${fontSize === size && lastSetByPreset ? "bg-primary text-white" : "bg-muted text-foreground"} text-xs font-medium min-w-[36px]`}
                            onClick={() => {
                              setFontSize(size)
                              setLastSetByPreset(true)
                            }}
                            style={{
                              boxShadow: fontSize === size && lastSetByPreset ? "0 0 0 2px var(--primary)" : undefined,
                            }}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <label className="font-medium text-xs block mb-1">Custom Size</label>
                        <input
                          type="number"
                          min="8"
                          max="32"
                          value={fontSize}
                          onChange={(e) => {
                            let val = Number.parseInt(e.target.value) || 14
                            val = Math.max(8, Math.min(32, val))
                            setFontSize(val)
                            setLastSetByPreset(false)
                          }}
                          className="w-full px-2 py-1 border border-border rounded-md text-xs"
                          placeholder="Enter font size (8-32)"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
        </CardHeader>
        <div className="flex-1 min-h-0 h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Code Editor Section */}
          <div className="border rounded-md bg-slate-900 flex-1 flex flex-col relative min-h-[400px] overflow-auto h-full">
            {/* Copy/Paste Warning */}
            {showCopyPasteWarning && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border bg-red-500 text-white">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Copy-pasting is disabled</span>
                </div>
              </div>
            )}
            <div className="flex-1 relative overflow-auto h-full">
              <CodeMirrorEditor
                value={value}
                onChange={onChange || (() => {})}
                language={language}
                readOnly={readOnly}
                fontSize={fontSize}
                lineNumbers={lineNumbers}
                onCopyPasteAttempt={handleCopyPasteAttempt}
              />
            </div>
          </div>
          {/* Console Section */}
          <div className="border rounded-md flex-1 flex flex-col bg-background min-h-[400px] min-w-[350px] max-w-[700px]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
              <div className="border-b flex-shrink-0 bg-muted/50">
                <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                  <TabsTrigger
                    value="output"
                    className="rounded-none border-r data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4 py-2"
                  >
                    <Terminal className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Output
                  </TabsTrigger>
                  {testCases && testCases.length > 0 && (
                    <TabsTrigger
                      value="testcases"
                      className="rounded-none data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4 py-2"
                    >
                      <TestTube className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Tests ({executionStats.passed}/{executionStats.total})
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <TabsContent value="output" className="m-0 h-full min-h-0">
                  <div className="h-full min-h-0 overflow-auto">
                    <div className="p-4 font-mono text-sm">
                      {isRunning ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Executing code...</span>
                        </div>
                      ) : executionResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {executionResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={executionResult.success ? "text-green-600" : "text-red-600"}>
                                {executionResult.success ? "Success" : "Failed"}
                              </span>
                            </div>
                            {executionResult.executionTime && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{executionResult.executionTime}ms</span>
                              </div>
                            )}
                          </div>
                          {executionResult.error && (
                            <div className="text-red-600 bg-red-50 p-3 rounded border">
                              <div className="font-medium mb-1">Error:</div>
                              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-40">
                                {executionResult.error}
                              </pre>
                            </div>
                          )}
                          {executionResult.output && (
                            <div>
                              <div className="font-medium mb-2">Output:</div>
                              <pre className="whitespace-pre-wrap bg-muted p-3 rounded border text-sm overflow-auto max-h-60">
                                {executionResult.output}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Click "Run" to execute your code</div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                {testCases && testCases.length > 0 && (
                  <TabsContent value="testcases" className="m-0 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-auto">
                      <div className="p-4 space-y-4">
                        {codeSubmissions.length === 0 ? (
                          <div className="text-muted-foreground text-center py-8">
                            No test results yet. Click "Run" to execute your code.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {codeSubmissions.map((submission, submissionIndex) => (
                              <div key={submissionIndex} className="border rounded-md p-4 bg-muted/50">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold">Submission #{submissionIndex + 1}</h3>
                                  <Badge variant={submission.allPassed ? "default" : "secondary"}>
                                    {submission.passedCount}/{submission.totalCount} Passed
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  {submission.results.map((result, resultIndex) => (
                                    <div
                                      key={resultIndex}
                                      className="border rounded-md p-3 bg-background overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">Test Case {resultIndex + 1}</span>
                                        <Badge variant={result.passed ? "default" : "destructive"}>
                                          {result.passed ? "✓ Passed" : "✗ Failed"}
                                        </Badge>
                                      </div>
                                      <div className="space-y-2 text-xs">
                                        <div>
                                          <span className="font-medium">Expected:</span>
                                          <pre className="mt-1 p-2 bg-muted rounded text-xs border overflow-auto max-h-32">
                                            {result.expectedOutput}
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="font-medium">Your Output:</span>
                                          <pre
                                            className={`mt-1 p-2 rounded text-xs border overflow-auto max-h-32 ${
                                              result.passed
                                                ? "bg-green-50 border-green-200"
                                                : "bg-red-50 border-red-200"
                                            }`}
                                          >
                                            {result.actualOutput}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Shortcuts: Ctrl+Enter (Run), Ctrl+S (Save), Tab (Complete)</span>
              <span>Lines: {value?.split("\n").length || 0}</span>
              <span>Language: {currentLang.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cpu className="h-3 w-3" />
              <span>{isRunning ? "Running..." : "Ready"}</span>
            </div>
          </div>
        </div>
      </Card>
      <input ref={fileInputRef} type="file" accept=".js,.ts,.py,.java,.cpp,.c,.php,.rs,.go" className="hidden" />
    </div>
  )
}
