"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Toaster, toast } from "sonner"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXTwitter, faFacebookF, faYoutube, faWhatsapp } from "@fortawesome/free-brands-svg-icons"

export default function ContactPage() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

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
      } catch (error) {
        console.error("Error with fallback form:", error)
        toast.error("Could not open email client. Please contact us directly at hi@oddiant.com")
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    try {
      console.log("Submitting form data:", formData)

      // Use absolute URL for API endpoint to avoid path issues
      const apiUrl = "/api/contact"

      console.log("Submitting to API URL:", apiUrl)

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

      console.log("Response status:", response.status)

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
          toast.error("The contact form is currently unavailable. Would you like to use your email client instead?", {
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
        console.log("Response data:", data)
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error("Received invalid response from server. Please try again.")
      }

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
    } catch (error) {
      console.error("Error submitting form:", error)

      // More specific error messages with proper type checking
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error("Request timed out. Please check your connection and try again.")
        } else if (error instanceof TypeError && error.message.includes("fetch")) {
          toast.error("Network error. Please check your connection and try again.")
          toast.error("Would you like to use your email client instead?", {
            action: {
              label: "Use Email",
              onClick: () => setUseEmailFallback(true),
            },
            duration: 10000,
          })
        } else {
          toast.error(error.message || "Failed to send message. Please try again.")
        }
      } else {
        toast.error("Failed to send message. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Balanced Epic Galaxy Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Nebula Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-black"></div>

        {/* Balanced Colorful Moving Stars */}
        <div className="stars-container">
          {[...Array(90)].map((_, i) => (
            <div
              key={i}
              className={`star star-${(i % 6) + 1}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${3 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Balanced Shooting Stars */}
        <div className="shooting-stars">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="shooting-star"
              style={{
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 12}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Balanced Floating Particles */}
        <div className="particles">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 18}s`,
                animationDuration: `${12 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Balanced Floating Orbits */}
        <div className="floating-orbits">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`floating-orbit orbit-${(i % 4) + 1}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${18 + Math.random() * 15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse-glow">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Get in touch with our team to discuss how we can help your business reach the stars
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Contact Form - BEAST MODERN DYNAMIC BORDER */}
            <div className="order-2 lg:order-1">
              <div className="relative group">
                {/* KILLER PROFESSIONAL ANIMATED BORDER */}
                <div className="absolute -inset-1 rounded-3xl overflow-hidden">
                  <div className="beast-border"></div>
                </div>

                {/* Premium Glassmorphism Container */}
                <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/30 shadow-2xl">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          ></path>
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Send us a message
                      </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            Your Name <span className="text-pink-400">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              id="name"
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
                          <label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            Email Address <span className="text-pink-400">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="email"
                              id="email"
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
                          <label htmlFor="phone" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            Phone Number
                          </label>
                          <div className="relative group">
                            <input
                              type="tel"
                              id="phone"
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
                          <label
                            htmlFor="company"
                            className="text-sm font-medium text-gray-300 flex items-center gap-2"
                          >
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            Company Name
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              id="company"
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
                        <label htmlFor="service" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          Service of Interest <span className="text-pink-400">*</span>
                        </label>
                        <div className="relative group">
                          <select
                            id="service"
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
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </div>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                          Your Message <span className="text-pink-400">*</span>
                        </label>
                        <div className="relative group">
                          <textarea
                            id="message"
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
                              Sending...
                            </div>
                          ) : useEmailFallback ? (
                            <span className="relative z-10">Send via Email Client</span>
                          ) : (
                            <div className="flex items-center justify-center gap-2 relative z-10">
                              <span>Send Message</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                ></path>
                              </svg>
                            </div>
                          )}
                        </Button>
                      </div>

                      {!useEmailFallback && (
                        <p className="text-xs text-center text-gray-400 mt-4">
                          Having trouble with the form?{" "}
                          <button
                            type="button"
                            onClick={() => setUseEmailFallback(true)}
                            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                          >
                            Use email client instead
                          </button>
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="order-1 lg:order-2">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Contact Information
                  </h2>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                    Get in touch with us for any inquiries about our services, partnerships, or career opportunities.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Phone</h3>
                        <a
                          href="tel:+917300875549"
                          className="text-gray-300 hover:text-cyan-400 transition-colors text-lg block"
                        >
                          +91 7300875549
                        </a>
                        <a
                          href="tel:+918755498866"
                          className="text-gray-300 hover:text-cyan-400 transition-colors text-lg block"
                        >
                          +91 8755498866
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Email</h3>
                        <a
                          href="mailto:hi@oddiant.com"
                          className="text-gray-300 hover:text-purple-400 transition-colors text-lg"
                        >
                          hi@oddiant.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Office Locations</h3>
                        <a
                          className="text-gray-300 hover:text-green-400 transition-colors text-lg block mb-1"
                          href="https://maps.app.goo.gl/BBFMKuiDnabN2rPE6"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          D.D Puram Bareilly, Uttar Pradesh, India
                        </a>
                        <a
                          className="text-gray-300 hover:text-green-400 transition-colors text-lg block"
                          href="https://maps.app.goo.gl/bMVpmZkageHxXuc76"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Sector-63 Noida, Uttar Pradesh, India
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    Business Hours
                  </h3>
                  <div className="space-y-3 text-gray-300">
                    <p className="flex justify-between items-center">
                      <span>Monday - Friday:</span>
                      <span className="text-cyan-400 font-medium">9:30 AM - 6:30 PM IST</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span>Saturday:</span>
                      <span className="text-red-400 font-medium">Closed</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span>Sunday:</span>
                      <span className="text-red-400 font-medium">Closed</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Follow Us</h3>
                  <div className="flex space-x-3">
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="LinkedIn"
                      className="w-10 h-10 bg-gray-800/80 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                      </svg>
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter"
                      className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                      <FontAwesomeIcon icon={faXTwitter} className="w-5 h-5" />
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="w-10 h-10 bg-gray-800/80 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5" />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                      className="w-10 h-10 bg-gray-800/80 hover:bg-red-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                    >
                      <FontAwesomeIcon icon={faYoutube} className="w-5 h-5" />
                    </a>
                    <a
                      href="https://wa.me/your-number"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="WhatsApp"
                      className="w-10 h-10 bg-gray-800/80 hover:bg-green-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Balanced Galaxy Background Animations */
        .stars-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          animation: twinkle-enhanced linear infinite;
        }

        .star-1 {
          width: 2px;
          height: 2px;
          background: #00ffff;
          box-shadow: 0 0 8px #00ffff;
        }

        .star-2 {
          width: 3px;
          height: 3px;
          background: #ff00ff;
          box-shadow: 0 0 10px #ff00ff;
        }

        .star-3 {
          width: 1px;
          height: 1px;
          background: #ffff00;
          box-shadow: 0 0 6px #ffff00;
        }

        .star-4 {
          width: 2px;
          height: 2px;
          background: #00ff00;
          box-shadow: 0 0 8px #00ff00;
        }

        .star-5 {
          width: 3px;
          height: 3px;
          background: #ff6600;
          box-shadow: 0 0 10px #ff6600;
        }

        .star-6 {
          width: 1px;
          height: 1px;
          background: #6600ff;
          box-shadow: 0 0 6px #6600ff;
        }

        @keyframes twinkle-enhanced {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5) rotate(0deg);
          }
          25% {
            opacity: 0.7;
            transform: scale(1.1) rotate(90deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
          75% {
            opacity: 0.8;
            transform: scale(1.1) rotate(270deg);
          }
        }

        /* Balanced Shooting Stars */
        .shooting-stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .shooting-star {
          position: absolute;
          left: -100px;
          width: 3px;
          height: 3px;
          background: linear-gradient(45deg, #fff, #00ffff, transparent);
          border-radius: 50%;
          animation: shoot-enhanced linear infinite;
          box-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
        }

        @keyframes shoot-enhanced {
          0% {
            transform: translateX(-100px) translateY(0px) scale(0);
            opacity: 1;
          }
          10% {
            transform: translateX(0px) translateY(-20px) scale(1);
            opacity: 1;
          }
          90% {
            transform: translateX(calc(100vw - 100px)) translateY(-180px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(-200px) scale(0);
            opacity: 0;
          }
        }

        .shooting-star::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 80px;
          height: 2px;
          background: linear-gradient(45deg, rgba(255,255,255,0.9), rgba(0,255,255,0.6), transparent);
        }

        /* Balanced Floating Particles */
        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: float-particle-enhanced linear infinite;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
        }

        @keyframes float-particle-enhanced {
          0% {
            opacity: 0;
            transform: translateY(100vh) translateX(0px) scale(0);
          }
          10% {
            opacity: 1;
            transform: translateY(90vh) translateX(10px) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(50vh) translateX(-20px) scale(1.2);
          }
          90% {
            opacity: 1;
            transform: translateY(10vh) translateX(15px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10vh) translateX(0px) scale(0);
          }
        }

        /* Balanced Floating Orbits */
        .floating-orbits {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .floating-orbit {
          position: absolute;
          border-radius: 50%;
          animation: orbit-float ease-in-out infinite;
        }

        .orbit-1 {
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%);
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        .orbit-2 {
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .orbit-3 {
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .orbit-4 {
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        @keyframes orbit-float {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: translate(50px, -30px) scale(1.1) rotate(90deg);
            opacity: 0.6;
          }
          50% {
            transform: translate(20px, -60px) scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(-30px, -40px) scale(1.1) rotate(270deg);
            opacity: 0.6;
          }
        }

        /* Pulse Glow Animation */
        @keyframes pulse-glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
          }
          50% {
            text-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(236, 72, 153, 0.6);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        /* 🔥 BEAST MODERN DYNAMIC BORDER - KILLER PROFESSIONAL 🔥 */
        .beast-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(6, 182, 212, 0.6) 35%,
            rgba(168, 85, 247, 0.8) 40%,
            rgba(236, 72, 153, 0.6) 45%,
            rgba(59, 130, 246, 0.7) 50%,
            rgba(16, 185, 129, 0.6) 55%,
            rgba(245, 158, 11, 0.7) 60%,
            rgba(239, 68, 68, 0.6) 65%,
            transparent 70%
          );
          background-size: 400% 400%;
          animation: beast-flow 8s ease-in-out infinite;
          filter: blur(1px);
        }

        .beast-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(6, 182, 212, 0.4),
            rgba(168, 85, 247, 0.6),
            rgba(236, 72, 153, 0.4),
            rgba(59, 130, 246, 0.5),
            rgba(16, 185, 129, 0.4),
            rgba(245, 158, 11, 0.5),
            rgba(239, 68, 68, 0.4),
            transparent
          );
          animation: beast-rotate 12s linear infinite;
          filter: blur(0.5px);
        }

        .beast-border::after {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          bottom: 1px;
          background: rgba(17, 24, 39, 0.95);
          border-radius: 23px;
          z-index: 1;
        }

        @keyframes beast-flow {
          0%, 100% {
            background-position: 0% 50%;
            transform: scale(1);
          }
          25% {
            background-position: 100% 0%;
            transform: scale(1.01);
          }
          50% {
            background-position: 100% 100%;
            transform: scale(1.02);
          }
          75% {
            background-position: 0% 100%;
            transform: scale(1.01);
          }
        }

        @keyframes beast-rotate {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.02);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          75% {
            transform: rotate(270deg) scale(1.02);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        /* Interactive Hover Enhancement */
        .group:hover .beast-border {
          background: linear-gradient(
            45deg,
            transparent 25%,
            rgba(6, 182, 212, 0.8) 30%,
            rgba(168, 85, 247, 1) 35%,
            rgba(236, 72, 153, 0.8) 40%,
            rgba(59, 130, 246, 0.9) 45%,
            rgba(16, 185, 129, 0.8) 50%,
            rgba(245, 158, 11, 0.9) 55%,
            rgba(239, 68, 68, 0.8) 60%,
            transparent 65%
          );
          background-size: 300% 300%;
          animation: beast-flow-intense 4s ease-in-out infinite;
        }

        @keyframes beast-flow-intense {
          0%, 100% {
            background-position: 0% 50%;
            transform: scale(1.02);
          }
          50% {
            background-position: 100% 50%;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
