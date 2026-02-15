import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: number | string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'info' | 'warning' | 'danger' | 'safe'
  subtitle?: string
  delay?: number
  pulse?: boolean
}

export default function MetricCard({
  icon,
  label,
  value,
  change,
  trend,
  color = 'info',
  subtitle,
  delay = 0,
  pulse = false
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  // Counter-up animation for numeric values
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1500
      const steps = 60
      const increment = value / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [value])
  
  const colorMap = {
    info: 'var(--color-info)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    safe: 'var(--color-safe)'
  }
  
  const trendIcon = {
    up: <TrendingUp size={14} />,
    down: <TrendingDown size={14} />,
    neutral: <Minus size={14} />
  }
  
  return (
    <motion.div
      className="glass-card metric-card"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 25
        }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ 
        delay,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        minHeight: '180px',
        padding: 'var(--space-7)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
    >
      {/* Background gradient accent */}
      <motion.div 
        className="stat-card-accent"
        animate={{
          opacity: isHovered ? 0.2 : 0.15,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: '160px',
          height: '160px',
          background: `radial-gradient(circle, ${colorMap[color]}, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />
      
      {/* Subtle shimmer effect on hover */}
      <motion.div
        animate={{
          x: isHovered ? ['-100%', '200%'] : '-100%',
          opacity: isHovered ? [0, 0.3, 0] : 0
        }}
        transition={{
          duration: 1.2,
          repeat: isHovered ? Infinity : 0,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          pointerEvents: 'none',
          filter: 'blur(10px)'
        }}
      />
      
      {/* Icon */}
      <motion.div
        style={{
          color: colorMap[color],
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
        }}
        animate={pulse ? {
          scale: [1, 1.15, 1],
          opacity: [1, 0.75, 1]
        } : isHovered ? {
          scale: 1.1,
          rotate: [0, -5, 5, 0]
        } : {}}
        transition={pulse ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        } : {
          duration: 0.5
        }}
      >
        {icon}
      </motion.div>
      
      {/* Content */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: 'var(--text-callout)',
          color: 'var(--text-tertiary)',
          marginBottom: 'var(--space-3)',
          fontWeight: 'var(--weight-headline)',
          letterSpacing: '0.01em'
        }}>
          {label}
        </p>
        
        <motion.p
          style={{
            fontSize: 'var(--text-display-2)',
            fontWeight: 'var(--weight-title)',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.98), rgba(0,0,0,0.70))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
            marginBottom: 'var(--space-2)',
            letterSpacing: '-0.03em'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
        >
          {typeof value === 'number' ? displayValue : value}
        </motion.p>
        
        {subtitle && (
          <motion.p 
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-tertiary)',
              fontWeight: 'var(--weight-body)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
          >
            {subtitle}
          </motion.p>
        )}
        
        {change && trend && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-footnote)',
              color: trend === 'up' 
                ? 'var(--color-safe)' 
                : trend === 'down'
                ? 'var(--color-danger)'
                : 'var(--text-tertiary)',
              marginTop: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: trend === 'up'
                ? 'rgba(34, 197, 94, 0.08)'
                : trend === 'down'
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(0,0,0,0.04)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'var(--weight-headline)',
              width: 'fit-content'
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.6 }}
          >
            {trendIcon[trend]}
            <span>{change}</span>
          </motion.div>
        )}
      </div>
      
      {/* Hover border glow */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.95
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, ${colorMap[color]}40, transparent)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none'
        }}
      />
    </motion.div>
  )
}
