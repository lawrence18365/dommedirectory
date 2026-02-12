/**
 * Design Tokens for DommeDirectory
 * Centralized design constants for consistent UI/UX
 */

export const colors = {
  // Background colors
  background: {
    primary: '#0a0a0a',      // Main page background
    secondary: '#0d0d0d',    // Header, nav bars
    tertiary: '#141414',     // Elevated surfaces
    card: '#1a1a1a',         // Cards, panels
    input: '#262626',        // Form inputs
    hover: '#1f1f1f',        // Hover states
  },
  
  // Accent colors (Primary: Red)
  accent: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',  // Primary accent
    700: '#b91c1c',  // Hover state
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',    // gray-400
    muted: '#6b7280',        // gray-500
    disabled: '#4b5563',     // gray-600
  },
  
  // Border colors
  border: {
    default: '#1f1f1f',
    hover: '#374151',        // gray-700
    focus: '#dc2626',        // red-600
  },
  
  // Status colors
  status: {
    success: '#22c55e',      // green-500
    warning: '#eab308',      // yellow-500
    error: '#dc2626',        // red-600
    info: '#3b82f6',         // blue-500
    online: '#22c55e',       // green-500
    offline: '#6b7280',      // gray-500
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};

export const typography = {
  fontFamily: {
    heading: ['Cinzel', 'Georgia', 'serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  glow: '0 0 20px -5px rgba(220, 38, 38, 0.4)',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Component-specific styles
export const components = {
  button: {
    primary: {
      background: colors.accent[600],
      text: colors.text.primary,
      hoverBackground: colors.accent[700],
      padding: `${spacing[2]} ${spacing[4]}`,
      borderRadius: borderRadius.lg,
    },
    secondary: {
      background: colors.background.card,
      text: colors.text.primary,
      border: `1px solid ${colors.border.hover}`,
      hoverBackground: colors.background.hover,
    },
    ghost: {
      background: 'transparent',
      text: colors.text.secondary,
      hoverText: colors.text.primary,
    },
  },
  
  card: {
    background: colors.background.card,
    border: `1px solid ${colors.border.default}`,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
  },
  
  input: {
    background: colors.background.input,
    text: colors.text.primary,
    placeholder: colors.text.muted,
    border: '1px solid transparent',
    borderRadius: borderRadius.md,
    padding: `${spacing[3]} ${spacing[4]}`,
    focusBorder: colors.accent[600],
  },
  
  badge: {
    default: {
      background: colors.background.hover,
      text: colors.text.secondary,
      border: `1px solid ${colors.border.default}`,
    },
    primary: {
      background: colors.accent[600],
      text: colors.text.primary,
    },
    success: {
      background: `${colors.status.success}20`,
      text: colors.status.success,
      border: `${colors.status.success}30`,
    },
  },
};

// Layout constants
export const layout = {
  maxWidth: '1920px',
  headerHeight: '3.5rem',  // 56px
  sidebarWidth: '16rem',   // 256px
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  tooltip: 1800,
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  components,
  layout,
  zIndex,
};
