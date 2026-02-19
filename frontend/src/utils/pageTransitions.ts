/**
 * Vision OS Page Transition System
 * 
 * Three transition styles for spatial window management:
 * 1. SLIDE - Window slides in from right (default for navigation)
 * 2. SCALE - Window scales up from center (for modals/overlays)
 * 3. FADE_SLIDE - Combination of fade + subtle slide (for similar pages)
 */

import type { Variants } from 'framer-motion'

// Default: Spatial Float-In (Vision OS style)
// Instead of sliding, window scales up and fades in from depth
export const slideTransition: Variants = {
    initial: {
        opacity: 0,
        scale: 0.96,
        y: 10,
        filter: 'blur(10px)', // Spatial depth cue
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.5,
            ease: [0.2, 0.8, 0.2, 1], // "Floaty" ease
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        filter: 'blur(10px)',
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        }
    }
}

// Scale transition (coming from background)
export const scaleTransition: Variants = {
    initial: {
        opacity: 0,
        scale: 0.85,
        y: 30,
        filter: 'blur(12px)'
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1], // Spring-like expansion
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        filter: 'blur(12px)',
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        }
    }
}

// Fade + scale (subtle layering)
export const fadeSlideTransition: Variants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        filter: 'blur(4px)'
    },
    animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        filter: 'blur(4px)',
        transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
        }
    }
}

// Spring physics config (for interactive transitions)
export const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
}
