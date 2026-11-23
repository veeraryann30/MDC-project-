import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Lock, Mail, User, AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import Logo from './Logo';

const EASE = [0.16, 1, 0.3, 1];
const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

const field =
  'w-full rounded-xl border border-ctp-border-strong bg-ctp-bg py-3 pl-10 pr-3 text-sm text-ctp-text placeholder:text-ctp-text-muted outline-none transition-[border-color,box-shadow] focus:border-ctp-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ctp-accent)_18%,transparent)]';

/** Checks the form before it is sent. The server repeats every check; this only saves a round trip. */
function validate(mode, { email, password, fullName }) {
  const e = {};
  if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
  if (mode === 'signup') {
    if (password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`;
    else if (!password.trim()) e.password = 'Password cannot be only spaces.';
    if (fullName.trim().length > 80) e.fullName = 'Keep your name under 80 characters.';
  } else if (!password) {
    e.password = 'Enter your password.';
  }
  return e;
}

/**
 * Log in / Sign up dialog. Rendered on document.body (the page layout has transformed ancestors),
 * closes with Escape or a click outside, keeps keyboard focus inside while open.
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const panelRef = useRef(null);
  const emailRef = useRef(null);
  const openerRef = useRef(null);
  const closeTimer = useRef(null);

  // Each opening starts clean, in the requested mode.
  useEffect(() => {
    if (!isOpen) return undefined;
    setMode(initialMode);
    setPassword(''); setShowPw(false); setErrors({}); setFormError(''); setDone('');
    openerRef.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => emailRef.current?.focus(), 60);

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      clearTimeout(closeTimer.current);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      openerRef.current?.focus?.();
    };
  }, [isOpen, initialMode, onClose]);

  const switchMode = (next) => {
    setMode(next); setErrors({}); setFormError(''); setPassword(''); setShowPw(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const found = validate(mode, { email, password, fullName });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.loginUser(email.trim(), password)
        : await api.registerUser(email.trim(), password, fullName.trim());
      setDone(mode === 'login' ? 'Welcome back.' : 'Account created. You are signed in.');
      onAuthSuccess?.(data.user);
      closeTimer.current = setTimeout(onClose, 700);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const fieldError = (msg, id) => msg && <p id={id} role="alert" className="mt-1.5 text-[12.5px] text-ctp-danger">{msg}</p>;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="ctp-console fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button" aria-label="Close" tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-labelledby="auth-title"
            className="ctp-dark relative w-full max-w-md rounded-3xl border border-ctp-border bg-ctp-bg-2 p-6 text-ctp-text shadow-2xl sm:p-8"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-ctp-text-2 transition-colors hover:bg-ctp-surface-2 hover:text-ctp-text">
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <Logo size="sm" withWordmark={false} withTagline={false} tone="dark" />
              <h2 id="auth-title" className="ctp-display mt-4 text-2xl">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p className="mt-1.5 text-[13.5px] text-ctp-text-2">
                {isLogin ? 'Log in to see your scan history and saved reports.' : 'Sign up to keep your scan history and report links you got wrong.'}
              </p>
            </div>

            <div role="tablist" aria-label="Log in or sign up" className="mt-6 grid grid-cols-2 rounded-xl border border-ctp-border bg-ctp-bg p-1 text-[13.5px] font-medium">
              {[['login', 'Log in'], ['signup', 'Sign up']].map(([id, label]) => (
                <button
                  key={id} type="button" role="tab" aria-selected={mode === id}
                  onClick={() => switchMode(id)}
                  className={`cursor-pointer rounded-lg py-2 transition-colors ${mode === id ? 'bg-ctp-surface-2 text-ctp-text' : 'text-ctp-text-muted hover:text-ctp-text'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="auth-name" className="mb-1.5 block text-[13px] font-medium text-ctp-text-2">Name <span className="text-ctp-text-muted">(optional)</span></label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ctp-text-muted" />
                    <input id="auth-name" type="text" autoComplete="name" maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Veer Aryan" className={field} aria-invalid={!!errors.fullName} />
                  </div>
                  {fieldError(errors.fullName, 'auth-name-err')}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-1.5 block text-[13px] font-medium text-ctp-text-2">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ctp-text-muted" />
                  <input ref={emailRef} id="auth-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }} placeholder="you@example.com" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-err' : undefined} />
                </div>
                {fieldError(errors.email, 'auth-email-err')}
              </div>

              <div>
                <label htmlFor="auth-password" className="mb-1.5 block text-[13px] font-medium text-ctp-text-2">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ctp-text-muted" />
                  <input
                    id="auth-password" type={showPw ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
                    placeholder={isLogin ? 'Your password' : `At least ${MIN_PASSWORD} characters`} className={`${field} pr-11`}
                    aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-pw-err' : undefined}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-ctp-text-muted transition-colors hover:text-ctp-text">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldError(errors.password, 'auth-pw-err')}
                {!isLogin && !errors.password && <p className="mt-1.5 text-[12px] text-ctp-text-muted">Longer is stronger. A short phrase of several words works well.</p>}
              </div>

              <div aria-live="polite">
                {formError && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-ctp-danger/30 bg-ctp-danger/10 px-3 py-2.5 text-[13px] text-ctp-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{formError}
                  </p>
                )}
                {done && (
                  <p className="flex items-center gap-2 rounded-xl border border-ctp-safe/30 bg-ctp-safe/10 px-3 py-2.5 text-[13px] text-ctp-safe">
                    <Check className="h-4 w-4 shrink-0" />{done}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading || !!done} className="ctp-btn ctp-btn-primary h-11 w-full rounded-xl text-sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? 'Log in' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-ctp-text-muted">
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')} className="cursor-pointer font-medium text-ctp-accent-text hover:underline">
                {isLogin ? 'Create an account' : 'Log in'}
              </button>
            </p>
            <p className="mt-3 text-center text-[11.5px] leading-relaxed text-ctp-text-muted">
              You can scan links and QR codes without an account. Passwords are stored as salted hashes, never in plain text.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
