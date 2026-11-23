import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { explainResult } from '../../lib/explain';

const EASE = [0.16, 1, 0.3, 1];
const COLORS = { safe: 'var(--ctp-safe)', suspicious: 'var(--ctp-warn)', danger: 'var(--ctp-danger)', unverified: 'var(--ctp-text-2)' };

/**
 * Plain-English "why" + "what to do next" for non-technical readers.
 * Built only from the real scan result (see lib/explain.js).
 */
export default function WhyRiskyPanel({ result, showSteps = true }) {
  const reduced = useReducedMotion();
  const info = explainResult(result);
  if (!info) return null;
  const color = COLORS[info.state];

  return (
    <section
      aria-labelledby="why-risky-heading"
      className="ctp-dark relative overflow-hidden rounded-3xl border border-ctp-border bg-ctp-bg-2 text-ctp-text"
    >
      <div className={`grid grid-cols-1 gap-0 ${showSteps ? "lg:grid-cols-[1.15fr_1fr]" : ""}`}>
        {/* Reasons */}
        <div className="p-6 sm:p-8">
          <h2 id="why-risky-heading" className="ctp-display text-xl sm:text-2xl">{info.heading}</h2>
          <p className="mt-1 text-[13px] text-ctp-text-muted">{info.sub}</p>

          <ol className="mt-5 space-y-3">
            {info.reasons.map((r, i) => (
              <motion.li
                key={r.title}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : 0.1 + i * 0.08 }}
                className="flex gap-3.5 rounded-2xl border border-ctp-border bg-ctp-surface p-4"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)` }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium leading-snug">{r.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ctp-text-2">{r.plain}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          {info.note && <p className="mt-4 text-[12.5px] leading-relaxed text-ctp-text-muted">{info.note}</p>}
        </div>

        {/* Next steps */}
        {showSteps && (
        <div className="border-t border-ctp-border bg-ctp-surface/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color }}>What to do next</h2>
          <ul className="mt-4 space-y-4">
            {info.steps.map((s) => (
              <li key={s.strong} className="flex gap-3 text-[14px] leading-relaxed">
                <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                <span>
                  <strong className="font-medium text-ctp-text">{s.strong}</strong>{' '}
                  <span className="text-ctp-text-2">{s.rest}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </section>
  );
}
