import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

// IST timezone offset (+5:30 hours from UTC)
const IST_OFFSET = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds

// Helper function to get IST date at start of day
function getISTDateStart(date?: Date): Date {
  const now = date || new Date()
  const istDate = new Date(now.getTime() + IST_OFFSET)
  return new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate())
}

export async function GET() {
  try {
    // Connect to database
    const { db } = await connectToDatabase()

    // Get current date in IST for consistent comparison
    const todayIST = getISTDateStart()
    const yesterdayIST = new Date(todayIST)
    yesterdayIST.setDate(yesterdayIST.getDate() - 1)

    console.log("Cleanup dates (IST):", {
      todayIST: todayIST.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      yesterdayIST: yesterdayIST.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    })

    // Delete interviews that are more than 1 day old and still scheduled
    const pastInterviewsResult = await db.collection("interviews").deleteMany({
      date: { $lt: yesterdayIST },
      status: { $in: ["scheduled", "confirmed"] },
    })

    console.log(`Deleted ${pastInterviewsResult.deletedCount} past interviews`)

    // Delete very old completed/expired interviews (older than 30 days)
    const thirtyDaysAgoIST = new Date(todayIST)
    thirtyDaysAgoIST.setDate(thirtyDaysAgoIST.getDate() - 30)

    const oldInterviewsResult = await db.collection("interviews").deleteMany({
      date: { $lt: thirtyDaysAgoIST },
      status: { $in: ["completed", "expired", "cancelled"] },
    })

    console.log(`Deleted ${oldInterviewsResult.deletedCount} old completed/expired interviews`)

    return NextResponse.json(
      {
        success: true,
        message: `Cleanup completed successfully`,
        deletedPast: pastInterviewsResult.deletedCount,
        deletedOld: oldInterviewsResult.deletedCount,
        totalDeleted: pastInterviewsResult.deletedCount + oldInterviewsResult.deletedCount,
        timezone: "IST (Asia/Kolkata)",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error cleaning up interviews:", error)
    return NextResponse.json({ success: false, message: "Failed to clean up interviews" }, { status: 500 })
  }
}
