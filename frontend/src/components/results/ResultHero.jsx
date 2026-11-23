import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PanelRightOpen } from 'lucide-react';
import { STATES, StateGlyph, ScoreRing } from '../scanner/VerdictPanel';
import FeedbackBar from './FeedbackBar';

const EASE = [0.16, 1, 0.3, 1];

// One dot per reputation source. Only a real answer is coloured: "not connected" is hollow, never green.
function dotFor(s) {
  if (s.status === 'ok' && s.verdict === 'malicious') return { color: 'var(--ctp-danger)', text: 'flagged it' };
  if (s.status === 'ok' && s.verdict === 'suspicious') return { color: 'var(--ctp-warn)', text: 'found it suspicious' };
  if (s.status === 'ok' && s.verdict === 'clean') return { color: 'var(--ctp-safe)', text: 'found nothing' };
  if (s.status === 'no_data') return { color: 'var(--ctp-text-muted)', text: 'has no record of it' };
  if (s.status === 'not_configured') return { color: null, text: 'is not connected' };
  if (s.status === 'skipped') return { color: null, text: 'was skipped' };
  return { color: 'var(--ctp-warn)', text: 'was unavailable' };
}

function SourceDots({ sources }) {
  const entries = Object.entries(sources || {});
  if (!entries.length) return null;
  const answered = entries.filter(([, s]) => s.status === 'ok' || s.status === 'no_data').length;
  return (
    <div className="flex flex-col items-center gap-2">
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5" aria-label="Security checks">
        {entries.map(([name, s]) => {
          const d = dotFor(s);
          return (
            <li key={name} title={`${name} ${d.text}`} className="flex items-center gap-1.5 text-[12.5px] text-ctp-text-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={d.color ? { background: d.color } : { border: '1.5px solid var(--ctp-text-muted)' }}
              />
              {name}
              <span className="sr-only"> {d.text}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-[12px] text-ctp-text-muted">{answered} of {entries.length} security checks answered</p>
    </div>
  );
}

/**
 * The whole answer in one view: verdict, one sentence, up to three actions, which checks ran.
 * Everything else lives in the full report drawer.
 */
export default function ResultHero({ result, state, label, headline, actions, onOpenReport, drawerOpen, kicker, urlLabel }) {
  const reduced = useReducedMotion();
  const s = STATES[state] || STATES.safe;
  const score = Math.min(100, Math.max(0, Math.round(Number(result.risk_score) || 0)));
  const sources = result.engine?.sources || result.intelligence;
  const confidence = result.engine?.confidence;

  return (
    <section
      className="ctp-dark relative overflow-hidden rounded-3xl border border-ctp-border bg-ctp-bg-2 text-ctp-text"
      aria-label={`Scan verdict: ${label}, score ${score} out of 100`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-40 h-80 w-[28rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-[90px]"
        style={{ background: s.color }}
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 py-8 text-center sm:px-9 sm:py-10">
        <ScoreRing score={score} color={s.color} pulses={s.pulses} state={state} />

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium uppercase tracking-[0.12em]"
            style={{ color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`, background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}
          >
            <StateGlyph state={state} color={s.color} />
            {label}
          </motion.span>
          {confidence && (
            <span className="text-[12px] text-ctp-text-muted" title={`${confidence.pct}% confidence in this verdict`}>
              {confidence.label.charAt(0) + confidence.label.slice(1).toLowerCase()} confidence
            </span>
          )}
        </div>

        <h1 className="ctp-display text-[length:var(--ctp-text-h2)] leading-[1.1]">{headline}</h1>

        {kicker && <p className="text-[12px] uppercase tracking-[0.1em] text-ctp-text-muted">{kicker}</p>}

        <p className="max-w-full truncate rounded-lg border border-ctp-border bg-ctp-surface px-3 py-1.5 font-mono text-[12.5px] text-ctp-text-2 select-all" title={urlLabel || result.url}>
          {urlLabel || result.url}
        </p>

        {actions.length > 0 && (
          <div className="w-full text-left">
            <h2 className="text-center text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: s.color }}>What to do</h2>
            <ol className="mx-auto mt-3 max-w-xl space-y-2.5">
              {actions.map((a, i) => (
                <li key={a.title} className="flex gap-3 text-[14px] leading-relaxed">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                    style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <strong className="font-medium text-ctp-text">{a.title}</strong>
                    {a.detail ? <span className="text-ctp-text-2"> {a.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <SourceDots sources={sources} />

        <button
          type="button"
          onClick={onOpenReport}
          aria-haspopup="dialog"
          aria-expanded={!!drawerOpen}
          className="ctp-btn ctp-btn-primary h-11 rounded-xl px-5 text-sm"
        >
          <PanelRightOpen className="h-4 w-4" strokeWidth={1.9} />
          Show full report
        </button>

        <FeedbackBar scanId={result.id} compact />
      </div>
    </section>
  );
}
