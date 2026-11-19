import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, unlockAudio, playClick } from '../../lib/sound';

/**
 * Sound effects on/off switch. On by default (audio starts after the first interaction,
 * as browsers require). The choice is persisted in localStorage.
 */
export default function SoundToggle({ variant = 'pill', className = '' }) {
  const [on, setOn] = useState(isSoundEnabled);

  useEffect(() => {
    const sync = (e) => setOn(!!e.detail);
    window.addEventListener('ctp-sound-change', sync);
    return () => window.removeEventListener('ctp-sound-change', sync);
  }, []);

  const toggle = () => {
    const next = !on;
    if (next) unlockAudio();
    setSoundEnabled(next);
    setOn(next);
    if (next) playClick(); // confirmation; the global listener ran before the switch flipped
  };

  const Icon = on ? Volume2 : VolumeX;
  const label = on ? 'Sound effects: on' : 'Sound effects: off';

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Sound effects"
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-ctp-border-strong transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent ${on ? 'bg-ctp-accent-solid' : 'bg-ctp-surface-2'} ${className}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ctp-border px-2.5 py-1 text-[12px] text-ctp-text-2 transition-colors duration-200 hover:border-ctp-border-strong hover:text-ctp-text cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctp-accent ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
      Sound {on ? 'on' : 'off'}
    </button>
  );
}
