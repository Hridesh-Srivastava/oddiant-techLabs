import ExcelJS from "exceljs"
import path from "path"
import os from "os"
import { connectToDatabase } from "./mongodb"

interface NewsletterSubscriber {
  email: string
  subscriptionDate: Date
  active: boolean
  source?: string
  createdAt: Date
}

// Define a consistent file path for the Excel file
const EXCEL_FILE_NAME = "newsletter_subscribers.xlsx"
const TEMP_DIR = os.tmpdir()
const EXCEL_FILE_PATH = path.join(TEMP_DIR, EXCEL_FILE_NAME)

const EXCEL_FILES_COLLECTION = "excelFiles"
const MASTER_FILE_ID = "newsletter_subscribers_master_file"

export async function generateNewsletterExcel(): Promise<Buffer> {
  try {
    console.log("Starting Newsletter Excel generation...")

    // Connect to the database
    const { db } = await connectToDatabase()

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    let worksheet: ExcelJS.Worksheet

    // Initialize the worksheet
    worksheet = workbook.addWorksheet("Newsletter Subscribers")

    // Define columns
    worksheet.columns = [
      { header: "Email", key: "email", width: 40 },
      { header: "Subscription Date", key: "subscriptionDate", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Source", key: "source", width: 20 },
      { header: "Created At", key: "createdAt", width: 25 },
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Commit the styling
    headerRow.commit()

    // Get ALL subscribers from the database
    console.log("Fetching all newsletter subscribers from database...")
    const allSubscribers = await db
      .collection("newsletters")
      .find({})
      .sort({ createdAt: 1 }) // Sort by date ascending
      .toArray()

    console.log(`Found ${allSubscribers.length} total subscribers in database`)

    // Add all subscribers to the worksheet
    allSubscribers.forEach((subscriber) => {
      worksheet.addRow({
        email: subscriber.email,
        subscriptionDate: subscriber.subscriptionDate || subscriber.createdAt,
        status: subscriber.active ? "Active" : "Unsubscribed",
        source: subscriber.source || "Website",
        createdAt: subscriber.createdAt,
      })
    })

    // Format date columns
    worksheet.getColumn("subscriptionDate").numFmt = "yyyy-mm-dd hh:mm:ss"
    worksheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss"

    // Save the workbook to a buffer - Fixed TypeScript error
    console.log("Generating Excel buffer...")
    const uint8Array = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(uint8Array)

    try {
      // Save the Excel file to the file system (for backup purposes)
      console.log("Saving Excel file to:", EXCEL_FILE_PATH)
      await workbook.xlsx.writeFile(EXCEL_FILE_PATH)

      // Update the excelFiles collection with the latest file data and subscriber count
      await db.collection(EXCEL_FILES_COLLECTION).updateOne(
        { fileId: MASTER_FILE_ID },
        {
          $set: {
            fileData: buffer,
            lastUpdated: new Date(),
            subscriberCount: allSubscribers.length,
          },
        },
        { upsert: true }, // Create if it doesn't exist
      )
      console.log("Updated Excel file metadata in database")
    } catch (dbError) {
      console.error("Error updating Excel file in database:", dbError)
      // Continue with the buffer we already have
    }

    console.log("Excel generation complete with all subscribers included")
    return buffer
  } catch (error) {
    console.error("Error in Excel generation:", error)
    throw error
  }
}