/**
 * Vision OS Page Transition System
 * 
 * Three transition styles for spatial window management:
 * 1. SLIDE - Window slides in from right (default for navigation)
 * 2. SCALE - Window scales up from center (for modals/overlays)
 * 3. FADE_SLIDE - Combination of fade + subtle slide (for similar pages)
 */

import type { Variants } from 'framer-motion'

// Default: Slide transition (feels like pushing windows)
export const slideTransition: Variants = {
    initial: {
        opacity: 0,
        x: 100,
        scale: 0.96,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.32, 0.72, 0, 1],
        }
    },
    exit: {
        opacity: 0,
        x: -100,
        scale: 0.96,
        transition: {
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1],
        }
    }
}

// Scale transition (feels like bringing window to front)
export const scaleTransition: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
        y: 40,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: [0.32, 0.72, 0, 1],
        }
    },
    exit: {
        opacity: 0,
        scale: 1.05,
        transition: {
            duration: 0.3,
            ease: [0.32, 0.72, 0, 1],
        }
    }
}

// Fade + subtle slide (feels like window layering)
export const fadeSlideTransition: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
        }
    },
    exit: {
        opacity: 0,
        y: -20,
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
