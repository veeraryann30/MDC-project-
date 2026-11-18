import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const ShieldScene = lazy(() => import('./ShieldScene'));

/** Tracks whether <html> currently carries the light theme class. */
function useIsLight() {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setLight(el.classList.contains('light')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return light;
}

/** Static, layout-identical shield (no WebGL, small screens, reduced motion, still loading). */
function StaticShield({ pulse }) {
  return (
    <svg viewBox="0 0 200 240" className="w-[46%] h-auto" role="img" aria-label="Security shield" fill="none">
      <defs>
        <linearGradient id="hs-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2a30" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
        <filter id="hs-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M100 8c29 8 54 11 80 15v72c0 63-35 107-80 131C55 203 20 159 20 95V23c26-4 51-7 80-15z" stroke="#a855f7" strokeWidth="3" filter="url(#hs-glow)" fill="url(#hs-body)" />
      <path d="M100 30c22 6 42 8 62 11v55c0 48-26 82-62 102-36-20-62-54-62-102V41c20-3 40-5 62-11z" stroke="#c084fc" strokeOpacity=".8" strokeWidth="1.2" />
      <rect x="74" y="98" width="52" height="42" rx="8" fill="#26262c" stroke="#3d3d46" />
      <path d="M85 98V88a15 15 0 0130 0v10" stroke="#d4d4dc" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="116" r="5" fill="#c084fc" />
      <rect x="98" y="118" width="4" height="12" rx="2" fill="#c084fc" />
      {pulse > 0 && <circle key={pulse} cx="100" cy="115" r="60" stroke="#c084fc" strokeWidth="1.5" className="ctp-static-pulse" />}
    </svg>
  );
}

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Hero shield. The Three.js chunk is only requested on desktop-width screens with WebGL and
 * no reduced-motion preference, after the browser is idle. Rendering pauses off-screen.
 * Clicking (or pressing Enter/Space on the focusable overlay) spins the shield, fires a
 * security pulse and shows a short "shield engaged" confirmation. The animation is decorative:
 * it makes no claim about any scan result.
 */
export default function HeroShield() {
  const wrapRef = useRef(null);
  const reduced = useReducedMotion();
  const light = useIsLight();
  const [enable3D, setEnable3D] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const confirmTimer = useRef(null);

  const activate = useCallback(() => {
    setPulseKey((k) => k + 1);
    setConfirm(true);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirm(false), 2200);
  }, []);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let idleId;
    const update = () => {
      const ok = mq.matches && !rm.matches && canUseWebGL();
      if (!ok) { setEnable3D(false); return; }
      const start = () => setEnable3D(true);
      idleId = 'requestIdleCallback' in window
        ? window.requestIdleCallback(start, { timeout: 2000 })
        : window.setTimeout(start, 600);
    };
    update();
    mq.addEventListener('change', update);
    rm.addEventListener('change', update);
    return () => {
      if (idleId !== undefined) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
        window.clearTimeout(idleId);
      }
      mq.removeEventListener('change', update);
      rm.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full aspect-square max-w-[580px] mx-auto flex items-center justify-center">
      {/* soft ground light behind the shield */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[10%] bottom-[6%] h-[24%] rounded-[50%] blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--ctp-accent-glow), transparent)', opacity: light ? 0.55 : 0.9 }}
      />

      {enable3D ? (
        <div className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><StaticShield pulse={0} /></div>}>
            <ShieldScene active={visible && tabVisible} light={light} pulseKey={pulseKey} onActivate={activate} />
          </Suspense>
        </div>
      ) : (
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={reduced || !pulseKey ? undefined : { rotateY: [0, 360] }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
          key={`static-${pulseKey}`}
          style={{ perspective: 800 }}
        >
          <StaticShield pulse={pulseKey} />
        </motion.div>
      )}

      {/* keyboard / assistive access to the same interaction */}
      <button
        type="button"
        onClick={activate}
        aria-label="Engage the shield (decorative animation)"
        className="absolute inset-[18%] rounded-[40%] opacity-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ctp-accent"
        style={{ pointerEvents: enable3D ? 'none' : 'auto', cursor: 'pointer' }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex justify-center" aria-live="polite">
        <AnimatePresence>
          {confirm && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full border border-ctp-border-strong bg-ctp-surface/90 px-3.5 py-1.5 text-[13px] text-ctp-text backdrop-blur"
              style={{ boxShadow: 'var(--ctp-shadow-sm)' }}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--ctp-accent-solid)' }}>
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
              Shield engaged
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
