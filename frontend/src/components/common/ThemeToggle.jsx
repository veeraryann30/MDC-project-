import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Animated sun / moon theme switch.
 * One SVG morphs between the two states: the sun's rays rotate and retract while a mask
 * circle slides across the disc to carve the crescent. Calls the app's toggleTheme(e),
 * which handles the circular reveal, persistence (localStorage) and the <html> class.
 */
export default function ThemeToggle({ theme, toggleTheme, size = 36, className = '' }) {
  const reduced = useReducedMotion();
  const isDark = theme === 'dark';
  const spring = reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 22 };
  const maskId = `ctp-moon-mask-${size}`;

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme && toggleTheme(e)}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{ width: size, height: size }}
      className={`ctp-theme-toggle group relative inline-flex shrink-0 items-center justify-center rounded-full border border-ctp-border bg-ctp-surface text-ctp-text transition-[background-color,border-color,transform] duration-200 hover:border-ctp-border-strong hover:bg-ctp-surface-2 active:scale-95 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent ${className}`}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <motion.circle
              r="5.2"
              fill="black"
              initial={false}
              animate={{ cx: isDark ? 15.5 : 30, cy: isDark ? 8.5 : 0 }}
              transition={spring}
            />
          </mask>
        </defs>
        <motion.circle
          cx="12" cy="12"
          fill="currentColor"
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: isDark ? 8 : 4.6 }}
          transition={spring}
        />
        <motion.g
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
          initial={false}
          animate={{ rotate: isDark ? 45 : 0, opacity: isDark ? 0 : 1, scale: isDark ? 0.4 : 1 }}
          transition={spring}
          style={{ originX: '12px', originY: '12px' }}
        >
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.55 1.55M17.15 17.15l1.55 1.55M5.3 18.7l1.55-1.55M17.15 6.85l1.55-1.55" />
        </motion.g>
      </svg>
    </button>
  );
}
