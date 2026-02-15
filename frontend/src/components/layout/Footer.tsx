import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface FooterProps {
  className?: string
}

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { name: 'About', path: '/about' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Terms', path: '/terms' },
    { name: 'Contact', path: '/contact' }
  ]

  return (
    <motion.footer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        width: '100%',
        background: 'var(--glass-t2-bg)',
        backdropFilter: 'var(--glass-t2-blur)',
        WebkitBackdropFilter: 'var(--glass-t2-blur)',
        border: 'var(--glass-t2-border)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 'var(--space-8) var(--space-6)',
        marginTop: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)'
        }}
      >
        {/* Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {footerLinks.map((link, index) => (
            <span key={link.path} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <Link
                to={link.path}
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-footnote)',
                  fontWeight: 'var(--weight-body)',
                  transition: 'color var(--duration-fast) var(--ease-default)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }}
              >
                {link.name}
              </Link>
              {index < footerLinks.length - 1 && (
                <span
                  style={{
                    width: '1px',
                    height: '12px',
                    background: 'rgba(0, 0, 0, 0.1)'
                  }}
                />
              )}
            </span>
          ))}
        </nav>

        {/* Copyright */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-footnote)',
              color: 'var(--text-tertiary)',
              fontWeight: 'var(--weight-body)',
              margin: 0,
              textAlign: 'center'
            }}
          >
            © {currentYear} OnboardRash. All rights reserved.
          </p>
          
          <p
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-tertiary)',
              fontWeight: 'var(--weight-body)',
              margin: 0,
              textAlign: 'center',
              opacity: 0.7
            }}
          >
            Real-time fleet intelligence powered by AI
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
