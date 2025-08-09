"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { User, AtSign, Phone, Briefcase, ListFilter, MessageSquare, Send, Loader2, Mail, Sparkles } from "lucide-react"

interface FallbackFormProps {
  onSuccess?: () => void
}

export default function FallbackForm({ onSuccess }: FallbackFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "it-consulting",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

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

      toast.success("Email client opened. Please send the email to complete your submission.")

      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "it-consulting",
        message: "",
      })
    } catch (error) {
      console.error("Error with fallback form:", error)
      toast.error("Could not open email client. Please contact us directly at hi@oddiant.com")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {/* Enhanced cosmic background for fallback form */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 filter blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.3) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
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
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-20 filter blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(245,158,11,0.3) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 2,
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`fallback-particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"][Math.floor(Math.random() * 5)],
              boxShadow: `0 0 ${Math.random() * 6 + 3}px currentColor`,
            }}
            animate={{
              y: [0, Math.random() * -50 - 20],
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-lg border border-zinc-700/50 rounded-3xl p-8 shadow-2xl">
        {/* Enhanced sparkle effects */}
        <motion.div
          className="absolute top-4 left-4"
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
          <Sparkles className="h-5 w-5 text-blue-400" />
        </motion.div>

        <motion.div
          className="absolute bottom-4 right-4"
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
          <Sparkles className="h-5 w-5 text-purple-400" />
        </motion.div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Email Client Form
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fallback-name" className="text-sm font-medium text-white flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-400" />
                Your Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Input
                  type="text"
                  id="fallback-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder:text-gray-500 transition-all duration-300 group-hover:bg-white/15"
                  placeholder="Enter Your Name"
                />
                <motion.span
                  initial={{ width: "0%" }}
                  animate={{ width: formData.name ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-email" className="text-sm font-medium text-white flex items-center">
                <AtSign className="mr-2 h-4 w-4 text-gray-400" />
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Input
                  type="email"
                  id="fallback-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder:text-gray-500 transition-all duration-300 group-hover:bg-white/15"
                  placeholder="user@oddiant.com"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fallback-phone" className="text-sm font-medium text-white flex items-center">
                <Phone className="mr-2 h-4 w-4 text-gray-400" />
                Phone Number
              </Label>
              <div className="relative group">
                <Input
                  type="tel"
                  id="fallback-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder:text-gray-500 transition-all duration-300 group-hover:bg-white/15"
                  placeholder="+91 1234567890"
                />
                <motion.span
                  initial={{ width: "0%" }}
                  animate={{ width: formData.phone ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-company" className="text-sm font-medium text-white flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-gray-400" />
                Company Name
              </Label>
              <div className="relative group">
                <Input
                  type="text"
                  id="fallback-company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder:text-gray-500 transition-all duration-300 group-hover:bg-white/15"
                  placeholder="Your Company"
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

          <div className="space-y-2">
            <Label htmlFor="fallback-service" className="text-sm font-medium text-white flex items-center">
              <ListFilter className="mr-2 h-4 w-4 text-gray-400" />
              Service of Interest <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="fallback-service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white transition-all duration-300 hover:bg-white/15"
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

          <div className="space-y-2">
            <Label htmlFor="fallback-message" className="text-sm font-medium text-white flex items-center">
              <MessageSquare className="mr-2 h-4 w-4 text-gray-400" />
              Your Message <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <Textarea
                id="fallback-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/10 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder:text-gray-500 transition-all duration-300 group-hover:bg-white/15 resize-none"
                placeholder="Tell us about your project or inquiry..."
              />
              <motion.span
                initial={{ width: "0%" }}
                animate={{ width: formData.message ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Opening Email Client...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Send via Email Client
                  <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Send className="ml-3 h-5 w-5" />
                  </motion.span>
                </span>
              )}
            </Button>
          </motion.div>

          <p className="text-xs text-center text-gray-400 mt-4">
            This will open your default email client with a pre-filled message.
          </p>
        </form>
      </div>
    </div>
  )
}
