// Theme-aware CSS-variable colour that still supports Tailwind opacity modifiers (e.g. bg-ctp-accent/20).
const ctpVar = (name) => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? `var(${name})`
    : `color-mix(in srgb, var(${name}) ${Math.round(Number(opacityValue) * 100)}%, transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // v2 redesign tokens (theme-aware CSS variables, see index.css)
        ctp: {
          bg: ctpVar('--ctp-bg'),
          surface: ctpVar('--ctp-surface'),
          'surface-2': ctpVar('--ctp-surface-2'),
          border: ctpVar('--ctp-border'),
          'border-strong': ctpVar('--ctp-border-strong'),
          text: ctpVar('--ctp-text'),
          'text-2': ctpVar('--ctp-text-2'),
          muted: ctpVar('--ctp-text-muted'),
          accent: ctpVar('--ctp-accent'),
          'accent-ink': ctpVar('--ctp-accent-ink'),
          safe: ctpVar('--ctp-safe'),
          warn: ctpVar('--ctp-warn'),
          danger: ctpVar('--ctp-danger'),
        },
        // Sophisticated White & Blue Design System
        brand: {
          bg: '#FFFFFF',
          secondary: '#F5F9FF',
          blue: '#2563EB',
          deepBlue: '#1E40AF',
          lightBlue: '#DBEAFE',
          textPrimary: '#111827',
          textSecondary: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dim: '#F5F9FF',
          bright: '#FFFFFF',
          lowest: '#FFFFFF',
          low: '#F5F9FF',
          container: '#FFFFFF',
          high: '#F8FAFC',
          highest: '#F1F5F9',
          variant: '#E2E8F0',
        },
        'on-surface': {
          DEFAULT: '#111827',
          variant: '#64748B',
        },
        outline: {
          DEFAULT: '#E2E8F0',
          variant: '#DBEAFE',
        },
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#64748B',
          container: '#F5F9FF',
        },
        // Legacy compatibility mappings updated to light palette
        mono: {
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#F8FAFC',
          border: '#E2E8F0',
          borderHover: '#DBEAFE',
          primary: '#111827',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        shadow: {
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F8FAFC',
          border: '#E2E8F0',
          primary: '#2563EB',
          secondary: '#64748B',
          muted: '#94A3B8',
          orange: '#2563EB',
          safe: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
        cyber: {
          dark: '#F5F9FF',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          border: '#E2E8F0',
          borderHover: '#BFDBFE',
          accent: '#2563EB',
          accentLight: '#3B82F6',
          accentGlow: 'rgba(37, 99, 235, 0.12)',
          safe: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          text: '#111827',
          textMuted: '#64748B',
          textSecondary: '#64748B',
        }
      },
      borderRadius: {
        'DEFAULT': '0.75rem',
        'sm': '0.5rem',
        'md': '0.875rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.04)',
        'blue-glow': '0 0 25px rgba(37, 99, 235, 0.15)',
        'blue-glow-sm': '0 0 12px rgba(37, 99, 235, 0.12)',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
