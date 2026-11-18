/**
 * Scan-result sound feedback (Web Audio API, no audio files, nothing downloaded).
 *
 * Rules enforced here:
 *  - Off by default; the user turns it on explicitly (stored in localStorage).
 *  - Sounds only play for a real, received scan result (playScanResultSound), never on load
 *    or while a scan is running, and never twice for the same result.
 *  - Browsers only allow audio after a user gesture, so unlockAudio() must be called from a
 *    click/keypress handler (the scan button and the sound toggle both do).
 *  - Every failure is swallowed: audio problems never affect the visual result.
 */
import { classifyResult } from './verdict';

const STORAGE_KEY = 'catch_the_phish_sound';
let ctx = null;
let lastPlayedId = null;

export function isSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent('ctp-sound-change', { detail: !!on }));
}

/** Creates / resumes the AudioContext. Call from a user gesture. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** One enveloped note routed through the shared master chain. */
function tone(freq, start, dur, { type = 'sine', peak = 0.12, attack = 0.012, lowpass = null } = {}) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  let node = osc;
  if (lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    node.connect(filter);
    node = filter;
  }
  node.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  // ~430 ms: soft ascending two-tone chime ("everything looks good")
  safe: () => {
    tone(659.25, 0.0, 0.22, { type: 'sine', peak: 0.1 });
    tone(880.0, 0.13, 0.3, { type: 'sine', peak: 0.1 });
    tone(1318.5, 0.13, 0.24, { type: 'sine', peak: 0.025 }); // faint shimmer
  },
  // ~420 ms: gentle descending pair, triangle timbre ("take care")
  suspicious: () => {
    tone(466.16, 0.0, 0.2, { type: 'triangle', peak: 0.09 });
    tone(392.0, 0.17, 0.26, { type: 'triangle', peak: 0.09 });
  },
  // ~700 ms: low double pulse ("potential threat"), filtered so it is firm but never harsh
  danger: () => {
    tone(174.61, 0.0, 0.26, { type: 'sawtooth', peak: 0.13, lowpass: 520, attack: 0.008 });
    tone(174.61, 0.36, 0.3, { type: 'sawtooth', peak: 0.13, lowpass: 520, attack: 0.008 });
  },
};

/**
 * Plays the sound matching a real scan result, at most once per result.
 * Returns the verdict key that was handled (or null).
 */
export function playScanResultSound(result) {
  const verdict = classifyResult(result);
  if (!verdict) return null;

  const id = result?.id ?? null;
  if (id !== null && id === lastPlayedId) return verdict; // already handled this scan
  lastPlayedId = id;

  if (!isSoundEnabled()) return verdict;
  try {
    if (!ctx && !unlockAudio()) return verdict;
    if (ctx.state === 'suspended') {
      // Not unlocked by a gesture: stay silent rather than queueing a late, surprising sound.
      return verdict;
    }
    SOUNDS[verdict]();
  } catch {
    /* audio is optional */
  }
  return verdict;
}
