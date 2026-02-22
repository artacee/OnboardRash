/**
 * OnboardRash Design System — visionOS Theme for React Native
 * 
 * Mirrors the web frontend's design-system.css tokens for consistent
 * Apple visionOS "Spatial Glass" aesthetics across platforms.
 */

export const theme = {
  // ─── Background ────────────────────────────────────────
  colors: {
    bgBase: '#f5f7fa',

    // Glass materials (4-tier system)
    glassTier0: 'rgba(255, 255, 255, 0.48)',
    glassTier0Hover: 'rgba(255, 255, 255, 0.58)',
    glassTier1: 'rgba(255, 255, 255, 0.38)',
    glassTier1Hover: 'rgba(255, 255, 255, 0.50)',
    glassTier2: 'rgba(255, 255, 255, 0.28)',
    glassTier2Hover: 'rgba(255, 255, 255, 0.40)',
    glassTier3: 'rgba(255, 255, 255, 0.60)',

    // Text hierarchy (dark text on light bg)
    textPrimary: 'rgba(0, 0, 0, 0.95)',
    textSecondary: 'rgba(0, 0, 0, 0.70)',
    textTertiary: 'rgba(0, 0, 0, 0.50)',
    textQuaternary: 'rgba(0, 0, 0, 0.30)',

    // Semantic colors
    safe: '#34d399',
    safeBg: 'rgba(52, 211, 153, 0.12)',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.12)',
    danger: '#f87171',
    dangerBg: 'rgba(248, 113, 113, 0.12)',
    info: '#60a5fa',
    infoBg: 'rgba(96, 165, 250, 0.12)',

    // Borders
    glassBorder: 'rgba(255, 255, 255, 0.35)',
    glassBorderLight: 'rgba(255, 255, 255, 0.55)',

    // Orb gradients (for animated background)
    orbPurple: 'rgba(120, 80, 220, 0.55)',
    orbPurpleFade: 'rgba(140, 100, 230, 0.15)',
    orbPink: 'rgba(255, 120, 170, 0.50)',
    orbPinkFade: 'rgba(255, 160, 200, 0.10)',
    orbCyan: 'rgba(60, 190, 255, 0.50)',
    orbCyanFade: 'rgba(100, 210, 255, 0.10)',
    orbAmber: 'rgba(255, 200, 80, 0.45)',
    orbAmberFade: 'rgba(255, 220, 140, 0.10)',

    white: '#ffffff',
    black: '#000000',
  },

  // ─── Border Radius ─────────────────────────────────────
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    full: 9999,
  },

  // ─── Spacing (4px base) ────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
    '6xl': 80,
  },

  // ─── Typography ────────────────────────────────────────
  fonts: {
    body: 'Inter_500Medium',
    headline: 'Inter_600SemiBold',
    title: 'Inter_700Bold',
    display: 'Inter_800ExtraBold',
  },

  fontSize: {
    caption: 12,
    footnote: 13,
    callout: 15,
    body: 16,
    title3: 20,
    title2: 24,
    title1: 32,
    display2: 40,
    display1: 56,
  },

  fontWeight: {
    body: '500' as const,
    headline: '600' as const,
    title: '700' as const,
    display: '800' as const,
  },

  // ─── Shadows (elevation levels) ────────────────────────
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.10,
      shadowRadius: 40,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.12,
      shadowRadius: 60,
      elevation: 8,
    },
    pageWindow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 32 },
      shadowOpacity: 0.10,
      shadowRadius: 80,
      elevation: 10,
    },
  },

  // ─── Animation Timing ──────────────────────────────────
  timing: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 500,
    dramatic: 800,
  },
} as const;

// Severity color mapping
export const severityColors = {
  HIGH: { color: theme.colors.danger, bg: theme.colors.dangerBg },
  MEDIUM: { color: theme.colors.warning, bg: theme.colors.warningBg },
  LOW: { color: theme.colors.safe, bg: theme.colors.safeBg },
} as const;

// Event type labels
export const eventTypeLabels: Record<string, string> = {
  HARSH_BRAKE: 'Harsh Braking',
  HARSH_ACCEL: 'Harsh Acceleration',
  AGGRESSIVE_TURN: 'Aggressive Turn',
  TAILGATING: 'Tailgating',
  CLOSE_OVERTAKING: 'Close Overtaking',
};
