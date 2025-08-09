"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { testimonials } from "../data"
import { useClientRandom } from "@/hooks/use-client-random"

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const testimonialsToShow = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ]

  // Client-only starfield to avoid SSR/client random mismatches
  const stars = useClientRandom(
    () => ({
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"][Math.floor(Math.random() * 5)],
      boxShadow: `0 0 ${Math.random() * 6 + 3}px currentColor`,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
    }),
    60
  )

  // Ensure we only render random visuals after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="py-20 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
      {/* Enhanced cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />

      {/* Animated starfield */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", willChange: "transform, opacity" }}>
        {mounted && stars.map((s, i) => (
          <motion.div
            key={`testimonial-star-${i}`}
            className="absolute rounded-full"
            style={{
              width: s.width,
              height: s.height,
              top: s.top,
              left: s.left,
              background: s.background,
              boxShadow: s.boxShadow,
              willChange: "transform, opacity",
            }}
            animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
            transition={{ duration: s.duration, repeat: Number.POSITIVE_INFINITY, delay: s.delay }}
          />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 border border-purple-500/20 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          scale: { duration: 6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-16 h-16 border border-blue-500/20"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        animate={{
          rotate: -360,
          y: [0, -15, 0],
        }}
        transition={{
          rotate: { duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          y: { duration: 5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
        }}
      />

      {/* Enhanced gradient orbs */}
    <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full filter blur-3xl opacity-20"
        style={{
      background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 100%)",
      willChange: "transform, opacity",
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
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full filter blur-3xl opacity-20"
        style={{
      background: "radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(16,185,129,0.2) 50%, transparent 100%)",
      willChange: "transform, opacity",
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
        <div className="text-center mb-16">
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                ⭐
              </motion.div>
              <span className="text-sm font-medium text-amber-400">Testimonials</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            What Our Clients Say
          </h2>
          <p className="text-xl text-center text-gray-400 mb-16">Trusted by companies worldwide</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="relative"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonialsToShow.map((testimonial, idx) => (
                    <div
                      key={`${testimonial.id}-${idx}`}
                      className={`bg-white/10 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 ${
                        idx === 0 ? "border-l-4 border-purple-400" : ""
                      }`}
                    >
                      <div className="flex items-center mb-6">
                        <div className="relative">
                          <img
                            src={testimonial.avatar || "/placeholder.svg"}
                            alt={testimonial.name}
                            className="w-14 h-14 rounded-full border-2 border-purple-300"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-4 h-4 border-2 border-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-white">{testimonial.name}</h3>
                          <p className="text-gray-300">
                            {testimonial.position}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic">"{testimonial.testimonial}"</p>

                      <div className="mt-6 flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={`star-${i}-${testimonial.id}`}
                            className="w-5 h-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white shadow-lg border border-white/20 transition-all duration-300"
              aria-label="Previous testimonial"
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
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white shadow-lg border border-white/20 transition-all duration-300"
              aria-label="Next testimonial"
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
          </div>

          <div className="flex justify-center mt-12 space-x-2">
            {testimonials.map((testimonial, index) => (
              <button
                key={`indicator-${testimonial.id}`}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                }}
                className={`w-3 h-3 rounded-full ${
                  currentIndex === index
                    ? "bg-purple-500 scale-125 shadow-lg shadow-purple-500/50"
                    : "bg-gray-600 hover:bg-gray-500"
                } transition-all duration-300`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Testimonials
