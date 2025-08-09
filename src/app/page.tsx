"use client"

// Home page performance refactor: unify with company hero structure & migrate heavy DOM animations to canvas.
import { useRef } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TypedText from "@/components/TypedText"
import { ArrowRight, Monitor, Users, UserPlus, BookOpen, CheckCircle, Sparkles, Zap, Shield, Clock, Award } from 'lucide-react'
import CanvasStarfield from "@/components/visuals/CanvasStarfield"

// Lazy-load FAQ to defer hydration cost
const FAQSection = dynamic(() => import("@/components/FAQSection"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 420 }} />,
})

export default function Home() {
  // In-view gating for section entrance animations
  const heroRef = useRef<HTMLDivElement>(null)
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.25 })

  const servicesRef = useRef<HTMLDivElement>(null)
  const isServicesInView = useInView(servicesRef, { once: true, amount: 0.2 })
  const aboutRef = useRef<HTMLDivElement>(null)
  const isAboutInView = useInView(aboutRef, { once: true, amount: 0.2 })
  const ctaRef = useRef<HTMLDivElement>(null)
  const isCtaInView = useInView(ctaRef, { once: true, amount: 0.2 })

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

  const services = [
    {
      title: "IT Consulting",
      description: "Web Based Solutions & Web App Development",
      icon: <Monitor className="w-6 h-6" />,
      color: "blue",
    },
    {
      title: "HR Consulting",
      description: "Background Verification & Onboarding and Payroll",
      icon: <Users className="w-6 h-6" />,
      color: "purple",
    },
    {
      title: "Recruitment & Manpower Consulting",
      description: "Permanent Staffing & Contingent Staffing",
      icon: <UserPlus className="w-6 h-6" />,
      color: "green",
    },
    {
      title: "Personality Development Program (PDP)",
      description: "Resume Writing, Soft Skill Training & Interview Preparation",
      icon: <BookOpen className="w-6 h-6" />,
      color: "amber",
    },
  ]

  const stats = [
    { value: "7+", label: "Years Experience" },
    { value: "20+", label: "Global Clients" },
    { value: "1200+", label: "Successful Placements" },
    { value: "2", label: "Delivery Centers" },
  ]

  // Removed client-random animated DOM elements; backgrounds now handled by lightweight CanvasStarfield

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Hero Section (Canvas-driven background) */}
      <section ref={heroRef} className="relative pt-32 pb-24 overflow-hidden" style={{ contain: "layout paint style", contentVisibility: "auto", containIntrinsicSize: "720px" }}>
        <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
          {/* Faint radial grid overlay */}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-screen" aria-hidden>
            <div className="w-full h-full" style={{backgroundImage:"repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0 1px, transparent 1px 90px)"}} />
          </div>
          <CanvasStarfield className="absolute inset-0" count={150} opacity={0.9} maxFPS={28} quality="balanced" />
          {/* Orbital rings enhanced (one extra) */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ willChange: "transform" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`hero-orbit-${i}`}
                className="absolute border border-white/10 rounded-full"
                style={{ width: 220 + i * 150, height: 220 + i * 150, willChange: "transform" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 34 + i * 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                {i > 0 && [0,1].map((p) => (
                  <motion.div
                    key={`hero-ring-dot-${i}-${p}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background:["#3B82F6","#8B5CF6","#10B981","#F59E0B"][ (i+p) % 4],
                      top:"50%",
                      left:"50%",
                      transformOrigin:`${110 + i * 75}px 0`,
                      boxShadow:`0 0 8px ${["#3B82F6","#8B5CF6","#10B981","#F59E0B"][ (i+p) % 4]}`,
                      willChange:"transform"
                    }}
                    animate={{ rotate: p === 0 ? -360 : 360 }}
                    transition={{ duration: 28 + i * 6, repeat: Number.POSITIVE_INFINITY, ease:"linear" }}
                  />
                ))}
              </motion.div>
            ))}
          </div>
          {/* Gradient orbs (existing + two subtle extras) */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full filter blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.26) 0%, rgba(139,92,246,0.16) 55%, transparent 100%)",
              willChange: "transform, opacity",
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.32, 0.5, 0.32], x: [0, 40, 0], y: [0, -25, 0] }}
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full filter blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.26) 0%, rgba(245,158,11,0.16) 55%, transparent 100%)",
              willChange: "transform, opacity",
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.42, 0.28], x: [0, -35, 0], y: [0, 30, 0] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 2 }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-56 h-56 rounded-full filter blur-2xl"
            style={{ background:"radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(147,197,253,0.15) 60%, transparent 100%)" }}
            animate={{ scale:[1,1.15,1], opacity:[0.15,0.35,0.15] }}
            transition={{ duration:24, repeat:Number.POSITIVE_INFINITY, repeatType:"reverse" }}
          />
          <motion.div
            className="absolute top-12 right-8 w-48 h-48 rounded-full filter blur-2xl"
            style={{ background:"radial-gradient(circle, rgba(20,184,166,0.32) 0%, rgba(59,130,246,0.15) 55%, transparent 100%)" }}
            animate={{ scale:[1,1.2,1], opacity:[0.18,0.4,0.18], rotate:[0,45,0] }}
            transition={{ duration:30, repeat:Number.POSITIVE_INFINITY, ease:"easeInOut" }}
          />
          {/* Center star cluster (static defined small set) */}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="relative w-[520px] h-[520px]">
              {[
                {x:260,y:110,c:'#3B82F6',d:9},
                {x:300,y:180,c:'#8B5CF6',d:11},
                {x:180,y:250,c:'#10B981',d:13},
                {x:340,y:300,c:'#F59E0B',d:10},
                {x:220,y:340,c:'#EC4899',d:12},
                {x:280,y:400,c:'#06B6D4',d:14},
              ].map((s,i)=>(
                <motion.div key={i} className="absolute rounded-full" style={{ left:s.x, top:s.y, width:6, height:6, background:s.c, boxShadow:`0 0 10px ${s.c}` }} animate={{ opacity:[0.2,1,0.2], scale:[0.8,1.4,0.8] }} transition={{ duration: s.d, repeat:Number.POSITIVE_INFINITY }} />
              ))}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
            }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-100 leading-tight">
              <TypedText
                strings={["Empowering Through Personality, Talent & Tech"]}
                typeSpeed={70} /* slower (ms per char) for readable pace */
                backSpeed={40}
                backDelay={1200}
                loop={false} /* only type once since single string */
                showCursor={true}
                className="text-white"
              />
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Innovative IT consulting, expert staffing solutions, and tailored personality development
              programs—delivered to fit your unique business needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-full px-8 py-7 text-lg group transition-all duration-300"
              >
                <Link href="/solutions" className="flex items-center">
                  Explore Solutions
                  <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.span>
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-full px-8 py-7 text-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 transition-all duration-300"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
        <CanvasStarfield className="absolute inset-0" count={90} opacity={0.7} maxFPS={30} quality="balanced" />
        {/* Minimal decorative shapes retained */}
        <motion.div className="absolute top-20 left-10 w-28 h-28 border border-blue-500/15 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
        {/* Added subtle secondary shape (slow float + rotate) */}
        <motion.div
          className="absolute bottom-16 right-8 w-16 h-16 border border-purple-500/15 rounded-lg"
          style={{ backdropFilter: "blur(2px)" }}
          animate={{ rotate: -360, y: [0, -18, 0] }}
          transition={{ rotate: { duration: 70, repeat: Number.POSITIVE_INFINITY, ease: "linear" }, y: { duration: 14, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" } }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate={isServicesInView ? "visible" : "hidden"}
            variants={fadeInUpVariants}
            className="text-center mb-16"
          >
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Our Services</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Comprehensive Solutions
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We provide end-to-end solutions tailored to your business requirements
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            animate={isServicesInView ? "visible" : "hidden"}
            variants={staggerContainerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {services.map((service, index) => {
              const colorClasses = {
                blue: "from-blue-500 to-blue-700 shadow-blue-500/20",
                purple: "from-purple-500 to-purple-700 shadow-purple-500/20",
                green: "from-green-500 to-green-700 shadow-green-500/20",
                amber: "from-amber-500 to-amber-700 shadow-amber-500/20",
              }
              return (
                <motion.div
                  key={service.title}
                  variants={fadeInUpVariants}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-zinc-800 h-full overflow-hidden group hover:bg-white/10 transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${colorClasses[service.color as keyof typeof colorClasses]} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {service.icon}
                      </div>
                      <CardTitle className="text-xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "880px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        <CanvasStarfield className="absolute inset-0" count={70} opacity={0.65} maxFPS={28} quality="balanced" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate={isAboutInView ? "visible" : "hidden"} variants={fadeInUpVariants}>
              <div className="inline-block mb-3">
                <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">About Us</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Roadmap Oddiant Techlabs
              </h2>
              <div className="space-y-6 text-gray-300">
                <p className="text-lg">
                  With over 7 years of industry experience, we've built a strong reputation for delivering results that
                  matter. Our commitment to excellence has earned us the trust of 20+ global clients who rely on us for
                  dependable, top-tier service.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <p>
                      <span className="font-bold text-white">1234 Placements & Counting</span> - We take pride in
                      connecting talent with opportunity—making over 1,200 successful placements and transforming
                      careers around the world.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <p>
                      <span className="font-bold text-white">2 Strategic Delivery Centers</span> - Our dual-location
                      model enables us to offer seamless support and agile solutions to clients across the globe.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  asChild
                  className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all duration-300"
                >
                  <Link href="/company" className="flex items-center">
                    Learn More
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.span>
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              animate={isAboutInView ? "visible" : "hidden"}
              variants={fadeInUpVariants}
              className="relative"
            >
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 mix-blend-overlay z-10" />
                {/* Stats grid */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="grid grid-cols-2 gap-6 w-full max-w-md p-6">
                    {stats.map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <motion.span
                          className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2"
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ duration: 6 + idx, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                        >
                          {stat.value}
                        </motion.span>
                        <span className="text-sm text-gray-300">{stat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                {/* Background pattern */}
                <div className="absolute inset-0 bg-zinc-900 z-0">
                  <div className="absolute inset-0 opacity-30">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "30px 30px",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/30 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
              <motion.div
                className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/30 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: 1,
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "880px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
        <CanvasStarfield className="absolute inset-0" count={60} opacity={0.75} speedX={{ min: 0.12, max: 0.28 }} speedY={{ min: -0.02, max: 0.02 }} size={{ min: 0.6, max: 1.6 }} maxFPS={26} quality="battery" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUpVariants}
            className="text-center mb-16"
          >
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Why Choose Us</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Our Advantages
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Discover what makes Oddiant Techlabs the preferred choice for businesses worldwide
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Award className="w-6 h-6" />,
                title: "Proven Track Record",
                description: "Over 20+ satisfied clients globally across various industries with consistent results.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Expert Team",
                description: "Our team of professionals brings diverse expertise and experience to every project.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Quick Turnaround",
                description: "Efficient processes ensuring fast delivery without compromising on quality.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Tailored Solutions",
                description: "Customized approaches to meet your specific business requirements and challenges.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Innovative Approach",
                description: "Leveraging cutting-edge technologies and methodologies for optimal results.",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Quality Assurance",
                description: "Rigorous quality control processes to ensure excellence in every deliverable.",
              },
            ].map((item, index) => (
              <motion.div key={item.title} variants={fadeInUpVariants} className="h-full">
                <Card className="bg-white/5 backdrop-blur-sm border-zinc-800 h-full overflow-hidden group hover:bg-white/10 transition-all duration-300 hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          {item.icon}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section (lighter background, deferred hydration) */}
      <section className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
        <CanvasStarfield className="absolute inset-0" count={50} opacity={0.55} maxFPS={26} quality="battery" />
        <div className="container mx-auto px-4 relative z-10">
          <FAQSection />
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
        <CanvasStarfield className="absolute inset-0" count={80} opacity={0.55} speedX={{ min: 0.05, max: 0.25 }} speedY={{ min: -0.01, max: 0.01 }} size={{ min: 0.8, max: 1.8 }} maxFPS={28} quality="balanced" />
        {/* Reintroduced optimized floating visuals (few elements only) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`cta-ring-${i}`}
              className="absolute border rounded-full"
              style={{
                width: 260 + i * 180,
                height: 260 + i * 180,
                borderColor: ["#3B82F6", "#8B5CF6", "#10B981"][i % 3] + "33",
                borderWidth: "1px",
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, opacity: [0.25, 0.45, 0.25], scale: [1, 1.08, 1] }}
              transition={{ duration: 60 + i * 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          ))}
          {/* Single gradient energy orb */}
          <motion.div
            className="absolute w-72 h-72 rounded-full filter blur-3xl"
            style={{ background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.35), rgba(139,92,246,0.18) 55%, transparent 75%)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25], rotate: [0, 45, 0] }}
            transition={{ duration: 35, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate={isCtaInView ? "visible" : "hidden"}
            variants={fadeInUpVariants}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ready to accelerate your business growth?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Contact us today to discuss how Oddiant Techlabs can help you achieve your business goals.
            </p>
            <Button
              asChild
              className="rounded-full px-8 py-7 text-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all duration-300"
            >
              <Link href="/contact" className="flex items-center">
                Get Started
                <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
