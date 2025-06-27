import ExcelJS from "exceljs"
import path from "path"
import os from "os"
import { connectToDatabase } from "./mongodb"

interface ContactSubmission {
  name: string
  email: string
  phone?: string
  company?: string
  service: string
  message: string
  createdAt: Date
}

// Define a consistent file path for the Excel file
const EXCEL_FILE_NAME = "contact_submissions.xlsx"
const TEMP_DIR = os.tmpdir()
const EXCEL_FILE_PATH = path.join(TEMP_DIR, EXCEL_FILE_NAME)

// Collection name for Excel file metadata
const EXCEL_FILES_COLLECTION = "excelFiles"
const MASTER_FILE_ID = "contact_submissions_master_file"

export async function generateExcel(newSubmissions: ContactSubmission[]): Promise<Buffer> {
  try {
    console.log("Starting Excel generation with database-backed approach...")

    // Connect to the database
    const { db } = await connectToDatabase()

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    let worksheet: ExcelJS.Worksheet

    // Initialize the worksheet
    worksheet = workbook.addWorksheet("Contact Submissions")

    // Define columns
    worksheet.columns = [
      { header: "Date", key: "createdAt", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Service", key: "service", width: 20 },
      { header: "Message", key: "message", width: 50 },
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

    // Get ALL submissions from the database, not just the new ones
    console.log("Fetching all contact submissions from database...")
    const allSubmissions = await db
      .collection("contactSubmissions")
      .find({})
      .sort({ createdAt: 1 }) // Sort by date ascending
      .toArray()

    console.log(`Found ${allSubmissions.length} total submissions in database`)

    // Add all submissions to the worksheet
    allSubmissions.forEach((submission) => {
      worksheet.addRow({
        createdAt: submission.createdAt,
        name: submission.name,
        email: submission.email,
        phone: submission.phone || "N/A",
        company: submission.company || "N/A",
        service: submission.service,
        message: submission.message,
      })
    })

    // Format date column
    worksheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss"

    // Save the workbook to a buffer - Fixed TypeScript error
    console.log("Generating Excel buffer...")
    const uint8Array = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(uint8Array)

    try {
      // Save the Excel file to the file system (for backup purposes)
      console.log("Saving Excel file to:", EXCEL_FILE_PATH)
      await workbook.xlsx.writeFile(EXCEL_FILE_PATH)

      // Update the excelFiles collection with the latest file data and submission count
      await db.collection(EXCEL_FILES_COLLECTION).updateOne(
        { fileId: MASTER_FILE_ID },
        {
          $set: {
            fileData: buffer,
            lastUpdated: new Date(),
            submissionCount: allSubmissions.length,
          },
        },
        { upsert: true }, // Create if it doesn't exist
      )
      console.log("Updated Excel file metadata in database")
    } catch (dbError) {
      console.error("Error updating Excel file in database:", dbError)
      // Continue with the buffer we already have
    }

    console.log("Excel generation complete with all submissions included")
    return buffer
  } catch (error) {
    console.error("Error in Excel generation:", error)

    // Create a fallback Excel file with just the new submissions as fallback
    console.log("Creating fallback Excel file with just new submissions...")
    return createFallbackExcel(newSubmissions)
  }
}

// Helper function to create a fallback Excel file with just the new submissions
async function createFallbackExcel(submissions: ContactSubmission[]): Promise<Buffer> {
  try {
    console.log("Creating fallback Excel file...")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Contact Submissions")

    // Define columns
    worksheet.columns = [
      { header: "Date", key: "createdAt", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Service", key: "service", width: 20 },
      { header: "Message", key: "message", width: 50 },
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

    // Add submissions
    submissions.forEach((submission) => {
      worksheet.addRow({
        createdAt: submission.createdAt,
        name: submission.name,
        email: submission.email,
        phone: submission.phone || "N/A",
        company: submission.company || "N/A",
        service: submission.service,
        message: submission.message,
      })
    })

    // Format date column
    worksheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss"

    // Generate buffer directly without saving to file - Fixed TypeScript error
    const uint8Array = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(uint8Array)
    console.log("Fallback Excel file created successfully")
    return buffer
  } catch (fallbackError) {
    console.error("Error creating fallback Excel:", fallbackError)

    // Last resort: return a simple JSON buffer
    console.log("Returning JSON as last resort")
    const jsonString = JSON.stringify(submissions, null, 2)
    return Buffer.from(jsonString, "utf-8")
  }
}