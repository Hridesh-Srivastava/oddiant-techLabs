"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { CheckCircle, AlertCircle, Camera, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function SystemCheckPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [systemChecks, setSystemChecks] = useState({
    cameraAccess: false,
    microphoneAccess: false,
    fullscreenMode: false,
    compatibleBrowser: false,
    tabFocus: true,
  })
  const [isCheckingCamera, setIsCheckingCamera] = useState(true)
  const [isCheckingMicrophone, setIsCheckingMicrophone] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [checkProgress, setCheckProgress] = useState(0)
  const [checkComplete, setCheckComplete] = useState(false)
  const [checkFailed, setCheckFailed] = useState(false)

  // Visibility tracking for tab focus
  const visibilityRef = useRef(true)

  useEffect(() => {
    // Get invitation token from URL or localStorage
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token") || localStorage.getItem("invitationToken")

    if (token) {
      setInvitationToken(token)
      localStorage.setItem("invitationToken", token)
    } else {
      // Redirect to error page if no token
      toast.error("Invalid invitation link")
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }

    // Check browser compatibility
    checkBrowserCompatibility()

    // Check camera access
    checkCameraAccess()

    // Check microphone access
    checkMicrophoneAccess()

    // Set up tab switching detection
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)

    // Check if already in fullscreen
    setIsFullscreen(!!document.fullscreenElement)

    return () => {
      // Clean up event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)

      // Stop camera if active
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [router])

  useEffect(() => {
    // Update progress based on checks
    const checks = Object.values(systemChecks)
    const passedChecks = checks.filter((check) => check).length
    const progress = Math.round((passedChecks / checks.length) * 100)
    setCheckProgress(progress)

    // Determine if all checks passed or if any failed
    if (progress === 100) {
      setCheckComplete(true)
      setCheckFailed(false)
    } else if (!isCheckingCamera && !isCheckingMicrophone && !isFullscreen) {
      setCheckFailed(true)
    }
  }, [systemChecks, isCheckingCamera, isCheckingMicrophone, isFullscreen])

  const checkBrowserCompatibility = () => {
    // Check for modern browser features required for the exam
    const isCompatible =
      typeof window !== "undefined" &&
      !!window.navigator &&
      !!window.localStorage &&
      !!window.Blob &&
      !!window.MediaDevices &&
      !!window.navigator.mediaDevices &&
      !!window.navigator.mediaDevices.getUserMedia

    setSystemChecks((prev) => ({
      ...prev,
      compatibleBrowser: isCompatible,
    }))
  }

  const checkCameraAccess = async () => {
    setIsCheckingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setSystemChecks((prev) => ({
        ...prev,
        cameraAccess: true,
      }))
    } catch (error) {
      console.error("Camera access error:", error)
      setSystemChecks((prev) => ({
        ...prev,
        cameraAccess: false,
      }))
    } finally {
      setIsCheckingCamera(false)
    }
  }

  const checkMicrophoneAccess = async () => {
    setIsCheckingMicrophone(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Stop the audio stream immediately after getting permission
      stream.getTracks().forEach((track) => track.stop())

      setSystemChecks((prev) => ({
        ...prev,
        microphoneAccess: true,
      }))
    } catch (error) {
      console.error("Microphone access error:", error)
      setSystemChecks((prev) => ({
        ...prev,
        microphoneAccess: false,
      }))
    } finally {
      setIsCheckingMicrophone(false)
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden" && visibilityRef.current) {
      visibilityRef.current = false
      setSystemChecks((prev) => ({
        ...prev,
        tabFocus: false,
      }))
    } else if (document.visibilityState === "visible") {
      visibilityRef.current = true
      setSystemChecks((prev) => ({
        ...prev,
        tabFocus: true,
      }))
    }
  }

  const handleWindowBlur = () => {
    if (visibilityRef.current) {
      visibilityRef.current = false
      setSystemChecks((prev) => ({
        ...prev,
        tabFocus: false,
      }))
    }
  }

  const enableFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        setSystemChecks((prev) => ({
          ...prev,
          fullscreenMode: true,
        }))
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
      toast.error("Failed to enable fullscreen mode")
    }
  }

  const handleNextStep = () => {
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
            <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">System Check</div>
            <div className="w-1/3 text-center text-muted-foreground p-2">ID Verification</div>
            <div className="w-1/3 text-center text-muted-foreground p-2">Exam Rules</div>
          </div>

          <div className="flex justify-between items-center">
            <div className="w-full">
              <Progress value={checkProgress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">System check progress: {checkProgress}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-video bg-black rounded-md overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isCheckingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                    <p>Checking camera access...</p>
                  </div>
                </div>
              )}
              {!isCheckingCamera && !systemChecks.cameraAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p>Camera access denied</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkCameraAccess}
                      className="mt-2 bg-white text-black hover:bg-gray-200"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {systemChecks.cameraAccess ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Camera Access</span>
                </div>
                {!systemChecks.cameraAccess && !isCheckingCamera && (
                  <Button size="sm" onClick={checkCameraAccess}>
                    Allow
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {systemChecks.microphoneAccess ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Microphone Access</span>
                </div>
                {!systemChecks.microphoneAccess && !isCheckingMicrophone && (
                  <Button size="sm" onClick={checkMicrophoneAccess}>
                    Allow
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {systemChecks.fullscreenMode ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  )}
                  <span>Fullscreen Mode</span>
                </div>
                {!systemChecks.fullscreenMode && (
                  <Button size="sm" onClick={enableFullscreen}>
                    Enable
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {systemChecks.compatibleBrowser ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Compatible Browser</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {systemChecks.tabFocus ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Tab Focus</span>
                </div>
              </div>
            </div>
          </div>

          {checkFailed && (
            <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
              <h3 className="font-medium flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                System Check Failed
              </h3>
              <p className="mt-1 text-sm">Please resolve all issues before proceeding to ID verification.</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button onClick={handleNextStep} disabled={!checkComplete}>
              Next: ID Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
