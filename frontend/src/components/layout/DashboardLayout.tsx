// ============================================================
// DashboardLayout — Main authenticated shell
// Sidebar + Header + Content area with socket + data polling
// ============================================================

import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useSocket } from '@/hooks/useSocket'
import { useDataPolling } from '@/hooks/useDataPolling'
import { useUIStore } from '@/stores/useUIStore'
import { CommandPalette } from '@/components/ui/CommandPalette'

export function DashboardLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)

  // Initialize WebSocket connection
  useSocket()

  // Start data polling
  useDataPolling()

  return (
    <div className="min-h-screen bg-void">
      <Sidebar />

      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col min-h-screen"
      >
        <Header />

        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>

      {/* Command Palette Overlay */}
      <CommandPalette />
    </div>
  )
}
