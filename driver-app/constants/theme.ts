/**
 * OnboardRash Design System — visionOS Theme for React Native
 * 
 * Mirrors the web frontend's design-system.css tokens for consistent
 * Apple visionOS "Spatial Glass" aesthetics across platforms.
 */

export const theme = {
  // ─── Background ────────────────────────────────────────
  colors: {
    bgBase: '#ede8ff',

    // Glass materials (4-tier system) — near-transparent on iOS (BlurView provides the frost)
    // On Android these are used as actual backgrounds since BlurView blur is weak
    glassTier0: 'rgba(255, 255, 255, 0.08)',
    glassTier0Hover: 'rgba(255, 255, 255, 0.14)',
    glassTier1: 'rgba(255, 255, 255, 0.06)',
    glassTier1Hover: 'rgba(255, 255, 255, 0.12)',
    glassTier2: 'rgba(255, 255, 255, 0.04)',
    glassTier2Hover: 'rgba(255, 255, 255, 0.10)',
    glassTier3: 'rgba(255, 255, 255, 0.60)',
    // Android: tinted translucent — no BlurView, must rely on real background showing through.
    // Pure white rgba causes a white panel. Use lavender tint at low opacity instead.
    glassTier0Android: 'rgba(210, 195, 255, 0.38)',
    glassTier1Android: 'rgba(210, 195, 255, 0.28)',
    glassTier2Android: 'rgba(210, 195, 255, 0.20)',

    // Text hierarchy (dark text on light bg)
    textPrimary: 'rgba(0, 0, 0, 0.95)',
    textSecondary: 'rgba(0, 0, 0, 0.70)',
    textTertiary: 'rgba(0, 0, 0, 0.50)',
    textQuaternary: 'rgba(0, 0, 0, 0.30)',

    // Semantic colors
    safe: '#34d399',
    safeBg: 'rgba(52, 211, 153, 0.12)',
    safeText: '#047857',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.12)',
    warningText: '#92400e',
    danger: '#f87171',
    dangerBg: 'rgba(248, 113, 113, 0.12)',
    dangerText: '#b91c1c',
    info: '#60a5fa',
    infoBg: 'rgba(96, 165, 250, 0.12)',
    infoText: '#1d4ed8',

    // Gradient endpoints for score arc
    gradientEndSafe: '#6ee7b7',
    gradientEndWarning: '#fde68a',
    gradientEndDanger: '#fca5a5',

    // Utility
    divider: 'rgba(0, 0, 0, 0.06)',
    modalOverlay: 'rgba(0, 0, 0, 0.35)',

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

    // Button variant backgrounds
    primaryBg: 'rgba(52, 211, 153, 0.25)',
    dangerBtnBg: 'rgba(248, 113, 113, 0.25)',

    // 5th orb (aqua green)
    orbGreen: 'rgba(80, 220, 180, 0.30)',
    orbGreenFade: 'rgba(100, 230, 190, 0.10)',

    // Shimmer / skeleton loader
    shimmerBase: 'rgba(255, 255, 255, 0.08)',
    shimmerHighlight: 'rgba(255, 255, 255, 0.28)',

    // Inner shadow for glass depth
    innerShadow: 'rgba(0, 0, 0, 0.04)',
    innerShadowMd: 'rgba(0, 0, 0, 0.07)',

    // Button press flash
    pressOverlay: 'rgba(255, 255, 255, 0.15)',

    // Glass border gradient sim (bottom edge)
    glassBorderDark: 'rgba(0, 0, 0, 0.04)',
  },

  // ─── Icon Sizes ────────────────────────────────────────
  iconSize: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
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

  // ─── Animation Spring Presets ──────────────────────────
  spring: {
    press: { damping: 15, stiffness: 300, mass: 0.8 },
    bounce: { damping: 12, stiffness: 150 },
    smooth: { damping: 20, stiffness: 200 },
    snappy: { damping: 18, stiffness: 250 },
    gentle: { damping: 22, stiffness: 120 },
  },

  // ─── Breathe Timing Presets ────────────────────────────
  breathe: {
    slow: 3000,
    medium: 2000,
    fast: 1500,
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
