/**
 * Turns a real scan result into plain-English guidance for non-technical readers.
 * Nothing here is invented: every reason comes from a finding the backend actually returned
 * (threats_detected / safe_indicators / breakdown). The wording is just simpler than the
 * forensic text shown further down the page.
 */
import { classifyResult } from './verdict';

// Plain-English version of each rule the backend can raise (ids from rule_engine.py).
const PLAIN_THREATS = {
  brand_impersonation: {
    title: 'It pretends to be a real company',
    plain: "The web address is made to look like a well-known brand, but it isn't that company's real website.",
  },
  ip_address_host: {
    title: 'It uses numbers instead of a website name',
    plain: 'The link points to a string of numbers rather than a normal website name. Real companies almost never do this.',
  },
  suspicious_port: {
    title: 'It uses an unusual connection setting',
    plain: 'The link uses a connection setting that ordinary websites rarely use, which is common on throwaway scam servers.',
  },
  punycode_homograph: {
    title: 'It uses look-alike letters',
    plain: 'The address contains special characters that can pass for normal letters, a trick used to copy real websites.',
  },
  url_shortener: {
    title: "You can't see where it really goes",
    plain: 'This is a shortened link, so the real destination is hidden until you click it.',
  },
  suspicious_tld: {
    title: 'The address ending is popular with scammers',
    plain: 'The ending of the web address (like .xyz or .top) is very cheap to register and is often used for scam sites.',
  },
  excessive_subdomains: {
    title: 'The address is padded to hide the real site',
    plain: 'The address has lots of extra parts, a trick to push the real website name out of sight.',
  },
  at_symbol_trick: {
    title: 'It contains a hidden redirect symbol',
    plain: "The address contains an '@', which can make it look like it goes to one website while it really goes to another.",
  },
  credential_keywords: {
    title: 'It asks for your login in the address',
    plain: "The address contains words like 'login' or 'verify', which scams use to get you to type your password.",
  },
  http_insecure_transport: {
    title: "The connection isn't protected",
    plain: "The site doesn't use encryption, so anything you type could be seen by other people.",
  },
  double_slash_redirect: {
    title: 'It may send you somewhere else',
    plain: 'The address has a hidden redirect that can take you to a different website than the one it appears to show.',
  },
  high_entropy_domain: {
    title: 'The website name looks random',
    plain: 'The website name looks like random characters, which is typical of throwaway scam sites.',
  },
};

const PLAIN_SAFE = {
  https_present: 'The connection is encrypted (HTTPS).',
  clean_domain_structure: 'The web address is plain and simple, with none of the usual disguise tricks.',
};

const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const STEPS = {
  danger: [
    { strong: "Don't open it or type anything.", rest: 'Close the page. Do not enter passwords, card details or one-time codes.' },
    { strong: 'Go to the real site yourself.', rest: 'If the link claimed to be from a bank, shop or delivery company, type their official address into your browser or use their app.' },
    { strong: 'Already entered something?', rest: 'Change that password right away, turn on two-step sign-in, and tell your bank if you shared card details.' },
    { strong: 'Report and delete the message.', rest: 'Mark it as phishing in your email or messaging app so others are protected too.' },
  ],
  suspicious: [
    { strong: "Don't enter passwords or codes yet.", rest: "Treat this link as unverified until you've checked it another way." },
    { strong: 'Check with the sender.', rest: "If it came from someone you know or a company, confirm using a phone number or app you already trust, not the one in the message." },
    { strong: 'When unsure, skip the link.', rest: 'Type the official website address into your browser instead.' },
  ],
  unverified: [
    { strong: "Treat it as unknown, not as safe.", rest: 'Nothing looked wrong, but no outside security service could confirm this link either.' },
    { strong: "Don't enter passwords or codes until you're sure.", rest: 'Check with whoever sent it, using a phone number or app you already trust.' },
    { strong: 'When unsure, type the official address yourself.', rest: 'That avoids any hidden redirect or look-alike address.' },
  ],
  safe: [
    { strong: 'Check the message makes sense.', rest: 'A safe-looking link can still come from a scam message, so make sure you were expecting it.' },
    { strong: 'Read the address before you sign in.', rest: 'Make sure the name in your browser bar is spelled exactly as the real site.' },
  ],
};

const TITLES = {
  danger: { heading: 'Why this is risky', sub: 'The main warning signs we found, in plain English.' },
  suspicious: { heading: 'Why this looks suspicious', sub: 'The main things that made us cautious, in plain English.' },
  safe: { heading: 'Why this looks okay', sub: "What we checked and didn't find a problem with." },
  unverified: { heading: 'Why we can\'t call this safe', sub: 'Low warning signs, but nothing independent confirmed it.' },
};

/**
 * @returns {{state: 'safe'|'suspicious'|'danger', heading: string, sub: string,
 *            reasons: {title: string, plain: string, severity?: string}[],
 *            steps: {strong: string, rest: string}[], note?: string} | null}
 */
export function explainResult(result) {
  const state = classifyResult(result);
  if (!state) return null;

  const threats = Array.isArray(result.threats_detected) ? result.threats_detected : [];
  const safeSignals = Array.isArray(result.safe_indicators) ? result.safe_indicators : [];

  let reasons = [];
  let note;

  if (state === 'safe') {
    reasons = safeSignals
      .map((s) => ({ title: s.title, plain: PLAIN_SAFE[s.id] || s.what_was_detected || s.title }))
      .slice(0, 3);
    if (reasons.length === 0) {
      reasons = [{ title: 'No warning signs found', plain: 'None of our checks found a known trick in this link.' }];
    }
    note = 'Low risk is not a guarantee. No tool can promise a link is safe, so stay alert.';
  } else {
    reasons = threats
      .filter((t) => SEVERITY_RANK[String(t.severity).toUpperCase()])
      .map((t, idx) => ({ t, idx, rank: SEVERITY_RANK[String(t.severity).toUpperCase()] }))
      .sort((a, b) => b.rank - a.rank || a.idx - b.idx)
      .slice(0, 3)
      .map(({ t }) => {
        const p = PLAIN_THREATS[t.id];
        return {
          title: p?.title || t.title,
          plain: p?.plain || t.what_was_detected || t.why_it_matters || t.title,
          severity: String(t.severity).toUpperCase(),
        };
      });

    if (reasons.length === 0 && state === 'unverified') {
      reasons = [{
        title: 'No warning signs, but no confirmation either',
        plain: 'Our checks found no obvious tricks, but no outside security service has verified this link, so it is treated as unknown rather than safe.',
      }];
      note = 'A brand-new scam link can look clean for hours before security services list it.';
    }
    if (reasons.length === 0) {
      reasons = [{
        title: 'It matches patterns seen in scam links',
        plain: "No single obvious trick stands out, but our detection model found this link's overall pattern similar to known scam links.",
      }];
    }
  }

  return { state, ...TITLES[state], reasons, steps: STEPS[state], note };
}
