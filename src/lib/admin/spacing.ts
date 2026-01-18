/**
 * Consistent spacing utilities for admin pages
 * Based on 4px base unit
 */

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    base: '1rem',    // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
} as const

export const typography = {
    heading: {
        h1: 'text-2xl sm:text-3xl',
        h2: 'text-xl sm:text-2xl',
        h3: 'text-lg sm:text-xl',
        h4: 'text-base sm:text-lg',
    },
    body: {
        large: 'text-base sm:text-lg',
        base: 'text-sm sm:text-base',
        small: 'text-xs sm:text-sm',
        tiny: 'text-xs',
    },
    colors: {
        primary: 'text-white',
        secondary: 'text-white/60',
        tertiary: 'text-white/40',
        muted: 'text-white/30',
    },
} as const
