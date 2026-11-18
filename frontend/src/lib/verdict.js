/**
 * Maps a real backend scan result to a verdict key. Thresholds mirror the backend bands
 * (0-30 safe, 31-60 suspicious, 61-100 dangerous) and the classification the API returns.
 * Returns null when the result carries no usable score, so nothing is ever assumed safe.
 */
export function classifyResult(result) {
  if (!result) return null;
  const score = Number(result.risk_score);
  const cls = String(result.classification || '').toUpperCase();
  if (cls === 'PHISHING' || cls === 'DANGEROUS' || (Number.isFinite(score) && score >= 61)) return 'danger';
  if (cls === 'SUSPICIOUS' || (Number.isFinite(score) && score >= 31)) return 'suspicious';
  if (cls === 'SAFE' || (Number.isFinite(score) && score >= 0)) return 'safe';
  return null;
}
