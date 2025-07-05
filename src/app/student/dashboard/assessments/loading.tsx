import React from "react"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg font-medium text-gray-700">Assessment dashboard is loading</span>
        <span className="flex">
          <span className="animate-bounce [animation-delay:0s] text-black text-2xl">.</span>
          <span className="animate-bounce [animation-delay:0.15s] text-black text-2xl">.</span>
          <span className="animate-bounce [animation-delay:0.3s] text-black text-2xl">.</span>
          <span className="animate-bounce [animation-delay:0.45s] text-black text-2xl">.</span>
        </span>
      </div>
      <div className="w-full flex justify-center">
      </div>
    </div>
  )
} 