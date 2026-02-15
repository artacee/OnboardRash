import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS v4 Configuration
 * 
 * With Tailwind v4, most configuration is done via CSS @theme directive.
 * This config mainly defines content paths for class detection.
 */
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Design system colors are defined in CSS variables
      // and referenced via var(--color-name) in components
      colors: {
        // Map Tailwind color names to our CSS variables
        'glass-primary': 'var(--glass-t1-bg)',
        'glass-secondary': 'var(--glass-t2-bg)',
        'glass-overlay': 'var(--glass-t3-bg)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        // Map to our design system spacing scale
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'sm': 'var(--shadow-2)',
        'md': 'var(--shadow-3)',
        'lg': 'var(--shadow-4)',
        'xl': 'var(--shadow-5)',
        '2xl': 'var(--shadow-6)',
        'page-window': 'var(--shadow-0-page-window)',
      },
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'dramatic': 'var(--duration-dramatic)',
      },
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'smooth': 'var(--ease-smooth)',
        'spring': 'var(--ease-spring)',
      },
    },
  },
  plugins: [],
}

export default config
