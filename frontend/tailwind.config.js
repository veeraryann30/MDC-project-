/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#050608',
          surface: '#090C13',
          card: '#0B0F17',
          cardHover: '#121722',
          border: 'rgba(255, 107, 0, 0.18)',
          borderHover: 'rgba(255, 107, 0, 0.45)',
          accent: '#FF6B00',
          accentLight: '#FFA043',
          accentGlow: 'rgba(255, 107, 0, 0.35)',
          safe: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          textMuted: '#94a3b8'
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
