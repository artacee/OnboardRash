// ============================================================
// Dashboard Page — Command Center Main View
// ============================================================

import { motion } from 'framer-motion'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { FleetMap } from '@/components/dashboard/FleetMap'
import { AlertFeed } from '@/components/dashboard/AlertFeed'
import { EventTable } from '@/components/dashboard/EventTable'

const pageVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { 
      duration: 0.4,
      staggerChildren: 0.1,
    }
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
}

export function Dashboard() {
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Stats Row */}
      <motion.section variants={sectionVariants}>
        <StatsGrid />
      </motion.section>

      {/* Map + Alerts Row */}
      <motion.section 
        variants={sectionVariants}
        className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6"
        style={{ minHeight: '480px' }}
      >
        <FleetMap />
        <AlertFeed />
      </motion.section>

      {/* Event History Table */}
      <motion.section variants={sectionVariants}>
        <EventTable />
      </motion.section>
    </motion.div>
  )
}
