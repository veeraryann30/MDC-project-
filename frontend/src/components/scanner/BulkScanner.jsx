import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, FileUp, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';
import { classifyResult } from '../../lib/verdict';

const MAX_LINKS = 25;
const MAX_FILE_BYTES = 256 * 1024;

const VERDICT = {
  danger: { label: 'Dangerous', color: 'var(--ctp-danger)' },
  suspicious: { label: 'Suspicious', color: 'var(--ctp-warn)' },
  safe: { label: 'Low risk', color: 'var(--ctp-safe)' },
};

/** Splits pasted / uploaded text into unique link-looking tokens (must contain a dot). */
export function extractLinks(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text || '').split(/[\s,;]+/)) {
    const token = raw.replace(/^["'<(\[]+|["'>)\],.]+$/g, '');
    if (!token || !/[^\s/]+\.[^\s/]+/.test(token) || token.length > 2048 || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/** Spreadsheet-safe CSV cell: quote it, and defuse values a spreadsheet would run as a formula. */
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(items, scannedAt = new Date()) {
  const header = ['url', 'domain', 'verdict', 'risk_score', 'main_reasons', 'error', 'scanned_at_utc'];
  const rows = items.map((it) => {
    const key = it.ok ? classifyResult(it) : null;
    return [
      it.url,
      it.domain || '',
      key ? VERDICT[key].label : 'Not checked',
      it.ok ? Math.round(it.risk_score) : '',
      (it.top_reasons || []).join('; '),
      it.error || '',
      scannedAt.toISOString(),
    ];
  });
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function downloadCsv(items) {
  const blob = new Blob([buildCsv(items)], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/\D/g, '');
  a.href = href;
  a.download = `catch-the-phish-bulk-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/**
 * Bulk link checker: paste or upload a list, get a table, export it as CSV.
 * Every row is a real backend result (api.scanBulk); links that fail are shown as not checked.
 */
export default function BulkScanner() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);

  const links = useMemo(() => extractLinks(text), [text]);
  const overLimit = links.length > MAX_LINKS;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is too large. Use a .txt or .csv file under 256 KB.');
      return;
    }
    try {
      const content = await file.text();
      const found = extractLinks(content);
      if (found.length === 0) {
        setError('No links were found in that file.');
        return;
      }
      setText((prev) => (prev.trim() ? `${prev.trim()}\n${found.join('\n')}` : found.join('\n')));
      setNotice(`Added ${found.length} link${found.length === 1 ? '' : 's'} from ${file.name}.`);
    } catch {
      setError('That file could not be read.');
    }
  };

  const handleScan = async () => {
    if (links.length === 0) {
      setError('Paste at least one link, one per line.');
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const data = await api.scanBulk(links.slice(0, MAX_LINKS));
      const sorted = [...data.items].sort((a, b) => (b.ok ? b.risk_score : -1) - (a.ok ? a.risk_score : -1));
      setResults({ ...data, items: sorted });
    } catch (err) {
      setError(err.message || 'The bulk check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const counts = results
    ? results.items.reduce(
        (acc, it) => {
          const k = it.ok ? classifyResult(it) : 'failed';
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        },
        { danger: 0, suspicious: 0, safe: 0, failed: 0 }
      )
    : null;

  return (
    <div className="ctp-dark ctp-scanner relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-ctp-border bg-ctp-surface p-5 text-ctp-text shadow-[var(--ctp-shadow)] sm:p-7">
      {loading && <span aria-hidden="true" className="ctp-scanbeam" />}

      <div className="relative flex items-center justify-between gap-3 text-[13px]">
        <label htmlFor="ctp-bulk-input" className="font-medium">Links to check</label>
        <span className="text-ctp-text-muted">Up to {MAX_LINKS} at a time</span>
      </div>

      <div className="relative mt-3 rounded-2xl border border-ctp-border-strong bg-ctp-bg transition-[border-color,box-shadow] duration-300 focus-within:border-ctp-accent focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ctp-accent)_16%,transparent)]">
        <textarea
          id="ctp-bulk-input"
          value={text}
          onChange={(e) => { setText(e.target.value); if (error) setError(''); if (notice) setNotice(''); }}
          disabled={loading}
          rows={6}
          spellCheck={false}
          placeholder={'Paste links here, one per line\nhttp://paypa1-verify.xyz/login\nhttps://www.google.com'}
          className="ctp-scanner-input block w-full resize-y bg-transparent px-4 py-4 font-mono text-[13px] outline-none disabled:opacity-60"
        />
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2.5">
        <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFile} className="sr-only" aria-label="Upload a .txt or .csv file of links" tabIndex={-1} />
        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-ctp-border-strong px-4 py-2 text-[13px] text-ctp-text-2 transition-colors hover:border-ctp-accent hover:text-ctp-text disabled:opacity-50 cursor-pointer"
        >
          <FileUp className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          Upload .txt / .csv
        </button>
        {text && !loading && (
          <button
            type="button"
            onClick={() => { setText(''); setError(''); setNotice(''); }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-ctp-text-muted transition-colors hover:text-ctp-text cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        )}

        <span className={`ml-auto text-[13px] tabular-nums ${overLimit ? 'text-ctp-warn' : 'text-ctp-text-muted'}`} aria-live="polite">
          {links.length === 0
            ? 'No links yet'
            : overLimit
              ? `${links.length} links found. Only the first ${MAX_LINKS} will be checked`
              : `${links.length} link${links.length === 1 ? '' : 's'} ready`}
        </span>
        <button type="button" onClick={handleScan} disabled={loading || links.length === 0} className="ctp-btn ctp-btn-primary h-11 rounded-xl px-5 text-sm">
          {loading ? 'Checking' : 'Check all'}
          {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
        </button>
      </div>

      <div aria-live="polite" className="relative mt-3 min-h-[20px] text-[13px] text-ctp-text-muted">
        {loading && <span>Checking {Math.min(links.length, MAX_LINKS)} links. This can take a little while…</span>}
        {!loading && notice && <span>{notice}</span>}
      </div>

      {error && (
        <div role="alert" className="relative mt-2 flex items-start gap-2 rounded-xl border border-ctp-danger/30 bg-ctp-danger/10 px-3 py-2.5 text-[13px] text-ctp-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {results && (
        <div className="relative mt-6 border-t border-ctp-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-2 text-[12.5px]" aria-label="Summary">
              {[['danger', counts.danger], ['suspicious', counts.suspicious], ['safe', counts.safe]].map(([k, n]) => (
                <li key={k} className="flex items-center gap-1.5 rounded-full border border-ctp-border px-3 py-1">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: VERDICT[k].color }} />
                  {n} {VERDICT[k].label.toLowerCase()}
                </li>
              ))}
              {counts.failed > 0 && (
                <li className="rounded-full border border-ctp-border px-3 py-1 text-ctp-text-muted">{counts.failed} not checked</li>
              )}
            </ul>
            <button
              type="button"
              onClick={() => downloadCsv(results.items)}
              className="inline-flex items-center gap-2 rounded-full border border-ctp-border-strong px-4 py-2 text-[13px] font-medium transition-colors hover:border-ctp-accent cursor-pointer"
            >
              <Download className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Export CSV
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-ctp-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
              <caption className="sr-only">Results for each link, highest risk first</caption>
              <thead className="bg-ctp-bg text-ctp-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Link</th>
                  <th scope="col" className="px-4 py-3 font-medium">Verdict</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Score</th>
                  <th scope="col" className="px-4 py-3 font-medium">Main reason</th>
                </tr>
              </thead>
              <tbody>
                {results.items.map((it) => {
                  const key = it.ok ? classifyResult(it) : null;
                  const v = key ? VERDICT[key] : null;
                  return (
                    <tr key={it.url} className="border-t border-ctp-border align-top">
                      <td className="max-w-[260px] px-4 py-3 font-mono text-[12.5px]">
                        <span className="block truncate" title={it.url}>{it.url}</span>
                      </td>
                      <td className="px-4 py-3">
                        {v ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium" style={{ color: v.color }}>
                            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                            {v.label}
                          </span>
                        ) : (
                          <span className="text-ctp-text-muted">Not checked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{it.ok ? Math.round(it.risk_score) : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text-2">
                        {it.ok ? (it.top_reasons?.[0] || 'No warning signs found') : it.error}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12.5px] text-ctp-text-muted">
            Links are analysed from their text only and are never opened.          </p>
        </div>
      )}
    </div>
  );
}
