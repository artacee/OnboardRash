// ============================================================
// Header — Top bar with search, connection status, threat indicator
// ============================================================

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Bell, Volume2, VolumeX, User, Wifi, WifiOff } from 'lucide-react'
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
    safe: 'from-signal-safe/0 via-signal-safe/20 to-signal-safe/0',
    elevated: 'from-signal-warning/0 via-signal-warning/30 to-signal-warning/0',
    critical: 'from-signal-critical/0 via-signal-critical/40 to-signal-critical/0',
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl relative z-10">
      {/* Ambient Threat Indicator — bottom border glow */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r',
          threatColors[threatLevel]
        )}
        animate={{
          opacity: threatLevel === 'safe' ? 0.5 : 1,
        }}
        transition={{ duration: 1, repeat: threatLevel === 'critical' ? Infinity : 0, repeatType: 'reverse' }}
      />

      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h2 className="font-display font-semibold text-lg text-text-primary">
          Command Center
        </h2>
      </div>

      {/* Center: Search Bar */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg glass text-text-ghost text-sm hover:border-border-default transition-all cursor-pointer min-w-[280px]"
      >
        <Search className="w-4 h-4" />
        <span>Search buses, events...</span>
        <kbd className="ml-auto text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border-subtle">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg hover:bg-surface-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          {unacknowledgedCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-ksrtc-crimson text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
            </motion.span>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg hover:bg-surface-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Connection Status */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono',
            connected
              ? 'bg-signal-safe/10 text-signal-safe border border-signal-safe/20'
              : 'bg-signal-critical/10 text-signal-critical border border-signal-critical/20'
          )}
        >
          {connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-signal-safe animate-dot-pulse" />
              <Wifi className="w-3 h-3" />
              Live
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-signal-critical" />
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
            <User className="w-4 h-4 text-text-secondary" />
          </div>
          <span className="text-sm font-medium text-text-secondary hidden lg:block">Admin</span>
        </div>
      </div>
    </header>
  )
}
