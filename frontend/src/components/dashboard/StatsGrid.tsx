// ============================================================
// StatsGrid — Premium HUD-style stat cards
// ============================================================

import { motion } from 'framer-motion'
import { Bus, MapPin, AlertTriangle, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Sparkline } from '@/components/ui/Sparkline'
import { useEventStore } from '@/stores/useEventStore'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } 
  },
}

// Mock sparkline data
const sparkData = {
  buses: [3, 5, 4, 7, 8, 6, 9, 12, 10, 12],
  active: [2, 3, 3, 5, 6, 4, 7, 8, 6, 8],
  events: [5, 8, 12, 9, 15, 18, 14, 20, 23, 21],
  critical: [0, 1, 0, 2, 1, 1, 3, 2, 3, 3],
}

export function StatsGrid() {
  const stats = useEventStore((s) => s.stats)

  const cards = [
    {
      label: 'Total Buses',
      value: stats.total_buses,
      icon: Bus,
      color: 'text-kerala-teal',
      bgColor: 'bg-kerala-teal/5',
      borderColor: 'border-kerala-teal/20',
      spark: sparkData.buses,
      sparkColor: 'var(--color-kerala-teal)',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Now',
      value: stats.active_buses,
      icon: MapPin,
      color: 'text-signal-info',
      bgColor: 'bg-signal-info/5',
      borderColor: 'border-signal-info/20',
      spark: sparkData.active,
      sparkColor: 'var(--color-signal-info)',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Events Today',
      value: stats.today_events,
      icon: AlertTriangle,
      color: 'text-signal-warning',
      bgColor: 'bg-signal-warning/5',
      borderColor: 'border-signal-warning/20',
      spark: sparkData.events,
      sparkColor: 'var(--color-signal-warning)',
      trend: '-5%',
      trendUp: false,
    },
    {
      label: 'Critical',
      value: stats.high_severity,
      icon: ShieldAlert,
      color: 'text-signal-critical',
      bgColor: 'bg-signal-critical/5',
      borderColor: 'border-signal-critical/20',
      spark: sparkData.critical,
      sparkColor: 'var(--color-signal-critical)',
      glow: stats.high_severity > 0,
      trend: stats.high_severity > 0 ? 'ALERT' : '—',
      trendUp: null,
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={item} className="group">
          <GlassPanel
            variant="card"
            glow={card.glow ? 'crimson' : 'none'}
            hud
            className={`
              h-full min-h-[160px] transition-all duration-500 overflow-hidden
              ${card.glow ? 'animate-pulse-critical' : ''}
              hover:translate-y-[-2px]
            `}
          >
            {/* Top row: Icon + Sparkline */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className={`
                w-11 h-11 rounded-xl ${card.bgColor} border ${card.borderColor}
                flex items-center justify-center flex-shrink-0
                group-hover:scale-110 transition-transform duration-500
              `}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-shrink-0">
                <Sparkline data={card.spark} color={card.sparkColor} width={72} height={24} />
              </div>
            </div>

            {/* Value */}
            <div className="mb-1.5">
              <AnimatedCounter
                value={card.value}
                className={`text-3xl font-display font-bold ${card.color} tracking-tight leading-none`}
              />
            </div>

            {/* Label + Trend */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-text-ghost text-sm font-medium truncate">{card.label}</p>
              {card.trend && (
                <span className={`
                  inline-flex items-center gap-1 text-xs font-mono flex-shrink-0
                  ${card.trendUp === true ? 'text-signal-safe' : ''}
                  ${card.trendUp === false ? 'text-signal-warning' : ''}
                  ${card.trendUp === null && card.glow ? 'text-signal-critical animate-pulse' : ''}
                  ${card.trendUp === null && !card.glow ? 'text-text-ghost' : ''}
                `}>
                  {card.trendUp === true && <TrendingUp className="w-3 h-3" />}
                  {card.trendUp === false && <TrendingDown className="w-3 h-3" />}
                  {card.trend}
                </span>
              )}
            </div>

            {/* Decorative line */}
            <div className={`
              absolute bottom-0 left-6 right-6 h-px
              bg-gradient-to-r from-transparent ${card.color.replace('text-', 'via-')}/20 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-500
            `} />
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  )
}
