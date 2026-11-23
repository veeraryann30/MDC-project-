import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import AuthModal from '../components/common/AuthModal';

const AuthContext = createContext(null);

/**
 * Session state for the whole app: who is signed in, and one shared Log in / Sign up dialog.
 * The token lives in localStorage (see api.js); on load it is checked with the backend, and a
 * token the server no longer accepts is cleared, so the UI never shows a stale "signed in".
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'login' });

  useEffect(() => {
    let alive = true;
    api.getCurrentUser().then((u) => {
      if (alive) { setUser(u); setLoading(false); }
    });
    return () => { alive = false; };
  }, []);

  const openAuth = useCallback((mode = 'login') => setModal({ open: true, mode }), []);
  const closeAuth = useCallback(() => setModal((m) => ({ ...m, open: false })), []);
  const logout = useCallback(() => { api.logoutUser(); setUser(null); }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', openAuth, logout }),
    [user, loading, openAuth, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal isOpen={modal.open} initialMode={modal.mode} onClose={closeAuth} onAuthSuccess={setUser} />
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
