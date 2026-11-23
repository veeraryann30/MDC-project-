import { classifyResult } from './verdict';
import { explainResult } from './explain';

const TITLES = {
  danger: 'High risk detected',
  suspicious: 'This link looks suspicious',
  unverified: 'Not verified. Treat it as unknown',
  safe: 'No significant threats detected',
};

/**
 * Everything the short result view needs, derived from a real scan result:
 * verdict state + label, a one-line headline, and up to three actions.
 * Shared by the URL results page and the QR results.
 *
 * options.fallbackActions   - actions to use when the AI analyst did not write any
 * options.preferFallback    - use them even when generic plain-English steps exist
 */
export function heroProps(result, options = {}) {
  const { fallbackActions = [], preferFallback = false } = options;
  const ai = result.ai_analysis || result.engine?.ai_analysis;
  const state = classifyResult(result) || 'unverified';
  const engineVerdict = String(result.verdict || '').toUpperCase();
  const label = {
    danger: 'Dangerous',
    suspicious: 'Suspicious',
    unverified: 'Unverified',
    safe: engineVerdict === 'SAFE' ? 'Safe' : 'Low risk',
  }[state];

  const headline = ai?.headline || TITLES[state];

  let actions = [];
  if (String(ai?.generated_by || '').startsWith('groq:') && ai.recommendations?.length) {
    actions = ai.recommendations.slice(0, 3).map((t) => ({ title: t }));
  } else if (preferFallback && fallbackActions.length) {
    actions = fallbackActions.slice(0, 3).map((t) => ({ title: t }));
  } else {
    actions = (explainResult(result)?.steps || []).slice(0, 3).map((s) => ({ title: s.strong, detail: s.rest }));
    if (!actions.length) actions = fallbackActions.slice(0, 3).map((t) => ({ title: t }));
  }

  return { state, label, headline, actions, ai };
}
