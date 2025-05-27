"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Shield, ArrowLeft } from "lucide-react"

export default function SetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<"otp" | "password">("otp")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const userId = searchParams.get("userId")
  const userCollection = searchParams.get("collection")
  const email = searchParams.get("email")

  useEffect(() => {
    if (!userId || !userCollection || !email) {
      toast.error("Invalid access. Redirecting to login.")
      router.push("/auth/login")
    }
  }, [userId, userCollection, email, router])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/password-setup-otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userCollection,
          otp,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setStep("password")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userCollection,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to set password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/password-setup-otp/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userCollection,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/auth/login")
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit OTP to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-blue-600 hover:text-blue-500 text-center"
                disabled={loading}
              >
                Didn't receive OTP? Resend
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
          <CardDescription>Create a secure password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">Password must be at least 6 characters long</div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || password.length < 6 || password !== confirmPassword}
            >
              {loading ? "Setting Password..." : "Set Password"}
            </Button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-500 mt-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
