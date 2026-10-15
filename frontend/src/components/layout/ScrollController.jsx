import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollController({ activePage, theme = 'dark' }) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 1. Scroll Progress & Scroll-to-Top Visibility Tracker
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

  // 2. IntersectionObserver for Scroll-Driven In-View Reveals
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // SVG Circular Dashoffset Calculation (Radius: 16, Circumference: ~100.5)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <>
      {/* Scroll-Driven Top Telemetry Progress Bar (Placed below TopNavbar) */}
      <div 
        className="fixed top-16 left-0 right-0 z-30 pointer-events-none h-[2.5px] bg-transparent"
        aria-hidden="true"
      >
        <div 
          className={`h-full transition-all duration-150 ease-out relative ${
            theme === 'light'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.7)]'
              : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-300 shadow-[0_0_12px_rgba(255,107,0,0.85)]'
          }`}
          style={{ width: `${scrollPercent}%` }}
        >
          {/* Glowing Head Dot at Progress Lead */}
          {scrollPercent > 1 && (
            <span 
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                theme === 'light'
                  ? 'bg-cyan-300 shadow-[0_0_8px_#38bdf8]'
                  : 'bg-amber-200 shadow-[0_0_8px_#fbbf24]'
              }`} 
            />
          )}
        </div>
      </div>

      {/* Floating Tactical HUD "Scroll to Top" Controller */}
      <div 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          className={`group relative p-2.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer flex items-center justify-center shadow-2xl ${
            theme === 'light'
              ? 'bg-white/95 border border-blue-200 text-blue-600 hover:border-blue-500 hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)]'
              : 'bg-[#090C13]/90 border border-orange-500/40 text-orange-400 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(255,107,0,0.35)]'
          }`}
          title="Scroll to Top"
          aria-label="Scroll back to top"
        >
          {/* Progress Circular Ring */}
          <svg className="w-10 h-10 -rotate-90 pointer-events-none" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className={`${theme === 'light' ? 'stroke-slate-200' : 'stroke-[#1C2230]'}`}
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              className={`transition-all duration-150 ${
                theme === 'light' ? 'stroke-blue-600' : 'stroke-orange-500'
              }`}
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
