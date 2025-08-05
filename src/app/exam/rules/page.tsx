"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function ExamRulesPage() {
  const router = useRouter()

  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [testDetails, setTestDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [acceptedRules, setAcceptedRules] = useState(false)

  useEffect(() => {
    // Get invitation token from URL or localStorage
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token") || localStorage.getItem("invitationToken")

    if (token) {
      setInvitationToken(token)
      localStorage.setItem("invitationToken", token)
      fetchTestDetails(token)
    } else {
      // Redirect to error page if no token
      toast.error("Invalid invitation link")
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
  }, [router])

  const fetchTestDetails = async (token: string) => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/assessment/invitations/validate/${token}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to validate invitation")
      }

      const data = await response.json()

      if (data.success && data.invitation) {
        // Fetch test details
        const testResponse = await fetch(`/api/assessment/tests/public/${data.invitation.testId}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!testResponse.ok) {
          throw new Error("Failed to fetch test details")
        }

        const testData = await testResponse.json()

        if (testData.success) {
          setTestDetails(testData.test)
        } else {
          throw new Error(testData.message || "Failed to fetch test details")
        }
      } else {
        throw new Error(data.message || "Invalid invitation")
      }
    } catch (error) {
      console.error("Error fetching test details:", error)
      toast.error("Failed to load test details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExam = () => {
    if (invitationToken) {
      router.push(`/assessment/take/${invitationToken}`)
    }
  }

  const handleBackStep = () => {
    if (invitationToken) {
      router.push(`/exam/id-verification?token=${invitationToken}`)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Toaster position="top-center" />

      <Card>
        <CardHeader>
          <CardTitle>Pre-Exam Verification</CardTitle>
          <CardDescription>Complete system check and ID verification before starting the exam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between border rounded-md p-2 bg-muted/30">
            <div className="w-1/3 text-center text-muted-foreground p-2">System Check</div>
            <div className="w-1/3 text-center text-muted-foreground p-2">ID Verification</div>
            <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">Exam Rules</div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : testDetails ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">{testDetails.name}</h2>
                <p className="text-muted-foreground">{testDetails.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>{testDetails.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span>Passing score: {testDetails.passingScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    <span>{testDetails.sections?.length || 0} sections</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Exam Rules</h3>

                <div className="space-y-2 p-4 border rounded-md">
                  <p className="font-medium">During this exam:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>You must remain on the exam tab at all times</li>
                    <li>Your webcam must remain on throughout the exam</li>
                    <li>No other applications should be open on your device</li>
                    <li>No communication with others is allowed</li>
                    <li>You cannot copy or distribute exam content</li>
                    {testDetails.settings?.preventTabSwitching && (
                      <li className="text-amber-600">Tab switching is not allowed and will be recorded</li>
                    )}
                    {testDetails.settings?.autoSubmit && (
                      <li className="text-amber-600">The exam will be automatically submitted when time expires</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Test Instructions</h4>
                  <div className="text-muted-foreground">
                    {testDetails.instructions ? (
                      <p>{testDetails.instructions}</p>
                    ) : (
                      <p>No specific instructions provided for this test.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="accept-rules"
                    checked={acceptedRules}
                    onCheckedChange={(checked) => setAcceptedRules(checked === true)}
                  />
                  <Label htmlFor="accept-rules" className="text-sm">
                    I have read and agree to follow all exam rules and instructions
                  </Label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBackStep}>
                  Back
                </Button>
                <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={handleStartExam} disabled={!acceptedRules}>
                  Start Exam
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Test Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested test could not be found or has been deactivated.
              </p>
              <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
