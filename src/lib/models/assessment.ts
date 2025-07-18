import type { ObjectId } from "mongodb"

export interface AssessmentTest {
  _id?: string | ObjectId
  name: string
  description: string
  duration: number
  passingScore: number
  instructions: string
  settings: {
    shuffleQuestions: boolean
    preventTabSwitching: boolean
    allowCalculator: boolean
    autoSubmit: boolean
    notepadEnabled: boolean
  }
  sections: AssessmentSection[]
  status: "Active" | "Draft" | "Archived"
  createdBy: string | ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentSection {
  id: string
  title: string
  duration: number
  questionType: "Multiple Choice" | "Written Answer" | "Coding"
  questions: AssessmentQuestion[]
}

export interface AssessmentQuestion {
  id: string
  text: string
  type: "Multiple Choice" | "Written Answer" | "Coding"
  options?: string[]
  correctAnswer?: string | string[]
  points: number
}

export interface AssessmentCandidate {
  _id?: string | ObjectId
  name: string
  email: string
  testsAssigned: number
  testsCompleted: number
  averageScore: number
  status: "Completed" | "In Progress" | "Invited" | "Failed"
  createdBy: string | ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentResult {
  _id?: string | ObjectId
  candidateId: string | ObjectId
  testId: string | ObjectId
  candidate: string
  test: string
  score: number
  duration: number
  completionDate: Date
  status: "Passed" | "Failed"
  answers: AssessmentAnswer[]
  createdBy: string | ObjectId
  createdAt: Date
}

export interface AssessmentAnswer {
  questionId: string
  answer: string | string[]
  isCorrect?: boolean
  points: number
}

export interface AssessmentInvitation {
  _id?: string | ObjectId
  email: string
  testId: string | ObjectId
  testName: string
  employeeId: string | ObjectId
  companyName: string
  token: string
  status: "Pending" | "Completed" | "Expired"
  createdAt: Date
  expiresAt: Date
  completedAt?: Date
  createdBy: string | ObjectId
}
