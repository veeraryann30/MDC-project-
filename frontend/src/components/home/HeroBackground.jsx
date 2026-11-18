import React from 'react';

/**
 * HeroBackground
 * Premium Apple-inspired full-screen monochromatic hero background with multi-plane parallax.
 * Uses the abstract black-and-white curve wallpaper with:
 * - background-size: cover, background-position: center
 * - Subtle dark overlay for optimal text contrast and readability
 * - Animated glowing-edge effect along the curved shapes:
 *   1. Subtle white/silver light glow along the exact curve ridges
 *   2. Smooth travelling light animation that moves continuously along the curves
 *   3. Soft multi-stage outer glow with Gaussian blur
 *   4. Gentle pulsing ambient breathing cycle
 *   5. Slow, elegant, continuous Apple product launch aesthetic
 *   6. Multi-plane optical parallax on scroll for background and glowing curves
 *   7. GPU-accelerated SVG stroke animations and CSS keyframes
 *   8. Responsive viewBox="0 0 1024 576" matching image aspect ratio
 *   9. Zero red markings, pure silver/white luminescence
 */
export default function HeroBackground({ parallax = true }) {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    if (!parallax || typeof window === 'undefined') return;
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [parallax]);

  const p1 = Math.round(scrollY * 0.05 * 10) / 10;
  const p2 = Math.round(scrollY * 0.09 * 10) / 10;
  const p3 = Math.round(scrollY * 0.14 * 10) / 10;
  const p4 = Math.round(scrollY * 0.18 * 10) / 10;

  return (
    <div className="hero-background-canvas absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Base Abstract Black-and-White Wallpaper Layer (Parallax Depth 1) */}
      <div 
        className="absolute inset-0 w-full h-full motion-reduce:transform-none"
        style={{
          transform: `translate3d(0, ${p1}px, 0)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-hero-subtle-drift motion-reduce:animate-none motion-reduce:transform-none"
          style={{
            backgroundImage: "url('/images/hero-abstract-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* 2. Subtle Dark Editorial Overlay for Contrast & Readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"
        aria-hidden="true"
      />
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"
        aria-hidden="true"
      />

      {/* 3. Pixel-Perfect Ambient Ridge Luminescence Layer (Parallax Depth 2) */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat mix-blend-screen opacity-45 animate-hero-curve-pulse motion-reduce:animate-none motion-reduce:transform-none"
        style={{
          backgroundImage: "url('/images/hero-curve-glow.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'drop-shadow(0 0 14px rgba(255, 255, 255, 0.4))',
          transform: `translate3d(0, ${p2}px, 0)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* 4. Animated Vector Glowing Edge & Travelling Light System (Parallax Depth 3) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen motion-reduce:transform-none"
        style={{
          transform: `translate3d(0, ${p3}px, 0)`,
          willChange: 'transform',
        }}
        viewBox="0 0 1024 576" 
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Soft outer glow with progressive Gaussian blur */}
          <filter id="hero-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blurSmall" />
            <feGaussianBlur stdDeviation="8" result="blurMed" />
            <feGaussianBlur stdDeviation="16" result="blurLarge" />
            <feMerge>
              <feMergeNode in="blurLarge" />
              <feMergeNode in="blurMed" />
              <feMergeNode in="blurSmall" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense photonic beam glow filter for travelling light */}
          <filter id="hero-glow-beam" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="beamCore" />
            <feGaussianBlur stdDeviation="5" result="beamGlow" />
            <feGaussianBlur stdDeviation="12" result="beamAura" />
            <feMerge>
              <feMergeNode in="beamAura" />
              <feMergeNode in="beamGlow" />
              <feMergeNode in="beamCore" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Silver/white gradients for subtle edge taper */}
          <linearGradient id="silver-edge-tl" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="silver-edge-br" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* A. CONTINUOUS PULSING AMBIENT CURVE GLOW (Subtle White/Silver) */}
        {/* ------------------------------------------------------------- */}
        <g className="animate-hero-edge-pulse motion-reduce:animate-none">
          {/* Top-Left Curve Ambient Edge Glow */}
          <path 
            d="M 485 0 C 350 124, 175 177, 0 235" 
            fill="none" 
            stroke="url(#silver-edge-tl)" 
            strokeWidth="1.6" 
            filter="url(#hero-glow-soft)"
            opacity="0.85"
          />
          <path 
            d="M 485 0 C 350 124, 175 177, 0 235" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="0.8" 
            opacity="0.9"
          />

          {/* Bottom-Right Primary Curve Ambient Edge Glow */}
          <path 
            d="M 660 560 C 761 443, 891 365, 1024 331" 
            fill="none" 
            stroke="url(#silver-edge-br)" 
            strokeWidth="1.6" 
            filter="url(#hero-glow-soft)"
            opacity="0.85"
          />
          <path 
            d="M 660 560 C 761 443, 891 365, 1024 331" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="0.8" 
            opacity="0.9"
          />

          {/* Bottom-Right Secondary Accent Contour */}
          <path 
            d="M 680 576 C 730 495, 780 450, 850 435" 
            fill="none" 
            stroke="rgba(240, 245, 255, 0.45)" 
            strokeWidth="1.2" 
            filter="url(#hero-glow-soft)"
            opacity="0.6"
          />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* B. TRAVELLING LIGHT ANIMATION (Apple-Style Photon Beams)      */}
        {/* Smooth, slow, elegant travelling light along the curves       */}
        {/* ------------------------------------------------------------- */}

        {/* Top-Left Travelling Beam */}
        <g className="motion-reduce:hidden">
          {/* Soft outer aura */}
          <path 
            d="M 485 0 C 350 124, 175 177, 0 235" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.35)" 
            strokeWidth="5.5" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-tl-aura"
            filter="url(#hero-glow-soft)"
          />
          {/* Intense core beam */}
          <path 
            d="M 485 0 C 350 124, 175 177, 0 235" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.9)" 
            strokeWidth="2.4" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-tl-core"
            filter="url(#hero-glow-beam)"
          />
          {/* Specular apex center */}
          <path 
            d="M 485 0 C 350 124, 175 177, 0 235" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-tl-center"
          />
        </g>

        {/* Bottom-Right Travelling Beam */}
        <g className="motion-reduce:hidden">
          {/* Soft outer aura */}
          <path 
            d="M 660 560 C 761 443, 891 365, 1024 331" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.35)" 
            strokeWidth="5.5" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-br-aura"
            filter="url(#hero-glow-soft)"
          />
          {/* Intense core beam */}
          <path 
            d="M 660 560 C 761 443, 891 365, 1024 331" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.9)" 
            strokeWidth="2.4" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-br-core"
            filter="url(#hero-glow-beam)"
          />
          {/* Specular apex center */}
          <path 
            d="M 660 560 C 761 443, 891 365, 1024 331" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeLinecap="round"
            pathLength="1000"
            className="animate-hero-travel-br-center"
          />
        </g>
      </svg>

      {/* 5. Soft Ambient Focal Radial Luminescence at Curve Crests (Parallax Depth 4) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen motion-reduce:transform-none"
        style={{
          background: `
            radial-gradient(ellipse 35% 25% at 32% 16%, rgba(255, 255, 255, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 30% 25% at 82% 74%, rgba(255, 255, 255, 0.08) 0%, transparent 70%)
          `,
          transform: `translate3d(0, ${p4}px, 0)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* 6. Ultra-faint Apple-grade hairline texture grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '96px 96px'
        }}
        aria-hidden="true"
      />
    </div>
  );
}
