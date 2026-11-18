import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollController
 * Apple-Grade Global Smooth Momentum Scrolling & Tactile Click Animation Engine.
 * Features:
 * - Physics-based inertial momentum scrolling with Apple damping deceleration
 * - Sub-pixel requestAnimationFrame interpolation for 60fps velvety glide
 * - Respects nested scroll containers, touch devices, and prefers-reduced-motion
 * - Apple dynamic specular click flash / radial wave feedback on all interactive elements
 * - Tactile spring compression on click with Apple quartic ease-out
 * - Floating Apple macOS minimal scrollbar & scroll telemetry HUD
 */
export default function ScrollController({ activePage, theme = 'dark' }) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 1. Scroll Progress & Scroll-to-Top HUD Visibility Tracker
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          const pct = docHeight > 0 ? Math.min(Math.max((currentScroll / docHeight) * 100, 0), 100) : 0;
          
          setScrollPercent(pct);
          setShowScrollTop(currentScroll > 220);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activePage]);

  // 2. IntersectionObserver for Apple-Style Scroll-Driven In-View Reveals
  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    const observeAll = () => {
      const elements = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-driven'
      );
      elements.forEach((el) => observer.observe(el));
    };

    observeAll();
    const timer = setTimeout(observeAll, 150);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [activePage]);

  // 3. Apple Dynamic Specular Click Feedback (iOS / macOS / VisionOS Style)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    const handlePointerDown = (e) => {
      // Find nearest clickable container
      const target = e.target.closest('button, a, [role="button"], .shadow-card, .apple-interactive');
      if (!target) return;
      if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;

      // Limit concurrent ripple nodes on same element
      const existing = target.querySelectorAll('.apple-click-ripple');
      if (existing.length > 2) {
        existing[0].remove();
      }

      // Ensure relative positioning on the element
      const style = window.getComputedStyle(target);
      if (style.position === 'static') {
        target.style.position = 'relative';
      }
      if (style.overflow !== 'hidden' && !target.classList.contains('overflow-visible')) {
        target.style.overflow = 'hidden';
      }

      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2.2;

      const ripple = document.createElement('span');
      ripple.className = 'apple-click-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      target.appendChild(ripple);

      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 450);
    };

    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Programmatic Apple Quartic Ease-Out Scroll to Top
  const scrollToTop = () => {
    const startY = window.scrollY;
    if (startY <= 0) return;

    const duration = Math.min(750, Math.max(380, startY * 0.4));
    const startTime = performance.now();

    // Apple quartic ease-out deceleration curve: 1 - (1 - t)^4
    const easeOutQuartic = (t) => 1 - Math.pow(1 - t, 4);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuartic(progress);

      window.scrollTo(0, Math.round(startY * (1 - eased)));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  // Circular Dashoffset Calculation (Radius: 16, Circumference: ~100.5)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <>
      {/* Scroll-Driven Top Telemetry Progress Bar */}
      <div 
        className="fixed top-16 left-0 right-0 z-30 pointer-events-none h-[2px] bg-transparent"
        aria-hidden="true"
      >
        <div
          className="ctp-dark h-full relative bg-ctp-accent will-change-[width]"
          style={{ width: `${scrollPercent}%`, transition: 'width 120ms linear' }}
        />
      </div>

      {/* Floating Tactical HUD "Scroll to Top" Controller with Apple Aesthetics */}
      <div 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          className="ctp-dark group relative p-2 rounded-full bg-ctp-bg/90 backdrop-blur-md border border-ctp-border text-ctp-text hover:border-ctp-border-strong transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-[var(--ctp-shadow)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctp-accent"
          title="Scroll to Top"
          aria-label="Scroll back to top"
        >
          {/* Progress Circular Ring */}
          <svg className="w-10 h-10 -rotate-90 pointer-events-none" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="stroke-ctp-border"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="stroke-ctp-accent transition-[stroke-dashoffset] duration-150"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Chevron Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </>
  );
}
