"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, AlertTriangle, RefreshCw } from "lucide-react"

interface CameraVideoProps {
  cameraManager: {
    stream: MediaStream | null
    status: "inactive" | "requesting" | "active" | "error"
    error: string | null
    startCamera: () => Promise<MediaStream | null>
    restartCamera: () => Promise<void>
    assignToVideo: (video: HTMLVideoElement, context: string) => Promise<void>
  }
  context: string
  className?: string
}

export function CameraVideo({ cameraManager, context, className = "" }: CameraVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { stream, status, error, startCamera, restartCamera, assignToVideo } = cameraManager

  // Assign stream when video element is ready
  useEffect(() => {
    if (videoRef.current) {
      assignToVideo(videoRef.current, context)
    }
  }, [assignToVideo, context, stream, status])

  return (
    <div className={`aspect-video bg-black rounded-md overflow-hidden relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        onLoadedMetadata={() => console.log(`📹 ${context}: Video loaded`)}
      />

      {status !== "active" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
          <div>
            {status === "error" && error ? (
              <>
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restartCamera}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </>
            ) : status === "requesting" ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Starting camera...</p>
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm mb-3">Camera inactive</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
