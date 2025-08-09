"use client"

import React, { useEffect, useRef } from "react"

type Range = { min: number; max: number }

type Star = {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  color: string
  alpha: number
  twinkleDir: number
}

// Narrow types for non-standard navigator fields we read optionally
type NavigatorExtras = {
  connection?: { saveData?: boolean } | null
  mozConnection?: { saveData?: boolean } | null
  webkitConnection?: { saveData?: boolean } | null
  deviceMemory?: number
}

export type CanvasStarfieldProps = {
  className?: string
  style?: React.CSSProperties
  count?: number
  colors?: string[]
  size?: Range // radius px
  speedX?: Range // px per frame
  speedY?: Range // px per frame
  opacity?: number // global alpha multiplier
  twinkle?: boolean
  pauseWhenHidden?: boolean
  maxFPS?: number // throttle rendering
  scaleWithArea?: boolean // adjust count by container area
  quality?: "high" | "balanced" | "battery" // rendering quality presets
  adaptiveQuality?: boolean // auto downgrade on low-end devices
  respectSaveData?: boolean // follow user data saver preference
  pauseOnBlur?: boolean // pause when tab is hidden
  dprCap?: number | "auto" // cap device pixel ratio to limit fill rate
  ariaHidden?: boolean // hide from assistive tech (decorative)
}

const defaultColors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function CanvasStarfield({
  className,
  style,
  count = 100,
  colors = defaultColors,
  size = { min: 0.8, max: 2.2 },
  speedX = { min: -0.05, max: 0.05 },
  speedY = { min: -0.15, max: -0.05 }, // gently drifting up by default
  opacity = 1,
  twinkle = true,
  pauseWhenHidden = true,
  maxFPS = 30,
  scaleWithArea = true,
  quality = "balanced",
  adaptiveQuality = true,
  respectSaveData = true,
  pauseOnBlur = true,
  dprCap = "auto",
  ariaHidden = true,
}: CanvasStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const starsRef = useRef<Star[]>([])
  const dprRef = useRef(1)
  const sizeRef = useRef({ w: 0, h: 0 })
  const visibleRef = useRef(true)
  const prefReducedRef = useRef(false)
  const saveDataRef = useRef(false)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const lastDrawRef = useRef(0)
  const spriteMapRef = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const effectiveQualityRef = useRef<"high" | "balanced" | "battery">(quality)

  // Initialize and handle resize
  useEffect(() => {
    const canvas = canvasRef.current!
  const ctx = canvas.getContext("2d")!
  ctxRef.current = ctx
    // Determine device characteristics and preferences
  const nav: (Navigator & NavigatorExtras) | undefined = typeof navigator !== "undefined" ? (navigator as Navigator & NavigatorExtras) : undefined
  const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection
    saveDataRef.current = !!(respectSaveData && connection && connection.saveData)

  const deviceMemory = Number(nav?.deviceMemory || 0)
  const hardwareConcurrency = Number((typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 0)
    const isLowEnd = !!(
      adaptiveQuality && (
        (deviceMemory && deviceMemory <= 4) ||
        (hardwareConcurrency && hardwareConcurrency <= 4)
      )
    )

    // Effective quality considering environment
    effectiveQualityRef.current = (saveDataRef.current || isLowEnd) ? "battery" : quality

    // DPR with cap based on quality
    const rawDpr = Math.max(1, window.devicePixelRatio || 1)
    const autoCap = effectiveQualityRef.current === "high" ? 2 : effectiveQualityRef.current === "balanced" ? 1.75 : 1.25
    const cap = typeof dprCap === "number" ? Math.max(1, dprCap) : autoCap
    dprRef.current = Math.min(rawDpr, cap)

    // prefers-reduced-motion
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    prefReducedRef.current = !!mql.matches
    const onRMP = () => (prefReducedRef.current = !!mql.matches)
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onRMP)
    } else {
      // Older Safari/Firefox
      const legacy = mql as unknown as { addListener?: (cb: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void }
      legacy.addListener?.(onRMP)
    }

    // Pause on document visibility change
    const onVis = () => {
      if (pauseOnBlur) {
        visibleRef.current = !document.hidden
      }
    }
    if (pauseOnBlur) {
      document.addEventListener("visibilitychange", onVis)
      // initialize state
      visibleRef.current = !document.hidden
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const b = parent.getBoundingClientRect()
      sizeRef.current = { w: b.width, h: b.height }
      const dpr = dprRef.current
      canvas.width = Math.ceil(b.width * dpr)
      canvas.height = Math.ceil(b.height * dpr)
      canvas.style.width = `${b.width}px`
      canvas.style.height = `${b.height}px`
      const c = ctxRef.current
      c?.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (scaleWithArea) {
        // scale count by sqrt of area ratio to keep visual density consistent
        const baseArea = 1280 * 720
        const factor = Math.sqrt((b.width * b.height) / baseArea)
        const qualityMul = effectiveQualityRef.current === "battery" ? 0.75 : 1
        const saveDataMul = saveDataRef.current ? 0.8 : 1
        const reducedMul = prefReducedRef.current ? 0.6 : 1
        const totalMul = qualityMul * saveDataMul * reducedMul
        const target = Math.max(16, Math.round(count * factor * totalMul))
        adjustStarCount(target)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement ?? canvas)

    // Initialize stars only once
    if (starsRef.current.length === 0) {
      const { w, h } = sizeRef.current
      const qualityMul = effectiveQualityRef.current === "battery" ? 0.75 : 1
      const saveDataMul = saveDataRef.current ? 0.8 : 1
      const reducedMul = prefReducedRef.current ? 0.6 : 1
      const totalMul = qualityMul * saveDataMul * reducedMul
      const effectiveCount = Math.max(16, Math.floor(count * totalMul))
      starsRef.current = Array.from({ length: effectiveCount }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(size.min, size.max),
        vx: rand(speedX.min, speedX.max) * (prefReducedRef.current || effectiveQualityRef.current === "battery" ? 0.7 : 1),
        vy: rand(speedY.min, speedY.max) * (prefReducedRef.current || effectiveQualityRef.current === "battery" ? 0.7 : 1),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: rand(0.35, 1),
        twinkleDir: Math.random() < 0.5 ? -1 : 1,
      }))
    }

    let last = performance.now()
    const step = (t: number) => {
      if (pauseWhenHidden && !visibleRef.current) {
        rafRef.current = requestAnimationFrame(step)
        return
      }
  const dt = Math.min(33, t - last) // cap logic dt
      last = t
      // fps throttle
  const q = effectiveQualityRef.current
  const cappedFPS = q === "battery" || saveDataRef.current || prefReducedRef.current ? Math.min(maxFPS, 24) : q === "balanced" ? Math.min(maxFPS, 30) : maxFPS
  const minFrameMs = 1000 / Math.max(1, cappedFPS)
      if (t - lastDrawRef.current < minFrameMs) {
        rafRef.current = requestAnimationFrame(step)
        return
      }
      lastDrawRef.current = t
      const { w, h } = sizeRef.current

      const c = ctxRef.current!
      c.clearRect(0, 0, w, h)
      c.save()
      for (const s of starsRef.current) {
        // update
        s.x += s.vx * dt
        s.y += s.vy * dt

        // wrap
        if (s.x < -10) s.x = w + 10
        if (s.x > w + 10) s.x = -10
        if (s.y < -10) s.y = h + 10
        if (s.y > h + 10) s.y = -10

        // twinkle alpha (quality-aware)
  if (twinkle && !prefReducedRef.current && !saveDataRef.current) {
          const qMul = effectiveQualityRef.current === "high" ? 1 : effectiveQualityRef.current === "balanced" ? 0.85 : 0.6
          s.alpha += s.twinkleDir * 0.003 * qMul * dt
          if (s.alpha < 0.25) {
            s.alpha = 0.25
            s.twinkleDir = 1
          } else if (s.alpha > 1) {
            s.alpha = 1
            s.twinkleDir = -1
          }
        }

        // draw sprite
        c.globalAlpha = s.alpha * opacity
        const sprite = getSprite(s.color, s.r)
        const hw = sprite.width / 2
        const hh = sprite.height / 2
        c.drawImage(sprite, s.x - hw, s.y - hh)
      }
      c.restore()

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    // intersection observer to pause when not visible
    let io: IntersectionObserver | null = null
    if (pauseWhenHidden && "IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        const entry = entries[0]
        visibleRef.current = !!entry?.isIntersecting
      }, { root: null, threshold: 0 })
      io.observe(canvas)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      io?.disconnect()
      if (pauseOnBlur) document.removeEventListener("visibilitychange", onVis)
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onRMP)
      } else {
        const legacy = mql as unknown as { removeListener?: (cb: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void }
        legacy.removeListener?.(onRMP)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  function adjustStarCount(target: number) {
    const arr = starsRef.current
    const { w, h } = sizeRef.current
    if (target > arr.length) {
      const add = target - arr.length
      for (let i = 0; i < add; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(size.min, size.max),
          vx: rand(speedX.min, speedX.max) * (prefReducedRef.current || effectiveQualityRef.current === "battery" ? 0.7 : 1),
          vy: rand(speedY.min, speedY.max) * (prefReducedRef.current || effectiveQualityRef.current === "battery" ? 0.7 : 1),
          color: colors[Math.floor(Math.random() * colors.length)] || defaultColors[Math.floor(Math.random() * defaultColors.length)],
          alpha: rand(0.35, 1),
          twinkleDir: Math.random() < 0.5 ? -1 : 1,
        })
      }
    } else if (target < arr.length) {
      arr.length = target
    }
  }

  function getSprite(color: string, radius: number): HTMLCanvasElement {
    const q = effectiveQualityRef.current
    const buckets = q === "high" ? 10 : q === "battery" ? 4 : 6
    const minR = Math.min(size.min, size.max)
    const maxR = Math.max(size.min, size.max)
    const t = (radius - minR) / Math.max(0.0001, maxR - minR)
    const idx = Math.min(buckets - 1, Math.max(0, Math.round(t * (buckets - 1))))
    const key = `${color}:${idx}:${buckets}`
    const cache = spriteMapRef.current
    const existing = cache.get(key)
    if (existing) return existing

    const r = minR + (idx / Math.max(1, buckets - 1)) * (maxR - minR)
    const sizePx = Math.max(4, Math.ceil(r * 6))
    const off = document.createElement("canvas")
    off.width = sizePx
    off.height = sizePx
    const g = off.getContext("2d")!
    const cx = sizePx / 2
    const cy = sizePx / 2
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4)
    grad.addColorStop(0, withAlpha(color, 1))
    grad.addColorStop(0.35, withAlpha(color, 0.6))
    grad.addColorStop(1, withAlpha(color, 0))
    g.fillStyle = grad
    g.fillRect(0, 0, sizePx, sizePx)
    cache.set(key, off)
    return off
  }

  function withAlpha(hex: string, a: number) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!m) return hex
    const r = parseInt(m[1].substring(0, 2), 16)
    const g = parseInt(m[1].substring(2, 4), 16)
    const b = parseInt(m[1].substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
  style={{ pointerEvents: "none", display: "block", ...style }}
  aria-hidden={ariaHidden}
    />
  )
}
