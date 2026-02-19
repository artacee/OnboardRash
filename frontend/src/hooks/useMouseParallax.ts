/**
 * useMouseParallax Hook — Mouse-driven Parallax Effect
 * 
 * Tracks mouse position and returns motion values for parallax animations.
 * Per frontend_implementation_guide.md:
 * - Max displacement: 15px default
 * - Floating glass cards respond to mouse movement
 * - Values can be multiplied for layered depth effect
 * 
 * @example
 * ```tsx
 * const mouseParallax = useMouseParallax(15)
 * 
 * // Apply to floating elements with different multipliers for depth
 * <motion.div style={{ x: mouseParallax.x * 1.5, y: mouseParallax.y * 1.5 }} />
 * <motion.div style={{ x: mouseParallax.x * -1.2, y: mouseParallax.y * -1.2 }} />
 * ```
 */

import { useEffect } from 'react'
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion'

export interface MouseParallaxValues {
  /** Horizontal offset motion value (px) */
  x: MotionValue<number>
  /** Vertical offset motion value (px) */
  y: MotionValue<number>
}

export interface MouseParallaxConfig {
  /** Spring stiffness. Higher = snappier response. Default: 150 */
  stiffness?: number
  /** Spring damping. Higher = less oscillation. Default: 20 */
  damping?: number
  /** Spring mass. Higher = more inertia. Default: 1 */
  mass?: number
}

/** Default spring config for smooth parallax feel */
const DEFAULT_SPRING_CONFIG: MouseParallaxConfig = {
  stiffness: 150,
  damping: 20,
  mass: 1,
}

/**
 * Hook for creating mouse-driven parallax effects
 * 
 * @param maxDisplacement - Maximum pixel displacement from center (default: 15)
 * @param config - Optional spring physics configuration
 * @returns Object with x and y MotionValues for use in Framer Motion
 * 
 * @example
 * ```tsx
 * // Basic usage with 15px max displacement
 * const parallax = useMouseParallax(15)
 * 
 * // Custom spring physics
 * const parallax = useMouseParallax(20, { stiffness: 100, damping: 15 })
 * 
 * // Apply to element with multiplier for depth
 * <motion.div
 *   style={{
 *     x: parallax.x * 1.5,  // 1.5x effect
 *     y: parallax.y * 1.5,
 *   }}
 * />
 * ```
 */
export function useMouseParallax(
  maxDisplacement = 15,
  config: MouseParallaxConfig = {}
): MouseParallaxValues {
  // Merge config with defaults
  const springConfig = { ...DEFAULT_SPRING_CONFIG, ...config }

  // Raw motion values (updated on mouse move)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smoothed spring values for buttery animation
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  useEffect(() => {
    // Handle mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      // Get viewport dimensions
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window

      // Calculate position relative to center (-0.5 to 0.5)
      const xPercent = (clientX / innerWidth) - 0.5
      const yPercent = (clientY / innerHeight) - 0.5

      // Scale to max displacement
      const x = xPercent * maxDisplacement * 2
      const y = yPercent * maxDisplacement * 2

      // Update motion values
      mouseX.set(x)
      mouseY.set(y)
    }

    // Handle mouse leaving viewport (reset to center)
    const handleMouseLeave = () => {
      mouseX.set(0)
      mouseY.set(0)
    }

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [maxDisplacement, mouseX, mouseY])

  return {
    x: springX,
    y: springY,
  }
}

export default useMouseParallax
