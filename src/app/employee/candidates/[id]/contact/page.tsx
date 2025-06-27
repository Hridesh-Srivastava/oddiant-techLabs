"use client"

import React, { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, Send, Copy, Check, AlertCircle } from 'lucide-react'
import { toast, Toaster } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Candidate {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
}

export default function ContactCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Await the params as they're now Promise-based in Next.js 15
  const resolvedParams = use(params)
  const candidateId = resolvedParams.id
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [smsMessage, setSmsMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [phoneFormatted, setPhoneFormatted] = useState("")
  const [twilioConfigured, setTwilioConfigured] = useState(true) // Default to true, will be updated

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/employee/candidates/${candidateId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch candidate details")
        }

        const data = await response.json()
        setCandidate(data.candidate)

        // Format phone number for display if it exists
        if (data.candidate?.phone) {
          // For Indian numbers, format with +91 prefix for display
          const phone = data.candidate.phone.replace(/\D/g, "")
          if (phone.length === 10 && /^[6-9]/.test(phone)) {
            setPhoneFormatted(`+91 ${phone}`)
          } else if (phone.length === 10) {
            // For other 10-digit numbers
            setPhoneFormatted(`+91 ${phone}`)
          } else if (phone.length === 11 && phone.startsWith("1")) {
            // For US numbers
            setPhoneFormatted(`+${phone}`)
          } else {
            // Default formatting
            setPhoneFormatted(data.candidate.phone)
          }
        }

        // Check Twilio configuration status
        const configResponse = await fetch("/api/config/twilio-status")
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setTwilioConfigured(configData.configured)
        }
      } catch (error) {
        console.error("Error fetching candidate:", error)
        toast.error("Failed to load candidate details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidate()
  }, [candidateId])

  const handleSendEmail = async () => {
    if (!candidate || !emailSubject || !emailBody) {
      toast.error("Please fill in all email fields")
      return
    }

    try {
      setIsSending(true)

      const response = await fetch("/api/employee/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: candidate._id,
          type: "email",
          subject: emailSubject,
          content: emailBody,
          sentAt: new Date(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send email")
      }

      toast.success(`Email sent to ${candidate.name}`)
      setEmailSubject("")
      setEmailBody("")
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setIsSending(false)
    }
  }

  const handleSendSMS = async () => {
    if (!candidate || !candidate.phone || !smsMessage) {
      toast.error("Please fill in the message and ensure candidate has a phone number")
      return
    }

    try {
      setIsSending(true)

      const response = await fetch("/api/employee/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: candidate._id,
          type: "sms",
          content: smsMessage,
          sentAt: new Date(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send SMS")
      }

      if (!twilioConfigured) {
        toast.info(`SMS logged for ${candidate.name} (Twilio not configured for actual sending)`)
      } else {
        toast.success(`SMS sent to ${candidate.name}`)
      }

      setSmsMessage("")
    } catch (error) {
      console.error("Error sending SMS:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send SMS")
    } finally {
      setIsSending(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Candidate Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The candidate you are trying to contact does not exist or has been removed.
              </p>
              <Button onClick={() => router.push("/employee/dashboard?tab=candidates")}>View All Candidates</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidate
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={candidate.avatar || "/placeholder.svg?height=48&width=48"} alt={candidate.name} />
                <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{candidate.name}</CardTitle>
                <CardDescription>{candidate.role}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{candidate.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(candidate.email)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {candidate.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>{phoneFormatted || candidate.phone}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(candidate.phone)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms" disabled={!candidate.phone}>
              SMS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Send Email</CardTitle>
                <CardDescription>Compose an email to send to the candidate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-to">To</Label>
                  <Input id="email-to" value={candidate.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-body">Message</Label>
                  <Textarea
                    id="email-body"
                    placeholder="Enter your message"
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle>Send SMS</CardTitle>
                <CardDescription>Send a text message to the candidate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!twilioConfigured && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Twilio is not fully configured. SMS will be logged but not actually sent.
                      {process.env.NODE_ENV === "development" && " This is normal in development mode."}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sms-to">To</Label>
                  <Input id="sms-to" value={phoneFormatted || candidate.phone} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-message">Message</Label>
                  <Textarea
                    id="sms-message"
                    placeholder="Enter your message"
                    rows={4}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 text-right">{smsMessage.length}/160 characters</p>
                </div>
                <Button className="w-full" onClick={handleSendSMS} disabled={isSending}>
                  {isSending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send SMS
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}