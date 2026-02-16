import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

interface NavbarProps {
  className?: string
  /** Start transparent, become opaque on scroll (for landing page) */
  transparent?: boolean
}

export default function Navbar({ className, transparent = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Events', path: '/events' },
    { name: 'Settings', path: '/settings' }
  ]

  return (
    <motion.nav
      className={cn('navbar-floating', isScrolled && 'navbar-floating--scrolled', className)}
      initial={{ opacity: 0, y: -40, scale: 0.95, x: '-50%' }}
      animate={{ 
        opacity: transparent && !isScrolled ? 0.95 : 1, 
        y: 0,
        scale: isScrolled ? 0.96 : 1,
        x: '-50%'
      }}
      transition={{ 
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      whileHover={{
        scale: isScrolled ? 0.98 : 1.02,
        y: isScrolled ? 0 : -2,
        x: '-50%'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: 'var(--space-6)',
        left: '50%',
        zIndex: 9999,
        width: 'fit-content',
        maxWidth: 'calc(100vw - 80px)',
        background: transparent && !isScrolled 
          ? 'var(--glass-t0-bg)' 
          : isScrolled || isHovered
            ? 'var(--glass-t0-bg-hover)' 
            : 'var(--glass-t0-bg)',
        backdropFilter: 'var(--glass-t0-blur)',
        WebkitBackdropFilter: 'var(--glass-t0-blur)',
        border: 'var(--glass-t0-border)',
        borderRadius: '100px',
        padding: 'var(--space-2) var(--space-4)',
        boxShadow: isHovered 
          ? `0 24px 80px rgba(0, 0, 0, 0.12),
             0 12px 40px rgba(0, 0, 0, 0.08),
             0 0 0 0.5px rgba(255, 255, 255, 0.6) inset,
             0 0 30px rgba(138, 117, 234, 0.2)`
          : `0 20px 60px rgba(0, 0, 0, 0.08),
             0 10px 30px rgba(0, 0, 0, 0.04),
             0 0 0 0.5px rgba(255, 255, 255, 0.6) inset`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
          height: '48px'
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--text-primary)',
            fontWeight: 'var(--weight-title)',
            fontSize: 'var(--text-body)',
            letterSpacing: '-0.02em',
            padding: '0 var(--space-3)',
            whiteSpace: 'nowrap'
          }}
        >
          <span
            style={{
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            🚌
          </span>
          <span style={{ fontWeight: '600' }}>OnboardRash</span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.08)'
          }}
        />

        {/* Nav Links (Segment Control Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: '100px',
            padding: 'var(--space-1)'
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path

            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  position: 'relative',
                  textDecoration: 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-body)',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: '100px',
                  background: isActive ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-capsule"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '100px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      zIndex: -1
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.08)'
          }}
        />

        {/* Sign Out Button */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'white',
            fontSize: 'var(--text-body)',
            fontWeight: '600',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, rgba(138, 117, 234, 0.9) 0%, rgba(159, 122, 234, 0.9) 100%)',
            boxShadow: '0 4px 12px rgba(138, 117, 234, 0.3)',
            transition: 'all var(--duration-fast) var(--ease-default)',
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(138, 117, 234, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(138, 117, 234, 0.3)'
          }}
        >
          Sign Out
        </button>
      </div>
    </motion.nav>
  )
}
