/**
 * Client-side mirror of backend/app/services/url_validation.py, so obviously invalid input is
 * rejected instantly. The server repeats the check (this one is only a convenience).
 *
 * Returns an error message string, or '' when the input looks like a web address.
 */
export const INVALID_URL_MESSAGE =
  'This is not a valid web address. Enter a full link such as https://example.com/login or a domain such as example.com.';
const SCHEME_MESSAGE = 'Only http and https links can be scanned.';

const HAS_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;
const SCHEME_NO_SLASHES = /^[A-Za-z][A-Za-z0-9+.-]*:(?!\d+(?:[/?#]|$))/; // javascript:..., mailto:...; not host:port
const LABEL = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;
const IPV4 = /^(\d{1,3})(\.\d{1,3}){3}$/;
const NUMERIC_HOST = /^(0x[0-9a-f]+|\d+)(\.(0x[0-9a-f]+|\d+)){0,3}$/i; // 2130706433, 0x7f000001

function validHost(rawHost) {
  let host = rawHost.toLowerCase().replace(/\.$/, '');
  if (!host || host.length > 253) return false;
  if (host.startsWith('[') && host.endsWith(']')) return true; // IPv6 literal, already parsed by URL()
  if (IPV4.test(host) || NUMERIC_HOST.test(host)) return true;
  if (host === 'localhost') return true;
  const labels = host.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((l) => LABEL.test(l))) return false;
  const tld = labels[labels.length - 1];
  return /^[a-z]{2,63}$/.test(tld) || /^xn--[a-z0-9-]{1,59}$/.test(tld);
}

export function validateUrlInput(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return 'Please enter or paste a valid URL to analyze.';
  if (/\s/.test(s)) return INVALID_URL_MESSAGE;

  let candidate;
  if (HAS_SCHEME.test(s)) candidate = s;
  else if (SCHEME_NO_SLASHES.test(s)) return SCHEME_MESSAGE;
  else candidate = `http://${s}`;

  let parsed;
  try {
    parsed = new URL(candidate); // lowercases the host and converts internationalised names to punycode
  } catch {
    return INVALID_URL_MESSAGE;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return SCHEME_MESSAGE;
  return validHost(parsed.hostname) ? '' : INVALID_URL_MESSAGE;
}
