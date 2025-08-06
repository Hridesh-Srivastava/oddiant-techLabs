"use client"
import type React from "react"
import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Linkedin, Facebook, Youtube, Mail, Phone, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { FaWhatsapp } from "react-icons/fa"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const footerRef = useRef(null)
  const isInView = useInView(footerRef, { once: true, amount: 0.2 })

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe")
      }
      setSuccessMessage("Thank you for subscribing to our newsletter!")
      setEmail("")
      setTimeout(() => setSuccessMessage(""), 4000)
    } catch (error) {
      console.error("Subscription error:", error)
      setSuccessMessage(error instanceof Error ? error.message : "Failed to subscribe. Please try again.")
      setTimeout(() => setSuccessMessage(""), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }
  const XIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-twitter-x"
      viewBox="0 0 16 16"
    >
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
    </svg>
  )
  const socialLinks = [
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://linkedin.com",
      label: "LinkedIn",
    },
    { icon: <XIcon />, href: "https://twitter.com", label: "X" },
    {
      icon: <Facebook className="w-5 h-5" />,
      href: "https://facebook.com",
      label: "Facebook",
    },
    {
      icon: <Youtube className="w-5 h-5" />,
      href: "https://youtube.com",
      label: "YouTube",
    },
    {
      icon: <FaWhatsapp className="w-5 h-5" />,
      href: "https://whatsapp.com",
      label: "WhatsApp",
    },
  ]
  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/company", label: "Company" },
    { href: "/solutions", label: "Solutions" },
    { href: "/contact", label: "Contact Us" },
  ]
  const serviceLinks = [
    { href: "/solutions#it-consulting", label: "IT Consulting" },
    { href: "/solutions#hr-services", label: "HR Consulting" },
    { href: "/solutions#recruitment", label: "Recruitment & Manpower" },
    { href: "/solutions#staffing", label: "Personality Development" },
  ]
  return (
      <motion.footer
        ref={footerRef}
        variants={footerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="relative bg-gradient-to-b from-black to-zinc-900 text-white pt-20 pb-8 overflow-hidden z-10"
      >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/80 to-[#0c0a20]" />
        {/* Cosmic dust */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        {/* Animated nebula clouds */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-10"
          style={{
            background: "radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.3) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-0 right-0 w-full h-full opacity-10"
          style={{
            background: "radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.3) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 5,
          }}
        />
        {/* Colorful stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={`footer-star-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"][
                Math.floor(Math.random() * 6)
              ],
              boxShadow: `0 0 ${Math.random() * 5 + 2}px currentColor`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
        {/* Orbital rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`footer-orbit-${i}`}
              className="absolute border rounded-full opacity-5"
              style={{
                width: 300 + i * 200,
                height: 300 + i * 200,
                borderColor: ["#3B82F6", "#8B5CF6", "#10B981"][i],
                borderWidth: "1px",
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 30 + i * 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {/* Orbital particles */}
              {Array.from({ length: 2 }).map((_, j) => (
                <motion.div
                  key={`orbital-particle-${i}-${j}`}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ["#3B82F6", "#8B5CF6", "#10B981"][i],
                    top: "50%",
                    left: "50%",
                    marginLeft: "-0.75px",
                    marginTop: "-0.75px",
                    transformOrigin: `${150 + i * 100}px 0`,
                    boxShadow: `0 0 8px ${["#3B82F6", "#8B5CF6", "#10B981"][i]}`,
                  }}
                  animate={{
                    rotate: j % 2 === 0 ? 360 : -360,
                  }}
                  transition={{
                    duration: 15 + j * 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    delay: j * 2,
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>
        {/* Enhanced gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full filter blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full filter blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 2,
          }}
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter Subscription */}
        <motion.div variants={itemVariants} className="relative mb-16 pb-16 border-b border-zinc-800">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 shadow-xl backdrop-blur-sm border border-white/5">
            {/* Sparkle effects */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Stay Updated
                </h3>
                <p className="text-gray-300 text-sm">
                  Subscribe to our newsletter for updates, industry insights, and exclusive offers.
                </p>
              </div>
              <div>
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setSuccessMessage("") }}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-400"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium transition-all duration-300 rounded-md py-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Subscribing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          Subscribe <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                  {/* Success/Error Message - Compact and styled */}
                  {successMessage && (
                    <div className="px-3 py-2 rounded-md bg-green-600/80 border border-green-400 text-white text-sm font-medium shadow-lg transition-all duration-300">
                      {successMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and Company Info */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <div className="relative w-[180px] h-[40px]">
                <Image src="/images/logos/oddiant-preview.png" alt="Oddiant Techlabs" fill className="object-contain" />
              </div>
            </Link>
            <p className="text-gray-400 mb-6">
              Empowering businesses through innovative IT consulting, expert staffing solutions, and tailored
              personality development programs.
            </p>
            <p className="text-md font-bold text-white mb-4">Follow Us:</p>
            <div className="flex space-x-3">
              {socialLinks.map((link) => {
                let hoverColor = ""
                switch (link.label) {
                  case "WhatsApp":
                    hoverColor = "hover:bg-green-500"
                    break
                  case "Facebook":
                    hoverColor = "hover:bg-blue-600"
                    break
                  case "LinkedIn":
                    hoverColor = "hover:bg-blue-500"
                    break
                  case "X":
                    hoverColor = "hover:bg-gray-500"
                    break
                  case "YouTube":
                    hoverColor = "hover:bg-red-600"
                    break
                  default:
                    hoverColor = "hover:bg-white/20"
                }
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    whileHover={{ scale: 1.1, y: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 ${hoverColor} hover:shadow-lg hover:shadow-${link.label.toLowerCase()}-500/20`}
                  >
                    {link.icon}
                  </motion.a>
                )
              })}
            </div>
          </motion.div>
          {/* Quick Links */}
          <motion.div variants={itemVariants} className="col-span-1">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white flex items-center group transition-all duration-300"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          {/* Services */}
          <motion.div variants={itemVariants} className="col-span-1">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Services
            </h3>
            <ul className="space-y-4">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white flex items-center group transition-all duration-300"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          {/* Contact Info */}
          <motion.div variants={itemVariants} className="col-span-1">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Contact Info
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Office Locations</p>
                  <a
                    href="https://maps.app.goo.gl/BBFMKuiDnabN2rPE6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    D.D Puram Bareilly, Uttar Pradesh
                  </a>
                  <br />
                  <a
                    href="https://maps.app.goo.gl/bMVpmZkageHxXuc76"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Sector-63 Noida, Uttar Pradesh
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                  <Mail className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Email</p>
                  <a href="mailto:hi@oddiant.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                    hi@oddiant.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Phone</p>
                  <a href="tel:+917300875549" className="text-gray-400 hover:text-white transition-colors text-sm">
                    +91 7300875549
                  </a>
                  <br />
                  <a href="tel:+918755498866" className="text-gray-400 hover:text-white transition-colors text-sm">
                    +91 8755498866
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Business Hours</p>
                  <p className="text-gray-400 text-sm">Mon-Fri: 9:30 AM - 6:30 PM IST</p>
                  <p className="text-gray-400 text-sm">Sat-Sun: Closed</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>
        <Separator className="my-10 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-30" />
        {/* Bottom Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm"
        >
          <p>&copy; {new Date().getFullYear()} Oddiant Techlabs LLP. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="/images/logos/PRIVACY-TERMS[1].pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  )
}
