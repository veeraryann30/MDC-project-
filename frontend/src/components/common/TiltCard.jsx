import React, { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Card with restrained 3D depth: tilts a few degrees toward the cursor, the shadow shifts
 * opposite to the tilt, and a soft purple light follows the pointer (see .ctp-lit in index.css).
 * Updates inline styles directly (no React re-render per pointer move) and eases back on leave.
 * Inactive for touch input and reduced-motion users.
 */
export default function TiltCard({ children, className = '', max = 5, as: Tag = 'div', style, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const onMove = (e) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * 2 * max;
    const rx = -(py - 0.5) * 2 * max;
    el.style.transition = 'transform 90ms linear, box-shadow 200ms';
    el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--px', ((px - 0.5) * 2).toFixed(3));
    el.style.setProperty('--py', ((py - 0.5) * 2).toFixed(3));
    el.style.boxShadow = `${(-ry * 3).toFixed(1)}px ${(rx * 3 + 22).toFixed(1)}px 50px -24px var(--ctp-accent-glow), var(--ctp-shadow-sm)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 600ms';
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    el.style.boxShadow = '';
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`ctp-lit ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
