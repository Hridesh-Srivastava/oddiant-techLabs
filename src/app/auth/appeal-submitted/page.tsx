import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Clock } from "lucide-react"

export default function AppealSubmittedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Appeal Submitted</CardTitle>
          <CardDescription>Your appeal has been successfully submitted for review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              What happens next?
            </h3>
            <p className="text-blue-700 text-sm">
              Our technical team will review your updated information within the next 48 hours. Once a decision has been
              made, you will receive an email notification with further instructions.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Appeal Process</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Your appeal has been submitted</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">⟳</span>
                <span>Our team is reviewing your updated information</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">○</span>
                <span>You'll receive an email once a decision has been made</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">○</span>
                <span>If approved, you can sign in to access your dashboard</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Link href="/auth/employee/login">
              <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline">Return to Login</Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 text-center pt-4">
            If you have any questions, please contact our support team at{" "}
            <a href="mailto:support@oddiant.com" className="text-blue-600 hover:underline">
              support@oddiant.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
