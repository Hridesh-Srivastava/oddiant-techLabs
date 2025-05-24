import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    // Connect to database
    const { db } = await connectToDatabase()

    // Get current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Delete all past interviews that are still scheduled/confirmed
    const pastInterviewsResult = await db.collection("interviews").deleteMany({
      date: { $lt: today },
      status: { $in: ["scheduled", "confirmed"] },
    })

    console.log(`Deleted ${pastInterviewsResult.deletedCount} past interviews`)

    // Delete very old completed/expired interviews (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldInterviewsResult = await db.collection("interviews").deleteMany({
      date: { $lt: thirtyDaysAgo },
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
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error cleaning up interviews:", error)
    return NextResponse.json({ success: false, message: "Failed to clean up interviews" }, { status: 500 })
  }
}
