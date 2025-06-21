import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateExcel } from "@/lib/excel"
import { sendEmail } from "@/lib/email"

// Use auto dynamic setting to ensure compatibility with nodejs runtime
export const dynamic = "auto"
export const runtime = "nodejs"

// Enable CORS with OPTIONS method
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}

// Handle POST requests
export async function POST(request: NextRequest) {
  console.log("Contact API route hit with POST method")

  try {
    // Parse the request body with error handling
    let body
    try {
      body = await request.json()
      console.log("Request body parsed successfully:", body)
    } catch (error) {
      console.error("Error parsing request body:", error)
      return new Response(JSON.stringify({ success: false, message: "Invalid request format" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      })
    }

    // Validate required fields
    if (!body.name || !body.email || !body.service || !body.message) {
      console.error("Missing required fields:", body)
      return new Response(JSON.stringify({ success: false, message: "Please fill in all required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      })
    }

    try {
      // Connect to the database
      console.log("Connecting to database...")
      const { db } = await connectToDatabase()
      console.log("Database connected successfully")

      // Create a new contact submission with timestamp
      const contactSubmission = {
        ...body,
        createdAt: new Date(),
      }

      // Insert the submission into the database
      console.log("Inserting submission into database...")
      await db.collection("contactSubmissions").insertOne(contactSubmission)
      console.log("Submission inserted successfully")

      try {
        // Generate Excel file with ALL submissions (this will include the new one)
        console.log("Generating Excel file with all submissions...")
        const excelBuffer = await generateExcel([contactSubmission])
        console.log("Excel file generated successfully, buffer size:", excelBuffer.length)

        // Get total count of submissions for admin notification
        const totalSubmissions = await db.collection("contactSubmissions").countDocuments()
        console.log("Total submissions count:", totalSubmissions)

        // Send admin notification email with Excel attachment
        console.log("Sending admin notification email with Excel attachment...")
        const adminHtmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Contact Form Submission</title>
              <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                  .content { padding: 30px; }
                  .submission-details { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
                  .detail-row { display: flex; margin-bottom: 12px; }
                  .detail-label { font-weight: 600; color: #495057; min-width: 100px; }
                  .detail-value { color: #6c757d; flex: 1; }
                  .message-box { background-color: #e9ecef; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
                  .stats { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center; }
                  .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
                  .attachment-note { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>New Contact Form Submission</h1>
                      <p style="margin: 5px 0 0 0; opacity: 0.9;">Oddiant Techlabs Contact System</p>
                  </div>
                  
                  <div class="content">
                      <p>You have received a new contact form submission. Please find the details below:</p>
                      
                      <div class="submission-details">
                          <div class="detail-row">
                              <span class="detail-label">Name:</span>
                              <span class="detail-value">${contactSubmission.name}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Email:</span>
                              <span class="detail-value">${contactSubmission.email}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Phone:</span>
                              <span class="detail-value">${contactSubmission.phone || "Not provided"}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Company:</span>
                              <span class="detail-value">${contactSubmission.company || "Not provided"}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Service:</span>
                              <span class="detail-value">${contactSubmission.service}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Date:</span>
                              <span class="detail-value">${contactSubmission.createdAt.toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</span>
                          </div>
                      </div>
                      
                      <div class="message-box">
                          <strong>Message:</strong><br>
                          ${contactSubmission.message.replace(/\n/g, "<br>")}
                      </div>
                      
                      <div class="stats">
                          <strong>Total Submissions: ${totalSubmissions}</strong>
                      </div>
                      
                      <div class="attachment-note">
                          <strong>Excel Report Attached:</strong> The attached Excel file contains all contact form submissions including this latest one. The file is automatically updated with each new submission.
                      </div>
                  </div>
                  
                  <div class="footer">
                      <p>This is an automated notification from Oddiant Techlabs Contact System.</p>
                      <p>Please respond to the customer directly at: ${contactSubmission.email}</p>
                  </div>
              </div>
          </body>
          </html>
        `

        const adminTextContent = `
New Contact Form Submission - Oddiant Techlabs

Contact Details:
Name: ${contactSubmission.name}
Email: ${contactSubmission.email}
Phone: ${contactSubmission.phone || "Not provided"}
Company: ${contactSubmission.company || "Not provided"}
Service: ${contactSubmission.service}
Date: ${contactSubmission.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

Message:
${contactSubmission.message}

Total Submissions: ${totalSubmissions}

Note: The attached Excel file contains all contact form submissions including this latest one.
Please respond to the customer directly at: ${contactSubmission.email}
        `

        await sendEmail({
          to: process.env.EMAIL_TO,
          subject: `New Contact Form Submission from ${contactSubmission.name}`,
          text: adminTextContent,
          html: adminHtmlContent,
          attachments: [
            {
              filename: "contact_submissions.xlsx",
              content: excelBuffer,
              contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          ],
        })
        console.log("Admin notification email sent successfully")

        // Send user confirmation email
        console.log("Sending user confirmation email...")
        const userHtmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Thank you for your inquiry</title>
              <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                  .content { padding: 30px; }
                  .submission-summary { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
                  .detail-row { display: flex; margin-bottom: 12px; }
                  .detail-label { font-weight: 600; color: #495057; min-width: 100px; }
                  .detail-value { color: #6c757d; flex: 1; }
                  .message-box { background-color: #e9ecef; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
                  .next-steps { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 20px 0; }
                  .contact-info { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
                  .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Thank You for Your Inquiry</h1>
                      <p style="margin: 5px 0 0 0; opacity: 0.9;">Oddiant Techlabs</p>
                  </div>
                  
                  <div class="content">
                      <p>Dear ${contactSubmission.name},</p>
                      
                      <p>Thank you for reaching out to Oddiant Techlabs. We have successfully received your inquiry and our team will review it promptly.</p>
                      
                      <div class="submission-summary">
                          <h3 style="margin-top: 0; color: #495057;">Your Submission Summary:</h3>
                          <div class="detail-row">
                              <span class="detail-label">Name:</span>
                              <span class="detail-value">${contactSubmission.name}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Email:</span>
                              <span class="detail-value">${contactSubmission.email}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Phone:</span>
                              <span class="detail-value">${contactSubmission.phone || "Not provided"}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Company:</span>
                              <span class="detail-value">${contactSubmission.company || "Not provided"}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Service:</span>
                              <span class="detail-value">${contactSubmission.service}</span>
                          </div>
                          <div class="detail-row">
                              <span class="detail-label">Submitted:</span>
                              <span class="detail-value">${contactSubmission.createdAt.toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</span>
                          </div>
                      </div>
                      
                      <div class="message-box">
                          <strong>Your Message:</strong><br>
                          ${contactSubmission.message.replace(/\n/g, "<br>")}
                      </div>
                      
                      <div class="next-steps">
                          <h3 style="margin-top: 0; color: #0c5460;">What Happens Next?</h3>
                          <ul style="margin: 0; padding-left: 20px;">
                              <li>Our team will review your inquiry within 24 hours</li>
                              <li>We will contact you via email or phone to discuss your requirements</li>
                              <li>If needed, we will schedule a consultation call at your convenience</li>
                              <li>We will provide you with a customized solution proposal</li>
                          </ul>
                      </div>
                      
                      <div class="contact-info">
                          <h3 style="margin-top: 0; color: #495057;">Contact Information:</h3>
                          <p><strong>Email:</strong> hi@oddiant.com</p>
                          <p><strong>Phone:</strong> +91 7300875549, +91 8755498866</p>
                          <p><strong>Business Hours:</strong> Mon-Fri: 9:30 AM - 6:30 PM IST</p>
                          <p><strong>Office Locations:</strong></p>
                          <ul style="margin: 5px 0; padding-left: 20px;">
                              <li>D.D Puram Bareilly, Uttar Pradesh</li>
                              <li>Sector-63 Noida, Uttar Pradesh</li>
                          </ul>
                      </div>
                      
                      <p>If you have any urgent questions or need immediate assistance, please feel free to contact us directly.</p>
                      
                      <p>Best regards,<br>
                      <strong>Oddiant Techlabs Team</strong></p>
                  </div>
                  
                  <div class="footer">
                      <p>This is an automated confirmation email. Please do not reply to this email.</p>
                      <p>For any queries, contact us at hi@oddiant.com</p>
                  </div>
              </div>
          </body>
          </html>
        `

        const userTextContent = `
Dear ${contactSubmission.name},

Thank you for reaching out to Oddiant Techlabs. We have successfully received your inquiry and our team will review it promptly.

Your Submission Summary:
Name: ${contactSubmission.name}
Email: ${contactSubmission.email}
Phone: ${contactSubmission.phone || "Not provided"}
Company: ${contactSubmission.company || "Not provided"}
Service: ${contactSubmission.service}
Submitted: ${contactSubmission.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

Your Message:
${contactSubmission.message}

What Happens Next?
- Our team will review your inquiry within 24 hours
- We will contact you via email or phone to discuss your requirements
- If needed, we will schedule a consultation call at your convenience
- We will provide you with a customized solution proposal

Contact Information:
Email: hi@oddiant.com
Phone: +91 7300875549, +91 8755498866
Business Hours: Mon-Fri: 9:30 AM - 6:30 PM IST

Office Locations:
- D.D Puram Bareilly, Uttar Pradesh
- Sector-63 Noida, Uttar Pradesh

If you have any urgent questions or need immediate assistance, please feel free to contact us directly.

Best regards,
Oddiant Techlabs Team

---
This is an automated confirmation email. Please do not reply to this email.
For any queries, contact us at hi@oddiant.com
        `

        await sendEmail({
          to: contactSubmission.email,
          subject: `Thank you for contacting Oddiant Techlabs, ${contactSubmission.name}`,
          text: userTextContent,
          html: userHtmlContent,
        })
        console.log("User confirmation email sent successfully")
      } catch (emailError) {
        // Log but don't fail if email sending fails
        console.error("Error with email sending:", emailError)
        // Continue processing - we'll still return success since the DB entry was created
      }

      // Return success response with explicit headers
      return new Response(
        JSON.stringify({
          success: true,
          message: "Contact form submitted successfully! You will receive a confirmation email shortly.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    } catch (error) {
      console.error("Error processing contact form:", error)
      return new Response(JSON.stringify({ success: false, message: "Failed to process your request" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      })
    }
  } catch (error) {
    console.error("Unexpected error in contact form handler:", error)
    return new Response(JSON.stringify({ success: false, message: "An unexpected error occurred" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }
}
