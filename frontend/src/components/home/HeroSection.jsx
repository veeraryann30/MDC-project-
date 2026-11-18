import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.07 }}
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

  return (
    <section className="ctp-dark relative -mt-[68px] pt-[68px] bg-ctp-bg text-ctp-text overflow-hidden">
      {/* Background: faint engineering grid + one slow-drifting light. Decorative only. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 62% 45%, #000 20%, transparent 75%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 62% 45%, #000 20%, transparent 75%)',
          }}
        />
        <div
          className="ctp-drift absolute right-[8%] top-[10%] w-[560px] h-[560px] rounded-full blur-[120px] opacity-[0.14]"
          style={{ background: 'radial-gradient(closest-side, var(--ctp-accent), transparent)' }}
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

          <h1 className="mt-6 font-semibold text-[length:var(--ctp-text-display)] leading-[1.02] tracking-[-0.04em]">
            <RevealLine text="Your Digital World." delay={0.1} />
            <RevealLine
              text="Protected."
              delay={0.35}
              className="w-fit bg-gradient-to-r from-ctp-text via-ctp-text to-ctp-accent bg-clip-text text-transparent"
            />
          </h1>

          <motion.p {...anim(0.6)} className="mt-6 max-w-xl text-[length:var(--ctp-text-body)] leading-relaxed text-ctp-text-2">
            Detect digital threats before they become digital disasters. Stay one step ahead of phishing, scams, and malicious links.
          </motion.p>

          <motion.div {...anim(0.75)} className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton
              type="button"
              onClick={onScan}
              className="group inline-flex items-center gap-2 h-12 px-7 rounded-full bg-ctp-accent text-ctp-accent-ink text-sm font-medium tracking-wide cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent"
            >
              Scan a Link
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </MagneticButton>
            <MagneticButton
              type="button"
              onClick={onExplore}
              strength={0.2}
              className="inline-flex items-center h-12 px-6 rounded-full border border-ctp-border-strong text-ctp-text text-sm font-medium tracking-wide hover:bg-ctp-surface-2 transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-text"
            >
              Explore Protection
            </MagneticButton>
          </motion.div>

          <motion.ul {...anim(0.9)} className="mt-12 flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-ctp-muted">
            {['Zero-execution static analysis', '34 structural URL features', 'ML model + explainable rules'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-ctp-accent" strokeWidth={2.4} />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="lg:col-span-5"
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.25 }}
        >
          <HeroShield />
        </motion.div>
      </div>
    </section>
  );
}
