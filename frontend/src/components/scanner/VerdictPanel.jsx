import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, TriangleAlert, Lock, LockOpen } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

/** Three distinct visual states. Colours come from theme tokens so contrast holds in both themes. */
const STATES = {
  safe: { label: 'Low risk', icon: ShieldCheck, color: 'var(--ctp-safe)' },
  suspicious: { label: 'Suspicious', icon: TriangleAlert, color: 'var(--ctp-warn)' },
  danger: { label: 'Dangerous', icon: ShieldAlert, color: 'var(--ctp-danger)' },
};

const R = 64;
const C = 2 * Math.PI * R;

function ScoreRing({ score, color }) {
  const reduced = useReducedMotion();
  const offset = C - (score / 100) * C;
  return (
    <div className="relative h-44 w-44 shrink-0">
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
        <span className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ctp-muted">of 100</span>
      </div>
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
      <div className="mt-2 flex justify-between text-[11px] text-ctp-muted">
        <span>Safe</span><span>Suspicious</span><span>Dangerous</span>
      </div>
    </div>
  );
}

export default function VerdictPanel({ state = 'safe', score = 0, title, summary, url, mlScore, ruleScore, https }) {
  const s = STATES[state] || STATES.safe;
  const Icon = s.icon;
  const Lk = https ? Lock : LockOpen;

  return (
    <section
      className="ctp-dark relative overflow-hidden rounded-3xl border border-ctp-border bg-ctp-bg text-ctp-text"
      aria-label={`Scan verdict: ${s.label}, score ${score} out of 100`}
    >
      {/* one quiet wash of the state colour; no glow borders */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full opacity-[0.12] blur-[90px]"
        style={{ background: s.color }}
      />

      <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-9 lg:grid-cols-[auto_1fr] lg:gap-12">
        <div className="mx-auto lg:mx-0"><ScoreRing score={score} color={s.color} /></div>

        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium uppercase tracking-[0.12em]"
            style={{ color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)` }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {s.label}
          </motion.div>

          <h2 className="mt-4 text-[length:var(--ctp-text-h1)] font-semibold leading-[1.08] tracking-[-0.035em]">{title}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ctp-text-2">{summary}</p>

          <div className="mt-6 rounded-xl border border-ctp-border bg-ctp-surface px-4 py-3 font-mono text-[13px] text-ctp-text break-all select-all">
            {url}
          </div>

          <div className="mt-7"><ScaleBar score={score} color={s.color} /></div>

          <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-ctp-border pt-5 text-sm">
            <div>
              <dt className="text-[12px] text-ctp-muted">Machine learning</dt>
              <dd className="mt-1 font-medium tabular-nums">{mlScore ?? 0}%</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ctp-muted">Rule heuristics</dt>
              <dd className="mt-1 font-medium tabular-nums">{ruleScore ?? 0}%</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ctp-muted">Transport</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium">
                <Lk className="h-3.5 w-3.5" style={{ color: https ? 'var(--ctp-safe)' : 'var(--ctp-danger)' }} strokeWidth={2} />
                {https ? 'HTTPS' : 'HTTP only'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
