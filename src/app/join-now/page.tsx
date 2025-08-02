import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, Briefcase } from "lucide-react"

export default function JoinNowPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen ">
      <h1 className="text-3xl font-bold mb-8 text-center text-black">Join Our Platform</h1>
      <p className="text-xl text-black text-center mb-12">Choose how you want to join Oddiant Techlabs</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* User Card */}
        <Card className="w-full transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Candidate Portal</CardTitle>
            <CardDescription>Join as a job seeker or individual</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              Create an account to access exclusive resources, track your applications, and connect with opportunities and companies.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/auth/register" className="w-full">
              <Button size="lg" className="w-full bg-black text-white hover:bg-green-600 hover:text-black">
                Register
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button size="lg" variant="outline" className="w-full hover:bg-green-600 hover:text-black text-black">
                Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Employer Card */}
        <Card className="w-full transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Employers Portal</CardTitle>
            <CardDescription>Join as an organization or institution</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              Create an account with your official email to access the dashboard and manage talent acquisition for your
              organization.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/auth/employee/register" className="w-full">
              <Button size="lg" className="w-full bg-black text-white hover:bg-green-600 hover:text-black">
                Register
              </Button>
            </Link>
            <Link href="/auth/employee/login" className="w-full">
              <Button size="lg" variant="outline" className="w-full hover:bg-green-600 hover:text-black text-black">
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
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
