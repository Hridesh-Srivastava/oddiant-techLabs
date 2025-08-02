"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Typed from "typed.js"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import { Briefcase, Clock, MapPin, ChevronRight, TrendingUp, Users, Award, Star, Sparkles } from "lucide-react"
import { Footer } from "@/components/layout/footer"
import { FlowingBackground } from "@/components/flowing-background"
import { GlowingStars } from "@/components/glowing-stars"
import { MovingCards } from "@/components/moving-cards"
import { FloatingElements } from "@/components/floating-elements"
import { ParticleText } from "@/components/particle-text"
import { GradientCards } from "@/components/gradient-cards"

export default function Home() {
  // Fix hydration error by ensuring client-side rendering for dynamic elements
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Typed.js setup
  const typedElement = useRef(null)
  const typed = useRef<Typed | null>(null)

  useEffect(() => {
    if (typedElement.current && isMounted) {
      typed.current = new Typed(typedElement.current, {
        strings: ["Your Career Journey", "Your Dream Job", "Your Next Opportunity"],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true,
        showCursor: true,
        cursorChar: "|",
      })
    }

    return () => {
      if (typed.current) {
        typed.current.destroy()
      }
    }
  }, [isMounted])

  // Parallax effect for hero section
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 300, 500], [1, 0.5, 0])

  // Scroll indicator visibility
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 200], [1, 0])

  // Static data for featured jobs
  const featuredJobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechSolutions Inc.",
      location: "Bangalore, India",
      type: "Full-time",
      salary: "₹18-25 LPA",
      posted: "2 days ago",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-blue-600/20 to-indigo-600/20",
    },
    {
      id: "2",
      title: "Data Scientist",
      company: "Analytics Pro",
      location: "Remote",
      type: "Full-time",
      salary: "₹20-28 LPA",
      posted: "1 day ago",
      skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-purple-600/20 to-pink-600/20",
    },
    {
      id: "3",
      title: "DevOps Engineer",
      company: "CloudTech Systems",
      location: "Hyderabad, India",
      type: "Full-time",
      salary: "₹16-22 LPA",
      posted: "3 days ago",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-cyan-600/20 to-blue-600/20",
    },
    {
      id: "4",
      title: "UI/UX Designer",
      company: "Creative Solutions",
      location: "Mumbai, India",
      type: "Full-time",
      salary: "₹12-18 LPA",
      posted: "5 days ago",
      skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-amber-600/20 to-orange-600/20",
    },
    {
      id: "5",
      title: "Product Manager",
      company: "InnovateTech",
      location: "Delhi NCR, India",
      type: "Full-time",
      salary: "₹22-30 LPA",
      posted: "1 week ago",
      skills: ["Product Strategy", "Agile", "User Stories", "Roadmapping"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-green-600/20 to-emerald-600/20",
    },
    {
      id: "6",
      title: "Backend Developer",
      company: "ServerStack",
      location: "Pune, India",
      type: "Full-time",
      salary: "₹14-20 LPA",
      posted: "4 days ago",
      skills: ["Node.js", "Express", "MongoDB", "GraphQL"],
      logo: "/placeholder.svg?height=80&width=80",
      color: "from-violet-600/20 to-purple-600/20",
    },
  ]

  // Static data for stats
  const stats = {
    totalJobs: "10,000+",
    totalCompanies: "500+",
    totalPlacements: "234+",
  }

  // Static data for how it works
  const howItWorks = [
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Create Your Profile",
      description: "Sign up and build your professional profile to showcase your skills and experience",
      color: "bg-gradient-to-br from-blue-600 to-indigo-700",
    },
    {
      icon: <Briefcase className="h-8 w-8 text-white" />,
      title: "Apply with Ease",
      description: "Browse jobs that match your skills and apply with just a few clicks",
      color: "bg-gradient-to-br from-purple-600 to-pink-700",
    },
    {
      icon: <Award className="h-8 w-8 text-white" />,
      title: "Get Hired",
      description: "Connect with employers, ace your interviews, and land your dream job",
      color: "bg-gradient-to-br from-indigo-600 to-blue-700",
    },
  ]

  // Static data for testimonials
  const testimonials = [
    {
      name: "Priya Sharma",
      position: "Software Engineer at TechCorp",
      quote:
        "I found my dream job within two weeks of signing up. The platform made it easy to connect with top employers in my field.",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 5,
    },
    {
      name: "Rahul Patel",
      position: "Marketing Manager at BrandX",
      quote:
        "The personalized job recommendations were spot on. I'm now working at a company that perfectly matches my skills and career goals.",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 5,
    },
    {
      name: "Ananya Gupta",
      position: "HR Director at GlobalFirm",
      quote:
        "As an employer, I've found exceptional talent through this platform. The quality of candidates has been consistently impressive.",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      position: "Data Scientist at AnalyticsPro",
      quote:
        "The job matching algorithm is incredibly accurate. I received offers from companies that were perfect for my skill set and career aspirations.",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 5,
    },
  ]

  // Only render client-side components after mounting to prevent hydration errors
  if (!isMounted) {
    return null
  }

  return (
    <main className="flex flex-col min-h-screen overflow-hidden">
      {/* Hero Section with Dynamic Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dynamic background with flowing lines and gradient */}
        <FlowingBackground />

        {/* Content */}
        <div className="container relative z-10 mx-auto px-4 pt-20 pb-16">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-4 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="text-white/80 font-medium">
                <Sparkles className="inline-block w-4 h-4 mr-2 text-purple-300" />
                Connecting talent with opportunity
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span
                ref={typedElement}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
              ></span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Starts Here
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Connect with top employers and discover opportunities that match your skills and aspirations
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Link href="/join-now">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-purple-900/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105">
                  Get Started
                </Button>
              </Link>
              {/* <Link href="/jobs">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300 hover:border-white/50"
                >
                  Browse Jobs
                </Button>
              </Link> */}
            </motion.div>
          </motion.div>

          {/* Stats with glow effect */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            {Object.entries(stats).map(([key, value], index) => (
              <motion.div
                key={key}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100"></div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center relative border border-white/20 group-hover:border-white/30 transition-all duration-300">
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-blue-100">
                    {key === "totalJobs" && "Active Job Listings"}
                    {key === "totalCompanies" && "Partner Companies"}
                    {key === "totalPlacements" && "Successful Placements"}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
            style={{ opacity: scrollIndicatorOpacity }}
          >
            <motion.div
              className="w-8 h-12 rounded-full border-2 border-white/30 flex justify-center p-1"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
            >
              <motion.div
                className="w-1.5 h-3 bg-white/70 rounded-full"
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <GlowingStars />
        <FloatingElements />
      </section>

      {/* Particle Text Section */}
      <section className="py-20 bg-gradient-to-b from-[#0a061d] to-[#150e33] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center justify-center">
            <ParticleText text="Discover Your Potential" />
            <p className="text-center text-indigo-200 mt-8 max-w-2xl mx-auto text-lg">
              Our AI-powered matching algorithm connects you with opportunities that align with your skills, experience,
              and career aspirations.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section with Auto-Scrolling Cards */}
      <section className="py-20 bg-gradient-to-b from-[#150e33] to-[#0a061d] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Opportunities</h2>
              <p className="text-indigo-200 mt-2">Discover your next career move</p>
            </div>
            {/* <Link href="/jobs" className="text-indigo-300 hover:text-indigo-100 flex items-center font-medium group">
              View all jobs{" "}
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Link> */}
          </motion.div>

          {/* Swiper for auto-scrolling cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Swiper
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={"auto"}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2,
                slideShadows: false,
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              modules={[EffectCoverflow, Pagination, Autoplay]}
              className="mySwiper"
            >
              {featuredJobs.map((job) => (
                <SwiperSlide key={job.id} className="max-w-md py-10">
                  <Link href={`/jobs/${job.id}`}>
                    <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-500 border-0 shadow-lg shadow-purple-900/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg mb-1 text-white group-hover:text-indigo-300 transition-colors">
                                {job.title}
                              </h3>
                              <p className="text-indigo-200 text-sm">{job.company}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 p-2 backdrop-blur-sm">
                              <Image
                                src={job.logo || "/placeholder.svg"}
                                alt={job.company}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 text-indigo-200 bg-indigo-900/30 border-indigo-700/50"
                            >
                              <MapPin className="h-3 w-3" /> {job.location}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 text-indigo-200 bg-indigo-900/30 border-indigo-700/50"
                            >
                              <Briefcase className="h-3 w-3" /> {job.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 text-indigo-200 bg-indigo-900/30 border-indigo-700/50"
                            >
                              <Clock className="h-3 w-3" /> {job.posted}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <Badge
                                key={index}
                                className="bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 border-indigo-700/50"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 3 && (
                              <Badge className="bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 border-indigo-700/50">
                                +{job.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-indigo-800/30 p-4 bg-indigo-900/20 flex justify-between items-center">
                          <div className="text-sm text-indigo-200">
                            <span className="font-medium text-white">{job.salary}</span>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-indigo-300 hover:text-white hover:bg-indigo-800/30 p-0 group"
                          >
                            View Details{" "}
                            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section with Animated Cards */}
      <section className="py-20 bg-gradient-to-b from-[#0a061d] to-[#150e33] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">How It Works</h2>
            <p className="text-indigo-200 max-w-2xl mx-auto">
              Our streamlined process makes it easy to find and apply for your next career opportunity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Connector line - visible on desktop only */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-indigo-800/50 -translate-y-1/2 z-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-600"></div>
                  </div>
                )}

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100"></div>

                <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 text-center relative border border-white/10 group-hover:border-white/20 transition-all duration-300 h-full flex flex-col items-center">
                  <div
                    className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/30`}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-indigo-200">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient Cards Section */}
      <section className="py-20 bg-gradient-to-b from-[#150e33] to-[#0a061d] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">Why Choose Us</h2>
            <p className="text-indigo-200 max-w-2xl mx-auto">
              We offer a comprehensive platform designed to connect talent with opportunity
            </p>
          </motion.div>

          <GradientCards />
        </div>
      </section>

      {/* For Employers Section with Animated UI */}
      <section className="py-20 bg-gradient-to-b from-[#0a061d] to-[#150e33] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-white">For Employers</h2>
              <p className="text-xl text-indigo-200 mb-8">
                Find the right talent for your organization with our comprehensive recruitment solutions
              </p>

              <div className="space-y-6">
                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 transition-all duration-300">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Access Top Talent</h3>
                    <p className="text-indigo-200">
                      Connect with qualified candidates who match your specific requirements and company culture
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 transition-all duration-300">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Streamlined Hiring</h3>
                    <p className="text-indigo-200">
                      Our platform simplifies the recruitment process from job posting to candidate selection
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 transition-all duration-300">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Employer Branding</h3>
                    <p className="text-indigo-200">
                      Showcase your company culture and values to attract candidates who align with your vision
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-10">
                <Link href="/auth/employee/register">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-900/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105">
                    Join as Employer
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="relative h-[500px] rounded-xl overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Animated UI mockup */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm rounded-xl"></div>

              {/* Header */}
              <motion.div
                className="absolute top-6 left-6 right-6 h-12 bg-white/10 rounded-lg"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
              ></motion.div>

              {/* Stats cards */}
              <div className="absolute top-24 left-6 right-6 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="h-24 bg-white/10 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                  ></motion.div>
                ))}
              </div>

              {/* Table */}
              <motion.div
                className="absolute top-56 left-6 right-6 bottom-6 bg-white/10 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                {/* Table header */}
                <div className="h-10 bg-white/10 rounded-lg mb-4"></div>

                {/* Table rows */}
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="h-12 bg-white/10 rounded-lg mb-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 1.3 + i * 0.1 }}
                  ></motion.div>
                ))}
              </motion.div>

              {/* Animated dots */}
              <div className="absolute bottom-4 right-4 flex space-x-1">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white/50 rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  ></motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with Auto-Scrolling */}
      <section className="py-20 bg-gradient-to-b from-[#150e33] to-[#0a061d] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">Success Stories</h2>
            <p className="text-indigo-200 max-w-2xl mx-auto">
              Hear from professionals who found their dream careers through our platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Swiper
              slidesPerView={1}
              spaceBetween={30}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              modules={[Pagination, Autoplay]}
              className="testimonial-swiper pb-12"
            >
              {testimonials.map((testimonial, index) => (
                <SwiperSlide key={index}>
                  <div className="relative group h-full">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100"></div>

                    <Card className="bg-white/5 backdrop-blur-md border-white/10 group-hover:border-white/20 transition-all duration-300 h-full shadow-lg shadow-purple-900/10">
                      <CardContent className="pt-6 h-full flex flex-col">
                        <div className="flex-1">
                          <div className="flex mb-4">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <p className="text-indigo-100 italic mb-6">"{testimonial.quote}"</p>
                        </div>
                        <div className="flex items-center mt-auto pt-4 border-t border-indigo-800/30">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-indigo-900/50">
                            <Image
                              src={testimonial.avatar || "/placeholder.svg"}
                              alt={testimonial.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{testimonial.name}</h3>
                            <p className="text-sm text-indigo-200">{testimonial.position}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-[#0a061d] to-[#150e33] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Ready to Take the Next Step in Your Career?
            </motion.h2>
            <motion.p
              className="text-xl text-indigo-200 mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Join thousands of professionals who have found their dream jobs through our platform
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/join-now">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-900/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105">
                  Get Started Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section with Moving Logos */}
      <section className="py-16 bg-gradient-to-b from-[#150e33] to-[#0a061d] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white">Trusted By Leading Companies</h2>
          </motion.div>

          <MovingCards />
        </div>
      </section>

    </main>
  )
}
