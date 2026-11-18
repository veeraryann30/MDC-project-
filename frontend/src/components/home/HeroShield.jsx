import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';

const ShieldScene = lazy(() => import('./ShieldScene'));

/** Static, layout-identical fallback (no WebGL, small screens, reduced motion, still loading). */
function StaticShield() {
  return (
    <svg viewBox="0 0 200 240" className="w-[46%] h-auto" role="img" aria-label="Security shield" fill="none">
      <defs>
        <linearGradient id="hs-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2d33" />
          <stop offset="1" stopColor="#0f1012" />
        </linearGradient>
      </defs>
      <path d="M100 12c28 8 52 10 78 14v70c0 62-34 104-78 128C56 200 22 158 22 96V26c26-4 50-6 78-14z" fill="url(#hs-body)" stroke="#3a3a42" strokeWidth="1.5" />
      <path d="M100 30c22 6 42 8 62 11v55c0 48-26 82-62 102-36-20-62-54-62-102V41c20-3 40-5 62-11z" stroke="#22d3ee" strokeOpacity=".55" strokeWidth="1.2" />
      <path d="M72 118l20 20 38-44" stroke="#22d3ee" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
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
 * Lazy-loaded 3D shield. The Three.js chunk is only requested when the visual is
 * on a desktop-width screen, WebGL exists and the user has not asked for reduced motion.
 * Rendering pauses whenever the hero is scrolled out of view or the tab is hidden.
 */
export default function HeroShield() {
  const wrapRef = useRef(null);
  const [enable3D, setEnable3D] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnable3D(mq.matches && !rm.matches && canUseWebGL());
    update();
    mq.addEventListener('change', update);
    rm.addEventListener('change', update);
    return () => {
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
    <div ref={wrapRef} className="relative w-full aspect-square max-w-[560px] mx-auto flex items-center justify-center">
      {/* soft ground light, behind everything */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[8%] h-[22%] rounded-[50%] blur-3xl opacity-40"
        style={{ background: 'radial-gradient(closest-side, rgba(34,211,238,0.35), transparent)' }}
      />
      {enable3D ? (
        <div className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><StaticShield /></div>}>
            <ShieldScene active={visible && tabVisible} />
          </Suspense>
        </div>
      ) : (
        <StaticShield />
      )}
    </div>
  );
}
