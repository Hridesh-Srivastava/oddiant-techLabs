import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign, verify } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const TOKEN_EXPIRATION = "1d"

// Add the auth function that was missing
export async function auth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return null
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return null
    }

    return {
      user,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Compare password with hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token with user type
export function generateToken(userId: string, userType = "student"): string {
  return sign({ userId, userType }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION })
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; userType: string } | null {
  try {
    return verify(token, JWT_SECRET) as { userId: string; userType: string }
  } catch (error) {
    return null
  }
}

// Set JWT token in cookies
export async function setAuthCookie(token: string): Promise<void> {
  (await cookies()).set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
    sameSite: "lax",
  })
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  (await cookies()).delete("auth_token")
}

// Get user ID from request
export async function getUserFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("auth_token")?.value
  if (!token) {
    return null
  }
  const decoded = verifyToken(token)
  return decoded?.userId || null
}

// Get user type from request
export async function getUserTypeFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("auth_token")?.value
  if (!token) {
    return null
  }
  const decoded = verifyToken(token)
  return decoded?.userType || null
}

// Auth middleware
export async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const userId = await getUserFromRequest(req)
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  return null
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Check both collections for the user
    let user = await db.collection("students").findOne({ _id: new ObjectId(userId) })
    let userType = "student"

    // If not found in students, try employees collection
    if (!user) {
      user = await db.collection("employees").findOne({ _id: new ObjectId(userId) })
      userType = "employee"

      // If not found in employees, try admins collection
      if (!user) {
        user = await db.collection("admins").findOne({ _id: new ObjectId(userId) })
        userType = "admin"
      }
    }

    if (!user) {
      return null
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user
    return { ...userWithoutPassword, userType }
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
