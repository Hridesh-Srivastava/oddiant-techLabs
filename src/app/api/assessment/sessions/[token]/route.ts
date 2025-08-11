import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AssessmentSession } from "@/lib/models/assessment-session";

// Collection name constant
const COLLECTION = "assessment_sessions";

// Helper to build no-cache headers
function noCacheHeaders() {
  const headers = new Headers();
  headers.append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.append("Pragma", "no-cache");
  headers.append("Expires", "0");
  return headers;
}

// GET: Fetch existing session (or 404)
export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const { db } = await connectToDatabase();
    const session = await db.collection(COLLECTION).findOne({ token });
    if (!session) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404, headers: noCacheHeaders() });
    }
    return NextResponse.json({ success: true, session }, { status: 200, headers: noCacheHeaders() });
  } catch (e) {
    console.error("GET session error", e);
    return NextResponse.json({ success: false, message: "Failed to fetch session" }, { status: 500, headers: noCacheHeaders() });
  }
}

// POST: Create session if not exists (idempotent)
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const { testId, durationSeconds, invitationId } = body as { testId: string; durationSeconds: number; invitationId?: string };

    if (!testId || !durationSeconds) {
      return NextResponse.json({ success: false, message: "Missing testId or durationSeconds" }, { status: 400, headers: noCacheHeaders() });
    }

    const { db } = await connectToDatabase();

    const existing = await db.collection(COLLECTION).findOne({ token });
    if (existing) {
      return NextResponse.json({ success: true, session: existing }, { status: 200, headers: noCacheHeaders() });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000);
    const newSession: AssessmentSession = {
      token,
      testId,
      invitationId,
      startedAt: now,
      expiresAt,
      durationSeconds,
      lastActivityAt: now,
      tabSwitchCount: 0,
      currentSection: 0,
      currentQuestion: 0,
      answers: {},
      codes: {},
      codeSubmissions: {},
      notes: "",
    };

  interface SessionInsert extends Omit<AssessmentSession, "_id"> { createdAt: Date; updatedAt: Date }
  const insertDoc: SessionInsert = { ...newSession, createdAt: now, updatedAt: now };
  const collection = db.collection<SessionInsert>(COLLECTION);
  const result = await collection.insertOne(insertDoc);
  const created = { _id: result.insertedId, ...newSession, createdAt: now, updatedAt: now };

  return NextResponse.json({ success: true, session: created }, { status: 201, headers: noCacheHeaders() });
  } catch (e) {
    console.error("POST session error", e);
    return NextResponse.json({ success: false, message: "Failed to create session" }, { status: 500, headers: noCacheHeaders() });
  }
}

// PATCH: Partial update of mutable fields
export async function PATCH(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const allowed: (keyof AssessmentSession)[] = [
      "answers",
      "codes",
      "codeSubmissions",
      "tabSwitchCount",
      "currentSection",
      "currentQuestion",
      "notes",
      "terminatedAt",
      "completedAt",
      "lastActivityAt",
    ];

    const update: Partial<AssessmentSession> = {};
    for (const key of allowed) {
      if (key in body) {
  (update as Record<string, unknown>)[key as string] = body[key];
      }
    }
    update.lastActivityAt = new Date();
    const { db } = await connectToDatabase();

  const session = await db.collection(COLLECTION).findOne({ token });
    if (!session) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404, headers: noCacheHeaders() });
    }

    // If already completed/terminated avoid overwriting critical markers
    if (session.completedAt || session.terminatedAt) {
      delete update.completedAt; // don't allow clearing
      delete update.terminatedAt;
    }

    await db.collection(COLLECTION).updateOne({ token }, { $set: { ...update, updatedAt: new Date() } });
    const updated = await db.collection(COLLECTION).findOne({ token });

    return NextResponse.json({ success: true, session: updated }, { status: 200, headers: noCacheHeaders() });
  } catch (e) {
    console.error("PATCH session error", e);
    return NextResponse.json({ success: false, message: "Failed to update session" }, { status: 500, headers: noCacheHeaders() });
  }
}
