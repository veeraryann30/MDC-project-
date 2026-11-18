import React, { useEffect, useRef, useState } from 'react';
import { Lock, X, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

const SAMPLE_URLS = [
  { label: 'Safe corporate', url: 'https://www.google.com/search?q=cybersecurity+research' },
  { label: 'Brand lookalike', url: 'http://paypa1-account-verification.xyz/login.php' },
  { label: 'Raw IP + port', url: 'http://192.168.1.100:8080/secure/bank-login.asp' },
  { label: 'Punycode homoglyph', url: 'http://xn--gogle-pra.com/signin/v2/identifier' },
];

/**
 * URL scanner. Every scan is a real request to the backend (api.scanUrl).
 * Progress is indeterminate on purpose: it runs until the server answers,
 * and shows real elapsed time instead of invented stages.
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

    setError('');
    setLoading(true);
    try {
      const result = await api.scanUrl(trimmed);
      setLoading(false);
      onScanComplete(result);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to analyze URL. Verify that the backend service is running.');
    }
  };

  return (
    <div className="ctp-dark ctp-scanner w-full max-w-3xl mx-auto rounded-2xl border border-ctp-border bg-ctp-surface text-ctp-text p-5 sm:p-7 shadow-[var(--ctp-shadow)]">
      <div className="flex items-center justify-between text-[13px]">
        <label htmlFor="ctp-url-input" className="font-medium text-ctp-text">Link to check</label>
        <span className="flex items-center gap-1.5 text-ctp-muted">
          <Lock className="w-3.5 h-3.5" strokeWidth={1.6} />
          Never opened or executed
        </span>
      </div>

      <form
        className="mt-3 relative"
        onSubmit={(e) => { e.preventDefault(); handleScan(); }}
      >
        <div className="relative flex items-center rounded-xl border border-ctp-border-strong bg-ctp-bg transition-[border-color,box-shadow] duration-300 focus-within:border-ctp-accent focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ctp-accent)_16%,transparent)]">
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
              className="p-1.5 mr-1 rounded-full text-ctp-muted hover:text-ctp-text hover:bg-ctp-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="group m-1.5 inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-ctp-accent px-5 text-sm font-medium text-ctp-accent-ink transition-[transform,opacity] duration-200 active:scale-[0.97] disabled:opacity-60 cursor-pointer disabled:cursor-wait focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent"
          >
            {loading ? 'Scanning' : 'Scan'}
            {!loading && <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />}
          </button>
        </div>

        {/* Honest, indeterminate progress: runs until the backend responds */}
        <div className="mt-4 h-[18px]" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-3 text-[12px] text-ctp-text-2">
              <div className="ctp-indeterminate relative h-px flex-1 overflow-hidden bg-ctp-border" role="progressbar" aria-label="Scanning" />
              <span className="font-mono tabular-nums text-ctp-muted">Analyzing {elapsed.toFixed(1)}s</span>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-1 flex items-start gap-2 rounded-lg border border-ctp-danger/30 bg-ctp-danger/10 px-3 py-2.5 text-[13px] text-ctp-danger">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]">
        <span className="text-ctp-muted mr-1">Try</span>
        {SAMPLE_URLS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            disabled={loading}
            onClick={() => { setUrl(sample.url); handleScan(sample.url); }}
            className="rounded-full border border-ctp-border px-3 py-1.5 text-ctp-text-2 transition-colors duration-200 hover:border-ctp-border-strong hover:text-ctp-text disabled:opacity-50 cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
