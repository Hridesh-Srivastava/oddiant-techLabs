"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: () => void
  isCapturingFace: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  isUploading?: boolean
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  isCapturingFace,
  videoRef,
  isUploading = false,
}: CameraModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <Camera className="h-5 w-5 inline mr-2" />
            {isCapturingFace ? "Capture Your Face" : "Capture ID Card"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror for face capture
            />
            {isCapturingFace && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-white rounded-full w-48 h-48 opacity-50"></div>
              </div>
            )}
            {!isCapturingFace && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-white rounded-lg w-64 h-40 opacity-50"></div>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={onCapture} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Capture"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
