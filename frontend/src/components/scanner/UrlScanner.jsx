import React, { useEffect, useRef, useState } from 'react';
import { Lock, X, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { playScanResultSound, unlockAudio } from '../../lib/sound';
import SoundToggle from '../common/SoundToggle';

// What the server runs for every scan. Shown as "running" while the request is open; none of
// these is ever marked complete by the client — completion is the response itself.
const ENGINE_STAGES = ['URL structure', 'Rule engine', 'ML model', 'Link origin'];

/**
 * URL scanner. Every scan is a real request to the backend (api.scanUrl).
 * Progress is indeterminate on purpose: the beam and timer run until the server answers,
 * so the animation never implies a check has passed before the result exists.
 */
export default function UrlScanner({ onScanComplete, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!loading) return undefined;
    startedAt.current = performance.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 100);
    return () => clearInterval(id);
  }, [loading]);

  const handleScan = async (targetUrl = url) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Please enter or paste a valid URL to analyze.');
      return;
    }
    if (trimmed.length > 2048) {
      setError('URL exceeds maximum safe length of 2048 characters.');
      return;
    }

    unlockAudio(); // user gesture: lets the result sound play later, if the user enabled sound
    setError('');
    setLoading(true);
    try {
      const result = await api.scanUrl(trimmed);
      setLoading(false);
      playScanResultSound(result); // real result only; silent unless the user turned sound on
      onScanComplete(result);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to analyze URL. Verify that the backend service is running.');
    }
  };

  return (
    <div className="ctp-dark ctp-scanner relative w-full max-w-3xl mx-auto overflow-hidden rounded-3xl border border-ctp-border bg-ctp-surface text-ctp-text p-5 sm:p-7 shadow-[var(--ctp-shadow)]">
      {/* Scanning beam: a glowing line sweeping across the card while the request is in flight */}
      {loading && <span aria-hidden="true" className="ctp-scanbeam" />}

      <form className="relative" onSubmit={(e) => { e.preventDefault(); handleScan(); }}>
        <div className="relative flex items-center rounded-2xl border border-ctp-border-strong bg-ctp-bg transition-[border-color,box-shadow] duration-300 focus-within:border-ctp-accent focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ctp-accent)_16%,transparent)]">
          <input
            id="ctp-url-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (error) setError(''); }}
            disabled={loading}
            placeholder="Paste a suspicious link, e.g. http://paypa1-verify.xyz/login"
            className="ctp-scanner-input flex-1 min-w-0 bg-transparent px-4 py-4 font-mono text-[13px] sm:text-sm outline-none disabled:opacity-60"
          />
          {url && !loading && (
            <button
              type="button"
              onClick={() => { setUrl(''); setError(''); }}
              aria-label="Clear input"
              className="p-1.5 mr-1 rounded-full text-ctp-text-muted hover:text-ctp-text hover:bg-ctp-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" disabled={loading} className="ctp-btn ctp-btn-primary m-1.5 h-11 shrink-0 rounded-xl px-5 text-sm">
            {loading ? 'Scanning' : 'Scan'}
            {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
          </button>
        </div>

        {/* Honest progress: stages the server is running; elapsed time is real */}
        <div className="mt-3" aria-live="polite">
          {loading && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-[12px] text-ctp-text-2">
                <div className="ctp-indeterminate relative h-px flex-1 overflow-hidden bg-ctp-border" role="progressbar" aria-label="Scanning" />
                <span className="font-mono tabular-nums text-ctp-text-muted">Analyzing {elapsed.toFixed(1)}s</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {ENGINE_STAGES.map((s, i) => (
                  <li key={s} className="flex items-center gap-1.5 rounded-full border border-ctp-border px-2.5 py-1 text-[12px] text-ctp-text-2">
                    <span className="ctp-run-dot" style={{ animationDelay: `${i * 0.18}s` }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div role="alert" className="relative mt-1 flex items-start gap-2 rounded-xl border border-ctp-danger/30 bg-ctp-danger/10 px-3 py-2.5 text-[13px] text-ctp-danger">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-center gap-4 text-[13px] border-t border-ctp-border pt-4">
        <label htmlFor="ctp-url-input" className="sr-only">Link to check</label>
        <div className="flex items-center gap-2.5">
          <SoundToggle />
          <span className="hidden items-center gap-1.5 text-ctp-text-muted sm:flex">
            <Lock className="w-3.5 h-3.5" strokeWidth={1.6} />
            Never opened or executed
          </span>
        </div>
      </div>
    </div>
  );
}
