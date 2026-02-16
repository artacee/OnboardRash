/**
 * useLenis Hook — Smooth Scroll Implementation
 * 
 * Initializes Lenis smooth scrolling with Vision OS-style buttery feel.
 * Default config per frontend_implementation_guide.md:
 * - lerp: 0.08 (interpolation factor for smoothness)
 * - duration: 1.4 (scroll animation duration in seconds)
 * 
 * @see https://lenis.studiofreight.com/
 */

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

export interface LenisConfig {
  /** Interpolation factor (0-1). Lower = smoother. Default: 0.08 */
  lerp?: number
  /** Scroll animation duration in seconds. Default: 1.4 */
  duration?: number
  /** Scroll orientation. Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Gesture orientation. Default: 'vertical' */
  gestureOrientation?: 'vertical' | 'horizontal' | 'both'
  /** Smoothness multiplier. Default: 1 */
  smoothWheel?: boolean
  /** Touch multiplier for touch devices. Default: 2 */
  touchMultiplier?: number
  /** Infinite scroll. Default: false */
  infinite?: boolean
}

/** Default Lenis configuration per implementation guide */
const DEFAULT_CONFIG: LenisConfig = {
  lerp: 0.08,
  duration: 1.4,
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  touchMultiplier: 2,
  infinite: false,
}

/**
 * Hook for initializing Lenis smooth scroll
 * 
 * @param config - Optional Lenis configuration overrides
 * @returns The Lenis instance (or null before initialization)
 * 
 * @example
 * ```tsx
 * // Basic usage with defaults
 * useLenis()
 * 
 * // Custom configuration
 * useLenis({ lerp: 0.1, duration: 1.2 })
 * 
 * // Access instance for programmatic control
 * const lenis = useLenis()
 * lenis?.scrollTo('#section')
 * ```
 */
export function useLenis(config: LenisConfig = {}): Lenis | null {
  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Merge user config with defaults
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }

    // Initialize Lenis
    const lenis = new Lenis({
      lerp: mergedConfig.lerp,
      duration: mergedConfig.duration,
      orientation: mergedConfig.orientation,
      gestureOrientation: mergedConfig.gestureOrientation,
      smoothWheel: mergedConfig.smoothWheel,
      touchMultiplier: mergedConfig.touchMultiplier,
      infinite: mergedConfig.infinite,
    })

    lenisRef.current = lenis

    // RAF loop for smooth updates
    function raf(time: number) {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }

    // Start the animation loop
    rafRef.current = requestAnimationFrame(raf)

    // Cleanup on unmount
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lenis.destroy()
      lenisRef.current = null
    }
  }, [
    config.lerp,
    config.duration,
    config.orientation,
    config.gestureOrientation,
    config.smoothWheel,
    config.touchMultiplier,
    config.infinite,
  ])

  return lenisRef.current
}

export default useLenis
