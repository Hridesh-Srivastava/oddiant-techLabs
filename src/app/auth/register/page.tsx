"use client"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"
import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="md:flex">
          <div className="hidden md:block md:w-1/3 bg-gradient-to-br from-blue-900 to-purple-900 p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 text-white">Join Our Community</h2>
            <p className="mb-4">Create an account to access exclusive resources and opportunities.</p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Personalized dashboard
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Track your applications
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Access exclusive resources
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Apply on unlimited opportunities
              </li>
            </ul>
          </div>
          <div className="w-full md:w-2/3 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Create Your Account</h1>
              <p className="text-gray-600">Fill out the form to get started</p>
              <p className="text-gray-600">Already have an account? <a href="/auth/login" className="text-blue-600 font-medium hover:underline">Sign in</a></p>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
