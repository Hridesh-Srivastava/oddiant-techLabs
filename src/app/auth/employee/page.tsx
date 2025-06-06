import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Briefcase } from "lucide-react"

export default function EmployeeAuthPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-center text-white">Employers Portal</h1>
      <p className="mb-8 text-center text-white">Find, Hire & Manage Talent with us</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="w-full transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create a new Organizations/Institution account</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              Sign up with your official email to access the dashboard and manage talent.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/employee/register">
              <Button size="lg" className="w-full bg-black text-white hover:bg-green-600 hover:text-black">
                Register Now
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="w-full transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Access your Organizations/Institution account</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              Already have an Organizations/Institution account? Sign in to access your dashboard and tools.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/employee/login">
              <Button size="lg" variant="outline" className="w-full bg-black text-white hover:bg-green-600 hover:text-black">
                Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact IT Support
          </Link>
        </p>
      </div>
    </div>
  )
}
