/**
 * Maps a real backend scan result to a verdict key.
 *
 * The unified threat engine sends an explicit `verdict` (SAFE | SUSPICIOUS | DANGEROUS | UNVERIFIED);
 * older records only carry `classification` + `risk_score`, which mirror the same bands
 * (0-30 safe, 31-60 suspicious, 61-100 dangerous).
 *
 * "unverified" means: low risk indicators, but no independent source confirmed the link.
 * It is deliberately NOT "safe" - an unknown URL is never treated as safe.
 * Returns null when the result carries no usable score, so nothing is ever assumed safe.
 */
export function classifyResult(result) {
  if (!result) return null;
  const v = String(result.verdict || '').toUpperCase();
  if (v === 'DANGEROUS') return 'danger';
  if (v === 'SUSPICIOUS') return 'suspicious';
  if (v === 'UNVERIFIED') return 'unverified';
  if (v === 'SAFE') return 'safe';

  const score = Number(result.risk_score);
  const cls = String(result.classification || '').toUpperCase();
  if (cls === 'UNVERIFIED') return 'unverified';
  if (cls === 'PHISHING' || cls === 'DANGEROUS' || (Number.isFinite(score) && score >= 61)) return 'danger';
  if (cls === 'SUSPICIOUS' || (Number.isFinite(score) && score >= 31)) return 'suspicious';
  if (cls === 'SAFE' || (Number.isFinite(score) && score >= 0)) return 'safe';
  return null;
}
