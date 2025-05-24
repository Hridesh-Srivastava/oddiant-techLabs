import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest, getUserTypeFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user ID and type from request
    const userId = await getUserFromRequest(request)
    const userType = await getUserTypeFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Verify user is admin
    if (userType !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const { id: employeeId } = await params

    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 })
    }

    // Redirect to the reject page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/verify-employee/${employeeId}/reject`,
    )
  } catch (error) {
    console.error("Error in reject route:", error)
    return NextResponse.json({ success: false, message: "Failed to access reject page" }, { status: 500 })
  }
}
