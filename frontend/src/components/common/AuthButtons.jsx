import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

function initials(user) {
  const src = (user.full_name || user.email || '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
}

/**
 * Signed out: "Log in" and "Sign up". Signed in: an account menu with the name, email, role and Log out.
 * `compact` keeps it small enough for the console's top bar on phones.
 */
export default function AuthButtons({ compact = false, quietSignup = false, onNavigate }) {
  const { user, loading, openAuth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (loading) return <span className="h-9 w-20" aria-hidden="true" />; // reserve space: no layout jump

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => { onNavigate?.(); openAuth('login'); }} className={`ctp-btn ctp-btn-ghost ${compact ? 'h-8 px-3 border border-ctp-border' : 'h-9 px-4'} text-xs`}>
          Log in
        </button>
        <button type="button" onClick={() => { onNavigate?.(); openAuth('signup'); }} className={`ctp-btn ${quietSignup ? 'ctp-btn-ghost border border-ctp-border' : 'ctp-btn-primary'} ${compact ? 'h-8 px-3 max-[480px]:hidden' : 'h-9 px-4'} text-xs`}>
          Sign up
        </button>
      </div>
    );
  }

  const name = user.full_name || user.email;
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-ctp-border bg-ctp-surface py-1 pl-1 pr-2.5 text-xs text-ctp-text transition-colors hover:border-ctp-border-strong"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ctp-accent/20 text-[11px] font-semibold text-ctp-accent-text" aria-hidden="true">{initials(user)}</span>
        <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ctp-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="sr-only">Account menu for {name}</span>
      </button>

      {open && (
        <div role="menu" className="ctp-dark absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-ctp-border bg-ctp-bg-2 p-2 text-ctp-text shadow-2xl">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-[12px] text-ctp-text-muted">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-ctp-border px-2 py-0.5 text-[11px] text-ctp-text-2">
              <ShieldCheck className="h-3 w-3" />{user.role === 'admin' ? 'Administrator' : 'Analyst'}
            </span>
          </div>
          <button
            type="button" role="menuitem"
            onClick={() => { setOpen(false); logout(); }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13.5px] text-ctp-text-2 transition-colors hover:bg-ctp-surface-2 hover:text-ctp-text"
          >
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      )}
    </div>
  );
}
