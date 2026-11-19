// Shared helpers for the service worker, popup and options page.

export const DEFAULT_APP_URL = 'https://catch-the-phish-app.vercel.app';
export const NOT_CONFIGURED = 'NOT_CONFIGURED';

export async function getConfig() {
  const { apiBase = '', appUrl = DEFAULT_APP_URL } = await chrome.storage.local.get(['apiBase', 'appUrl']);
  return { apiBase, appUrl };
}

/** Returns a trimmed link, or null when it is empty, too long or contains control characters. */
export function cleanTarget(text) {
  const s = String(text || '').trim();
  if (!s || s.length > 2048 || /[\r\n\t]/.test(s)) return null;
  return s;
}

/**
 * Sends ONE link, chosen by the user, to the configured Catch the Phish API for static analysis.
 * Nothing else (no page content, history or cookies) is ever sent.
 */
export async function scanLink(url) {
  const { apiBase } = await getConfig();
  if (!apiBase) throw new Error(NOT_CONFIGURED);

  let res;
  try {
    res = await fetch(`${apiBase}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error('The analysis service could not be reached. If it has been idle it may be waking up, so try again in a minute.');
  }
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
      else if (Array.isArray(body?.detail) && body.detail[0]?.msg) detail = String(body.detail[0].msg).replace(/^Value error,\s*/i, '');
    } catch { /* non-JSON error */ }
    throw new Error(detail || `The service answered with an error (${res.status}).`);
  }
  return res.json();
}

/** Same bands as the website: 0-30 low risk, 31-60 suspicious, 61-100 dangerous. */
export function verdictOf(result) {
  const score = Number(result?.risk_score);
  const cls = String(result?.classification || '').toUpperCase();
  if (cls === 'PHISHING' || cls === 'DANGEROUS' || (Number.isFinite(score) && score >= 61)) return { key: 'danger', label: 'Dangerous' };
  if (cls === 'SUSPICIOUS' || (Number.isFinite(score) && score >= 31)) return { key: 'suspicious', label: 'Suspicious' };
  return { key: 'safe', label: 'Low risk' };
}

export function reportUrl(appUrl, link) {
  return `${String(appUrl || DEFAULT_APP_URL).replace(/\/+$/, '')}/?scan=${encodeURIComponent(link)}`;
}

/** Validates a service address. Only https, or http for a local development backend. */
export function parseServiceUrl(input) {
  let u;
  try {
    u = new URL(String(input || '').trim());
  } catch {
    return null;
  }
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) return null;
  return u;
}
