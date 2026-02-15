import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  includeAtmosphere?: boolean
}

export default function Layout({ children, includeAtmosphere = true }: LayoutProps) {
  return (
    <div
      className="app-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden'
      }}
    >
      {/* Animated gradient background — fixed, behind everything */}
      {includeAtmosphere && (
        <div
          className="atmosphere"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'var(--bg-base)',
            overflow: 'hidden'
          }}
        >
          {/* Gradient Orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
          
          {/* Noise Overlay */}
          <div
            className="noise-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'var(--noise-texture)',
              backgroundSize: '256px 256px',
              opacity: 0.05,
              pointerEvents: 'none',
              mixBlendMode: 'overlay'
            }}
          />
        </div>
      )}

      {/* Page content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
