"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Award,
  Building,
  Shield,
  Users,
  MapPin,
  Home,
  Briefcase,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useClientRandom } from "@/hooks/use-client-random"

export default function WhatMakesUsDifferent() {
  const differentiators = [
    {
      icon: <Fingerprint className="w-10 h-10 text-blue-500" />,
      title: "A high degree of solution ownership",
      description:
        "We take complete responsibility for the solutions we provide, ensuring they meet your specific needs and expectations.",
    },
    {
      icon: <Award className="w-10 h-10 text-purple-500" />,
      title: "Proven process and a successful track record",
      description:
        "Our methodology has been refined through years of experience, resulting in consistently satisfied customers and clients.",
    },
    {
      icon: <Building className="w-10 h-10 text-blue-500" />,
      title: "Virtually integrated solutions company",
      description:
        "We seamlessly integrate various technologies and approaches to create comprehensive solutions for your business challenges.",
    },
    {
      icon: <Shield className="w-10 h-10 text-purple-500" />,
      title: "Full ownership of the solution",
      description:
        "From conception to implementation and beyond, we maintain complete ownership of the solutions we deliver.",
    },
    {
      icon: <Users className="w-10 h-10 text-blue-500" />,
      title: "35+ Private Sector Clients",
      description:
        "We've successfully served over 35 private sector clients across various industries, building a diverse portfolio of experience.",
    },
    {
      icon: <MapPin className="w-10 h-10 text-purple-500" />,
      title: "Onsite presence at various clients",
      description:
        "Our team maintains an onsite presence with many clients, ensuring direct communication and immediate response to needs.",
    },
    {
      icon: <Home className="w-10 h-10 text-blue-500" />,
      title: "Solution Centers in Noida, UP (India)",
      description:
        "Our strategically located solution centers enable us to provide efficient and effective services to clients worldwide.",
    },
    {
      icon: <Briefcase className="w-10 h-10 text-purple-500" />,
      title: "20+ professionals team strengths",
      description:
        "Our team of over 20 professionals brings diverse expertise and experience to every project we undertake.",
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const itemsPerSlide = 3
  const totalSlides = Math.ceil(differentiators.length / itemsPerSlide)

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay, totalSlides])

  const handlePrev = () => {
    setAutoplay(false)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides)
  }

  const handleNext = () => {
    setAutoplay(false)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides)
  }

  const getVisibleItems = () => {
    const startIndex = currentIndex * itemsPerSlide
    return differentiators.slice(startIndex, startIndex + itemsPerSlide)
  }

  // Client-only constellation
  const constellation = useClientRandom(
    () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      colorIndex: Math.floor(Math.random() * 4),
      boxShadow: `0 0 ${Math.random() * 6 + 3}px currentColor`,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 5,
    }),
    50
  )

  return (
  <section className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
      {/* Enhanced cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />

      {/* Animated constellation pattern */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", willChange: "transform, opacity" }}>
        {constellation.map((c, i) => (
          <motion.div
            key={`diff-star-${i}`}
            className="absolute"
            style={{ top: c.top, left: c.left, willChange: "transform, opacity" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: c.duration, repeat: Number.POSITIVE_INFINITY, delay: c.delay }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"][c.colorIndex],
                boxShadow: c.boxShadow,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-10 w-24 h-24 border border-blue-500/20 rounded-full"
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
        className="absolute bottom-20 right-10 w-20 h-20 border border-purple-500/20"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        animate={{
          rotate: -360,
          y: [0, -20, 0],
        }}
        transition={{
          rotate: { duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          y: { duration: 5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
        }}
      />

      {/* Enhanced gradient orbs */}
    <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full filter blur-3xl opacity-20"
        style={{
      background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 100%)",
      willChange: "transform, opacity",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
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
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full filter blur-3xl opacity-20"
        style={{
      background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(245,158,11,0.2) 50%, transparent 100%)",
      willChange: "transform, opacity",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.3, 0.2],
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
        <div className="text-center mb-12">
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                ⚡
              </motion.div>
              <span className="text-sm font-medium text-amber-400">What Makes Us Different</span>
            </div>
          </div>
          <motion.h2
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            What Makes Us Different?
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover the unique advantages that set Oddiant Techlabs apart from the competition
          </motion.p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[280px]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              {(function(){
                const items = getVisibleItems()
                if (!items.length) {
                  return Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`skeleton-${idx}`} className="h-full">
                      <Card className="bg-white/5 backdrop-blur-sm border-zinc-700/50 h-full animate-pulse">
                        <CardContent className="p-6 h-full flex flex-col">
                          <div className="mb-4 bg-white/10 rounded-lg w-16 h-10" />
                          <div className="h-6 bg-white/10 rounded w-2/3 mb-3" />
                          <div className="h-4 bg-white/10 rounded w-full mb-2" />
                          <div className="h-4 bg-white/10 rounded w-5/6" />
                        </CardContent>
                      </Card>
                    </div>
                  ))
                }
                return items.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="h-full"
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-zinc-700/50 h-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg w-fit">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-gray-300 flex-grow">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
                ))
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-center mt-8 gap-4">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-300 border border-white/20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2 items-center">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAutoplay(false)
                    setCurrentIndex(idx)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "bg-blue-500 w-4 shadow-lg shadow-blue-500/50" : "bg-white/30"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-300 border border-white/20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
