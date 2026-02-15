// ============================================================
// StatsGrid — Animated stat cards with sparklines
// ============================================================

import { motion } from 'framer-motion'
import { Bus, MapPin, AlertTriangle, ShieldAlert } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Sparkline } from '@/components/ui/Sparkline'
import { useEventStore } from '@/stores/useEventStore'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// Mock sparkline data (in real app, computed from event history)
const sparkData = {
  buses: [3, 5, 4, 7, 8, 6, 9, 12, 10, 12],
  active: [2, 3, 3, 5, 6, 4, 7, 8, 6, 8],
  events: [5, 8, 12, 9, 15, 18, 14, 20, 23, 21],
  critical: [0, 1, 0, 2, 1, 1, 3, 2, 3, 3],
}

export function StatsGrid() {
  const stats = useEventStore((s) => s.stats)
  const threatLevel = useEventStore((s) => s.threatLevel)

  const cards = [
    {
      label: 'Total Buses',
      value: stats.total_buses,
      icon: Bus,
      color: 'text-kerala-teal',
      spark: sparkData.buses,
      sparkColor: 'var(--color-kerala-teal)',
    },
    {
      label: 'Active Now',
      value: stats.active_buses,
      icon: MapPin,
      color: 'text-signal-info',
      spark: sparkData.active,
      sparkColor: 'var(--color-signal-info)',
    },
    {
      label: 'Events Today',
      value: stats.today_events,
      icon: AlertTriangle,
      color: 'text-signal-warning',
      spark: sparkData.events,
      sparkColor: 'var(--color-signal-warning)',
    },
    {
      label: 'Critical',
      value: stats.high_severity,
      icon: ShieldAlert,
      color: 'text-signal-critical',
      spark: sparkData.critical,
      sparkColor: 'var(--color-signal-critical)',
      glow: stats.high_severity > 0,
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={item}>
          <GlassPanel
            variant="card"
            glow={card.glow ? 'crimson' : 'none'}
            className={card.glow ? 'animate-pulse-critical' : ''}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <Sparkline data={card.spark} color={card.sparkColor} />
            </div>

            <div className="space-y-1">
              <AnimatedCounter
                value={card.value}
                className={`text-3xl font-display font-bold ${card.color}`}
              />
              <p className="text-text-ghost text-sm">{card.label}</p>
            </div>
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  )
}
