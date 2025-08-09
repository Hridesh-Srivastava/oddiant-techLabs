"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { clients } from "../data"

const ClientsPlanetary = () => {
  const [activeClientIndex, setActiveClientIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayRef = useRef<number | null>(null)

  const handleNext = useCallback(() => {
    setActiveClientIndex((prev) => (prev + 1) % clients.length)
  }, [])

  const handlePrev = () => {
    setActiveClientIndex((prev) => (prev === 0 ? clients.length - 1 : prev - 1))
  }

  const handleClientClick = (index: number) => {
    setActiveClientIndex(index)
    // Reset auto-play timer when clicking
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      if (isAutoPlaying) {
        autoPlayRef.current = window.setInterval(handleNext, 4000)
      }
    }
  }

  // Toggle auto-play
  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev)
  }

  // Handle auto-play effect
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = window.setInterval(handleNext, 4000)
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, handleNext])

  // Calculate positions for the surrounding client avatars
  const calculatePositions = (totalClients: number) => {
    const radius = 180 // Radius of the circle
    const positions = []

    for (let i = 0; i < totalClients; i++) {
      // Calculate angle to distribute evenly around the circle (in radians)
      const angle = (i * 2 * Math.PI) / totalClients

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      positions.push({ x, y })
    }

    return positions
  }

  // Precalculate positions
  const positions = calculatePositions(clients.length - 1) // -1 because one will be in the center

  return (
    <div className="py-20 relative overflow-hidden">
      {/* Enhanced cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />

      {/* Animated starfield */}
      <div className="absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={`client-star-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"][
                Math.floor(Math.random() * 6)
              ],
              boxShadow: `0 0 ${Math.random() * 6 + 3}px currentColor`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`client-orbit-${i}`}
            className="absolute border border-white/10 rounded-full"
            style={{
              width: 200 + i * 150,
              height: 200 + i * 150,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 25 + i * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Enhanced gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full filter blur-3xl opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 100%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full filter blur-3xl opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(16,185,129,0.2) 50%, transparent 100%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: 2,
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                🌟
              </motion.div>
              <span className="text-sm font-medium text-blue-400">Our Clients</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Our Clients
          </h2>
        </div>
        <p className="text-xl text-center text-gray-400 mb-16">Trusted by the world's most innovative companies</p>

        <div className="relative h-[360px] w-full max-w-4xl mx-auto">
          {/* Center hub with enhanced pulsing effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
            <motion.div
              className="w-56 h-56 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center backdrop-blur-sm"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-700/20 to-purple-700/20 flex items-center justify-center backdrop-blur-sm" />
            </motion.div>
          </div>

          {/* Featured client in center */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`center-${activeClientIndex}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <div className="relative">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-white/20">
                  <img
                    src={clients[activeClientIndex].avatar || "/placeholder.svg"}
                    alt={clients[activeClientIndex].name}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-full border-4 border-white/20 shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                  />
                </div>
                <div className="absolute top-1/2 -right-48 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm shadow-md px-6 py-3 rounded-xl text-center border border-white/20">
                  <div className="text-lg font-bold text-white">{clients[activeClientIndex].name}</div>
                  <div className="text-sm text-gray-300">{clients[activeClientIndex].position}</div>
                  <div className="text-xs text-purple-400 font-medium">{clients[activeClientIndex].company}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Surrounding clients */}
          {clients.map((client, index) => {
            // Skip the active client (it's displayed in the center)
            if (index === activeClientIndex) return null

            // Determine position index by adjusting for the missing active client
            let positionIndex = index
            if (index > activeClientIndex) positionIndex--

            const position = positions[positionIndex % positions.length]

            return (
              <motion.div
                key={client.id}
                initial={false}
                animate={{
                  x: position.x,
                  y: position.y,
                  scale: 0.5 + Math.random() * 0.2, // Varying sizes for visual interest
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 30,
                  duration: 0.5,
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                onClick={() => handleClientClick(index)}
              >
                <motion.div className="relative" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                  <img
                    src={client.avatar || "/placeholder.svg"}
                    alt={client.name}
                    className="rounded-full border-2 border-white/20 shadow-lg w-14 h-14 object-cover backdrop-blur-sm"
                  />
                  <div className="opacity-0 hover:opacity-100 absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm shadow-md px-3 py-2 rounded-md text-center whitespace-nowrap transition-opacity duration-300 border border-white/20">
                    <div className="text-xs font-bold text-white">{client.name}</div>
                    <div className="text-xs text-gray-300">{client.position}</div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}

          {/* Navigation buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white shadow-lg z-40 border border-white/20 transition-all duration-300"
            aria-label="Previous client"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white shadow-lg z-40 border border-white/20 transition-all duration-300"
            aria-label="Next client"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Navigation dots */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 justify-center">
            {clients.map((client, index) => (
              <button
                key={`dot-${client.id}`}
                onClick={() => handleClientClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeClientIndex === index
                    ? "bg-purple-500 scale-125 shadow-lg shadow-purple-500/50"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to client ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientsPlanetary
