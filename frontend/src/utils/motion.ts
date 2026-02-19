/**
 * Framer Motion Animation Variants
 * Vision OS-inspired motion patterns for React components
 * 
 * Usage:
 * import { fadeInUp, staggerContainer } from '@/utils/motion'
 * 
 * <motion.div variants={fadeInUp} initial="initial" animate="animate">
 *   Content
 * </motion.div>
 */

import type { Variant, Transition } from 'framer-motion'

/**
 * Type definitions for better TypeScript support
 */
export interface AnimationVariants {
  initial: Variant
  animate: Variant
  exit?: Variant
  transition?: Transition
}

/**
 * Apple's signature easing curves
 */
export const easings = {
  // Standard easing (most common)
  default: [0.4, 0, 0.2, 1],

  // Apple's signature smooth easing
  smooth: [0.16, 1, 0.3, 1],

  // Spring-like bounce
  spring: [0.34, 1.56, 0.64, 1],

  // Vision OS page transitions
  visionOS: [0.32, 0.72, 0, 1],

  // Ease in
  in: [0.4, 0, 1, 1],

  // Ease out
  out: [0, 0, 0.2, 1],
} as const

/**
 * Spring physics presets
 */
export const springs = {
  // Gentle spring (UI elements, cards)
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },

  // Bouncy spring (playful interactions)
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
    mass: 0.5,
  },

  // Stiff spring (quick, snappy)
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6,
  },

  // Soft spring (smooth, slow)
  soft: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 35,
    mass: 1,
  },
}

/**
 * ═══════════════════════════════════════════════════
 * ENTRANCE ANIMATIONS
 * ═══════════════════════════════════════════════════
 */

/**
 * Fade in with upward movement
 * Use for: Hero text, cards, content sections
 */
export const fadeInUp: AnimationVariants = {
  initial: {
    opacity: 0,
    y: 40
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    duration: 0.6,
    ease: easings.default
  },
}

/**
 * Fade in with downward movement
 * Use for: Dropdowns, tooltips, popovers
 */
export const fadeInDown: AnimationVariants = {
  initial: {
    opacity: 0,
    y: -20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    duration: 0.4,
    ease: easings.smooth
  },
}

/**
 * Fade in with leftward movement
 * Use for: Sidebar content, cards entering from right
 */
export const fadeInLeft: AnimationVariants = {
  initial: {
    opacity: 0,
    x: 40
  },
  animate: {
    opacity: 1,
    x: 0
  },
  transition: {
    duration: 0.5,
    ease: easings.smooth
  },
}

/**
 * Fade in with rightward movement
 * Use for: Side panels, notifications entering from left
 */
export const fadeInRight: AnimationVariants = {
  initial: {
    opacity: 0,
    x: -40
  },
  animate: {
    opacity: 1,
    x: 0
  },
  transition: {
    duration: 0.5,
    ease: easings.smooth
  },
}

/**
 * Scale in (zoom effect)
 * Use for: Buttons, modals, important alerts
 */
export const scaleIn: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1
  },
  transition: {
    duration: 0.4,
    ease: easings.default
  },
}

/**
 * Scale in with bounce
 * Use for: Success indicators, achievements, highlights
 */
export const scaleInBounce: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0
  },
  animate: {
    opacity: 1,
    scale: 1
  },
  transition: {
    duration: 0.5,
    ease: easings.spring
  },
}

/**
 * ═══════════════════════════════════════════════════
 * STAGGER ANIMATIONS (Parent Container Variants)
 * ═══════════════════════════════════════════════════
 */

/**
 * Stagger container - animates children with delay
 * Use for: Lists, grids, card containers
 * 
 * Usage:
 * <motion.div variants={staggerContainer} initial="initial" animate="animate">
 *   <motion.div variants={fadeInUp}>Child 1</motion.div>
 *   <motion.div variants={fadeInUp}>Child 2</motion.div>
 * </motion.div>
 */
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

/**
 * Stagger container - fast
 * Use for: Small lists, pills, badges
 */
export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

/**
 * Stagger container - slow
 * Use for: Hero sections, important content
 */
export const staggerContainerSlow = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

/**
 * ═══════════════════════════════════════════════════
 * CONTINUOUS ANIMATIONS
 * ═══════════════════════════════════════════════════
 */

/**
 * Float animation (gentle vertical bob)
 * Use for: Decorative elements, hero graphics, icons
 */
export const floatAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Float animation - slow
 * Use for: Background elements, large decorations
 */
export const floatAnimationSlow = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Pulse animation (scale breathing)
 * Use for: Live indicators, attention elements
 */
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Rotate animation (spinning)
 * Use for: Loading spinners, refresh icons
 */
export const rotateAnimation = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

/**
 * ═══════════════════════════════════════════════════
 * HOVER ANIMATIONS
 * ═══════════════════════════════════════════════════
 */

/**
 * Lift on hover
 * Use for: Cards, buttons, interactive elements
 */
export const hoverLift = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: easings.out,
    },
  },
}

/**
 * Scale on hover
 * Use for: Images, media, clickable items
 */
export const hoverScale = {
  rest: {
    scale: 1
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: easings.smooth,
    },
  },
}

/**
 * Glow on hover
 * Use for: Glass cards, buttons with effects
 */
export const hoverGlow = {
  rest: {
    boxShadow: '0 0 0 rgba(255, 255, 255, 0)'
  },
  hover: {
    boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
    transition: {
      duration: 0.3
    },
  },
}

/**
 * 3D tilt on hover (parallax effect)
 * Use for: Premium cards, hero elements
 */
export const tiltOnHover = {
  rest: {
    rotateX: 0,
    rotateY: 0
  },
  hover: {
    rotateX: 5,
    rotateY: 5,
    transition: {
      duration: 0.3
    },
  },
}

/**
 * ═══════════════════════════════════════════════════
 * TAP/PRESS ANIMATIONS
 * ═══════════════════════════════════════════════════
 */

/**
 * Button press (scale down)
 * Use for: Buttons, clickable cards
 */
export const tapScale = {
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    },
  },
}

/**
 * Icon bounce on tap
 * Use for: Icon buttons, small interactive elements
 */
export const tapBounce = {
  tap: {
    scale: [1, 0.9, 1.1, 1],
    transition: {
      duration: 0.3
    },
  },
}

/**
 * ═══════════════════════════════════════════════════
 * COMPONENT-SPECIFIC VARIANTS
 * ═══════════════════════════════════════════════════
 */

/**
 * Modal/Dialog entrance
 * Use for: Modals, dialogs, overlays
 */
export const modalVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  transition: {
    duration: 0.3,
    ease: easings.smooth
  },
}

/**
 * Backdrop fade
 * Use for: Modal backdrops, overlays
 */
export const backdropVariants: AnimationVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  },
  transition: {
    duration: 0.2
  },
}

/**
 * Notification slide in from top
 * Use for: Toasts, alerts, notifications
 */
export const notificationVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.95
  },
  transition: {
    duration: 0.4,
    ease: easings.smooth
  },
}

/**
 * Sidebar slide in
 * Use for: Sidebars, navigation drawers
 */
export const sidebarVariants: AnimationVariants = {
  initial: {
    x: -300,
    opacity: 0
  },
  animate: {
    x: 0,
    opacity: 1
  },
  exit: {
    x: -300,
    opacity: 0
  },
  transition: {
    duration: 0.3,
    ease: easings.smooth
  },
}

/**
 * Dropdown menu
 * Use for: Dropdown menus, select options
 */
export const dropdownVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    y: -10,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95
  },
  transition: {
    duration: 0.2,
    ease: easings.out
  },
}

/**
 * ═══════════════════════════════════════════════════
 * PAGE TRANSITION VARIANTS
 * ═══════════════════════════════════════════════════
 */

/**
 * Page slide transition (Vision OS style)
 * Use for: Page navigation, route changes
 */
export const pageSlide: AnimationVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.96,
  },
  transition: {
    duration: 0.5,
    ease: easings.visionOS,
  },
}

/**
 * Page fade transition
 * Use for: Same-context page changes
 */
export const pageFade: AnimationVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
  transition: {
    duration: 0.3,
  },
}

/**
 * ═══════════════════════════════════════════════════
 * UTILITY FUNCTIONS
 * ═══════════════════════════════════════════════════
 */

/**
 * Create custom stagger with specified delay
 */
export const createStagger = (staggerDelay: number, childrenDelay = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: childrenDelay,
    },
  },
})

/**
 * Create custom fade with direction
 */
export const createFade = (direction: 'up' | 'down' | 'left' | 'right', distance = 40) => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x'
  const value = direction === 'up' || direction === 'left' ? distance : -distance

  return {
    initial: {
      opacity: 0,
      [axis]: value
    },
    animate: {
      opacity: 1,
      [axis]: 0
    },
    transition: {
      duration: 0.5,
      ease: easings.smooth
    },
  }
}

/**
 * Create custom spring animation
 */
export const createSpring = (property: string, values: (number | string)[], duration = 2) => ({
  animate: {
    [property]: values,
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
})
