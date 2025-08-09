"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Award, Clock, Users, Shield, Headphones, Sparkles } from "lucide-react"
import { useClientRandom } from "@/hooks/use-client-random"
import { useEffect, useState } from "react"

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  const reasons = [
    {
      icon: <CheckCircle className="w-10 h-10 text-blue-500" />,
      title: "Proven Track Record",
      description: "Over 20+ satisfied clients globally across various industries with consistent results.",
      color: "blue",
    },
    {
      icon: <Award className="w-10 h-10 text-purple-500" />,
      title: "Industry Expertise",
      description: "Specialized knowledge across IT, FinTech, Healthcare, and many other sectors.",
      color: "purple",
    },
    {
      icon: <Clock className="w-10 h-10 text-green-500" />,
      title: "Quick Turnaround",
      description: "Efficient processes ensuring fast delivery without compromising on quality.",
      color: "green",
    },
    {
      icon: <Users className="w-10 h-10 text-amber-500" />,
      title: "Tailored Solutions",
      description: "Customized approaches to meet your specific business requirements and challenges.",
      color: "amber",
    },
    {
      icon: <Shield className="w-10 h-10 text-cyan-500" />,
      title: "Compliance Assured",
      description: "ISO certified with adherence to all regulatory standards and best practices.",
      color: "cyan",
    },
    {
      icon: <Headphones className="w-10 h-10 text-pink-500" />,
      title: "24/7 Support",
      description: "Round-the-clock assistance ensuring your business needs are always addressed.",
      color: "pink",
    },
  ]

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

  const colorClasses = {
    blue: "from-blue-500/20 to-blue-700/20 shadow-blue-500/20 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-700/20 shadow-purple-500/20 border-purple-500/20",
    green: "from-green-500/20 to-green-700/20 shadow-green-500/20 border-green-500/20",
    amber: "from-amber-500/20 to-amber-700/20 shadow-amber-500/20 border-amber-500/20",
    cyan: "from-cyan-500/20 to-cyan-700/20 shadow-cyan-500/20 border-cyan-500/20",
    pink: "from-pink-500/20 to-pink-700/20 shadow-pink-500/20 border-pink-500/20",
  }

  // Client-only random visuals
  const starfield = useClientRandom(
    () => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"][Math.floor(Math.random() * 7)],
      boxShadow: `0 0 ${Math.random() * 8 + 4}px currentColor`,
      yAnim: [0, Math.random() * -100 - 50] as [number, number],
      xAnim: [0, Math.random() * 50 - 25] as [number, number],
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
    }),
    60
  )

  const networkNodes = useClientRandom(
    () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"][Math.floor(Math.random() * 5)],
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 3,
    }),
    20
  )

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
  <section ref={sectionRef} className="py-24 relative overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
      {/* Enhanced cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />

      {/* Animated starfield */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", willChange: "transform, opacity" }}>
        {mounted && starfield.map((s, i) => (
          <motion.div
            key={`why-star-${i}`}
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
            animate={{ y: s.yAnim, x: s.xAnim, opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: s.duration, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: s.delay }}
          />
        ))}
      </div>

      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`why-orbit-${i}`}
            className="absolute border border-white/5 rounded-full"
            style={{
              width: 300 + i * 200,
              height: 300 + i * 200,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 40 + i * 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {/* Orbital particles */}
            {Array.from({ length: 2 }).map((_, j) => (
              <motion.div
                key={`why-orbital-particle-${i}-${j}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: ["#3B82F6", "#8B5CF6", "#10B981"][i],
                  top: "50%",
                  left: "50%",
                  transformOrigin: `${150 + i * 100}px 0`,
                  boxShadow: `0 0 6px ${["#3B82F6", "#8B5CF6", "#10B981"][i]}`,
                }}
                animate={{
                  rotate: j % 2 === 0 ? 360 : -360,
                }}
                transition={{
                  duration: 20 + j * 8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  delay: j * 3,
                }}
              />
            ))}
          </motion.div>
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
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full filter blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 100%)",
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
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full filter blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(245,158,11,0.2) 50%, transparent 100%)",
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

      {/* Network constellation */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", willChange: "transform, opacity" }}>
        {mounted && networkNodes.map((n, i) => (
          <motion.div
            key={`why-node-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{ top: n.top, left: n.left, background: n.background, boxShadow: `0 0 6px currentColor` }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: n.duration, repeat: Number.POSITIVE_INFINITY, delay: n.delay }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUpVariants}
          className="text-center mb-16"
        >
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Why Choose Us</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Our Advantages
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover the Oddiant Techlabs advantage and see why businesses trust us for their consulting needs
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {reasons.map((reason, idx) => (
            <motion.div
              key={reason.title}
              variants={fadeInUpVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="h-full"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-zinc-800 h-full overflow-hidden group hover:bg-white/10 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${
                        colorClasses[reason.color as keyof typeof colorClasses]
                      } shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {reason.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                      {reason.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {reason.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
