// ============================================================
// Sidebar — Premium HUD Navigation Rail
// ============================================================

import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bus,
  BarChart3,
  AlertTriangle,
  Users,
  Settings,
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
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-20 flex flex-col glass-strong"
    >
      {/* Subtle gradient border on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-kerala-teal/20 to-transparent" />

      {/* Logo Section */}
      <div className="flex items-center gap-4 px-5 h-20 border-b border-border-subtle relative">
        {/* Animated logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-ksrtc-crimson via-ksrtc-glow to-ksrtc-crimson bg-[length:200%_200%] animate-gradient-slow flex items-center justify-center flex-shrink-0 shadow-glow-crimson/20"
        >
          <Zap className="w-5 h-5 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-xl animate-ping-slow bg-ksrtc-crimson/30" />
        </motion.div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <h1 className="font-display font-bold text-base tracking-tight whitespace-nowrap gradient-text-crimson">
                OnboardRash
              </h1>
              <p className="text-[10px] text-text-ghost font-mono tracking-wider whitespace-nowrap uppercase">
                KSRTC Command
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group',
                'text-text-secondary hover:text-text-primary',
                !isActive && 'hover:bg-surface-1/50',
                isActive && 'bg-surface-2/80 text-text-primary shadow-lg'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-kerala-teal via-kerala-teal to-kerala-teal/50 rounded-full shadow-glow-teal/50"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                
                {/* Icon with glow on hover/active */}
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'relative flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-300',
                    isActive ? 'bg-kerala-teal/10' : 'group-hover:bg-surface-2/50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px] transition-colors duration-300',
                      isActive ? 'text-kerala-teal' : 'group-hover:text-kerala-teal/80'
                    )}
                  />
                  {/* Subtle glow behind icon when active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-kerala-teal/20 blur-md -z-10" />
                  )}
                </motion.div>
                
                {/* Label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={cn(
                        'text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300',
                        isActive && 'text-text-primary'
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Hover highlight */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-5 py-4 border-t border-border-subtle"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-text-ghost uppercase tracking-wider">
              <span>System Status</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-safe animate-pulse" />
                <span className="text-signal-safe">Operational</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse Toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-14 border-t border-border-subtle text-text-ghost hover:text-kerala-teal hover:bg-surface-1/30 transition-all duration-300 cursor-pointer group"
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </motion.div>
      </button>
    </motion.aside>
  )
}
