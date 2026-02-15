// ============================================================
// Header — Premium HUD Command Bar
// ============================================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Volume2, VolumeX, User, Wifi, WifiOff, Clock, Activity } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useEventStore } from '@/stores/useEventStore'
import { cn } from '@/lib/utils'

export function Header() {
  const connected = useUIStore((s) => s.connected)
  const soundEnabled = useUIStore((s) => s.soundEnabled)
  const setSoundEnabled = useUIStore((s) => s.setSoundEnabled)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const threatLevel = useEventStore((s) => s.threatLevel)
  const alerts = useEventStore((s) => s.alerts)
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length

  // Live clock
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  const threatColors = {
    safe: {
      bg: 'from-signal-safe/0 via-signal-safe/20 to-signal-safe/0',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
    },
    elevated: {
      bg: 'from-signal-warning/0 via-signal-warning/30 to-signal-warning/0',
      glow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]',
    },
    critical: {
      bg: 'from-signal-critical/0 via-signal-critical/40 to-signal-critical/0',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.5)]',
    },
  }

  return (
    <header className="h-20 flex items-center justify-between px-6 glass-strong relative z-10 border-b border-border-subtle">
      {/* HUD Corner Decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-kerala-teal/30 rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-kerala-teal/30 rounded-tr-sm" />
      
      {/* Ambient Threat Indicator — bottom border glow */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r',
          threatColors[threatLevel].bg
        )}
        animate={{
          opacity: threatLevel === 'safe' ? 0.6 : 1,
        }}
        transition={{ duration: 1, repeat: threatLevel === 'critical' ? Infinity : 0, repeatType: 'reverse' }}
      />
      
      {/* Threat glow below header */}
      {threatLevel !== 'safe' && (
        <div className={cn('absolute -bottom-2 left-1/4 right-1/4 h-4 blur-xl', threatColors[threatLevel].glow)} />
      )}

      {/* Left: Status info */}
      <div className="flex items-center gap-4 lg:gap-6 min-w-0">
        {/* Live Time */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-text-primary font-mono text-base lg:text-lg tabular-nums">
            <Clock className="w-4 h-4 text-kerala-teal flex-shrink-0" />
            <span className="whitespace-nowrap">{time.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
          <span className="text-[9px] lg:text-[10px] text-text-ghost font-mono uppercase tracking-wider truncate">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-border-default to-transparent hidden lg:block" />

        {/* Threat Level */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Activity className={cn(
            'w-5 h-5 flex-shrink-0',
            threatLevel === 'safe' && 'text-signal-safe',
            threatLevel === 'elevated' && 'text-signal-warning',
            threatLevel === 'critical' && 'text-signal-critical animate-pulse'
          )} />
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-text-ghost font-mono uppercase tracking-wider">Threat</span>
            <span className={cn(
              'text-xs font-semibold uppercase tracking-wide',
              threatLevel === 'safe' && 'text-signal-safe',
              threatLevel === 'elevated' && 'text-signal-warning',
              threatLevel === 'critical' && 'text-signal-critical'
            )}>
              {threatLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Premium Search Bar */}
      <motion.button
        onClick={() => setCommandPaletteOpen(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl glass hover:bg-surface-1/50 text-text-ghost text-sm transition-all duration-300 w-[280px] lg:w-[320px] group border border-border-subtle hover:border-border-default"
      >
        <Search className="w-4 h-4 flex-shrink-0 group-hover:text-kerala-teal transition-colors" />
        <span className="flex-1 text-left truncate text-xs lg:text-sm">Search buses, events...</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <kbd className="text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border-subtle group-hover:border-kerala-teal/30 transition-colors">
            ⌘K
          </kbd>
        </div>
      </motion.button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-3 rounded-xl hover:bg-surface-1/50 text-text-secondary hover:text-text-primary transition-all duration-300 cursor-pointer group"
        >
          <Bell className="w-5 h-5 group-hover:text-kerala-teal transition-colors" />
          <AnimatePresence>
            {unacknowledgedCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-ksrtc-crimson text-white text-[10px] font-bold flex items-center justify-center shadow-glow-crimson/50"
              >
                {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Sound Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-xl hover:bg-surface-1/50 text-text-secondary hover:text-text-primary transition-all duration-300 cursor-pointer group"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 group-hover:text-kerala-teal transition-colors" />
          ) : (
            <VolumeX className="w-5 h-5 group-hover:text-signal-warning transition-colors" />
          )}
        </motion.button>

        {/* Divider */}
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-border-default to-transparent mx-2" />

        {/* Connection Status */}
        <motion.div
          animate={!connected ? { x: [-1, 1, -1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-300',
            connected
              ? 'bg-signal-safe/5 text-signal-safe border border-signal-safe/20 shadow-[inset_0_0_20px_rgba(52,211,153,0.1)]'
              : 'bg-signal-critical/5 text-signal-critical border border-signal-critical/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]'
          )}
        >
          {connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-safe opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-safe" />
              </span>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LIVE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-signal-critical animate-pulse" />
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OFFLINE</span>
            </>
          )}
        </motion.div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-4 ml-2 border-l border-border-subtle">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-surface-2 to-surface-3 border border-border-default flex items-center justify-center cursor-pointer group overflow-hidden"
          >
            <User className="w-5 h-5 text-text-secondary group-hover:text-kerala-teal transition-colors" />
            {/* Hover glow */}
            <div className="absolute inset-0 bg-kerala-teal/0 group-hover:bg-kerala-teal/10 transition-colors duration-300" />
          </motion.div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-medium text-text-primary">Admin</span>
            <span className="text-[10px] text-text-ghost font-mono">Control Officer</span>
          </div>
        </div>
      </div>
    </header>
  )
}
