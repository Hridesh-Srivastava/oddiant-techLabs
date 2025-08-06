"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft, Search } from "lucide-react"

export default function ApplicationSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobTitle = searchParams.get("jobTitle") || "the position"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-gray-700">
              Thank you for applying to <span className="font-semibold">{jobTitle}</span>. Your application has been
              successfully submitted.
            </p>
            <p className="text-gray-500">
              Our team will review your application and get back to you soon. You will receive an email confirmation
              shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={() => router.push("/jobs")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse More Jobs
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="flex-1 bg-black text-white hover:text-black hover:bg-green-600">
                <Search className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
