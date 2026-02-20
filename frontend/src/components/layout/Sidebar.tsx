import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SidebarProps {
  className?: string
  defaultCollapsed?: boolean
}

interface MenuItem {
  name: string
  path: string
  icon: React.ReactElement
}

export default function Sidebar({ className, defaultCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const location = useLocation()

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Events', path: '/events', icon: <AlertCircle size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ]

  return (
    <motion.aside
      className={cn('sidebar', className)}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: '64px', // Below navbar
        left: 0,
        bottom: 0,
        width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--glass-t1-bg)',
        backdropFilter: 'var(--glass-t1-blur)',
        WebkitBackdropFilter: 'var(--glass-t1-blur)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 900,
        transition: 'width var(--duration-normal) var(--ease-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Menu Items */}
      <nav
        style={{
          flex: 1,
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 'var(--weight-headline)' : 'var(--weight-body)',
                fontSize: 'var(--text-body)',
                background: isActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                transition: 'all var(--duration-fast) var(--ease-default)',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {/* Icon */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'inherit'
                }}
              >
                {item.icon}
              </span>

              {/* Label (hidden when collapsed) */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'var(--space-2)',
                    bottom: 'var(--space-2)',
                    width: '3px',
                    background: 'var(--text-primary)',
                    borderRadius: '0 var(--radius-full) var(--radius-full) 0'
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <div
        style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-footnote)',
            fontWeight: 'var(--weight-body)',
            transition: 'all var(--duration-fast) var(--ease-default)',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
            e.currentTarget.style.color = 'var(--text-tertiary)'
          }}
        >
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>

          <span style={{ display: 'flex', alignItems: 'center' }}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
