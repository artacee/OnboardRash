// ============================================================
// Landing Page — Cinematic scroll-driven proposal page
// The first thing KSRTC officials see
// ============================================================

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Cpu,
  Wifi,
  Camera,
  MapPin,
  BarChart3,
  Zap,
  Clock,
  WifiOff,
  Activity,
  ChevronDown,
} from 'lucide-react'
import { GlobeScene } from '@/components/three/GlobeScene'
import { ParticleField } from '@/components/three/ParticleField'
import { Button } from '@/components/ui/Button'

// ── Animated counter for stats ──
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="font-display font-bold"
    >
      {isInView ? value.toLocaleString() : '0'}{suffix}
    </motion.span>
  )
}

// ── Stagger children animation ──
const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export function Landing() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const globeY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const globeOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen bg-void overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Globe Background */}
        <motion.div
          style={{ y: globeY, opacity: globeOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <GlobeScene className="absolute inset-0" />
        </motion.div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/60 to-void pointer-events-none" />

        {/* Hero Content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-mono text-kerala-teal tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-kerala-teal animate-dot-pulse" />
              Fleet Intelligence System
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-text-primary">Protecting Kerala's</span>
            <br />
            <span className="gradient-text-crimson">Roads in Real-Time</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            OnboardRash is an AI-powered rash driving detection system
            built for <span className="text-text-primary font-medium">KSRTC Kerala</span>.
            Every bus. Every second. Every life.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dashboard">
              <Button size="lg" className="text-base">
                Enter Command Center
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="text-base">
                Authenticate
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 text-text-ghost text-sm font-mono">
            Monitoring 6,000+ buses across Kerala
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-ghost"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2: THE PROBLEM
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        {/* Subtle red background pulse */}
        <div className="absolute inset-0 bg-gradient-to-b from-void via-ksrtc-crimson/[0.03] to-void pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <motion.p variants={fadeUp} className="text-ksrtc-glow font-mono text-sm uppercase tracking-widest mb-4">
            The Problem
          </motion.p>

          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-6">
            Kerala loses thousands of lives
            <br />
            <span className="text-text-secondary">to road accidents every year</span>
          </motion.h2>

          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            <StatCard value={4286} label="Deaths per year" suffix="+" accent="crimson" />
            <StatCard value={12} label="Lives lost per day" accent="crimson" />
            <StatCard value={38} label="Public transport related" suffix="%" accent="warning" />
          </motion.div>

          <motion.p variants={fadeUp} className="mt-16 text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            What if every bus could <span className="text-text-primary font-medium">detect danger</span> before
            it becomes a statistic?
          </motion.p>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 3: HOW IT WORKS
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <ParticleField className="absolute inset-0 opacity-30" count={200} color="#0D9488" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="relative z-10 max-w-6xl mx-auto"
        >
          <motion.p variants={fadeUp} className="text-kerala-teal font-mono text-sm uppercase tracking-widest mb-4 text-center">
            How It Works
          </motion.p>

          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-center mb-20">
            Edge Intelligence
            <span className="text-text-secondary"> on Every Bus</span>
          </motion.h2>

          {/* Three pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <PillarCard
              step="01"
              icon={Cpu}
              title="The Hardware"
              description="5 sensors on a Raspberry Pi 4 — IMU, GPS, Camera, Ultrasonic — sampling at 10Hz with Kalman Filter fusion."
              items={['MPU-6050 → G-Force', 'NEO-6M → GPS/Speed', 'Pi Camera → Evidence', 'HC-SR04 → Proximity']}
            />
            <PillarCard
              step="02"
              icon={Activity}
              title="The Intelligence"
              description="Real-time detection engine with configurable thresholds and multi-sensor fusion for zero false positives."
              items={['Harsh Brake < -1.5g', 'Aggressive Turn > 0.8g', 'Tailgating > 15% frame', 'Close Pass < 100cm']}
            />
            <PillarCard
              step="03"
              icon={Zap}
              title="The Response"
              description="Sub-500ms alert pipeline with video evidence capture and offline-first architecture."
              items={['Video buffer capture', 'Instant dashboard alert', 'Offline → auto-sync', 'CSV/PDF reports']}
            />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 4: KEY FEATURES
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="max-w-6xl mx-auto"
        >
          <motion.p variants={fadeUp} className="text-signal-info font-mono text-sm uppercase tracking-widest mb-4 text-center">
            Capabilities
          </motion.p>

          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl text-center mb-16">
            Built for the Real World
          </motion.h2>

          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={MapPin} title="Live Fleet Tracking" description="GPS positions of every bus on a real-time map with route visualization." />
            <FeatureCard icon={Camera} title="Video Evidence" description="Automatic 10-second clip capture with snapshot for every detected incident." />
            <FeatureCard icon={Shield} title="5 Detection Types" description="Harsh brake, harsh acceleration, aggressive turn, tailgating, close overtaking." />
            <FeatureCard icon={WifiOff} title="Offline-First" description="Events queue locally during connectivity loss, auto-sync when back online." />
            <FeatureCard icon={Clock} title="< 500ms Response" description="From detection to dashboard alert in under half a second." />
            <FeatureCard icon={BarChart3} title="Analytics & Reports" description="Danger zone heatmaps, driver scores, severity trends, CSV export." />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 5: CTA
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6 border-t border-border-subtle">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl mb-6">
            Ready to see it{' '}
            <span className="gradient-text-crimson">in action?</span>
          </motion.h2>

          <motion.p variants={fadeUp} className="text-text-secondary text-lg mb-10">
            The Command Center is running live with simulated fleet data.
            <br />
            Experience real-time detection, alerts, and analytics.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dashboard">
              <Button size="lg" className="text-base">
                Launch Command Center
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-16 text-text-ghost text-sm font-mono">
            OnboardRash • Proposed for KSRTC Kerala • 2026
          </motion.p>
        </motion.div>
      </section>
    </div>
  )
}

// ── Sub-components ──

function StatCard({
  value,
  label,
  suffix = '',
  accent,
}: {
  value: number
  label: string
  suffix?: string
  accent: 'crimson' | 'warning'
}) {
  const colors = {
    crimson: 'border-ksrtc-crimson/20 shadow-[0_0_40px_rgba(220,38,38,0.08)]',
    warning: 'border-signal-warning/20 shadow-[0_0_40px_rgba(245,158,11,0.08)]',
  }
  const textColors = {
    crimson: 'text-ksrtc-glow',
    warning: 'text-signal-warning',
  }

  return (
    <div className={`glass-card rounded-2xl p-8 ${colors[accent]}`}>
      <div className={`text-5xl font-display font-bold mb-2 ${textColors[accent]}`}>
        <CountUp value={value} suffix={suffix} />
      </div>
      <div className="text-text-secondary text-sm">{label}</div>
    </div>
  )
}

function PillarCard({
  step,
  icon: Icon,
  title,
  description,
  items,
}: {
  step: string
  icon: React.ElementType
  title: string
  description: string
  items: string[]
}) {
  return (
    <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 group">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-text-ghost font-mono text-sm">{step}</span>
        <div className="w-10 h-10 rounded-xl bg-kerala-teal/10 border border-kerala-teal/20 flex items-center justify-center group-hover:bg-kerala-teal/20 transition-colors">
          <Icon className="w-5 h-5 text-kerala-teal" />
        </div>
      </div>

      <h3 className="font-display font-semibold text-xl mb-3">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed mb-6">{description}</p>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm">
            <span className="w-1 h-1 rounded-full bg-kerala-teal flex-shrink-0" />
            <span className="text-text-secondary font-mono text-xs">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <motion.div variants={fadeUp} className="glass-card rounded-xl p-6 group">
      <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center mb-4 group-hover:border-kerala-teal/30 transition-colors">
        <Icon className="w-5 h-5 text-text-secondary group-hover:text-kerala-teal transition-colors" />
      </div>
      <h3 className="font-display font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
