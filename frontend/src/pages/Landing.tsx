// ============================================================
// Landing Page — Cinematic Awwwards-worthy Experience
// ============================================================

import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Cpu,
  Camera,
  MapPin,
  BarChart3,
  Zap,
  Clock,
  WifiOff,
  Activity,
  ChevronDown,
  Play,
} from 'lucide-react'
import { GlobeScene } from '@/components/three/GlobeScene'
import { Button } from '@/components/ui/Button'

// ── Magnetic button effect ──
function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e
    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    const x = (clientX - left - width / 2) * 0.15
    const y = (clientY - top - height / 2) * 0.15
    setPosition({ x, y })
  }

  const reset = () => setPosition({ x: 0, y: 0 })

  const springConfig = { damping: 15, stiffness: 150 }
  const x = useSpring(position.x, springConfig)
  const y = useSpring(position.y, springConfig)

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Character-by-character text reveal ──
function TextReveal({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
  const words = children.split(' ')
  
  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '120%', rotate: 8 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{
              duration: 1,
              delay: delay + wi * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// ── Animated counter ──
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue.toLocaleString()}{suffix}
    </span>
  )
}

// ── Reveal on scroll ──
function RevealOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Parallax transforms
  const globeY = useTransform(scrollYProgress, [0, 0.25], [0, -120])
  const globeScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.85])
  const globeOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  // Smooth spring physics
  const smoothGlobeY = useSpring(globeY, { damping: 25, stiffness: 100 })
  const smoothGlobeScale = useSpring(globeScale, { damping: 25, stiffness: 100 })

  // Cursor glow
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div ref={containerRef} className="relative bg-void">
      {/* Cursor glow */}
      <motion.div
        className="cursor-glow hidden lg:block"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      />

      {/* ════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Globe */}
        <motion.div
          style={{ y: smoothGlobeY, scale: smoothGlobeScale, opacity: globeOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <GlobeScene className="absolute inset-0" />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/20 via-void/50 to-void pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void to-transparent pointer-events-none" />

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass text-xs font-mono tracking-[0.15em] uppercase text-kerala-teal border border-kerala-teal/20 hover:border-kerala-teal/40 transition-colors duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kerala-teal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kerala-teal"></span>
              </span>
              Fleet Intelligence System
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-bold text-display-xl mb-10 leading-[1.05]">
            <TextReveal className="text-text-primary block" delay={0.3}>
              Protecting Kerala's
            </TextReveal>
            <span className="gradient-text-crimson block mt-1">
              <TextReveal delay={0.5}>Roads in Real-Time</TextReveal>
            </span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-14 leading-relaxed font-light"
          >
            AI-powered rash driving detection for{' '}
            <span className="text-text-primary font-normal">KSRTC Kerala</span>.
            <br className="hidden sm:block" />
            Every bus. Every second. Every life.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-5 flex-wrap"
          >
            <MagneticButton>
              <Link to="/dashboard">
                <Button size="lg" className="text-base px-8 py-4 btn-shine group">
                  Enter Command Center
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </MagneticButton>

            <MagneticButton>
              <button className="flex items-center gap-3 px-6 py-4 rounded-xl glass hover:bg-surface-1/50 transition-all duration-500 group border border-transparent hover:border-border-default">
                <span className="w-10 h-10 rounded-full bg-surface-2 border border-border-default flex items-center justify-center group-hover:bg-surface-3 group-hover:border-border-strong transition-all duration-500">
                  <Play className="w-4 h-4 text-text-primary ml-0.5" />
                </span>
                <span className="text-text-secondary group-hover:text-text-primary transition-colors duration-300">Watch Demo</span>
              </button>
            </MagneticButton>
          </motion.div>

          {/* Fleet stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mt-24 flex items-center justify-center gap-16 flex-wrap"
          >
            {[
              { value: '6,000+', label: 'Buses' },
              { value: '24/7', label: 'Coverage' },
              { value: '<500ms', label: 'Latency' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-display font-bold text-text-primary mb-1">{stat.value}</div>
                <div className="text-[10px] font-mono text-text-ghost uppercase tracking-[0.2em]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-3 text-text-ghost"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          THE PROBLEM
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 px-6 overflow-hidden">
        {/* Ambient red glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-void via-ksrtc-crimson/[0.02] to-void pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-ksrtc-crimson/[0.04] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-ksrtc-glow font-mono text-xs uppercase tracking-[0.25em] mb-4">
              — The Problem —
            </span>
            <h2 className="font-display font-bold text-display-lg leading-tight">
              Kerala loses thousands of lives
              <br />
              <span className="text-text-ghost">to road accidents every year</span>
            </h2>
          </RevealOnScroll>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {[
              { value: 4286, suffix: '+', label: 'Deaths per year', color: 'crimson' },
              { value: 12, suffix: '', label: 'Lives lost daily', color: 'crimson' },
              { value: 38, suffix: '%', label: 'Public transport related', color: 'warning' },
            ].map((stat, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className={`
                  relative py-8 px-6 rounded-2xl glass-card group
                  ${stat.color === 'crimson' ? 'hover:glow-crimson' : ''}
                  transition-all duration-700
                `}>
                  {/* HUD corners */}
                  <div className="absolute top-3 left-3 w-2 h-2 border-l-2 border-t-2 border-ksrtc-crimson/30 group-hover:border-ksrtc-crimson/60 transition-all duration-500" />
                  <div className="absolute top-3 right-3 w-2 h-2 border-r-2 border-t-2 border-ksrtc-crimson/30 group-hover:border-ksrtc-crimson/60 transition-all duration-500" />
                  <div className="absolute bottom-3 left-3 w-2 h-2 border-l-2 border-b-2 border-ksrtc-crimson/30 group-hover:border-ksrtc-crimson/60 transition-all duration-500" />
                  <div className="absolute bottom-3 right-3 w-2 h-2 border-r-2 border-b-2 border-ksrtc-crimson/30 group-hover:border-ksrtc-crimson/60 transition-all duration-500" />
                  
                  <div className="text-center">
                    <div className={`
                      text-4xl lg:text-5xl font-display font-bold leading-none
                      ${stat.color === 'crimson' ? 'text-ksrtc-glow' : 'text-signal-warning'}
                    `}>
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-text-secondary text-sm mt-2">{stat.label}</div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="mt-12 lg:mt-16 text-center" delay={0.3}>
            <p className="text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-light">
              What if every bus could{' '}
              <span className="text-text-primary font-normal">detect danger</span>{' '}
              before it becomes a statistic?
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 px-6 overflow-hidden">
        {/* Teal ambient glow */}
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-kerala-teal/[0.03] rounded-full blur-[180px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <RevealOnScroll className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-kerala-teal font-mono text-xs uppercase tracking-[0.25em] mb-4">
              — How It Works —
            </span>
            <h2 className="font-display font-bold text-display-lg">
              Edge Intelligence
              <span className="text-text-ghost"> on Every Bus</span>
            </h2>
          </RevealOnScroll>

          {/* Three pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                icon: Cpu,
                title: 'The Hardware',
                description: '5 sensors on a Raspberry Pi 4 — IMU, GPS, Camera, Ultrasonic — sampling at 10Hz with Kalman Filter fusion.',
                items: ['MPU-6050 → G-Force', 'NEO-6M → GPS/Speed', 'Pi Camera → Evidence', 'HC-SR04 → Proximity'],
              },
              {
                step: '02',
                icon: Activity,
                title: 'The Intelligence',
                description: 'Real-time detection engine with configurable thresholds and multi-sensor fusion for zero false positives.',
                items: ['Harsh Brake < -1.5g', 'Aggressive Turn > 0.8g', 'Tailgating > 15% frame', 'Close Pass < 100cm'],
              },
              {
                step: '03',
                icon: Zap,
                title: 'The Response',
                description: 'Sub-500ms alert pipeline with video evidence capture and offline-first architecture.',
                items: ['Video buffer capture', 'Instant dashboard alert', 'Offline → auto-sync', 'CSV/PDF reports'],
              },
            ].map((pillar, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className="h-full py-8 px-6 rounded-2xl glass-card group hover:glow-teal transition-all duration-700 text-center">
                  {/* HUD corners on hover */}
                  <div className="absolute top-3 left-3 w-2 h-2 border-l-2 border-t-2 border-kerala-teal/20 group-hover:border-kerala-teal/50 transition-all duration-500" />
                  <div className="absolute top-3 right-3 w-2 h-2 border-r-2 border-t-2 border-kerala-teal/20 group-hover:border-kerala-teal/50 transition-all duration-500" />
                  <div className="absolute bottom-3 left-3 w-2 h-2 border-l-2 border-b-2 border-kerala-teal/20 group-hover:border-kerala-teal/50 transition-all duration-500" />
                  <div className="absolute bottom-3 right-3 w-2 h-2 border-r-2 border-b-2 border-kerala-teal/20 group-hover:border-kerala-teal/50 transition-all duration-500" />

                  {/* Step badge */}
                  <div className="inline-block mb-4">
                    <span className="text-kerala-teal/50 font-mono text-[10px] tracking-[0.2em] uppercase">Step {pillar.step}</span>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-kerala-teal/5 border border-kerala-teal/10 flex items-center justify-center group-hover:bg-kerala-teal/10 group-hover:border-kerala-teal/30 transition-all duration-500">
                      <pillar.icon className="w-6 h-6 text-kerala-teal" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-xl mb-3 text-text-primary">{pillar.title}</h3>
                  
                  {/* Description */}
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">{pillar.description}</p>

                  {/* Specs list */}
                  <div className="pt-4 border-t border-border-subtle">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {pillar.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 justify-center">
                          <span className="w-1 h-1 rounded-full bg-kerala-teal/60 flex-shrink-0" />
                          <span className="text-text-ghost font-mono text-[10px] tracking-wide">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-signal-info font-mono text-xs uppercase tracking-[0.25em] mb-4">
              — Capabilities —
            </span>
            <h2 className="font-display font-bold text-display-lg">
              Built for the Real World
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: MapPin, title: 'Live Fleet Tracking', description: 'GPS positions of every bus on a real-time map with route visualization.' },
              { icon: Camera, title: 'Video Evidence', description: 'Automatic 10-second clip capture with snapshot for every detected incident.' },
              { icon: Shield, title: '5 Detection Types', description: 'Harsh brake, harsh acceleration, aggressive turn, tailgating, close overtaking.' },
              { icon: WifiOff, title: 'Offline-First', description: 'Events queue locally during connectivity loss, auto-sync when back online.' },
              { icon: Clock, title: '< 500ms Response', description: 'From detection to dashboard alert in under half a second.' },
              { icon: BarChart3, title: 'Analytics & Reports', description: 'Danger zone heatmaps, driver scores, severity trends, CSV export.' },
            ].map((feature, i) => (
              <RevealOnScroll key={i} delay={i * 0.05}>
                <div className="py-6 px-5 rounded-xl glass-card group h-full text-center">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-11 h-11 rounded-xl bg-surface-1 border border-border-subtle flex items-center justify-center group-hover:border-signal-info/30 group-hover:bg-signal-info/5 transition-all duration-500">
                      <feature.icon className="w-5 h-5 text-text-ghost group-hover:text-signal-info transition-colors duration-500" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-display font-semibold text-base mb-2">{feature.title}</h3>
                  
                  {/* Description */}
                  <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 px-6 border-t border-border-subtle">
        {/* Gradient orb */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-ksrtc-crimson/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="font-display font-bold text-display-lg mb-5">
              Ready to see it{' '}
              <span className="gradient-text-crimson">in action?</span>
            </h2>

            <p className="text-lg lg:text-xl text-text-secondary mb-10 font-light leading-relaxed">
              The Command Center is running live with simulated fleet data.
              <br className="hidden sm:block" />
              Experience real-time detection, alerts, and analytics.
            </p>

            <MagneticButton className="inline-block">
              <Link to="/dashboard">
                <Button size="lg" className="text-base px-10 py-4 btn-shine group">
                  Launch Command Center
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </MagneticButton>

            <p className="mt-16 text-text-ghost/60 text-[10px] font-mono tracking-[0.15em]">
              ONBOARDRASH • PROPOSED FOR KSRTC KERALA • 2026
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  )
}
