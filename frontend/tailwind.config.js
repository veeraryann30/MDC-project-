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
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        shadow: {
          bg: '#0B0B0C',
          surface: '#101012',
          card: '#151517',
          elevated: '#1B1B1F',
          border: '#29292D',
          primary: '#F5F5F5',
          secondary: '#92929A',
          muted: '#686870',
          orange: '#FF6B35',
          safe: '#35C98A',
          warning: '#F2B84B',
          danger: '#FF5C5C',
        },
        cyber: {
          dark: '#0B0B0C',
          surface: '#101012',
          card: '#151517',
          cardHover: '#1B1B1F',
          border: '#29292D',
          borderHover: 'rgba(255, 107, 53, 0.4)',
          accent: '#FF6B35',
          accentLight: '#FFA043',
          accentGlow: 'rgba(255, 107, 53, 0.25)',
          safe: '#35C98A',
          warning: '#F2B84B',
          danger: '#FF5C5C',
          textMuted: '#92929A'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
