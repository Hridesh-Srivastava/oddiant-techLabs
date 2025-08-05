"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function IDVerificationPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [studentId, setStudentId] = useState("")
  const [idCardImage, setIdCardImage] = useState<string | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturingFace, setIsCapturingFace] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

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

    // Check if verification was already completed
    const verificationStatus = localStorage.getItem(`verification_${token}`)
    if (verificationStatus === "complete") {
      setVerificationComplete(true)
    }

    return () => {
      // Stop camera if active
      stopCamera()
    }
  }, [router])

  useEffect(() => {
    // Check if all verification steps are complete
    if (studentId && idCardImage && faceImage) {
      setVerificationComplete(true)

      if (invitationToken) {
        localStorage.setItem(`verification_${invitationToken}`, "complete")
      }
    }
  }, [studentId, idCardImage, faceImage, invitationToken])

  const startCamera = async (forFace = true) => {
    try {
      if (stream) {
        // Stop any existing stream
        stopCamera()
      }

      setIsCameraActive(true)
      setIsCapturingFace(forFace)

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        await videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err)
          toast.error("Failed to start camera stream")
        })
      }
    } catch (error) {
      console.error("Camera access error:", error)
      toast.error("Failed to access camera. Please ensure camera permissions are granted.")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraActive(false)
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      toast.error("Camera not initialized properly")
      return
    }

    try {
      setIsUploading(true)
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        toast.error("Could not get canvas context")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      // Save image based on what we're capturing
      if (isCapturingFace) {
        setFaceImage(imageDataUrl)
      } else {
        setIdCardImage(imageDataUrl)
      }

      // Stop camera after capture
      stopCamera()

      // Upload to server
      await uploadImage(imageDataUrl, isCapturingFace ? "face" : "id_card")
    } catch (error) {
      console.error("Error capturing image:", error)
      toast.error("Failed to capture image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setIdCardImage(imageDataUrl)
      uploadImage(imageDataUrl, "id_card")
    }
    reader.onerror = () => {
      toast.error("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (imageDataUrl: string, type: "face" | "id_card") => {
    if (!invitationToken) {
      toast.error("No invitation token found")
      return
    }

    setIsUploading(true)

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append("image", blob, `${type}.jpg`)
      formData.append("token", invitationToken)
      formData.append("type", type)

      // Upload to server
      const uploadResponse = await fetch("/api/assessment/verification/upload", {
        method: "POST",
        body: formData,
        headers: {
          // Prevent caching
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.message || "Failed to upload image")
      }

      const data = await uploadResponse.json()

      if (!data.success) {
        throw new Error(data.message || "Upload failed")
      }

      toast.success(`${type === "face" ? "Face" : "ID Card"} uploaded successfully`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(`Failed to upload ${type === "face" ? "face" : "ID card"} image`)

      // Reset the image if upload fails
      if (type === "face") {
        setFaceImage(null)
      } else {
        setIdCardImage(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (type: "face" | "id_card") => {
    if (type === "face") {
      setFaceImage(null)
    } else {
      setIdCardImage(null)
    }
  }

  const handleNextStep = () => {
    if (invitationToken) {
      router.push(`/exam/rules?token=${invitationToken}`)
    }
  }

  const handleBackStep = () => {
    if (invitationToken) {
      router.push(`/exam/system-check?token=${invitationToken}`)
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
            <div className="w-1/3 text-center font-medium bg-background p-2 rounded-sm">ID Verification</div>
            <div className="w-1/3 text-center text-muted-foreground p-2">Exam Rules</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID Number</Label>
                <Input
                  id="student-id"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload ID Card</Label>
                {idCardImage ? (
                  <div className="relative border rounded-md overflow-hidden">
                    <img
                      src={idCardImage || "/placeholder.svg"}
                      alt="ID Card"
                      className="w-full h-auto max-h-[200px] object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveImage("id_card")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Click to upload ID card</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Upload
                      </Button>
                      <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" onClick={() => startCamera(false)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Capture Your Face</Label>
                {faceImage ? (
                  <div className="relative border rounded-md overflow-hidden">
                    <img
                      src={faceImage || "/placeholder.svg"}
                      alt="Face"
                      className="w-full h-auto max-h-[200px] object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveImage("face")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Capture your face using webcam</p>
                    <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" onClick={() => startCamera(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera view for capturing */}
          {isCameraActive && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
                <h3 className="text-lg font-medium mb-2">
                  {isCapturingFace ? "Capture Your Face" : "Capture ID Card"}
                </h3>
                <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {isCapturingFace && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-dashed border-white rounded-full w-48 h-48 opacity-50"></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                  <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={captureImage} disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Capture"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden"></canvas>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBackStep}>
              Back
            </Button>
            <Button className="bg-black text-white hover:text-black hover:bg-green-600" onClick={handleNextStep} disabled={!verificationComplete}>
              Next: Exam Rules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
