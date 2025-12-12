// Design System for Parkinson's Disease Patients
// Focus: Large touch targets, high contrast, simple navigation

export const ACCESSIBILITY = {
  // Font Sizes - Larger for easier reading
  fontSize: {
    base: '16px',      // Normal mode
    large: '18px',     // Accessibility mode
    xl: '20px',        // Maximum accessibility
  },

  // Touch Targets - Minimum 48px for motor control issues
  touchTarget: {
    min: '48px',       // Minimum tap target
    comfortable: '56px', // Comfortable size
    large: '64px',     // Large buttons for main actions
  },

  // Spacing - Generous to prevent mis-taps
  spacing: {
    tight: '12px',
    normal: '16px',
    comfortable: '24px',
    loose: '32px',
  },

  // Colors - High contrast for visibility
  colors: {
    primary: '#2563eb',      // Blue - strong contrast
    success: '#16a34a',      // Green
    warning: '#f59e0b',      // Orange
    danger: '#dc2626',       // Red
    text: {
      primary: '#111827',    // Near black
      secondary: '#4b5563',  // Medium gray
    },
    background: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
    }
  },

  // Border Radius - Gentle curves, not too sharp
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },

  // Transitions - Reduced motion for those sensitive
  transitions: {
    none: 'none',
    reduced: 'all 150ms ease',
    normal: 'all 200ms ease',
  },

  // Breakpoints
  breakpoints: {
    mobile: '640px',   // sm
    tablet: '768px',   // md
    desktop: '1024px', // lg
    wide: '1280px',    // xl
  }
} as const;

// Accessibility Mode Settings
export const ACCESSIBILITY_MODES = {
  NORMAL: 'normal',
  LARGE_TEXT: 'large-text',
  HIGH_CONTRAST: 'high-contrast',
  SIMPLIFIED: 'simplified',
} as const;

export type AccessibilityMode = typeof ACCESSIBILITY_MODES[keyof typeof ACCESSIBILITY_MODES];
