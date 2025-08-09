"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  User,
  AtSign,
  Briefcase,
  ListFilter,
  Linkedin,
  Facebook,
  Youtube,
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"
import { FaWhatsapp } from "react-icons/fa"
import CanvasStarfield from "@/components/visuals/CanvasStarfield"

// Define more specific types to fix the TypeScript error
interface ContactDetailWithLink {
  text: string
  link: string
}

interface ContactDetailWithoutLink {
  text: string
}

// Use a discriminated union type
type ContactDetail = ContactDetailWithLink | ContactDetailWithoutLink

// Type guard function to check if a detail has a link
function hasLink(detail: ContactDetail): detail is ContactDetailWithLink {
  return "link" in detail
}

interface ContactInfo {
  icon: React.ReactNode
  title: string
  details: ContactDetail[]
  color: string
}

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "it-consulting",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useEmailFallback, setUseEmailFallback] = useState(false)
  const [formStatus, setFormStatus] = useState<{
    success: boolean
    message: string
    visible: boolean
  } | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.25 })

  const formRef = useRef<HTMLDivElement>(null)
  const isFormInView = useInView(formRef, { once: true, amount: 0.3 })

  const infoRef = useRef<HTMLDivElement>(null)
  const isInfoInView = useInView(infoRef, { once: true, amount: 0.25 })

  // New: map visibility for lazy loading iframe
  const mapRef = useRef<HTMLDivElement>(null)
  const isMapInView = useInView(mapRef, { once: true, amount: 0.2 })

  // New: gated counts to avoid initial heavy animation cost before in view
  const heroOrbitCount = isHeroInView ? (prefersReducedMotion ? 3 : 6) : 0
  const heroParticlesBase = prefersReducedMotion ? 2 : 4
  const spiralLayerCount = isFormInView ? (prefersReducedMotion ? 4 : 8) : 0
  const spiralParticlesPerLayer = prefersReducedMotion ? 8 : 12

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormStatus(null)

    // If we're using the email fallback, use the fallback form
    if (useEmailFallback) {
      try {
        // Send email directly using mailto link
        const subject = `Contact Form: ${formData.name} - ${formData.service}`
        const body = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || "Not provided"}
Company: ${formData.company || "Not provided"}
Service: ${formData.service}

Message:
${formData.message}
        `.trim()

        // Create mailto link
        const mailtoLink = `mailto:hi@oddiant.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

        // Open email client
        window.location.href = mailtoLink

        // Show success message
        setFormStatus({
          success: true,
          message: "Email client opened. Please send the email to complete your submission.",
          visible: true,
        })
        toast.success("Email client opened. Please send the email to complete your submission.")

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          service: "it-consulting",
          message: "",
        })

        // Hide the message after 5 seconds
        setTimeout(() => {
          setFormStatus((prev) => (prev ? { ...prev, visible: false } : null))
        }, 5000)
      } catch (error) {
        console.error("Error with fallback form:", error)
        setFormStatus({
          success: false,
          message: "Could not open email client. Please contact us directly at hi@oddiant.com",
          visible: true,
        })
        toast.error("Could not open email client. Please contact us directly at hi@oddiant.com")

        // Hide the message after 5 seconds
        setTimeout(() => {
          setFormStatus((prev) => (prev ? { ...prev, visible: false } : null))
        }, 5000)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    try {
      // Use absolute URL for API endpoint to avoid path issues
      const apiUrl = "/api/contact"

      // Use fetch with improved error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if response is ok first
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}. Please try again later.`

        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text()
            console.error("Error response text:", errorText)
          } catch (textError) {
            console.error("Could not read error response text:", textError)
          }
        }

        // If we get a 405 error, offer to use the email fallback
        if (response.status === 405) {
          setFormStatus({
            success: false,
            message: "The contact form is currently unavailable. Would you like to use your email client instead?",
            visible: true,
          })
          toast.error("The contact form is currently unavailable.", {
            action: {
              label: "Use Email",
              onClick: () => setUseEmailFallback(true),
            },
            duration: 10000,
          })
        } else {
          throw new Error(errorMessage)
        }
        return
      }

      // Try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error("Received invalid response from server. Please try again.")
      }

      // Show success message
      setFormStatus({
        success: true,
        message: data?.message || "Message sent successfully! We'll get back to you soon.",
        visible: true,
      })
      toast.success(data?.message || "Message sent successfully! We'll get back to you soon.")

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "it-consulting",
        message: "",
      })

      // Hide the message after 5 seconds
      setTimeout(() => {
        setFormStatus((prev) => (prev ? { ...prev, visible: false } : null))
      }, 5000)
    } catch (error: unknown) {
      console.error("Error submitting form:", error)

      // More specific error messages
      if ((error as { name?: string })?.name === "AbortError") {
        setFormStatus({
          success: false,
          message: "Request timed out. Please check your connection and try again.",
          visible: true,
        })
        toast.error("Request timed out. Please check your connection and try again.")
      } else if (error instanceof TypeError && (error as TypeError).message.includes("fetch")) {
        setFormStatus({
          success: false,
          message: "Network error. Please check your connection and try again.",
          visible: true,
        })
        toast.error("Network error. Please check your connection and try again.")
        toast.error("Would you like to use your email client instead?", {
          action: {
            label: "Use Email",
            onClick: () => setUseEmailFallback(true),
          },
          duration: 10000,
        })
      } else {
        setFormStatus({
          success: false,
          message: error instanceof Error ? error.message : "Failed to send message. Please try again.",
          visible: true,
        })
        toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.")
      }

      // Hide the message after 5 seconds
      setTimeout(() => {
        setFormStatus((prev) => (prev ? { ...prev, visible: false } : null))
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const contactInfo: ContactInfo[] = [
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Office Locations",
      details: [
        {
          text: "D.D Puram Bareilly, Uttar Pradesh",
          link: "https://maps.app.goo.gl/BBFMKuiDnabN2rPE6",
        },
        {
          text: "Sector-63 Noida, Uttar Pradesh",
          link: "https://maps.app.goo.gl/bMVpmZkageHxXuc76",
        },
      ],
      color: "blue",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      details: [
        {
          text: "hi@oddiant.com",
          link: "mailto:hi@oddiant.com",
        },
      ],
      color: "green",
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Phone",
      details: [
        {
          text: "+91 7300875549",
          link: "tel:+917300875549",
        },
        {
          text: "+91 8755498866",
          link: "tel:+918755498866",
        },
      ],
      color: "purple",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Business Hours",
      details: [
        {
          text: "Mon-Fri: 9:30 AM - 6:30 PM IST",
        },
        {
          text: "Sat-Sun: Closed",
        },
      ],
      color: "amber",
    },
  ]

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-20 overflow-hidden"
        style={{ contentVisibility: "auto", containIntrinsicSize: "720px" }}
      >
        {/* Enhanced Cosmic Background */}
        <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />

          {/* GPU-friendly starfield (SSR-safe) */}
          <CanvasStarfield className="absolute inset-0" count={120} opacity={0.85} maxFPS={28} quality="balanced" />

          {/* Enhanced orbital rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: heroOrbitCount }).map((_, i) => (
              <motion.div
                key={`hero-orbit-${i}`}
                className="absolute border border-white/8 rounded-full"
                style={{
                  width: 200 + i * 180,
                  height: 200 + i * 180,
                }}
                animate={isHeroInView ? { rotate: 360 } : { rotate: 0 }}
                transition={{
                  duration: (prefersReducedMotion ? 35 : 25) + i * (prefersReducedMotion ? 20 : 15),
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                {/* Enhanced orbital particles */}
                {Array.from({ length: heroParticlesBase + i }).map((_, j) => (
                  <motion.div
                    key={`hero-orbital-particle-${i}-${j}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(45deg, ${
                        ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"][i]
                      }, ${["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"][i]})`,
                      top: "50%",
                      left: "50%",
                      transformOrigin: `${100 + i * 90}px 0`,
                      boxShadow: `0 0 12px ${["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"][i]}`,
                    }}
                    animate={isHeroInView ? { rotate: -360 } : { rotate: 0 }}
                    transition={{
                      duration: (prefersReducedMotion ? 24 : 18) + j * (prefersReducedMotion ? 8 : 6),
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                      delay: j * 3,
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </div>

          {/* Enhanced massive gradient orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full filter blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.3) 50%, transparent 100%)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.7, 0.3],
              x: [0, 60, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full filter blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(245,158,11,0.3) 50%, transparent 100%)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, -50, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: 3,
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full filter blur-2xl"
            style={{
              background: "radial-gradient(circle, rgba(236,72,153,0.5) 0%, rgba(6,182,212,0.3) 50%, transparent 100%)",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.8, 0.2],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Secondary subtle starfield for depth */}
          <CanvasStarfield
            className="absolute inset-0"
            count={isHeroInView ? 55 : 0}
            opacity={0.55}
            maxFPS={26}
            quality="battery"
            speedX={{ min: -0.03, max: 0.03 }}
            speedY={{ min: -0.08, max: -0.03 }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeInUpVariants}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </motion.div>
                <span className="text-sm font-medium text-blue-400">Get In Touch</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 leading-tight mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Get in touch with our team to discuss how we can help your business grow and achieve extraordinary results
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
      >
        {/* Enhanced cosmic background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />

        {/* Spiral galaxy effect */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
          {Array.from({ length: spiralLayerCount }).map((_, i) => (
            <motion.div
              key={`contact-spiral-${i}`}
              className="absolute"
              style={{
                width: 300 + i * 120,
                height: 300 + i * 120,
              }}
              animate={isFormInView ? { rotate: 360 } : { rotate: 0 }}
              transition={{
                duration: (prefersReducedMotion ? 45 : 35) + i * (prefersReducedMotion ? 16 : 12),
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {Array.from({ length: spiralParticlesPerLayer }).map((_, j) => (
                <motion.div
                  key={`contact-spiral-particle-${i}-${j}`}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: [
                      "#3B82F6",
                      "#8B5CF6",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                      "#EC4899",
                      "#06B6D4",
                      "#84CC16",
                    ][i],
                    top: "50%",
                    left: "50%",
                    transformOrigin: `${150 + i * 60}px 0`,
                    transform: `rotate(${j * 30}deg)`,
                    boxShadow: `0 0 8px ${["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"][i]}`,
                  }}
                  animate={{
                    opacity: isFormInView ? [0, 1, 0] : [0],
                    scale: isFormInView ? [0.5, 1.2, 0.5] : [0.5],
                  }}
                  transition={{
                    duration: prefersReducedMotion ? 6.5 : 5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: j * 0.4,
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Enhanced floating elements */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 border border-blue-500/20 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.3, 1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            scale: { duration: 8, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-28 h-28 border border-purple-500/20"
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          animate={{
            rotate: -360,
            y: [0, -25, 0],
          }}
          transition={{
            rotate: { duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            y: { duration: 6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Enhanced Contact Form */}
            <motion.div
              ref={formRef}
              initial="hidden"
              animate={isFormInView ? "visible" : "hidden"}
              variants={fadeInUpVariants}
              className="relative"
            >
              {/* Professional background with subtle patterns */}
              <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden">
                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Professional gradient orbs */}
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-2xl opacity-20"
                  style={{
                    background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-40 h-40 rounded-full filter blur-2xl opacity-20"
                  style={{
                    background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)",
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    delay: 2,
                  }}
                />

                {/* Subtle client-only dots via canvas to avoid SSR mismatch */}
                <CanvasStarfield
                  className="absolute inset-0"
                  count={24}
                  opacity={0.4}
                  maxFPS={28}
                  quality="battery"
                  speedX={{ min: -0.02, max: 0.02 }}
                  speedY={{ min: -0.05, max: -0.02 }}
                  size={{ min: 0.8, max: 1.6 }}
                />
              </div>

              <div className="bg-white/8 backdrop-blur-xl border border-zinc-700/30 rounded-3xl p-10 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/5 transition-all duration-500 relative">
                {/* Enhanced sparkle effects */}
                <motion.div
                  className="absolute top-6 left-6"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </motion.div>

                <motion.div
                  className="absolute bottom-6 right-6"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    delay: 1.5,
                  }}
                >
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <MessageSquare className="mr-3 h-8 w-8 text-blue-400" />
                  </motion.div>
                  Send Us a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-white flex items-center text-sm font-medium">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        Your Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative group">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Write Your Name"
                          className="bg-white/10 border-zinc-700/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl py-4 px-5 transition-all duration-300 group-hover:bg-white/15"
                          required
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: formData.name ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-white flex items-center text-sm font-medium">
                        <AtSign className="mr-2 h-4 w-4 text-gray-400" />
                        Your Email <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="client@oddiant.com"
                          className="bg-white/10 border-zinc-700/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl py-4 px-5 transition-all duration-300 group-hover:bg-white/15"
                          required
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: formData.email ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-white flex items-center text-sm font-medium">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        Phone Number
                      </Label>
                      <div className="relative group">
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 1234567890"
                          className="bg-white/10 border-zinc-700/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl py-4 px-5 transition-all duration-300 group-hover:bg-white/15"
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: formData.phone ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="company" className="text-white flex items-center text-sm font-medium">
                        <Briefcase className="mr-2 h-4 w-4 text-gray-400" />
                        Company Name
                      </Label>
                      <div className="relative group">
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Your Company"
                          className="bg-white/10 border-zinc-700/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl py-4 px-5 transition-all duration-300 group-hover:bg-white/15"
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: formData.company ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="service" className="text-white flex items-center text-sm font-medium">
                      <ListFilter className="mr-2 h-4 w-4 text-gray-400" />
                      Service of Interest <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-white/10 border border-zinc-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white transition-all duration-300 hover:bg-white/15"
                      >
                        <option className="text-black bg-white" value="it-consulting">
                          IT Consulting
                        </option>
                        <option className="text-black bg-white" value="hr-services">
                          HR Services
                        </option>
                        <option className="text-black bg-white" value="recruitment">
                          Recruitment
                        </option>
                        <option className="text-black bg-white" value="staffing">
                          Staffing
                        </option>
                        <option className="text-black bg-white" value="other">
                          Other
                        </option>
                      </select>
                      <motion.span
                        initial={{ width: "0%" }}
                        animate={{ width: formData.service ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-white flex items-center text-sm font-medium">
                      <MessageSquare className="mr-2 h-4 w-4 text-gray-400" />
                      Your Message <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative group">
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please describe how we can help you..."
                        className="min-h-[180px] bg-white/10 border-zinc-700/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl py-4 px-5 transition-all duration-300 group-hover:bg-white/15 resize-none"
                        required
                      />
                      <motion.span
                        initial={{ width: "0%" }}
                        animate={{ width: formData.message ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  {formStatus && formStatus.visible && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        formStatus.success
                          ? "bg-green-900/30 text-green-300 border border-green-800/50"
                          : "bg-red-900/30 text-red-300 border border-red-800/50"
                      }`}
                    >
                      {formStatus.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className="text-sm font-medium">{formStatus.message}</span>
                      {!formStatus.success && !useEmailFallback && formStatus.message.includes("unavailable") && (
                        <Button
                          type="button"
                          variant="link"
                          className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                          onClick={() => setUseEmailFallback(true)}
                        >
                          Use Email Client
                        </Button>
                      )}
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-300 rounded-xl py-6 text-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          {useEmailFallback ? "Opening Email Client..." : "Sending..."}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          {useEmailFallback ? "Send via Email Client" : "Send Message"}
                          <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                            <Send className="ml-3 h-5 w-5" />
                          </motion.span>
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  {!useEmailFallback && (
                    <p className="text-xs text-center text-gray-400 mt-4">
                      Having trouble with the form?{" "}
                      <button
                        type="button"
                        onClick={() => setUseEmailFallback(true)}
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
                      >
                        Use email client instead
                      </button>
                    </p>
                  )}
                </form>
              </div>

              {/* Subtle decorative elements */}
              <motion.div
                className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500/10 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 1,
                }}
              />
            </motion.div>

            {/* Enhanced Contact Information */}
            <motion.div
              ref={infoRef}
              initial="hidden"
              animate={isInfoInView ? "visible" : "hidden"}
              variants={staggerContainerVariants}
              className="space-y-8"
            >
              <motion.div variants={fadeInUpVariants}>
                <div className="inline-block mb-6">
                  <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                    <Globe className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Contact Information</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Contact Information
                </h2>
                <p className="text-gray-300 mb-8 text-lg">
                  We'd love to hear from you. Reach out to us through any of the following channels or fill out the
                  contact form.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contactInfo.map((info, index) => {
                  const colorClasses = {
                    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                    green: "bg-green-500/20 text-green-400 border-green-500/30",
                    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  }

                  return (
                    <motion.div
                      key={info.title}
                      variants={fadeInUpVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/5 backdrop-blur-lg border border-zinc-800/50 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group"
                    >
                      <div className="flex items-start gap-5">
                        <div
                          className={`w-14 h-14 rounded-2xl ${
                            colorClasses[info.color as keyof typeof colorClasses]
                          } flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border shadow-lg`}
                        >
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                            {info.title}
                          </h3>
                          <div className="space-y-2">
                            {info.details.map((detail, idx) => (
                              <div key={idx}>
                                {hasLink(detail) ? (
                                  <a
                                    href={detail.link}
                                    target={detail.link.startsWith("http") ? "_blank" : undefined}
                                    rel={detail.link.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group-hover:text-gray-300"
                                  >
                                    {detail.text}
                                    {detail.link.startsWith("http") && (
                                      <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    )}
                                  </a>
                                ) : (
                                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                    {detail.text}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Enhanced Map */}
              <motion.div variants={fadeInUpVariants} className="mt-12" ref={mapRef}>
                <div className="bg-white/5 backdrop-blur-lg border border-zinc-800/50 rounded-3xl p-8 overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Find Us</h3>
                  </div>
                  <div className="relative h-[350px] rounded-2xl overflow-hidden">
                    {isMapInView ? (
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.0011089455!2d77.3772!3d28.6273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5f25ac323e5%3A0x9e06f1aaca9e8e4a!2sSector%2063%2C%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1621234567890!5m2!1sen!2sin"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps showing Oddiant Techlabs location"
                        className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700 rounded-2xl"
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 animate-pulse text-sm text-gray-400">
                        Loading map...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Social Media */}
              <motion.div variants={fadeInUpVariants} className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Connect With Us</h3>
                </div>
                <div className="flex space-x-4">
                  {([
                    {
                      icon: <Linkedin className="w-5 h-5" />,
                      href: "https://linkedin.com",
                      label: "LinkedIn",
                      color: "#0A66C2",
                    },
                    {
                      icon: <FaXTwitter className="w-5 h-5" />,
                      href: "https://twitter.com",
                      label: "X",
                      color: "#A0A0A0",
                    },
                    {
                      icon: <Facebook className="w-5 h-5" />,
                      href: "https://facebook.com",
                      label: "Facebook",
                      color: "#1877F2",
                    },
                    {
                      icon: <Youtube className="w-5 h-5" />,
                      href: "https://youtube.com",
                      label: "YouTube",
                      color: "#FF0000",
                    },
                    {
                      icon: <FaWhatsapp className="w-5 h-5" />,
                      href: "https://wa.me/919876xxxxxx",
                      label: "WhatsApp",
                      color: "#25D366",
                    },
                  ] as const).map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl`}
                      style={{
                        color: social.color,
                        backgroundColor: `${social.color}20`,
                        border: `1px solid ${social.color}4D`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = social.color
                        e.currentTarget.style.border = `1px solid ${social.color}`
                        e.currentTarget.style.color = "#FFFFFF"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${social.color}20`
                        e.currentTarget.style.border = `1px solid ${social.color}4D`
                        e.currentTarget.style.color = social.color
                      }}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
