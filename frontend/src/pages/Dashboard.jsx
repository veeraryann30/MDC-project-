import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, animate, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { Link2, QrCode, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import TiltCard from '../components/common/TiltCard';

const EASE = [0.16, 1, 0.3, 1];

/** Number that counts up from 0 when it scrolls into view (instant for reduced motion). */
function CountUp({ value, decimals = 0, suffix = '' }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) { mv.set(value); return undefined; }
    const controls = animate(mv, value, { duration: 1.3, ease: EASE });
    return () => controls.stop();
  }, [inView, value, reduced, mv]);
  return <motion.span ref={ref} className="tabular-nums">{text}</motion.span>;
}

/** Pulsing status dot */
function StatusDot({ color }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: color }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

function StatCard({ label, value, hint, color, index, total }) {
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.07 }}
    >
      <TiltCard max={3} className="h-full rounded-2xl border border-ctp-border bg-ctp-surface p-5 shadow-[var(--ctp-shadow-sm)] transition-colors hover:border-ctp-border-strong">
        <div className="relative z-10 flex items-center justify-between text-[13px] text-ctp-text-2">
          <span>{label}</span>
          {color && <StatusDot color={color} />}
        </div>
        <div className="relative z-10 mt-3 text-4xl font-semibold tracking-[-0.03em]" style={color ? { color } : undefined}>
          <CountUp value={value} />
        </div>
        <div className="relative z-10 mt-2 text-[12px] text-ctp-text-muted">
          {hint}{color && total > 0 ? ` · ${pct}%` : ''}
        </div>
      </TiltCard>
    </motion.div>
  );
}

/** Animated SVG donut: safe / suspicious / dangerous share of all analyses. */
function Donut({ safe, suspicious, danger, unverified = 0 }) {
  const reduced = useReducedMotion();
  const total = safe + suspicious + danger + unverified;
  const R = 52;
  const C = 2 * Math.PI * R;
  const parts = [
    { key: 'safe', v: safe, color: 'var(--ctp-safe)', label: 'Safe' },
    { key: 'unverified', v: unverified, color: 'var(--ctp-text-muted)', label: 'Unverified' },
    { key: 'suspicious', v: suspicious, color: 'var(--ctp-warn)', label: 'Suspicious' },
    { key: 'danger', v: danger, color: 'var(--ctp-danger)', label: 'Dangerous' },
  ];
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`Safe ${safe}, unverified ${unverified}, suspicious ${suspicious}, dangerous ${danger}`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--ctp-border)" strokeWidth="14" />
          {total > 0 && parts.map((p, i) => {
            const len = Math.max(0, (p.v / total) * C - 2);
            const offset = -acc;
            acc += (p.v / total) * C;
            return (
              <motion.circle
                key={p.key}
                cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="14"
                strokeDashoffset={offset}
                initial={{ strokeDasharray: reduced ? `${len} ${C}` : `0 ${C}` }}
                animate={{ strokeDasharray: `${len} ${C}` }}
                transition={{ duration: reduced ? 0 : 1.1, ease: EASE, delay: 0.2 + i * 0.15 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-[-0.03em]"><CountUp value={total} /></span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-ctp-text-muted">classified</span>
        </div>
      </div>
      <ul className="min-w-[160px] flex-1 space-y-3 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ctp-text-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-medium tabular-nums">{p.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IndicatorBars({ items }) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className="text-sm text-ctp-text-muted">No threat indicators recorded yet.</p>;
  return (
    <ul className="space-y-4">
      {items.slice(0, 5).map((it, i) => (
        <li key={it.name}>
          <div className="flex items-baseline justify-between gap-4 text-[13px]">
            <span className="truncate text-ctp-text-2" title={it.name}>{it.name}</span>
            <span className="shrink-0 font-medium tabular-nums">{it.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ctp-border">
            <motion.div
              className="h-full rounded-full bg-ctp-accent"
              initial={{ width: reduced ? `${(it.count / max) * 100}%` : 0 }}
              animate={{ width: `${(it.count / max) * 100}%` }}
              transition={{ duration: 1, ease: EASE, delay: 0.25 + i * 0.08 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const CLASS_STYLE = {
  SAFE: { label: 'Safe', color: 'var(--ctp-safe)' },
  SUSPICIOUS: { label: 'Suspicious', color: 'var(--ctp-warn)' },
  PHISHING: { label: 'Dangerous', color: 'var(--ctp-danger)' },
  UNVERIFIED: { label: 'Unverified', color: 'var(--ctp-text-muted)' },
};

function Activity({ items }) {
  const reduced = useReducedMotion();
  if (!items.length) return <p className="text-sm text-ctp-text-muted">No scans yet. Run your first scan to see activity here.</p>;
  return (
    <ul className="divide-y divide-ctp-border">
      {items.slice(0, 7).map((a, i) => {
        const st = CLASS_STYLE[String(a.classification || '').toUpperCase()];
        return (
          <motion.li
            key={a.id}
            initial={reduced ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.05 }}
            className="flex items-center gap-4 py-3"
          >
            <span className="w-16 shrink-0 rounded-md border border-ctp-border px-1.5 py-0.5 text-center text-[11px] text-ctp-text-muted">{a.type}</span>
            <span className="min-w-0 flex-1 truncate text-sm" title={a.snippet}>{a.domain || a.snippet}</span>
            {st && (
              <span className="hidden items-center gap-1.5 text-[12px] sm:flex" style={{ color: st.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                {st.label}
              </span>
            )}
            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{Math.round(a.score)}</span>
            <span className="hidden w-20 shrink-0 text-right text-[12px] tabular-nums text-ctp-text-muted md:block">{a.time}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}


const VERDICT_STYLE = {
  SAFE: { label: 'Safe', color: 'var(--ctp-safe)' },
  UNVERIFIED: { label: 'Unverified', color: 'var(--ctp-text-muted)' },
  SUSPICIOUS: { label: 'Suspicious', color: 'var(--ctp-warn)' },
  DANGEROUS: { label: 'Dangerous', color: 'var(--ctp-danger)' },
};

/** 14-day scan volume; the red / amber parts of each bar are the days' dangerous and suspicious scans. */
function TrendChart({ days }) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...days.map((d) => d.scans));
  const total = days.reduce((a, d) => a + d.scans, 0);
  if (!total) return <p className="text-sm text-ctp-text-muted">No scans in the last 14 days.</p>;
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Scans per day for the last 14 days, ${total} in total`}>
        {days.map((d, i) => {
          const h = (d.scans / max) * 100;
          const danger = d.scans ? (d.dangerous / d.scans) * 100 : 0;
          const warn = d.scans ? (d.suspicious / d.scans) * 100 : 0;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.scans} scans, ${d.dangerous} dangerous, ${d.suspicious} suspicious`}>
              <motion.div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t-md bg-ctp-accent/70"
                initial={{ height: reduced ? `${h}%` : 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.03 }}
              >
                <div style={{ height: `${warn}%`, background: 'var(--ctp-warn)' }} />
                <div style={{ height: `${danger}%`, background: 'var(--ctp-danger)' }} />
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ctp-text-muted">
        <span>{days[0].date.slice(5)}</span><span>{days[days.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

const ENGINE_STATE = {
  online: { label: 'Online', color: 'var(--ctp-safe)' },
  idle: { label: 'Ready (not yet used)', color: 'var(--ctp-accent)' },
  degraded: { label: 'Degraded', color: 'var(--ctp-warn)' },
  not_configured: { label: 'Not configured', color: 'var(--ctp-text-muted)' },
};

/** Honest engine status: "online" only after a real successful call; unconfigured stays unconfigured. */
function EngineGrid({ data }) {
  const reduced = useReducedMotion();
  return (
    <div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.engines.map((e, i) => {
          const st = ENGINE_STATE[e.state] || ENGINE_STATE.degraded;
          return (
            <motion.li
              key={e.id}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.05 + i * 0.04 }}
              className={`rounded-xl border p-4 ${e.state === 'not_configured' ? 'border-dashed border-ctp-border bg-transparent' : 'border-ctp-border bg-ctp-bg-2'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium" title={e.name}>{e.name}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[11px]" style={{ color: st.color }}>
                  <StatusDot color={st.color} />{st.label}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-ctp-text-muted">{e.role}</p>
              {e.kind === 'external' && e.configured && (
                <p className="mt-2 text-[11px] tabular-nums text-ctp-text-muted">
                  {e.ok_count} ok · {e.failed_count} failed{e.rate_limited_count ? ` · ${e.rate_limited_count} rate-limited` : ''}
                  {typeof e.last_latency_ms === 'number' ? ` · ${e.last_latency_ms} ms` : ''}
                </p>
              )}
              {e.state === 'degraded' && e.last_error && <p className="mt-1 truncate text-[11px] text-ctp-warn" title={e.last_error}>{e.last_error}</p>}
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12px] text-ctp-text-muted">
        {data.configured_external} of {data.total_external} external services configured. {data.note}
      </p>
    </div>
  );
}

function VerdictChip({ verdict }) {
  const st = VERDICT_STYLE[verdict];
  if (!st) return null;
  return (
    <span className="hidden items-center gap-1.5 text-[12px] sm:flex" style={{ color: st.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />{st.label}
    </span>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-ctp-surface-2 ${className}`} />;
}

const SERVICES = [
  { id: 'url-scanner', title: 'URL Threat Scanner', description: 'Analyze any web link for phishing, credential harvesters and malicious servers.', icon: Link2, route: 'scanner' },
  { id: 'qr-scanner', title: 'QR Code Detector', description: 'Inspect QR codes from images or PDF invoices before opening them.', icon: QrCode, route: 'qr-scanner' },];

/**
 * Dashboard: live security overview (real backend statistics) followed by the tool launcher.
 * If the statistics cannot be loaded the overview says so; nothing is ever estimated.
 */
export default function Dashboard({ setActivePage }) {
  const reduced = useReducedMotion();
  const [stats, setStats] = useState(null);
  const [sec, setSec] = useState(null);
  const [engines, setEngines] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [main, security, status] = await Promise.allSettled([
        api.getDashboardStats(), api.getSecurityOverview(), api.getEngineStatus(),
      ]);
      if (main.status === 'rejected') throw main.reason;
      setStats(main.value);
      setSec(security.status === 'fulfilled' ? security.value : null);
      setEngines(status.status === 'fulfilled' ? status.value : null);
    } catch (err) {
      setStats(null);
      setError(err.message || 'Statistics are unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = stats?.total_scans ?? 0;

  return (
    <div className="space-y-12 py-6 sm:py-10">
      {/* Overview */}
      <section aria-labelledby="overview-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] tracking-wide text-ctp-accent-text">Dashboard</p>
            <h1 id="overview-title" className="ctp-display mt-2 text-[length:var(--ctp-text-h1)]">Security overview</h1>
          </div>
          <button type="button" onClick={load} disabled={loading} className="ctp-btn ctp-btn-ghost h-9 px-4 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-ctp-border bg-ctp-surface p-5 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ctp-warn" />
            <div>
              <p className="font-medium">Statistics unavailable</p>
              <p className="mt-1 text-ctp-text-2">{error}</p>
            </div>
          </div>
        )}

        {loading && !stats && !error && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard index={0} label="Total analyses" value={stats.total_scans} hint={`${stats.urls_analyzed} URLs`} total={total} />
              <StatCard index={1} label="Safe" value={stats.safe_count} hint="All channels" color="var(--ctp-safe)" total={total} />
              <StatCard index={2} label="Suspicious" value={stats.suspicious_count} hint="All channels" color="var(--ctp-warn)" total={total} />
              <StatCard index={3} label="Dangerous" value={stats.phishing_count} hint="All channels" color="var(--ctp-danger)" total={total} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
                className="rounded-2xl border border-ctp-border bg-ctp-surface p-6 lg:col-span-2"
              >
                <h2 className="mb-5 text-sm font-medium text-ctp-text-2">Threat overview</h2>
                <Donut safe={stats.safe_count} suspicious={stats.suspicious_count} danger={stats.phishing_count} unverified={stats.unverified_count || 0} />
                {stats.total_scans > stats.safe_count + stats.suspicious_count + stats.phishing_count + (stats.unverified_count || 0) && (
                  <p className="mt-5 text-[12px] text-ctp-text-muted">{stats.total_scans - (stats.safe_count + stats.suspicious_count + stats.phishing_count + (stats.unverified_count || 0))} analyses have no risk classification and are not shown.</p>
                )}
              </motion.div>

              <motion.div
                initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.32 }}
                className="rounded-2xl border border-ctp-border bg-ctp-surface p-6 lg:col-span-3"
              >
                <h2 className="mb-5 text-sm font-medium text-ctp-text-2">Most frequent threat indicators</h2>
                <IndicatorBars items={stats.top_threat_indicators || []} />
              </motion.div>
            </div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
              className="rounded-2xl border border-ctp-border bg-ctp-surface p-6"
            >
              <h2 className="mb-2 text-sm font-medium text-ctp-text-2">Recent scanning activity</h2>
              <Activity items={stats.recent_activity || []} />
            </motion.div>

            {sec && (
              <>
                <div className="pt-4">
                  <p className="text-[13px] tracking-wide text-ctp-accent-text">Threat detection</p>
                  <h2 className="ctp-display mt-2 text-[length:var(--ctp-text-h2)]">Links and QR codes</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                  <StatCard index={0} label="URLs scanned" value={sec.totals.urls_scanned} hint="Pasted links" />
                  <StatCard index={1} label="QR codes scanned" value={sec.totals.qr_scanned} hint="Images, PDFs, camera" />
                  <StatCard index={2} label="Malicious" value={sec.totals.malicious} hint="Dangerous verdicts" color="var(--ctp-danger)" total={sec.totals.urls_scanned + sec.totals.qr_scanned} />
                  <StatCard index={3} label="Suspicious" value={sec.totals.suspicious} hint="Caution advised" color="var(--ctp-warn)" total={sec.totals.urls_scanned + sec.totals.qr_scanned} />
                  <StatCard index={4} label="Safe" value={sec.totals.safe} hint="Confirmed low risk" color="var(--ctp-safe)" total={sec.totals.urls_scanned + sec.totals.qr_scanned} />
                  <StatCard index={5} label="Unverified" value={sec.totals.unverified} hint="Low risk, unconfirmed" color="var(--ctp-text-muted)" total={sec.totals.urls_scanned + sec.totals.qr_scanned} />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <div className="rounded-2xl border border-ctp-border bg-ctp-surface p-6 lg:col-span-3">
                    <h2 className="mb-5 text-sm font-medium text-ctp-text-2">Scans over the last 14 days</h2>
                    <TrendChart days={sec.timeline} />
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ctp-text-muted">
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-ctp-accent/70" />All scans</span>
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: 'var(--ctp-warn)' }} />Suspicious</span>
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: 'var(--ctp-danger)' }} />Dangerous</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ctp-border bg-ctp-surface p-6 lg:col-span-2">
                    <h2 className="mb-5 text-sm font-medium text-ctp-text-2">Flags by threat-intelligence source</h2>
                    {sec.source_detections.length ? (
                      <ul className="space-y-4">
                        {sec.source_detections.map((s) => (
                          <li key={s.source}>
                            <div className="flex items-baseline justify-between text-[13px]">
                              <span className="text-ctp-text-2">{s.source}</span>
                              <span className="tabular-nums"><strong className="font-medium">{s.flagged}</strong> <span className="text-ctp-text-muted">flagged / {s.queried} answered</span></span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ctp-border">
                              <div className="h-full rounded-full" style={{ width: `${s.queried ? (s.flagged / s.queried) * 100 : 0}%`, background: 'var(--ctp-danger)' }} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ctp-text-muted">No reputation source has answered a scan yet. Add API keys to enable them.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-ctp-border bg-ctp-surface p-6">
                  <h2 className="mb-2 text-sm font-medium text-ctp-text-2">Latest verdicts</h2>
                  {sec.recent.length ? (
                    <ul className="divide-y divide-ctp-border">
                      {sec.recent.slice(0, 6).map((r) => (
                        <li key={r.id} className="flex items-center gap-4 py-3">
                          <span className="w-12 shrink-0 rounded-md border border-ctp-border px-1.5 py-0.5 text-center text-[11px] text-ctp-text-muted">{r.type}</span>
                          <span className="min-w-0 flex-1 truncate text-sm" title={r.domain}>{r.domain}</span>
                          <VerdictChip verdict={r.verdict} />
                          <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{Math.round(r.score)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-ctp-text-muted">No scans yet.</p>}
                </div>
              </>
            )}

            {engines && (
              <div className="rounded-2xl border border-ctp-border bg-ctp-surface p-6">
                <h2 className="mb-5 text-sm font-medium text-ctp-text-2">Detection engines</h2>
                <EngineGrid data={engines} />
              </div>
            )}
          </>
        )}
      </section>

      {/* Tools */}
      <section aria-labelledby="tools-title" className="space-y-6">
        <h2 id="tools-title" className="ctp-display text-[length:var(--ctp-text-h2)]">Protection suite</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <TiltCard
                key={s.id}
                as="button"
                type="button"
                max={3}
                onClick={() => setActivePage(s.route)}
                className="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-ctp-border bg-ctp-surface p-6 text-left transition-colors hover:border-ctp-border-strong active:scale-[0.99] dashboard-service-card"
              >
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ctp-border bg-ctp-bg-2 text-ctp-accent-text transition-colors group-hover:border-ctp-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span className="relative z-10 min-w-0 flex-1">
                  <span className="block text-base font-medium">{s.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ctp-text-2">{s.description}</span>
                </span>
                <ArrowRight className="relative z-10 mt-1 h-4 w-4 shrink-0 text-ctp-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-ctp-accent-text" />
              </TiltCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
