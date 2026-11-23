import React, { useEffect, useState } from 'react';
import { Flag, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

/**
 * "Report this link" / "Mark as safe". Sends the user's label for this scan to the backend,
 * where it is stored for review. It does not change the score shown here.
 */
export default function FeedbackBar({ scanId, compact = false }) {
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [label, setLabel] = useState(null);
  const [error, setError] = useState('');

  // A new scan means a fresh question.
  useEffect(() => {
    setStatus('idle');
    setLabel(null);
    setError('');
  }, [scanId]);

  if (typeof scanId !== 'number') return null;

  const send = async (next) => {
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await api.sendFeedback(scanId, next);
      setLabel(next);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Your feedback could not be sent. Please try again.');
      setStatus('error');
    }
  };

  const btn =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-[border-color,color,background-color,transform] duration-200 hover:-translate-y-px active:translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent';
  const idle = 'border-ctp-border-strong text-ctp-text-2 hover:text-ctp-text hover:border-ctp-accent';
  const picked = 'border-ctp-accent bg-ctp-accent/10 text-ctp-text';
  const sending = status === 'sending';

  if (compact) {
    const chip = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent';
    return (
      <div aria-label="Give feedback on this verdict" role="group" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12.5px] text-ctp-text-muted">
        <span>Verdict wrong?</span>
        <button type="button" disabled={sending} onClick={() => send('phishing')} aria-pressed={status === 'done' && label === 'phishing'} className={`${chip} ${status === 'done' && label === 'phishing' ? picked : idle}`}>
          <Flag className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />Report
        </button>
        <button type="button" disabled={sending} onClick={() => send('safe')} aria-pressed={status === 'done' && label === 'safe'} className={`${chip} ${status === 'done' && label === 'safe' ? picked : idle}`}>
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />Mark as safe
        </button>
        <span aria-live="polite">
          {sending && 'Sending…'}
          {status === 'done' && <span className="inline-flex items-center gap-1 text-ctp-text-2"><Check className="h-3.5 w-3.5" style={{ color: 'var(--ctp-safe)' }} aria-hidden="true" />Thanks</span>}
          {status === 'error' && <span role="alert" className="text-ctp-danger">{error}</span>}
        </span>
      </div>
    );
  }

  return (
    <section
      aria-label="Give feedback on this verdict"
      className="ctp-dark flex flex-col gap-4 rounded-3xl border border-ctp-border bg-ctp-surface p-5 text-ctp-text sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium">Is this verdict wrong?</h2>
        <p className="mt-0.5 text-[13px] text-ctp-text-muted">
          Tell us what you think this link is. We use your feedback to review mistakes, including false alarms.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={sending}
            onClick={() => send('phishing')}
            aria-pressed={status === 'done' && label === 'phishing'}
            className={`${btn} ${status === 'done' && label === 'phishing' ? picked : idle}`}
          >
            <Flag className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            Report this link
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => send('safe')}
            aria-pressed={status === 'done' && label === 'safe'}
            className={`${btn} ${status === 'done' && label === 'safe' ? picked : idle}`}
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            Mark as safe
          </button>
        </div>

        <div aria-live="polite" className="min-h-[18px] text-[12.5px]">
          {sending && <span className="text-ctp-text-muted">Sending…</span>}
          {status === 'done' && (
            <span className="inline-flex items-center gap-1.5 text-ctp-text-2">
              <Check className="h-3.5 w-3.5" style={{ color: 'var(--ctp-safe)' }} strokeWidth={2.2} aria-hidden="true" />
              Thanks. You marked this as {label === 'phishing' ? 'phishing' : 'safe'}. You can change your answer.
            </span>
          )}
          {status === 'error' && (
            <span role="alert" className="inline-flex items-center gap-1.5 text-ctp-danger">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {error}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
