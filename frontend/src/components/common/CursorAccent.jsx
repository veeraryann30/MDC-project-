import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label[for]';

/**
 * A thin ring that trails the native cursor and grows over interactive elements.
 * Desktop mouse only; never rendered for touch or reduced-motion users.
 * The real cursor stays visible, so this is decoration, not a replacement.
 */
export default function CursorAccent() {
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.35 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(fine && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHot(!!e.target.closest?.(INTERACTIVE));
    };
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="ctp-dark pointer-events-none fixed left-0 top-0 z-[90] h-8 w-8 -ml-4 -mt-4 rounded-full border border-ctp-accent"
      style={{ x: sx, y: sy }}
      animate={{ scale: hot ? 1.7 : 1, opacity: visible ? (hot ? 0.45 : 0.6) : 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
