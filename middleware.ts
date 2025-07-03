import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define protected routes
  const studentProtectedRoutes = ["/student"]
  const employeeProtectedRoutes = ["/employee"]
  const adminProtectedRoutes = ["/admin"]
  const authRoutes = ["/auth/login", "/auth/register", "/auth/employee/login", "/auth/employee/register"]

  // Check if the current path is a protected route
  const isStudentProtectedRoute = studentProtectedRoutes.some((route) => path.startsWith(route))
  const isEmployeeProtectedRoute = employeeProtectedRoutes.some((route) => path.startsWith(route))
  const isAdminProtectedRoute = adminProtectedRoutes.some((route) => path.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => path === route)

  // Get the token from cookies
  const token = request.cookies.get("auth_token")?.value

  // If no token and trying to access protected route, redirect to login
  if (!token && (isStudentProtectedRoute || isEmployeeProtectedRoute || isAdminProtectedRoute)) {
    const loginUrl =
      isEmployeeProtectedRoute || isAdminProtectedRoute
        ? new URL("/auth/employee/login", request.url)
        : new URL("/auth/login", request.url)

    return NextResponse.redirect(loginUrl)
  }

  // If token exists, verify it
  if (token) {
    const decoded = verifyToken(token)

    // If token is invalid, redirect to login
    if (!decoded) {
      const loginUrl =
        isEmployeeProtectedRoute || isAdminProtectedRoute
          ? new URL("/auth/employee/login", request.url)
          : new URL("/auth/login", request.url)

      return NextResponse.redirect(loginUrl)
    }

    // Check user type for role-based access
    const userId = decoded.userId

    // Get user type from token or fetch from database
    const userType = await getUserType(userId)

    // Enforce role-based access
    if (isStudentProtectedRoute && userType !== "student") {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (isEmployeeProtectedRoute && userType !== "employee") {
      return NextResponse.redirect(new URL("/auth/employee/login", request.url))
    }

    if (isAdminProtectedRoute && userType !== "admin") {
      return NextResponse.redirect(new URL("/auth/employee/login", request.url))
    }

    // If authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthRoute) {
      if (userType === "student") {
        return NextResponse.redirect(new URL("/student/dashboard", request.url))
      } else if (userType === "employee") {
        return NextResponse.redirect(new URL("/employee/dashboard", request.url))
      } else if (userType === "admin") {
        return NextResponse.redirect(new URL("/admin/employees", request.url))
      }
    }
  }

  return NextResponse.next()
}

// Helper function to get user type from database
async function getUserType(userId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/check`, {
      headers: {
        "x-user-id": userId,
      },
    })

    if (!response.ok) {
      return "unknown"
    }

    const data = await response.json()
    return data.userType || "unknown"
  } catch (error) {
    console.error("Error fetching user type:", error)
    return "unknown"
  }
}

export const config = {
  matcher: [
    "/student/:path*",
    "/employee/:path*",
    "/employee/assessment/:path*", // Explicitly protect all assessment routes
    "/admin/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/employee/login",
    "/auth/employee/register",
  ],
}
