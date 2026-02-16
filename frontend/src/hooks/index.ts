/**
 * Hooks Barrel Export
 * 
 * Central export point for all custom hooks.
 * Import hooks using: import { hookName } from '@/hooks'
 */

// Smooth scroll
export { useLenis } from './useLenis'
export type { LenisConfig } from './useLenis'

// Mouse parallax
export { useMouseParallax } from './useMouseParallax'
export type { MouseParallaxValues, MouseParallaxConfig } from './useMouseParallax'

// WebSocket connection
export { useSocketIO } from './useSocketIO'

// Audio alerts
export { useAudioAlert } from './useAudioAlert'

// Cursor-reactive tilt
export { useTilt } from './useTilt'
export type { TiltConfig, TiltResult } from './useTilt'
