"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { useClientRandom } from "@/hooks/use-client-random"

// Define the FAQ item type
interface FAQItem {
  question: string
  answer: string
}

// Define the component props type
interface FAQSectionProps {
  className?: string
}

const faqs: FAQItem[] = [
  {
    question: "What services do you offer?",
    answer:
      "We specialize in recruitment, talent sourcing, and HR solutions tailored to global business needs. Our comprehensive services include IT consulting, HR consulting, recruitment & manpower consulting, and personality development programs.",
  },
  {
    question: "How experienced is your team?",
    answer:
      "Our team brings over 7 years of experience in the recruitment and IT consulting industry with a strong track record of successful placements and projects. We have a diverse team of professionals with expertise across various domains.",
  },
  {
    question: "Where are your delivery centers located?",
    answer:
      "We operate two strategically located delivery centers in Noida and Bareilly, Uttar Pradesh, India to provide seamless service across time zones and ensure efficient project delivery.",
  },
  {
    question: "Do you work with international clients?",
    answer:
      "Yes, we've partnered with over 20 clients globally across various industries and sectors. Our international experience allows us to understand diverse business needs and provide tailored solutions.",
  },
  {
    question: "How do I get started with your services?",
    answer:
      "You can reach out through our contact form or schedule a free consultation. We'll guide you through the process step-by-step, understanding your requirements and proposing the most suitable solutions for your business.",
  },
]

// Moved FAQSectionBackground back inside FAQSection and made it a local component
const FAQSectionBackground: React.FC = () => {
  const faqParticles = useClientRandom(() => ({
    width: Math.random() * 2 + 1,
    height: Math.random() * 2 + 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    background: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"][Math.floor(Math.random() * 5)],
    boxShadow: `0 0 ${Math.random() * 4 + 2}px currentColor`,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }), 15); // Reduced from 20 to 15

  return (
    <>
      {faqParticles.map((particle, i) => (
        <motion.div
          key={`faq-particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: particle.width,
            height: particle.height,
            top: particle.top,
            left: particle.left,
            background: particle.background,
            boxShadow: particle.boxShadow,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
          }}
        />
      ))}
    </>
  );
};

const FAQSection: React.FC<FAQSectionProps> = ({ className = "" }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={`relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 filter blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.2) 50%, transparent 80%)",
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
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 filter blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(59,130,246,0.2) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 2,
          }}
        />
        {/* Animated stars are now in a separate component */}
        <FAQSectionBackground /> {/* Render the background particles here */}
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="text-center mb-16 relative z-10">
        <div className="inline-block mb-3">
          <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">FAQ</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Find answers to common questions about our services and approach
        </p>
      </div>
      <div className="space-y-6 relative z-10">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="border border-zinc-800 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-purple-500/5"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full text-left flex justify-between items-center p-6 focus:outline-none"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="text-lg font-medium text-white">{faq.question}</span>
              <span className="ml-2 flex-shrink-0">
                {openIndex === index ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <ChevronUp className="h-5 w-5 text-blue-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </span>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  id={`faq-answer-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 border-t border-zinc-800 text-gray-300">{faq.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FAQSection
