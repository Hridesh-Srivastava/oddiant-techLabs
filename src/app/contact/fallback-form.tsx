"use client"
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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
    <div className="relative group">
      {/* Epic Animated Border */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 animate-gradient-xy"></div>

      {/* Glassmorphism Container */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-10">
          <div className="mesh-gradient"></div>
        </div>

        {/* Floating Orbs Inside Form */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>
        </div>

        <div className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fallback-name" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  Your Name <span className="text-pink-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="fallback-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                    placeholder="Enter Your Name"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="fallback-email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  Email Address <span className="text-pink-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="fallback-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                    placeholder="user@oddiant.com"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fallback-phone" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Phone Number
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    id="fallback-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
                    placeholder="+91 1234567890"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="fallback-company" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  Company Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="fallback-company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10"
                    placeholder="Your Company"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fallback-service" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Service of Interest <span className="text-pink-400">*</span>
              </label>
              <div className="relative group">
                <select
                  id="fallback-service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 appearance-none cursor-pointer"
                >
                  <option value="it-consulting" className="bg-gray-800">
                    IT Consulting
                  </option>
                  <option value="hr-services" className="bg-gray-800">
                    HR Services
                  </option>
                  <option value="recruitment" className="bg-gray-800">
                    Recruitment
                  </option>
                  <option value="staffing" className="bg-gray-800">
                    Staffing
                  </option>
                  <option value="other" className="bg-gray-800">
                    Other
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fallback-message" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                Your Message <span className="text-pink-400">*</span>
              </label>
              <div className="relative group">
                <textarea
                  id="fallback-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 resize-none"
                  placeholder="Tell us about your project or inquiry..."
                ></textarea>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="relative group">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0 text-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Opening Email Client...
                  </div>
                ) : (
                  <span className="relative z-10">Send via Email Client</span>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-400">
              This will open your default email client with a pre-filled message.
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        /* Gradient Animations */
        @keyframes gradient-xy {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg);
          }
          25% {
            transform: translate(10%, 10%) rotate(90deg);
          }
          50% {
            transform: translate(0%, 20%) rotate(180deg);
          }
          75% {
            transform: translate(-10%, 10%) rotate(270deg);
          }
        }

        .animate-gradient-xy {
          animation: gradient-xy 6s ease infinite;
        }

        /* Mesh Gradient Background */
        .mesh-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
          animation: mesh-move 20s ease-in-out infinite;
        }

        @keyframes mesh-move {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          33% {
            transform: translate(-40%, -60%) rotate(120deg);
          }
          66% {
            transform: translate(-60%, -40%) rotate(240deg);
          }
        }

        /* Floating Orbs */
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: float-orb 15s ease-in-out infinite;
        }

        .orb-1 {
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%);
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
          top: 60%;
          right: 15%;
          animation-delay: 5s;
        }

        .orb-3 {
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
          bottom: 20%;
          left: 20%;
          animation-delay: 10s;
        }

        @keyframes float-orb {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}
