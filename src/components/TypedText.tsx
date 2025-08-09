"use client"

import { useEffect, useMemo, useRef } from "react"
import Typed from "typed.js"

interface TypedTextProps {
  strings: string[]
  typeSpeed?: number
  backSpeed?: number
  backDelay?: number
  loop?: boolean
  showCursor?: boolean
  cursorChar?: string
  className?: string
}

export default function TypedText({
  strings,
  typeSpeed = 70,
  backSpeed = 40,
  backDelay = 1000,
  loop = true,
  showCursor = true,
  cursorChar = "|",
  className = "",
}: TypedTextProps) {
  const el = useRef<HTMLSpanElement>(null)
  const typed = useRef<Typed | null>(null)
  // Create a stable key based on content rather than array identity to avoid unnecessary re-inits
  const stringsKey = useMemo(() => JSON.stringify(strings), [strings])
  const processedStrings = useMemo(() => strings.map((str) => str.replace(/&/g, "&amp;")), [strings])

  useEffect(() => {
    if (!el.current) return

    // Clean up any previous instance
    if (typed.current) {
      typed.current.destroy()
    }

    // Create new Typed instance with optimized settings
    typed.current = new Typed(el.current, {
      strings: processedStrings,
      typeSpeed,
      backSpeed,
      backDelay,
      loop,
      showCursor,
      cursorChar,
      smartBackspace: false,
      startDelay: 0,
      autoInsertCss: true,
      contentType: "html",
      loopCount: loop ? Number.POSITIVE_INFINITY : 0,
      fadeOut: false,
      fadeOutClass: "typed-fade-out",
      fadeOutDelay: 0,
      shuffle: false,
      bindInputFocusEvents: false,
      stringsElement: undefined,
    })

    return () => {
      if (typed.current) {
        typed.current.destroy()
      }
    }
  // Depend on stringsKey instead of the array reference; keep primitive props
  }, [processedStrings, typeSpeed, backSpeed, backDelay, loop, showCursor, cursorChar])

  return <span ref={el} className={className}></span>
}
