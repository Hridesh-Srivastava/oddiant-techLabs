import type { ObjectId } from "mongodb"

export interface AssessmentSession {
  _id?: string | ObjectId; // Stored as ObjectId in Mongo, represented as string when serialized
  token: string;               // Invitation or direct access token
  invitationId?: string;       // Reference to assessment_invitations _id (string form)
  testId: string;              // Test id
  startedAt: Date;             // When candidate actually began
  expiresAt: Date;             // Authoritative server expiry
  durationSeconds: number;     // Cached duration in seconds
  lastActivityAt: Date;        // Updated on each PATCH
  completedAt?: Date;          // Set when submission done or auto-submitted
  terminatedAt?: Date;         // Set if forcibly terminated (tab switch violations etc.)
  tabSwitchCount?: number;     // Latest count
  currentSection?: number;     // Navigation state
  currentQuestion?: number;
  answers?: Record<string, string | string[]>; // Non‑coding answers & written answers
  codes?: Record<string, string>;              // Source code per coding question key
  codeSubmissions?: Record<string, {
    code: string;
    language: string;
    timestamp: string | Date;
    results: Array<{ input?: string; expectedOutput?: string; actualOutput?: string; passed: boolean; error?: string }>;
    allPassed?: boolean;
    passedCount?: number;
    totalCount?: number;
  }[]>;       // Latest code submission metadata per question (optional)
  notes?: string;                               // Notepad content if needed
}
