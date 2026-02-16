/**
 * Landing Page — Apple visionOS Showcase Grid ✨
 *
 * Layout: 3 top (aligned) | 2 left + hero + 2 right | 3 bottom (aligned)
 * Side cards are cut off at edges for premium effect
 */

import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import {
  Cpu, Camera, MapPin,
  ShieldCheck, BarChart3, Zap,
  Bell, Gauge, Wifi, Video,
} from 'lucide-react'
import { Button, FeatureCard } from '@/components/ui'
import { useLenis } from '@/hooks'

// ═══════════════════════════════════════════════════════════════════════
// FEATURES DATA — 3 top + 3 bottom (aligned) + 2 left + 2 right (cut off)
// Each has a unique colorScheme for tinted card backgrounds & icon bg
// ═══════════════════════════════════════════════════════════════════════
const topFeatures = [
  { icon: <Cpu className="w-10 h-10" />,          title: 'Edge Computing',     description: 'Raspberry Pi powered processing',  color: 'purple' as const, pattern: 'circuit' as const },
  { icon: <Camera className="w-10 h-10" />,       title: 'Computer Vision',    description: 'AI-driven detection system',       color: 'pink' as const, pattern: 'viewfinder' as const },
  { icon: <MapPin className="w-10 h-10" />,       title: 'GPS Tracking',       description: 'Real-time location monitoring',    color: 'cyan' as const, pattern: 'route' as const },
]

const bottomFeatures = [
  { icon: <ShieldCheck className="w-10 h-10" />,  title: 'Safety Alerts',      description: 'Instant driver notifications',     color: 'green' as const, pattern: 'pulse' as const },
  { icon: <BarChart3 className="w-10 h-10" />,    title: 'Analytics',          description: 'Fleet performance insights',       color: 'blue' as const, pattern: 'chart' as const },
  { icon: <Zap className="w-10 h-10" />,          title: 'Fast Alerts',        description: 'Sub-second event response',        color: 'lime' as const, pattern: 'bolt' as const },
]

const leftSideFeatures = [
  { icon: <Bell className="w-10 h-10" />,         title: 'Event Logging',      description: 'Comprehensive incident history',   color: 'orange' as const, pattern: 'waves' as const },
  { icon: <Gauge className="w-10 h-10" />,        title: 'Speed Monitor',      description: 'Velocity threshold detection',     color: 'teal' as const, pattern: 'speedometer' as const },
]

const rightSideFeatures = [
  { icon: <Wifi className="w-10 h-10" />,         title: 'IoT Connected',      description: 'Seamless device integration',      color: 'coral' as const, pattern: 'signal' as const },
  { icon: <Video className="w-10 h-10" />,        title: 'Video Recording',    description: 'HD dashcam footage capture',       color: 'peach' as const, pattern: 'film' as const },
]

// ═══════════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════
const appleEase = [0.4, 0, 0.2, 1] as const

const createVariants = (reduce: boolean) => ({
  heroStagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduce ? 0.05 : 0.15,
        delayChildren: reduce ? 0.05 : 0.2,
      },
    },
  },
  heroItem: {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.7, ease: appleEase },
    },
  },
  overlineVariant: {
    hidden: { opacity: 0, y: reduce ? 0 : 20, letterSpacing: '0.1em' },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: '0.2em',
      transition: { duration: reduce ? 0.2 : 0.6, ease: appleEase },
    },
  },
  ctaVariant: {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: reduce ? 0.2 : 0.5,
        ease: appleEase,
        delay: reduce ? 0.1 : 1.0,
      },
    },
  },
})

// ═══════════════════════════════════════════════════════════════════════
// LANDING PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function Landing() {
  const shouldReduceMotion = useReducedMotion()
  const reduce = shouldReduceMotion || false
  const variants = createVariants(reduce)

  useLenis({
    lerp: reduce ? 0.2 : 0.08,
    duration: reduce ? 0.5 : 1.4,
  })

  // Scroll to mid-position on mount to show hero prominently
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 540, // Adjust this value to control the scroll position
        behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <section
        role="main"
        aria-label="Landing page"
        className="showcase-outer-container"
      >
        <div className="showcase-grid-wrapper">
          {/* ─── TOP ROW: 3 cards (aligned to hero) ─── */}
          <div className="showcase-row-top">
            {topFeatures.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} delay={i * 0.07} iconPosition="bottom" pattern={f.pattern} />
            ))}
          </div>

          {/* ─── MIDDLE ROW: Side cards + Hero ─── */}
          <div className="showcase-middle-container">
            {/* LEFT SIDE CARDS (Cut off) */}
            <div className="showcase-side-cards-left">
              {leftSideFeatures.map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} delay={0.21 + i * 0.07} pattern={f.pattern} />
              ))}
            </div>

            {/* HERO: Dominant center card */}
            <motion.div
              className="showcase-hero-card"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0.25 : 0.8, ease: appleEase }}
            >
              <motion.div
                variants={variants.heroStagger}
                initial="hidden"
                animate="visible"
                className="showcase-hero-inner"
              >
                {/* Overline */}
                <motion.p
                  className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4 sm:mb-6"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  variants={variants.overlineVariant}
                  role="doc-subtitle"
                >
                  REAL-TIME ONBOARD RASH DRIVING DETECTION SYSTEM
                </motion.p>

                {/* Display Title */}
                <motion.h1
                  className="visionos-text font-extrabold leading-[0.95] tracking-tight px-4 sm:px-0"
                  style={{
                    fontSize: 'clamp(2.5rem, 8vw, 7rem)',
                    lineHeight: '0.95',
                  }}
                  variants={variants.heroItem}
                >
                  <span className="block">
                    Detect. Report.
                  </span>
                  <motion.span
                    className="block mt-2"
                    variants={variants.heroItem}
                  >
                    Drive Safer.
                  </motion.span>
                </motion.h1>

                {/* CTA */}
                <motion.div
                  className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
                  variants={variants.ctaVariant}
                  role="group"
                  aria-label="Call to action buttons"
                >
                  <Link to="/login" aria-label="Navigate to sign in page">
                    <Button
                      variant="secondary"
                      size="lg"
                      aria-label="Sign In to your account"
                    >
                      Sign In
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE CARDS (Cut off) */}
            <div className="showcase-side-cards-right">
              {rightSideFeatures.map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} delay={0.35 + i * 0.07} pattern={f.pattern} />
              ))}
            </div>
          </div>

          {/* ─── BOTTOM ROW: 3 cards (aligned to hero) ─── */}
          <div className="showcase-row-bottom">
            {bottomFeatures.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} delay={0.49 + i * 0.07} pattern={f.pattern} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
