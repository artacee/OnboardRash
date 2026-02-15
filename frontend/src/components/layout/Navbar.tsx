import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import FloatingButton from '@/components/ui/FloatingButton'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

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
      className={cn('navbar', isScrolled && 'navbar--scrolled', className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: isScrolled ? 'var(--glass-t1-bg-hover)' : 'var(--glass-primary)',
        backdropFilter: 'var(--glass-t1-blur)',
        WebkitBackdropFilter: 'var(--glass-t1-blur)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        transition: 'all var(--duration-normal) var(--ease-default)',
        boxShadow: isScrolled ? 'var(--shadow-3)' : 'none'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-8)'
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 'var(--weight-title)',
            fontSize: 'var(--text-title-3)',
            letterSpacing: '-0.02em',
            transition: 'opacity var(--duration-fast) var(--ease-default)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <span
            style={{
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            🚌
          </span>
          <span>OnboardRash</span>
        </Link>

        {/* Nav Links (Center) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)'
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
                  fontWeight: isActive ? 'var(--weight-headline)' : 'var(--weight-body)',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
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
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 'var(--space-3)',
                      right: 'var(--space-3)',
                      height: '2px',
                      background: 'var(--text-primary)',
                      borderRadius: 'var(--radius-full)'
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
        </div>

        {/* CTA Button */}
        <FloatingButton
          size="sm"
          onClick={() => {
            window.location.href = '/dashboard'
          }}
        >
          Launch Dashboard
        </FloatingButton>
      </div>
    </motion.nav>
  )
}
