// ============================================================
// Sidebar — Collapsible navigation rail
// ============================================================

import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bus,
  BarChart3,
  AlertTriangle,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Command Center', end: true },
  { path: '/dashboard/fleet', icon: Bus, label: 'Fleet' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/dashboard/events', icon: AlertTriangle, label: 'Events' },
  { path: '/dashboard/drivers', icon: Users, label: 'Drivers' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-20 flex flex-col bg-surface-0 border-r border-border-subtle"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ksrtc-crimson to-ksrtc-glow flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="font-display font-bold text-sm tracking-tight whitespace-nowrap gradient-text-crimson">
                OnboardRash
              </h1>
              <p className="text-[10px] text-text-ghost whitespace-nowrap">KSRTC Command</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                'text-text-secondary hover:text-text-primary hover:bg-surface-1',
                isActive && 'bg-surface-1 text-text-primary border border-border-subtle shadow-sm'
              )
            }
          >
            <item.icon
              className={cn(
                'w-5 h-5 flex-shrink-0 transition-colors',
                'group-hover:text-kerala-teal'
              )}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-12 border-t border-border-subtle text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  )
}
