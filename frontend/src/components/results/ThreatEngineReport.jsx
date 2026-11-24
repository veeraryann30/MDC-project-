import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, Radar, ExternalLink, Info, Link2,
  Cpu, GitBranch, Loader2, CircleSlash, Layers,
} from 'lucide-react';
import { api } from '../../services/api';

const EASE = [0.16, 1, 0.3, 1];

const VERDICTS = {
  SAFE: { label: 'Safe', color: '#16A34A', chip: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]', Icon: ShieldCheck },
  UNVERIFIED: { label: 'Unverified', color: '#64748B', chip: 'bg-slate-100 border-[#E2E8F0] text-[#475569]', Icon: HelpCircle },
  SUSPICIOUS: { label: 'Suspicious', color: '#D97706', chip: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]', Icon: AlertTriangle },
  DANGEROUS: { label: 'Dangerous', color: '#DC2626', chip: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]', Icon: ShieldAlert },
};

export function VerdictBadge({ verdict, className = '' }) {
  const v = VERDICTS[verdict];
  if (!v) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${v.chip} ${className}`}>
      <v.Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {v.label}
    </span>
  );
}

/** One honest chip per provider outcome: "no data" and "not configured" are never shown as clean. */
function sourceState(s) {
  if (s.status === 'ok' && s.verdict === 'malicious') return { label: 'Flagged', tone: 'bad' };
  if (s.status === 'ok' && s.verdict === 'suspicious') return { label: 'Suspicious', tone: 'warn' };
  if (s.status === 'ok' && s.verdict === 'clean') return { label: 'No threat found', tone: 'good' };
  if (s.status === 'no_data') return { label: 'No data', tone: 'mute' };
  if (s.status === 'not_configured') return { label: 'Not configured', tone: 'off' };
  if (s.status === 'rate_limited') return { label: 'Rate limited', tone: 'warn' };
  if (s.status === 'skipped') return { label: 'Skipped', tone: 'off' };
  return { label: 'Unavailable', tone: 'warn' };
}

const TONES = {
  bad: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
  warn: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
  good: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
  mute: 'bg-slate-100 border-[#E2E8F0] text-[#475569]',
  off: 'bg-white border-dashed border-[#E2E8F0] text-[#94A3B8]',
};

const safeHttps = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : null);

function SourceCard({ name, s, index }) {
  const reduced = useReducedMotion();
  const st = sourceState(s);
  const d = s.details || {};
  const ref = safeHttps(s.reference);
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.05 + index * 0.06 }}
      className={`rounded-xl border p-4 ${st.tone === 'off' ? 'border-dashed border-[#E2E8F0] bg-[#F8FAFC]' : st.tone === 'bad' ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E2E8F0] bg-[#F5F9FF]'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#111827]">{name}</span>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${TONES[st.tone]}`}>{st.label}</span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#475569]">{s.note || 'No details.'}</p>
      {(d.malicious !== undefined || d.threat_types || d.tags || d.categories) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.malicious !== undefined && (
            <span className="rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#475569]">
              {d.malicious} malicious · {d.suspicious ?? 0} suspicious
            </span>
          )}
          {(d.threat_types || []).map((t) => (
            <span key={t} className="rounded border border-[#FECACA] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#DC2626]">{t}</span>
          ))}
          {(d.tags || []).slice(0, 4).map((t) => (
            <span key={t} className="rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#475569]">{t}</span>
          ))}
          {(d.categories || []).slice(0, 4).map((t) => (
            <span key={t} className="rounded border border-[#FDE68A] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#D97706]">{t}</span>
          ))}
        </div>
      )}
      {ref && (
        <a href={ref} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline">
          Full report <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {typeof s.latency_ms === 'number' && st.tone !== 'off' && (
        <span className="mt-2 block font-mono text-[10px] text-[#94A3B8]">{s.latency_ms} ms</span>
      )}
    </motion.div>
  );
}

function Bar({ value, color, delay = 0 }) {
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: reduced ? `${pct}%` : 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      />
    </div>
  );
}

function RedirectChain({ redirect }) {
  if (!redirect?.is_shortener) return null;
  const chain = redirect.chain || [];
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#111827]">
        <GitBranch className="h-4 w-4 text-[#2563EB]" /> Short link redirect chain
      </h4>
      {chain.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {chain.map((h, i) => (
            <li key={`${h.host}-${i}`} className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[10px] text-[#2563EB] ring-1 ring-[#DBEAFE]">{i + 1}</span>
              <code className="break-all rounded bg-white px-1.5 py-0.5 text-[#111827] ring-1 ring-[#E2E8F0]">{h.host}</code>
              {h.not_contacted ? (
                <span className="rounded border border-[#BBF7D0] bg-[#F0FDF4] px-1.5 py-0.5 text-[10px] font-semibold text-[#16A34A]">destination analysed, never contacted</span>
              ) : (
                <span className="font-mono text-[10px] text-[#64748B]">HTTP {h.status}{h.tls_verified === false ? ' · certificate chain incomplete' : ''}</span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-[12px] text-[#64748B]">The short link was not expanded.</p>
      )}
      {redirect.stopped_reason && <p className="mt-3 text-[11.5px] text-[#64748B]">{redirect.stopped_reason}</p>}
      {redirect.error && <p className="mt-1 text-[11.5px] text-[#D97706]">{redirect.error}</p>}
    </div>
  );
}

/** Optional behavioural scan. urlscan.io's servers visit the page, so it only runs on an explicit click. */
function DeepScan({ url }) {
  const [state, setState] = useState('idle'); // idle | submitting | pending | done | error
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const poll = (uuid, tries = 0) => {
    timer.current = setTimeout(async () => {
      try {
        const r = await api.urlscanResult(uuid);
        if (r.state === 'done') { setInfo(r.summary); setState('done'); return; }
        if (r.state === 'error') { setError(r.message || 'Scan failed.'); setState('error'); return; }
        if (tries >= 20) { setError('The scan is taking longer than expected. Open the report link later.'); setState('error'); return; }
        poll(uuid, tries + 1);
      } catch (e) {
        setError(e.message || 'Could not read the scan result.'); setState('error');
      }
    }, tries === 0 ? 10000 : 4000);
  };

  const start = async () => {
    setState('submitting'); setError('');
    try {
      const r = await api.urlscanSubmit(url);
      setInfo({ report_url: r.report_url, uuid: r.uuid });
      setState('pending');
      poll(r.uuid);
    } catch (e) {
      setError(e.message || 'Could not start the scan.'); setState('error');
    }
  };

  const report = safeHttps(info?.report_url);
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#111827]">
        <Radar className="h-4 w-4 text-[#2563EB]" /> Deep behavioural scan (urlscan.io)
      </h4>
      {state === 'idle' || state === 'error' ? (
        <>
          <p className="mt-2 text-[12px] leading-relaxed text-[#64748B]">
            Asks urlscan.io to load this page in its own sandbox and report redirects, requests and brand impersonation.
            This sends the URL to urlscan.io (unlisted) and its servers will visit the page. Your device never does.
          </p>
          {state === 'error' && <p role="alert" className="mt-2 text-[12px] font-medium text-[#DC2626]">{error}</p>}
          <button type="button" onClick={start} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1E40AF]">
            <Radar className="h-3.5 w-3.5" /> Run deep scan
          </button>
        </>
      ) : null}
      {(state === 'submitting' || state === 'pending') && (
        <p className="mt-3 flex items-center gap-2 text-[12px] text-[#475569]" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
          {state === 'submitting' ? 'Submitting…' : 'urlscan.io is analysing the page. This usually takes 10–30 seconds.'}
        </p>
      )}
      {state === 'done' && info && (
        <div className="mt-3 space-y-2 text-[12px] text-[#475569]">
          <p>
            <strong className={info.malicious ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
              {info.malicious ? 'urlscan.io flagged this page as malicious' : 'urlscan.io found no malicious verdict'}
            </strong>
            {info.categories?.length ? ` (${info.categories.join(', ')})` : ''}.
          </p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Redirects', info.redirect_count],
              ['Cross-domain redirect', info.cross_domain_redirect ? 'Yes' : 'No'],
              ['Requests', info.requests],
              ['Server country', info.page_country || '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-[#E2E8F0] bg-[#F5F9FF] p-2">
                <dt className="text-[10px] text-[#64748B]">{k}</dt>
                <dd className="font-mono text-[12px] font-semibold text-[#111827]">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>
          {info.brands?.length > 0 && <p>Brands impersonated: <strong>{info.brands.join(', ')}</strong></p>}
        </div>
      )}
      {report && (state === 'pending' || state === 'done') && (
        <a href={report} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline">
          Open the full urlscan.io report <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

/**
 * Unified Threat Engine report: how the verdict was built, every source's honest status,
 * conflicts and what could not be checked. Renders only what the backend returned.
 */
export default function ThreatEngineReport({ result }) {
  const engine = result?.engine;
  if (!engine) return null;

  const v = VERDICTS[engine.verdict] || VERDICTS.UNVERIFIED;
  const sources = engine.sources || result.intelligence || {};
  const sourceEntries = Object.entries(sources);
  const answered = engine.sources_answered ?? sourceEntries.filter(([, s]) => s.status === 'ok' || s.status === 'no_data').length;
  const urlscanUsable = sources['urlscan.io'] && sources['urlscan.io'].status !== 'not_configured';
  const scanUrl = result.url || result.extracted_url;
  const models = engine.model_scores || {};

  return (
    <section aria-labelledby="engine-report-title" className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="engine-report-title" className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-[#111827]">
            <Layers className="h-4 w-4 text-[#2563EB]" /> Unified Threat Engine
          </h3>
          <p className="mt-1 max-w-xl text-[12px] text-[#64748B]">
            Machine learning, heuristics and reputation sources combined with unequal weights. An AI review agent gives an independent second opinion that can nudge the score by at most 15 points and can never lower a score that threat intelligence flagged. The AI analyst only explains the result.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <VerdictBadge verdict={engine.verdict} />
          <div className="w-36">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <span>Confidence</span><span style={{ color: v.color }}>{engine.confidence?.label}</span>
            </div>
            <div className="mt-1"><Bar value={engine.confidence?.pct} color={v.color} /></div>
            <div className="mt-1 font-mono text-[10px] text-[#94A3B8]">{engine.confidence?.pct}% · {answered}/{engine.sources_total ?? sourceEntries.length} sources answered</div>
          </div>
        </div>
      </div>

      {/* How the score was built */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">How the score was built</h4>
        <ul className="mt-3 space-y-3">
          {(engine.score_path || []).map((p, i) => (
            <li key={p.step}>
              <div className="flex items-baseline justify-between gap-3 text-[12px]">
                <span className={i === engine.score_path.length - 1 ? 'font-semibold text-[#111827]' : 'text-[#475569]'}>{p.step}</span>
                <span className="font-mono font-semibold tabular-nums text-[#111827]">{p.value === null ? 'n/a' : p.value}</span>
              </div>
              {p.value !== null && <div className="mt-1"><Bar value={p.value} color={i === engine.score_path.length - 1 ? v.color : '#93C5FD'} delay={0.1 + i * 0.1} /></div>}
            </li>
          ))}
        </ul>
        {engine.agent_review && (
          <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-white p-3 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[#111827]">AI review agent</span>
              <span className="font-mono text-[11px] text-[#475569]">
                {engine.agent_review.status === 'ok'
                  ? `estimates ${engine.agent_review.agent_probability}% · ${engine.agent_review.applied ? `adjusted ${engine.agent_review.adjustment > 0 ? '+' : ''}${engine.agent_review.adjustment}` : 'no change'}`
                  : 'unavailable · score unchanged'}
              </span>
            </div>
            {engine.agent_review.reasoning && <p className="mt-1.5 text-[#475569]">{engine.agent_review.reasoning}</p>}
            {engine.agent_review.note && <p className="mt-1.5 text-[11px] text-[#94A3B8]">{engine.agent_review.note}</p>}
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Random Forest', models.random_forest, 'Primary classifier'],
            ['Logistic Regression', models.logistic_regression, 'Linear baseline'],
            ['Heuristic rules', (engine.components || []).find((c) => c.id === 'rules')?.score, 'Brand, typosquat, keywords, TLS'],
          ].map(([name, val, sub]) => (
            <div key={name} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-[#111827]"><Cpu className="h-3.5 w-3.5 text-[#2563EB]" />{name}</span>
                <span className="font-mono font-bold text-[#2563EB]">{val === null || val === undefined ? 'n/a' : `${val}%`}</span>
              </div>
              <div className="mt-1.5"><Bar value={val} color="#2563EB" delay={0.2} /></div>
              <p className="mt-1.5 text-[10.5px] text-[#94A3B8]">{val === null || val === undefined ? 'Model unavailable' : sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reputation sources */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          <ShieldCheck className="h-3.5 w-3.5" /> Threat intelligence sources
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sourceEntries.filter(([, s]) => s.status !== 'not_configured').map(([name, s], i) => <SourceCard key={name} name={name} s={s} index={i} />)}
        </div>
        {sourceEntries.some(([, s]) => s.status === 'not_configured') && (
          <p className="mt-3 rounded-lg border border-dashed border-[#E2E8F0] px-3 py-2 text-[12px] text-[#94A3B8]">
            Not connected: {sourceEntries.filter(([, s]) => s.status === 'not_configured').map(([n]) => n).join(', ')}. Add the API keys on the server to enable them.
          </p>
        )}
      </div>

      <RedirectChain redirect={engine.redirect || result.redirect} />

      {engine.conflicts?.length > 0 && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D97706]"><AlertTriangle className="h-3.5 w-3.5" /> Conflicting signals</h4>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-[#D97706]">
            {engine.conflicts.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}

      {engine.limitations?.length > 0 && (
        <details className="group rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            <CircleSlash className="h-3.5 w-3.5" /> What could not be checked ({engine.limitations.length})
          </summary>
          <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-[#64748B]">
            {engine.limitations.map((l, i) => <li key={`${i}-${l.slice(0, 24)}`} className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />{l}</li>)}
          </ul>
        </details>
      )}

      {urlscanUsable && scanUrl && <DeepScan url={scanUrl} />}

      <p className="flex items-center gap-1.5 text-[10.5px] text-[#94A3B8]"><Link2 className="h-3 w-3" /> The scanned link was never opened by this platform.</p>
    </section>
  );
}
