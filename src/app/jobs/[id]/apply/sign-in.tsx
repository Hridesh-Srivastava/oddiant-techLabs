"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail } from "lucide-react"

interface SignInProps {
  jobId: string
  onCancel: () => void
}

export default function SignIn({ jobId, onCancel }: SignInProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/jobs/apply/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, jobId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in")
      }

      if (data.exists && data.message && data.message.toLowerCase().includes("already applied")) {
        toast.error("You have already applied for this job.")
        return
      }

      if (data.exists) {
        // User exists, redirect to success page
        toast.success("Application submitted successfully!")
        setTimeout(() => {
          router.push(`/jobs/${jobId}/apply/success`)
        }, 1500)
      } else {
        // User doesn't exist, show the full application form
        toast.info("Please complete the application form to apply")
        onCancel() // Close the sign-in form and show the full application form
      }
    } catch (error) {
      console.error("Error during sign-in:", error)
      toast.error(`Sign-in failed: ${error instanceof Error ? error.message : "Please try again"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In to Apply</CardTitle>
        <CardDescription>
          Already applied before? Sign in with your email to quickly apply for this job.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-black text-white hover:text-black hover:bg-green-600">
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enroll Now
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              New Applicant? Fill Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
