/**
 * AnimatedPage — Vision OS page transition wrapper
 * 
 * Wraps each route to apply spatial window transitions
 * using the variants defined in utils/pageTransitions.ts.
 * 
 * Three transition styles:
 * - slide: Window slides in from right (default for navigation)
 * - scale: Window scales up from center (for modals/overlays)
 * - fade-slide: Combo of fade + subtle slide (for similar pages)
 */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
    slideTransition,
    scaleTransition,
    fadeSlideTransition
} from '@/utils/pageTransitions'

interface AnimatedPageProps {
    children: ReactNode
    transition?: 'slide' | 'scale' | 'fade-slide'
}

export default function AnimatedPage({
    children,
    transition = 'slide'
}: AnimatedPageProps) {
    const variants = transition === 'slide'
        ? slideTransition
        : transition === 'scale'
            ? scaleTransition
            : fadeSlideTransition

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    )
}
