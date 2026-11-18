import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import HeroShield from './HeroShield';
import MagneticButton from '../common/MagneticButton';

const EASE = [0.16, 1, 0.3, 1];

/** Masked word-by-word headline reveal. Renders plain text when motion is reduced. */
function RevealLine({ text, delay = 0, className = '' }) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  return (
    <span className={`block ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.95, ease: EASE, delay: delay + i * 0.08 }}
          >
            {w}{i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

export default function HeroSection({ onScan, onExplore }) {
  const reduced = useReducedMotion();
  const anim = (d) => (reduced ? {} : fadeUp(d));
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const glowY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 140]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);

  // Cursor-responsive lighting: write CSS variables directly (no React re-render per move)
  const onMove = (e) => {
    if (reduced || e.pointerType === 'touch') return;
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    sectionRef.current.style.setProperty('--hx', `${((e.clientX - r.left) / r.width) * 100}%`);
    sectionRef.current.style.setProperty('--hy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={onMove}
      className="ctp-dark relative -mt-[68px] pt-[68px] bg-ctp-bg text-ctp-text overflow-hidden"
      style={{ '--hx': '62%', '--hy': '40%' }}
    >
      {/* Background: faint grid, purple key light that follows the cursor, and a scroll-parallax glow */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--ctp-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ctp-grid-line) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 62% 45%, #000 20%, transparent 75%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 62% 45%, #000 20%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ background: 'radial-gradient(640px circle at var(--hx) var(--hy), color-mix(in srgb, var(--ctp-accent) 14%, transparent), transparent 65%)' }}
        />
        <motion.div
          className="absolute right-[6%] top-[8%] h-[560px] w-[560px] rounded-full blur-[130px]"
          style={{ y: glowY, opacity: glowOpacity, background: 'radial-gradient(closest-side, var(--ctp-accent-glow), transparent)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:min-h-[calc(100svh-68px)] grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-6 py-16 sm:py-20">
        <div className="lg:col-span-7 flex flex-col items-start">
          <motion.div {...anim(0)} className="flex items-center gap-2.5 text-[13px] text-ctp-text-2 tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-ctp-accent opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ctp-accent" />
            </span>
            Zero-execution phishing intelligence
          </motion.div>

          <h1 className="ctp-display mt-6 text-[length:var(--ctp-text-display)]">
            <RevealLine text="Don't Trust the Link." delay={0.1} />
            <RevealLine text="Verify It." delay={0.38} className="text-ctp-accent-text" />
          </h1>

          <motion.p {...anim(0.62)} className="mt-6 max-w-xl text-[length:var(--ctp-text-body)] leading-relaxed text-ctp-text-2">
            Your intelligent defence against phishing, malicious URLs and digital scams.
          </motion.p>

          <motion.div {...anim(0.78)} className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton
              type="button"
              onClick={onScan}
              className="ctp-btn ctp-btn-primary h-12 px-7 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent"
            >
              Scan a Link
              <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
            </MagneticButton>
            <MagneticButton
              type="button"
              onClick={onExplore}
              strength={0.2}
              className="ctp-btn ctp-btn-ghost h-12 px-6 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent"
            >
              Explore Protection
            </MagneticButton>
          </motion.div>

          <motion.ul {...anim(0.92)} className="mt-12 flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-ctp-text-2">
            {['Zero-execution static analysis', '34 structural URL features', 'ML model + explainable rules'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-ctp-accent-text" strokeWidth={2.4} />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="lg:col-span-5"
          initial={reduced ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.25 }}
        >
          <HeroShield />
        </motion.div>
      </div>
    </section>
  );
}
