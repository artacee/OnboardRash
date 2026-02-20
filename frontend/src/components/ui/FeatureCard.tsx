import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export type FeatureColor =
  | 'purple' | 'pink' | 'cyan' | 'green'
  | 'orange' | 'teal' | 'mint' | 'coral'
  | 'peach' | 'blue' | 'slate' | 'lime'

export type FeaturePattern =
  | 'circuit' | 'viewfinder' | 'route' | 'pulse'
  | 'chart' | 'bolt' | 'waves' | 'speedometer'
  | 'signal' | 'film' | 'none'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay?: number
  color?: FeatureColor
  iconPosition?: 'top' | 'bottom'
  pattern?: FeaturePattern
}

const appleEase = [0.4, 0, 0.2, 1] as const

/** Maps color name → card bg tint + icon bg + icon fg + gradient */
const palette: Record<FeatureColor, {
  card: string
  iconBg: string
  iconFg: string
  gradient: string
  glow: string
}> = {
  purple: {
    card: 'rgba(168, 140, 230, 0.18)',
    iconBg: 'rgba(155, 114, 255, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(168, 140, 230, 0.25) 0%, rgba(120, 80, 220, 0.08) 100%)',
    glow: 'rgba(120, 80, 220, 0.4)'
  },
  pink: {
    card: 'rgba(245, 170, 200, 0.18)',
    iconBg: 'rgba(255, 126, 179, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(245, 170, 200, 0.25) 0%, rgba(240, 100, 150, 0.08) 100%)',
    glow: 'rgba(240, 100, 150, 0.4)'
  },
  cyan: {
    card: 'rgba(100, 210, 255, 0.15)',
    iconBg: 'rgba(77, 212, 255, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(100, 210, 255, 0.25) 0%, rgba(0, 190, 240, 0.08) 100%)',
    glow: 'rgba(0, 190, 240, 0.4)'
  },
  green: {
    card: 'rgba(120, 230, 180, 0.15)',
    iconBg: 'rgba(90, 238, 167, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(120, 230, 180, 0.25) 0%, rgba(40, 200, 130, 0.08) 100%)',
    glow: 'rgba(40, 200, 130, 0.4)'
  },
  orange: {
    card: 'rgba(255, 190, 130, 0.18)',
    iconBg: 'rgba(255, 173, 94, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(255, 190, 130, 0.25) 0%, rgba(255, 160, 80, 0.08) 100%)',
    glow: 'rgba(255, 160, 80, 0.4)'
  },
  teal: {
    card: 'rgba(130, 210, 230, 0.18)',
    iconBg: 'rgba(93, 213, 232, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(130, 210, 230, 0.25) 0%, rgba(60, 180, 200, 0.08) 100%)',
    glow: 'rgba(60, 180, 200, 0.4)'
  },
  mint: {
    card: 'rgba(180, 235, 220, 0.18)',
    iconBg: 'rgba(127, 239, 221, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(180, 235, 220, 0.25) 0%, rgba(140, 220, 200, 0.08) 100%)',
    glow: 'rgba(140, 220, 200, 0.4)'
  },
  coral: {
    card: 'rgba(255, 160, 170, 0.18)',
    iconBg: 'rgba(255, 112, 135, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(255, 160, 170, 0.25) 0%, rgba(250, 120, 140, 0.08) 100%)',
    glow: 'rgba(250, 120, 140, 0.4)'
  },
  peach: {
    card: 'rgba(255, 200, 170, 0.18)',
    iconBg: 'rgba(255, 184, 140, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(255, 200, 170, 0.25) 0%, rgba(250, 160, 120, 0.08) 100%)',
    glow: 'rgba(250, 160, 120, 0.4)'
  },
  blue: {
    card: 'rgba(150, 180, 255, 0.18)',
    iconBg: 'rgba(125, 164, 255, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(150, 180, 255, 0.25) 0%, rgba(100, 130, 240, 0.08) 100%)',
    glow: 'rgba(100, 130, 240, 0.4)'
  },
  slate: {
    card: 'rgba(180, 190, 210, 0.18)',
    iconBg: 'rgba(155, 168, 196, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(180, 190, 210, 0.25) 0%, rgba(130, 140, 170, 0.08) 100%)',
    glow: 'rgba(130, 140, 170, 0.4)'
  },
  lime: {
    card: 'rgba(200, 240, 100, 0.18)',
    iconBg: 'rgba(199, 245, 90, 0.75)',
    iconFg: '#fff',
    gradient: 'linear-gradient(135deg, rgba(200, 240, 100, 0.25) 0%, rgba(160, 210, 40, 0.08) 100%)',
    glow: 'rgba(160, 210, 40, 0.4)'
  },
}

// Decorative pattern components
const DecorativePattern = ({ pattern, color }: { pattern: FeaturePattern; color: string }) => {
  if (pattern === 'none') return null

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: 0.28,
    pointerEvents: 'none',
    zIndex: 1,
  }

  switch (pattern) {
    case 'circuit':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Main circuit paths */}
          <path d="M20,40 L80,40 M60,40 L60,80 M60,80 L120,80 M120,60 L120,120 M120,100 L180,100"
            stroke={color} strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M140,20 L160,20 M150,20 L150,50 M150,50 L180,50"
            stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M20,120 L50,120 M50,120 L50,160 M50,160 L100,160"
            stroke={color} strokeWidth="2" fill="none" opacity="0.5" />

          {/* Connection nodes */}
          <circle cx="60" cy="40" r="5" fill={color} opacity="0.7" />
          <circle cx="60" cy="80" r="5" fill={color} opacity="0.7" />
          <circle cx="120" cy="80" r="5" fill={color} opacity="0.7" />
          <circle cx="120" cy="100" r="5" fill={color} opacity="0.7" />
          <circle cx="150" cy="50" r="4" fill={color} opacity="0.6" />
          <circle cx="50" cy="160" r="4" fill={color} opacity="0.6" />

          {/* Chip components */}
          <rect x="16" y="36" width="8" height="8" fill={color} opacity="0.5" rx="1" />
          <rect x="176" y="96" width="8" height="8" fill={color} opacity="0.5" rx="1" />
          <rect x="176" y="46" width="6" height="6" fill={color} opacity="0.4" rx="1" />
          <rect x="96" y="156" width="8" height="8" fill={color} opacity="0.5" rx="1" />

          {/* Data flow indicators */}
          <path d="M75,40 L78,37 L78,43 Z" fill={color} opacity="0.5" />
          <path d="M115,80 L118,77 L118,83 Z" fill={color} opacity="0.5" />
          <path d="M165,50 L168,47 L168,53 Z" fill={color} opacity="0.4" />
        </svg>
      )

    case 'viewfinder':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Corner brackets - thicker and more prominent */}
          <path d="M40,60 L40,40 L60,40" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M140,40 L160,40 L160,60" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M160,140 L160,160 L140,160" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M60,160 L40,160 L40,140" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />

          {/* Inner frame */}
          <rect x="55" y="55" width="90" height="90" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3" rx="2" />

          {/* Scan lines - multiple layers */}
          <line x1="60" y1="100" x2="140" y2="100" stroke={color} strokeWidth="1.5" opacity="0.6" strokeDasharray="6,4" />
          <line x1="100" y1="60" x2="100" y2="140" stroke={color} strokeWidth="1.5" opacity="0.6" strokeDasharray="6,4" />
          <line x1="60" y1="80" x2="140" y2="80" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4,6" />
          <line x1="60" y1="120" x2="140" y2="120" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4,6" />
          <line x1="80" y1="60" x2="80" y2="140" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4,6" />
          <line x1="120" y1="60" x2="120" y2="140" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4,6" />

          {/* Center targeting reticle */}
          <circle cx="100" cy="100" r="4" fill={color} opacity="0.7" />
          <circle cx="100" cy="100" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
          <circle cx="100" cy="100" r="15" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />

          {/* Focus indicators at corners */}
          <circle cx="45" cy="45" r="2" fill={color} opacity="0.6" />
          <circle cx="155" cy="45" r="2" fill={color} opacity="0.6" />
          <circle cx="155" cy="155" r="2" fill={color} opacity="0.6" />
          <circle cx="45" cy="155" r="2" fill={color} opacity="0.6" />
        </svg>
      )

    case 'route':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Main route path - dotted */}
          <path d="M30,170 Q60,120 90,140 T150,80 L170,50"
            stroke={color} strokeWidth="3" fill="none" strokeDasharray="3,10" strokeLinecap="round" opacity="0.7" />
          {/* Secondary routes */}
          <path d="M25,180 Q50,145 75,155 T130,110"
            stroke={color} strokeWidth="2" fill="none" strokeDasharray="2,8" strokeLinecap="round" opacity="0.4" />
          <path d="M175,45 Q145,70 120,65"
            stroke={color} strokeWidth="2" fill="none" strokeDasharray="2,8" strokeLinecap="round" opacity="0.4" />

          {/* Location markers with pins */}
          <g opacity="0.8">
            {/* Start location */}
            <path d="M30,160 L30,170 L26,165 Z" fill={color} />
            <circle cx="30" cy="160" r="6" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="30" cy="160" r="3" fill={color} />

            {/* Mid waypoint */}
            <circle cx="90" cy="140" r="7" fill={color} opacity="0.7" />
            <circle cx="90" cy="140" r="11" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="90" cy="140" r="16" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />

            {/* End location */}
            <path d="M170,40 L170,50 L166,45 Z" fill={color} />
            <circle cx="170" cy="40" r="6" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="170" cy="40" r="3" fill={color} />
          </g>

          {/* Distance markers along route */}
          <circle cx="70" cy="150" r="2" fill={color} opacity="0.5" />
          <circle cx="115" cy="110" r="2" fill={color} opacity="0.5" />
          <circle cx="155" cy="70" r="2" fill={color} opacity="0.5" />

          {/* Grid overlay for map feel */}
          <path d="M50,20 L50,180 M100,20 L100,180 M150,20 L150,180"
            stroke={color} strokeWidth="0.5" opacity="0.15" strokeDasharray="5,10" />
          <path d="M20,50 L180,50 M20,100 L180,100 M20,150 L180,150"
            stroke={color} strokeWidth="0.5" opacity="0.15" strokeDasharray="5,10" />
        </svg>
      )

    case 'pulse':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Concentric pulsing rings - more detailed */}
          <circle cx="100" cy="100" r="15" fill="none" stroke={color} strokeWidth="2.5" opacity="0.8" />
          <circle cx="100" cy="100" r="25" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
          <circle cx="100" cy="100" r="40" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
          <circle cx="100" cy="100" r="55" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
          <circle cx="100" cy="100" r="70" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
          <circle cx="100" cy="100" r="85" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />

          {/* Center core with glow */}
          <circle cx="100" cy="100" r="8" fill={color} opacity="0.9" />
          <circle cx="100" cy="100" r="5" fill="#fff" opacity="0.6" />

          {/* Alert indicators at cardinal points */}
          <circle cx="100" cy="30" r="3" fill={color} opacity="0.6" />
          <circle cx="170" cy="100" r="3" fill={color} opacity="0.6" />
          <circle cx="100" cy="170" r="3" fill={color} opacity="0.6" />
          <circle cx="30" cy="100" r="3" fill={color} opacity="0.6" />

          {/* Radiating dashed lines */}
          <line x1="100" y1="100" x2="100" y2="25" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="175" y2="100" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="100" y2="175" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="25" y2="100" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
        </svg>
      )

    case 'chart':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Chart grid */}
          <line x1="40" y1="50" x2="40" y2="170" stroke={color} strokeWidth="1.5" opacity="0.4" />
          <line x1="40" y1="170" x2="160" y2="170" stroke={color} strokeWidth="1.5" opacity="0.4" />
          <line x1="40" y1="90" x2="160" y2="90" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2,2" />
          <line x1="40" y1="130" x2="160" y2="130" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2,2" />

          {/* Bar chart columns with depth */}
          <rect x="50" y="130" width="20" height="40" fill={color} opacity="0.6" rx="2" />
          <rect x="50" y="128" width="20" height="4" fill={color} opacity="0.3" rx="2" />

          <rect x="80" y="100" width="20" height="70" fill={color} opacity="0.7" rx="2" />
          <rect x="80" y="98" width="20" height="4" fill={color} opacity="0.35" rx="2" />

          <rect x="110" y="120" width="20" height="50" fill={color} opacity="0.65" rx="2" />
          <rect x="110" y="118" width="20" height="4" fill={color} opacity="0.3" rx="2" />

          <rect x="140" y="80" width="20" height="90" fill={color} opacity="0.75" rx="2" />
          <rect x="140" y="78" width="20" height="4" fill={color} opacity="0.4" rx="2" />

          {/* Trend line with points */}
          <path d="M60,135 L90,105 L120,125 L150,85"
            stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="60" cy="135" r="4" fill={color} opacity="0.8" />
          <circle cx="90" cy="105" r="4" fill={color} opacity="0.8" />
          <circle cx="120" cy="125" r="4" fill={color} opacity="0.8" />
          <circle cx="150" cy="85" r="4" fill={color} opacity="0.8" />

          {/* Upward arrow indicator */}
          <path d="M165,70 L165,55 M165,55 L160,60 M165,55 L170,60"
            stroke={color} strokeWidth="2" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'bolt':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Main lightning bolt */}
          <path d="M100,50 L85,105 L105,105 L90,155"
            stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" opacity="0.7" strokeLinecap="round" />
          <path d="M100,50 L85,105 L105,105 L90,155"
            fill={color} opacity="0.3" />

          {/* Secondary smaller bolts */}
          <path d="M135,70 L127,95 L137,95 L130,115"
            stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.5" />
          <path d="M65,85 L58,105 L67,105 L62,125"
            stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.5" />

          {/* Left speed lines */}
          <line x1="30" y1="70" x2="60" y2="70" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="25" y1="90" x2="55" y2="90" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="30" y1="110" x2="60" y2="110" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="35" y1="130" x2="60" y2="130" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />

          {/* Right speed lines */}
          <line x1="140" y1="70" x2="170" y2="70" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="145" y1="90" x2="175" y2="90" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="140" y1="110" x2="170" y2="110" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="140" y1="130" x2="165" y2="130" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />

          {/* Energy particles */}
          <circle cx="95" cy="70" r="2.5" fill={color} opacity="0.6" />
          <circle cx="88" cy="120" r="2.5" fill={color} opacity="0.6" />
          <circle cx="102" cy="85" r="2" fill={color} opacity="0.5" />
          <circle cx="93" cy="140" r="2" fill={color} opacity="0.5" />
        </svg>
      )

    case 'waves':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Multiple wave layers */}
          <path d="M10,100 Q30,75 50,100 T90,100 T130,100 T170,100 T210,100"
            stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" />
          <path d="M10,120 Q30,95 50,120 T90,120 T130,120 T170,120 T210,120"
            stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M10,140 Q30,115 50,140 T90,140 T130,140 T170,140 T210,140"
            stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M10,80 Q30,55 50,80 T90,80 T130,80 T170,80 T210,80"
            stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M10,60 Q30,35 50,60 T90,60 T130,60 T170,60 T210,60"
            stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />

          {/* Event markers on waves */}
          <circle cx="50" cy="100" r="4" fill={color} opacity="0.7" />
          <circle cx="90" cy="100" r="4" fill={color} opacity="0.7" />
          <circle cx="130" cy="100" r="4" fill={color} opacity="0.7" />
          <circle cx="170" cy="100" r="4" fill={color} opacity="0.7" />

          {/* Notification bell icons simplified */}
          <path d="M45,95 L45,88 Q45,85 48,85 L52,85 Q55,85 55,88 L55,95"
            stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
          <line x1="42" y1="96" x2="58" y2="96" stroke={color} strokeWidth="1.5" opacity="0.5" />
        </svg>
      )

    case 'speedometer':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Main gauge arc - thicker */}
          <path d="M50,140 A55,55 0 1,1 150,140"
            stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />

          {/* Inner gauge track */}
          <path d="M60,138 A45,45 0 1,1 140,138"
            stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />

          {/* Tick marks - more detailed */}
          <line x1="55" y1="133" x2="62" y2="120" stroke={color} strokeWidth="2.5" opacity="0.6" />
          <line x1="70" y1="105" x2="75" y2="98" stroke={color} strokeWidth="2" opacity="0.5" />
          <line x1="85" y1="88" x2="88" y2="80" stroke={color} strokeWidth="2" opacity="0.5" />
          <line x1="100" y1="82" x2="100" y2="70" stroke={color} strokeWidth="3" opacity="0.7" />
          <line x1="115" y1="88" x2="112" y2="80" stroke={color} strokeWidth="2" opacity="0.5" />
          <line x1="130" y1="105" x2="125" y2="98" stroke={color} strokeWidth="2" opacity="0.5" />
          <line x1="145" y1="133" x2="138" y2="120" stroke={color} strokeWidth="2.5" opacity="0.6" />

          {/* Minor tick marks */}
          <line x1="62" y1="118" x2="66" y2="112" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="77" y1="95" x2="80" y2="90" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="92" y1="83" x2="94" y2="77" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="108" y1="83" x2="106" y2="77" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="123" y1="95" x2="120" y2="90" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="138" y1="118" x2="134" y2="112" stroke={color} strokeWidth="1" opacity="0.4" />

          {/* Needle */}
          <line x1="100" y1="140" x2="120" y2="98" stroke={color} strokeWidth="3" opacity="0.8" strokeLinecap="round" />

          {/* Center pivot */}
          <circle cx="100" cy="140" r="6" fill={color} opacity="0.8" />
          <circle cx="100" cy="140" r="3" fill="#fff" opacity="0.6" />

          {/* Speed indicator arc (filled portion) */}
          <path d="M50,140 A55,55 0 0,1 120,98"
            stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.3" />
        </svg>
      )

    case 'signal':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Central device/node */}
          <circle cx="100" cy="100" r="12" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7" />
          <circle cx="100" cy="100" r="6" fill={color} opacity="0.7" />

          {/* Signal waves radiating outward - left */}
          <path d="M75,85 Q68,100 75,115" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" />
          <path d="M60,75 Q48,100 60,125" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M45,65 Q28,100 45,135" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M30,55 Q8,100 30,145" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />

          {/* Signal waves radiating outward - right */}
          <path d="M125,85 Q132,100 125,115" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" />
          <path d="M140,75 Q152,100 140,125" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M155,65 Q172,100 155,135" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M170,55 Q192,100 170,145" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />

          {/* Connected nodes/devices around the center */}
          <circle cx="60" cy="60" r="5" fill={color} opacity="0.6" />
          <circle cx="140" cy="60" r="5" fill={color} opacity="0.6" />
          <circle cx="140" cy="140" r="5" fill={color} opacity="0.6" />
          <circle cx="60" cy="140" r="5" fill={color} opacity="0.6" />

          {/* Connection lines to satellite nodes */}
          <line x1="100" y1="100" x2="60" y2="60" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="140" y2="60" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="140" y2="140" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
          <line x1="100" y1="100" x2="60" y2="140" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />

          {/* Data packets traveling */}
          <circle cx="80" cy="80" r="2" fill={color} opacity="0.8" />
          <circle cx="120" cy="80" r="2" fill={color} opacity="0.8" />
          <circle cx="120" cy="120" r="2" fill={color} opacity="0.8" />
          <circle cx="80" cy="120" r="2" fill={color} opacity="0.8" />
        </svg>
      )

    case 'film':
      return (
        <svg style={baseStyle} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          {/* Main film strip frame */}
          <rect x="55" y="65" width="90" height="70" fill="none" stroke={color} strokeWidth="2.5" opacity="0.6" rx="3" />

          {/* Film frames */}
          <line x1="55" y1="88" x2="145" y2="88" stroke={color} strokeWidth="1.5" opacity="0.5" />
          <line x1="55" y1="112" x2="145" y2="112" stroke={color} strokeWidth="1.5" opacity="0.5" />
          <line x1="100" y1="65" x2="100" y2="135" stroke={color} strokeWidth="1" opacity="0.3" />

          {/* Left sprocket holes */}
          <rect x="60" y="70" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="60" y="85" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="60" y="100" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="60" y="115" width="5" height="10" fill={color} opacity="0.6" rx="1" />

          {/* Right sprocket holes */}
          <rect x="135" y="70" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="135" y="85" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="135" y="100" width="5" height="10" fill={color} opacity="0.6" rx="1" />
          <rect x="135" y="115" width="5" height="10" fill={color} opacity="0.6" rx="1" />

          {/* Play symbol - larger and more prominent */}
          <path d="M90,92 L115,100 L90,108 Z" fill={color} opacity="0.7" />
          <circle cx="100" cy="100" r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />

          {/* Recording indicator */}
          <circle cx="125" cy="75" r="4" fill={color} opacity="0.7" />
          <circle cx="125" cy="75" r="7" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />

          {/* Film reel decoration */}
          <circle cx="170" cy="45" r="10" fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
          <circle cx="170" cy="45" r="6" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="165" y1="40" x2="175" y2="50" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="165" y1="50" x2="175" y2="40" stroke={color} strokeWidth="1" opacity="0.3" />
        </svg>
      )

    default:
      return null
  }
}

export default function FeatureCard({ icon, title, description, delay = 0, color = 'purple', iconPosition = 'top', pattern = 'none' }: FeatureCardProps) {
  const c = palette[color]
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isIconHovered, setIsIconHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    setMousePosition({ x, y })
  }

  return (
    <motion.div
      className="feature-tile"
      style={{ background: c.card }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 + delay, ease: appleEase }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.25, ease: appleEase },
      }}
    >
      {/* BACKGROUND LAYER - Gradient mesh */}
      <motion.div
        className="feature-tile__bg-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: c.gradient,
          borderRadius: 'inherit',
          opacity: 0.6,
          zIndex: 0,
        }}
        animate={{
          x: isHovered ? mousePosition.x * 8 : 0,
          y: isHovered ? mousePosition.y * 8 : 0,
        }}
        transition={{ duration: 0.3, ease: appleEase }}
      />

      {/* CONTEXTUAL PATTERN LAYER */}
      <DecorativePattern pattern={pattern} color={c.iconFg} />

      {/* DECORATIVE ORBS */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: c.glow,
          filter: 'blur(50px)',
          opacity: 0.25,
          zIndex: 0,
        }}
        animate={{
          x: isHovered ? mousePosition.x * -12 : 0,
          y: isHovered ? mousePosition.y * -12 : 0,
        }}
        transition={{ duration: 0.4, ease: appleEase }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '20%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: c.glow,
          filter: 'blur(40px)',
          opacity: 0.2,
          zIndex: 0,
        }}
        animate={{
          x: isHovered ? mousePosition.x * -8 : 0,
          y: isHovered ? mousePosition.y * -8 : 0,
        }}
        transition={{ duration: 0.35, ease: appleEase }}
      />

      {iconPosition === 'top' ? (
        <>
          {/* MID-GROUND LAYER - Icon with depth & liquid glass */}
          <motion.div
            className="feature-tile__icon"
            style={{
              background: c.iconBg,
              color: c.iconFg,
              position: 'relative',
              zIndex: 2,
              marginBottom: '16px',
              marginTop: '0',
              border: `1px solid rgba(255, 255, 255, 0.3)`,
              boxShadow: isIconHovered
                ? `0 12px 48px ${c.glow.replace('0.4', '0.7')}, 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 0 60px ${c.glow.replace('0.4', '0.3')}`
                : `0 8px 32px ${c.glow}, 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2) inset`,
              filter: isIconHovered ? 'brightness(1.15)' : 'brightness(1)',
            }}
            animate={{
              x: isHovered ? mousePosition.x * 6 : 0,
              y: isHovered ? mousePosition.y * 6 : (isIconHovered ? -2 : 0),
              scale: isIconHovered ? 1.05 : 1,
              rotateY: isHovered ? mousePosition.x * 10 : 0,
              rotateX: isHovered ? -mousePosition.y * 10 : 0,
            }}
            transition={{ duration: 0.3, ease: appleEase }}
            onMouseEnter={() => setIsIconHovered(true)}
            onMouseLeave={() => setIsIconHovered(false)}
            aria-hidden="true"
          >
            {icon}
          </motion.div>

          {/* FOREGROUND LAYER - Title with elevation */}
          <motion.h3
            className="feature-tile__title"
            style={{
              position: 'relative',
              zIndex: 3,
              textShadow: `0 2px 8px ${c.glow}`,
            }}
            animate={{
              x: isHovered ? mousePosition.x * 4 : 0,
              y: isHovered ? mousePosition.y * 4 : 0,
            }}
            transition={{ duration: 0.25, ease: appleEase }}
          >
            {title}
          </motion.h3>
        </>
      ) : (
        <>
          {/* FOREGROUND LAYER - Title with elevation (top position) */}
          <motion.h3
            className="feature-tile__title"
            style={{
              position: 'relative',
              zIndex: 3,
              textShadow: `0 2px 8px ${c.glow}`,
              marginBottom: '16px',
            }}
            animate={{
              x: isHovered ? mousePosition.x * 4 : 0,
              y: isHovered ? mousePosition.y * 4 : 0,
            }}
            transition={{ duration: 0.25, ease: appleEase }}
          >
            {title}
          </motion.h3>

          {/* MID-GROUND LAYER - Icon with depth & liquid glass (bottom position) */}
          <motion.div
            className="feature-tile__icon"
            style={{
              background: c.iconBg,
              color: c.iconFg,
              position: 'relative',
              zIndex: 2,
              marginBottom: '0',
              marginTop: 'auto',
              border: `1px solid rgba(255, 255, 255, 0.3)`,
              boxShadow: isIconHovered
                ? `0 12px 48px ${c.glow.replace('0.4', '0.7')}, 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 0 60px ${c.glow.replace('0.4', '0.3')}`
                : `0 8px 32px ${c.glow}, 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2) inset`,
              filter: isIconHovered ? 'brightness(1.15)' : 'brightness(1)',
            }}
            animate={{
              x: isHovered ? mousePosition.x * 6 : 0,
              y: isHovered ? mousePosition.y * 6 : (isIconHovered ? -2 : 0),
              scale: isIconHovered ? 1.05 : 1,
              rotateY: isHovered ? mousePosition.x * 10 : 0,
              rotateX: isHovered ? -mousePosition.y * 10 : 0,
            }}
            transition={{ duration: 0.3, ease: appleEase }}
            onMouseEnter={() => setIsIconHovered(true)}
            onMouseLeave={() => setIsIconHovered(false)}
            aria-hidden="true"
          >
            {icon}
          </motion.div>
        </>
      )}

      <p className="feature-tile__desc">{description}</p>
    </motion.div>
  )
}
