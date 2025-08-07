"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast, Toaster } from "sonner"
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/student/forgot-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("OTP sent to your email address")
        setStep(2)
      } else {
        toast.error(data.message || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Error requesting OTP:", error)
      toast.error("An error occurred while requesting OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp) {
      toast.error("Please enter the OTP")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/student/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("OTP verified successfully")
        setStep(3)
      } else {
        toast.error(data.message || "Invalid OTP")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast.error("An error occurred while verifying OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/student/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Password reset successfully")

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        toast.error(data.message || "Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error("An error occurred while resetting password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />

      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1)
            } else {
              router.push("/student/change-password")
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 1 ? "Back" : "Back to Change Password"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {step === 1 && <Mail className="mr-2 h-5 w-5" />}
              {step === 2 && <KeyRound className="mr-2 h-5 w-5" />}
              {step === 3 && <CheckCircle2 className="mr-2 h-5 w-5" />}
              Forgot Password
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your email to receive a one-time password"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </CardDescription>
          </CardHeader>

          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full bg-black text-white hover:text-black hover:bg-green-600" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password (OTP)</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the 6-digit OTP"
                    required
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500">
                    Please check your email for the OTP. It will expire in 10 minutes.
                  </p>
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => {
                      setIsLoading(true)
                      fetch("/api/student/forgot-password/request", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.success) {
                            toast.success("OTP resent to your email")
                          } else {
                            toast.error(data.message || "Failed to resend OTP")
                          }
                        })
                        .catch((error) => {
                          console.error("Error resending OTP:", error)
                          toast.error("An error occurred while resending OTP")
                        })
                        .finally(() => {
                          setIsLoading(false)
                        })
                    }}
                    disabled={isLoading}
                  >
                    Didn't receive the OTP? Resend
                  </Button>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </CardFooter>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
