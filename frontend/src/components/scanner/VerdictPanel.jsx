import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, LockOpen } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

/** Three distinct states. Colours are theme tokens, so contrast holds in light and dark. */
const STATES = {
  safe: { label: 'Low risk', color: 'var(--ctp-safe)', pulses: 1 },
  suspicious: { label: 'Suspicious', color: 'var(--ctp-warn)', pulses: 1 },
  danger: { label: 'Dangerous', color: 'var(--ctp-danger)', pulses: 2 },
  // Low risk indicators but nothing independent confirmed the link: shown as unknown, never as safe.
  unverified: { label: 'Unverified', color: 'var(--ctp-text-2)', pulses: 1 },
};

const R = 64;
const C = 2 * Math.PI * R;

/** Animated state glyph: shield + check (safe), triangle (suspicious), shield + bang (dangerous). */
function StateGlyph({ state, color, size = 18 }) {
  const reduced = useReducedMotion();
  const draw = reduced ? { pathLength: 1 } : { pathLength: [0, 1] };
  const common = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {state === 'suspicious' || state === 'unverified' ? (
        <>
          <motion.path d="M12 3.2 22 20.5H2L12 3.2z" {...common} initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: EASE }} />
          <motion.path d="M12 10v4.6M12 17.6v.2" {...common} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }} />
        </>
      ) : (
        <>
          <motion.path d="M12 2.5 20 5.5v6c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10v-6l8-3z" {...common} initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE }} />
          {state === 'safe' ? (
            <motion.path d="M8.2 12.2l2.8 2.8 5-5.6" {...common} initial={{ pathLength: reduced ? 1 : 0 }} animate={draw} transition={{ delay: 0.45, duration: 0.5, ease: EASE }} />
          ) : (
            <motion.path d="M12 7.8v5M12 16v.2" {...common} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.3 }} />
          )}
        </>
      )}
    </svg>
  );
}

function ScoreRing({ score, color, pulses, state }) {
  const reduced = useReducedMotion();
  const offset = C - (score / 100) * C;
  return (
    <div className="relative h-44 w-44 shrink-0">
      {/* security pulse: expanding halo(s) in the state colour, once the ring has drawn */}
      {!reduced && Array.from({ length: pulses }).map((_, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.9, 1.45] }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.9 + i * 0.45 }}
        />
      ))}
      <motion.div
        className="h-full w-full"
        animate={!reduced && state === 'danger' ? { x: [0, -5, 5, -3, 3, 0] } : undefined}
        transition={{ duration: 0.5, delay: 0.85, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="80" cy="80" r={R} fill="none" stroke="var(--ctp-border)" strokeWidth="6" />
          <motion.circle
            cx="80" cy="80" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: reduced ? offset : C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduced ? 0 : 1.4, ease: EASE, delay: 0.15 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums" style={{ color }}>{score}</span>
          <span className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ctp-text-muted">of 100</span>
        </div>
      </motion.div>
    </div>
  );
}

/** Position marker on the 0–100 scale; thresholds match the backend bands (30 / 60). */
function ScaleBar({ score, color }) {
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-ctp-border">
        <div className="absolute inset-y-0 left-0 w-[30%] rounded-l-full bg-ctp-safe/30" />
        <div className="absolute inset-y-0 left-[30%] w-[30%] bg-ctp-warn/30" />
        <div className="absolute inset-y-0 left-[60%] right-0 rounded-r-full bg-ctp-danger/30" />
        <motion.span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ctp-bg"
          style={{ backgroundColor: color }}
          initial={{ left: '0%' }}
          animate={{ left: `${score}%` }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ctp-text-muted">
        <span>Safe (0-30)</span><span>Suspicious (31-60)</span><span>Dangerous (61-100)</span>
      </div>
    </div>
  );
}

export default function VerdictPanel({ state = 'safe', score = 0, title, summary, url, domain, tld, mlScore, ruleScore, https }) {
  const reduced = useReducedMotion();
  const s = STATES[state] || STATES.safe;
  const Lk = https ? Lock : LockOpen;

  return (
    <section
      className="ctp-dark relative overflow-hidden rounded-3xl border border-ctp-border bg-ctp-bg-2 text-ctp-text"
      aria-label={`Scan verdict: ${s.label}, score ${score} out of 100`}
    >
      {/* one quiet wash of the state colour */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full opacity-[0.14] blur-[90px]"
        style={{ background: s.color }}
      />
      {/* dangerous results flash a brief red vignette, once */}
      {state === 'danger' && !reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ boxShadow: `inset 0 0 0 2px ${s.color}, inset 0 0 70px color-mix(in srgb, ${s.color} 35%, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 0.8, 0] }}
          transition={{ duration: 1.3, delay: 0.7, times: [0, 0.2, 0.45, 0.65, 1] }}
        />
      )}

      <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-9 lg:grid-cols-[auto_1fr] lg:gap-12">
        <div className="mx-auto lg:mx-0"><ScoreRing score={score} color={s.color} pulses={s.pulses} state={state} /></div>

        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium uppercase tracking-[0.12em]"
            style={{ color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`, background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}
          >
            <StateGlyph state={state} color={s.color} />
            {s.label}
          </motion.div>

          <h2 className="ctp-display mt-4 text-[length:var(--ctp-text-h1)] leading-[1.04]">{title}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ctp-text-2">{summary}</p>

          <div className="mt-6 rounded-xl border border-ctp-border bg-ctp-surface px-4 py-3 font-mono text-[13px] text-ctp-text break-all select-all">
            {url}
          </div>

          <div className="mt-7"><ScaleBar score={score} color={s.color} /></div>

          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-ctp-border pt-5 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-[12px] text-ctp-text-muted">Domain</dt>
              <dd className="mt-1 truncate font-medium" title={domain}>{domain || '—'}{tld ? <span className="text-ctp-text-muted"> .{tld}</span> : null}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ctp-text-muted">Transport</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium">
                <Lk className="h-3.5 w-3.5" style={{ color: https ? 'var(--ctp-safe)' : 'var(--ctp-danger)' }} strokeWidth={2} />
                {https ? 'HTTPS' : 'HTTP only'}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ctp-text-muted">Machine learning</dt>
              <dd className="mt-1 font-medium tabular-nums">{mlScore ?? 0}%</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ctp-text-muted">Rule heuristics</dt>
              <dd className="mt-1 font-medium tabular-nums">{ruleScore ?? 0}%</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
