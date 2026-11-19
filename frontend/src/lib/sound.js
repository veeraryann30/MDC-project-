/**
 * Scan-result sound feedback (Web Audio API, no audio files, nothing downloaded).
 *
 * Rules enforced here:
 *  - On by default, but silent until the user's first interaction (browser autoplay rules).
 *    The Settings toggle persists the choice in localStorage.
 *  - A subtle UI click plays for interactive elements (initClickSounds, installed once in main.jsx).
 *  - Result sounds only play for a real, received scan result (playScanResultSound), never on load
 *    or while a scan is running, and never twice for the same result.
 *  - Browsers only allow audio after a user gesture, so unlockAudio() must be called from a
 *    click/keypress handler (the scan button and the sound toggle both do).
 *  - Every failure is swallowed: audio problems never affect the visual result.
 */
import { classifyResult } from './verdict';

const STORAGE_KEY = 'catch_the_phish_sound';
let ctx = null;
let lastPlayedId = null;

/** On unless the user explicitly switched it off. Audio still stays silent until the first gesture. */
export function isSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
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

/* ---------------- UI click sound ---------------- */

const CLICK_MIN_GAP_MS = 70; // also swallows the synthetic second click a <label> fires
let lastClickAt = 0;

/** ~55 ms soft digital tick: a short sine with a tiny downward pitch glide plus a faint upper partial. */
export function playClick() {
  try {
    if (!isSoundEnabled() || !ctx || ctx.state !== 'running') return;
    const now = performance.now();
    if (now - lastClickAt < CLICK_MIN_GAP_MS) return;
    lastClickAt = now;

    const t0 = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 5200;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.055);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(1500, t0);
    body.frequency.exponentialRampToValueAtTime(950, t0 + 0.05);
    body.connect(filter);

    const air = ctx.createOscillator();
    const airGain = ctx.createGain();
    airGain.gain.value = 0.25;
    air.type = 'sine';
    air.frequency.setValueAtTime(3000, t0);
    air.connect(airGain);
    airGain.connect(filter);

    body.start(t0);
    air.start(t0);
    body.stop(t0 + 0.07);
    air.stop(t0 + 0.07);
  } catch {
    /* audio is optional */
  }
}

const CLICKABLE =
  'button, a[href], summary, select, [role="button"], [role="tab"], [role="menuitem"], [role="option"], ' +
  '[role="switch"], [role="checkbox"], [role="radio"], [role="link"], label[for], ' +
  'input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="file"], ' +
  '[data-click-sound]';

function isDisabled(el) {
  return !!el.closest('[disabled], [aria-disabled="true"], [data-no-click-sound], fieldset:disabled');
}

/** True for native/ARIA controls, or for custom cards/rows that show a pointer cursor. */
function isInteractive(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest(CLICKABLE)) return !isDisabled(target);
  let el = target;
  for (let i = 0; el && el !== document.body && i < 6; i += 1, el = el.parentElement) {
    if (getComputedStyle(el).cursor === 'pointer') return !isDisabled(target);
  }
  return false;
}

let clickSoundsInstalled = false;

/** Installs one document-level listener pair. Safe to call more than once. */
export function initClickSounds() {
  if (clickSoundsInstalled || typeof document === 'undefined') return;
  clickSoundsInstalled = true;

  // Any first gesture unlocks audio (autoplay policy); later ones just resume if the tab suspended it.
  const unlock = () => {
    if (!ctx || ctx.state === 'suspended') unlockAudio();
  };
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true, passive: true });

  // Capture phase and passive: never interferes with (or blocks) the element's own handlers.
  document.addEventListener(
    'click',
    (e) => {
      if (isInteractive(e.target)) playClick();
    },
    { capture: true, passive: true }
  );
}

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
