// ============================================================
// Dashboard Page — The Command Center main view
// Stats + Map + Alerts + Event Table
// ============================================================

import { motion } from 'framer-motion'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { FleetMap } from '@/components/dashboard/FleetMap'
import { AlertFeed } from '@/components/dashboard/AlertFeed'
import { EventTable } from '@/components/dashboard/EventTable'

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <StatsGrid />

      {/* Map + Alerts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6" style={{ minHeight: '420px' }}>
        <FleetMap />
        <AlertFeed />
      </div>

      {/* Event History Table */}
      <EventTable />
    </div>
  )
}
