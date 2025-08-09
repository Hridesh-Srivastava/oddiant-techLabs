"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, ChevronRight } from "lucide-react"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/company", label: "Company" },
    { href: "/solutions", label: "Solutions" },
    { href: "/contact", label: "Contact Us" },
  ]

  // Function to check if a link is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  }

  const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  }

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={navVariants}
    className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-black backdrop-blur-md shadow-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div variants={logoVariants} initial="initial" animate="animate" whileHover="hover">
            <Link href="/" className="relative">
              <div style={{ width: "180px", height: "40px", position: "relative" }}>
                <Image
                  src="/images/logos/oddiant-preview.png"
                  alt="Oddiant Techlabs"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href)

              return (
                <motion.div key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    className="relative text-white font-medium transition-all duration-300 group overflow-hidden hover:text-green-400"
                  >
                    <span className="relative z-10">{link.label}</span>

                    {/* Active indicator */}
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-blue-500"
                      initial={false}
                      animate={{
                        scaleX: isActive ? 1 : 0,
                        opacity: isActive ? 1 : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      style={{ transformOrigin: "left" }}
                    />

                    {/* Hover indicator */}
                    <span
                      className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400/50 to-blue-500/50 transform origin-left transition-transform duration-300 ${
                        isActive ? "scale-x-0" : "scale-x-0"
                      } group-hover:scale-x-100`}
                    />
                  </Link>
                </motion.div>
              )
            })}
            
                         {/* Portal Button */}
             <motion.div variants={itemVariants}>
               <a
                 href="/join-now"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 px-4 py-1 text-white font-medium border border-gray-300 rounded-md transition-all duration-300 hover:text-black hover:bg-green-600 hover:border-green-600"
               >
                 Portal
                 <ChevronRight size={16} />
               </a>
             </motion.div>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 transition-colors">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-gradient-to-b from-black to-zinc-900 text-white border-zinc-800">
              <SheetTitle className="text-white sr-only">Navigation Menu</SheetTitle>

              {/* Mobile Logo */}
              <div className="flex items-center mb-8">
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <div style={{ width: "150px", height: "35px", position: "relative" }}>
                    <Image
                      src="/images/logos/oddiant-preview.png"
                      alt="Oddiant Techlabs"
                      fill
                      className="object-contain"
                    />
                  </div>
                </Link>
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-6 mt-10">
                {navLinks.map((link) => {
                  const isActive = isActiveLink(link.href)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-xl font-medium transition-all duration-300 hover:text-green-400 ${
                        isActive ? "text-green-400" : "text-white"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.span
                          className="h-0.5 bg-green-400"
                          initial={false}
                          animate={{
                            width: isActive ? 20 : 0,
                            opacity: isActive ? 1 : 0,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                          }}
                        />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  )
                })}
                
                                 {/* Mobile Portal Button */}
                 <a
                   href="/join-now"
                   rel="noopener noreferrer"
                   className="inline-flex items-center justify-center gap-1 px-4 py-3 text-white font-medium border border-gray-300 rounded-md transition-all duration-300 hover:text-black hover:bg-green-600 hover:border-green-600"
                   onClick={() => setIsOpen(false)}
                 >
                   Portal
                   <ChevronRight size={18} />
                 </a>
              </div>

              {/* Mobile Contact Info */}
              <div className="mt-12 pt-8 border-t border-zinc-800">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <a href="mailto:hi@oddiant.com" className="text-white hover:text-green-400 transition-colors">
                      hi@oddiant.com
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <a href="tel:+917300875549" className="text-white hover:text-green-400 transition-colors">
                      +91 7300875549
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
