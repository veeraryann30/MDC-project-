import Lenis from 'lenis';

/**
 * Starts Lenis smooth scrolling on fine-pointer desktops only.
 * Skipped for reduced-motion users and touch devices, where native scrolling is better.
 * Returns a cleanup function.
 */
export function initSmoothScroll() {
  if (typeof window === 'undefined') return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !finePointer) return () => {};

  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  let rafId = requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  });

  // Let existing window.scrollTo / scrollIntoView callers keep working.
  window.__lenis = lenis;

  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
    delete window.__lenis;
  };
}
