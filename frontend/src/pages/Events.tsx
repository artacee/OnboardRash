// ============================================================
// Events Page — Full-screen event management view
// ============================================================

import { EventTable } from '@/components/dashboard/EventTable'

export function Events() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">Event History</h1>
        <p className="text-text-secondary text-sm">All detected driving events across the fleet.</p>
      </div>
      <EventTable />
    </div>
  )
}
