"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface CameraManager {
  stream: MediaStream | null
  status: "inactive" | "requesting" | "active" | "error"
  error: string | null
  startCamera: () => Promise<MediaStream | null>
  stopCamera: () => void
  restartCamera: () => Promise<void>
  assignToVideo: (video: HTMLVideoElement, context: string) => Promise<void>
}

export function useCameraManager(): CameraManager {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<"inactive" | "requesting" | "active" | "error">("inactive")
  const [error, setError] = useState<string | null>(null)

  // Prevent multiple simultaneous operations
  const operationLock = useRef(false)
  const activeVideos = useRef<Set<HTMLVideoElement>>(new Set())

  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    // Prevent multiple simultaneous starts
    if (operationLock.current || status === "requesting" || status === "active") {
      console.log("📹 Camera operation already in progress or active")
      return stream
    }

    operationLock.current = true

    try {
      setStatus("requesting")
      setError(null)
      console.log("📹 Starting camera...")

      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user",
        },
        audio: false,
      })

      console.log("📹 Camera started successfully")
      setStream(newStream)
      setStatus("active")

      // Assign to all active videos
      activeVideos.current.forEach((video) => {
        if (video.isConnected) {
          video.srcObject = newStream
          video.play().catch((e) => console.log("Play failed:", e.message))
        }
      })

      return newStream
    } catch (err: any) {
      console.error("📹 Camera start failed:", err)
      setStatus("error")

      let errorMessage = "Failed to access camera"
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied"
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found"
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is being used by another application"
      }

      setError(errorMessage)
      return null
    } finally {
      operationLock.current = false
    }
  }, [stream, status])

  const stopCamera = useCallback(() => {
    if (operationLock.current) return

    operationLock.current = true
    console.log("📹 Stopping camera")

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    // Clear all video sources
    activeVideos.current.forEach((video) => {
      if (video.isConnected) {
        video.srcObject = null
      }
    })
    activeVideos.current.clear()

    setStatus("inactive")
    setError(null)
    operationLock.current = false
  }, [stream])

  const restartCamera = useCallback(async () => {
    console.log("🔄 Restarting camera")
    stopCamera()
    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return startCamera()
  }, [stopCamera, startCamera])

  const assignToVideo = useCallback(
    async (video: HTMLVideoElement, context: string) => {
      if (!video || !video.isConnected) {
        console.log(`📹 ${context}: Video element not available`)
        return
      }

      // Add to active videos set
      activeVideos.current.add(video)

      if (stream && status === "active") {
        console.log(`📹 ${context}: Assigning existing stream`)
        video.srcObject = stream
        video.muted = true
        video.playsInline = true

        try {
          await video.play()
          console.log(`📹 ${context}: Video playing`)
        } catch (e: any) {
          console.log(`📹 ${context}: Play failed:`, e.message)
        }
      } else {
        console.log(`📹 ${context}: No active stream to assign`)
      }
    },
    [stream, status],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  return {
    stream,
    status,
    error,
    startCamera,
    stopCamera,
    restartCamera,
    assignToVideo,
  }
}
