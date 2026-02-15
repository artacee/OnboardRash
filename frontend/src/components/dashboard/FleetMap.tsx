// ============================================================
// FleetMap — Map placeholder with bus locations
// Uses a stylized CSS placeholder until Mapbox is configured
// ============================================================

import { motion } from 'framer-motion'
import { MapPin, Navigation, Satellite } from 'lucide-react'
import { useBusStore } from '@/stores/useBusStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { cn } from '@/lib/utils'

export function FleetMap() {
  const locations = useBusStore((s) => s.locations)

  return (
    <GlassPanel variant="strong" noPadding className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-kerala-teal" />
          <h3 className="font-display font-semibold text-sm">Fleet Map</h3>
          <span className="text-xs font-mono text-text-ghost bg-surface-2 px-2 py-0.5 rounded-full">
            {locations.length} active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md hover:bg-surface-1 text-text-ghost hover:text-text-secondary transition-colors cursor-pointer">
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-surface-1 text-text-ghost hover:text-text-secondary transition-colors cursor-pointer">
            <Satellite className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-surface-0 overflow-hidden min-h-[300px]">
        {/* Stylized grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(13, 148, 136, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(13, 148, 136, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Kerala outline (stylized) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-48 h-80">
            {/* Simplified Kerala shape with gradient */}
            <svg viewBox="0 0 100 220" className="w-full h-full opacity-30">
              <path
                d="M50 10 C35 30, 20 50, 25 80 C30 110, 20 130, 30 160 C35 175, 40 190, 45 200 C48 208, 50 210, 52 208 C55 200, 60 185, 58 170 C55 150, 65 130, 60 100 C55 70, 65 40, 50 10Z"
                fill="none"
                stroke="var(--color-kerala-teal)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            </svg>

            {/* Bus dots */}
            {locations.length > 0 ? (
              locations.map((loc, i) => (
                <motion.div
                  key={loc.bus_id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                  className="absolute"
                  style={{
                    // Map lat/lng to relative position within the shape
                    left: `${30 + (i * 12) % 40}%`,
                    top: `${15 + (i * 18) % 65}%`,
                  }}
                  title={`${loc.bus_registration} — ${loc.speed?.toFixed(0) ?? '?'} km/h`}
                >
                  <div className="relative group cursor-pointer">
                    <span className="absolute w-6 h-6 rounded-full bg-kerala-teal/20 animate-ping" />
                    <span className="relative flex w-3 h-3 rounded-full bg-kerala-teal shadow-[0_0_8px_rgba(13,148,136,0.5)]" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-surface-2 border border-border-subtle rounded-lg px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap shadow-lg">
                        <div className="font-semibold">{loc.bus_registration}</div>
                        <div className="text-text-ghost">{loc.speed?.toFixed(0) ?? '?'} km/h</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-ghost text-xs font-mono">
                No active buses
              </div>
            )}
          </div>
        </div>

        {/* Map label */}
        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-text-ghost bg-surface-0/80 px-2 py-1 rounded">
          Kerala, India • Live Fleet View
        </div>
      </div>
    </GlassPanel>
  )
}
