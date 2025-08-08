// Define all types used in the application
export interface Employee {
  _id: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  alternativeEmail?: string
  designation?: string
  companyName?: string
  companyLocation?: string
  phone?: string
  profileCompleted?: boolean
  avatar?: string
  notificationSettings?: {
    emailNotifications: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
  }
}

export interface Candidate {
  _id: string
  name: string
  email: string
  role: string
  status: string
  avatar?: string
  appliedDate: string
  skills: string[]
  location: string
  yearsOfExperience: number
  currentPosition: string
  content: string
  firstName: string
  lastName: string
  phone: string
  website: string
  experience: any[]
  education: any[]
  matchScore: number
  gender: string
  state: string
  currentSalary: number
  age: number
  industry?: string
  collection?: string
  employerId: string
  companyId?: string
}

export interface JobPosting {
  _id: string
  jobTitle: string
  department: string
  jobType: string
  jobLocation: string
  applicants?: number
  daysLeft?: number
  interviews?: number
  createdAt: string
  updatedAt?: string
  employerId: string
  companyId?: string
}

export interface Interview {
  _id: string
  candidate: {
    name: string
    email: string
  }
  position: string
  date: string
  time: string
  jobId?: string
  status: string
  meetingLink?: string
  notes?: string
  duration?: number
  employerId: string
  companyId?: string
}

export interface DashboardStats {
  activeCandidates: number
  openPositions: number
  interviewsToday: number
  hiringSuccessRate: number
}
