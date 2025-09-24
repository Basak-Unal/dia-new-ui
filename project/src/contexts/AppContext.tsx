import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '../types';

type ToastKind = 'success' | 'error' | 'info';

type AppCtx = {
  session: Session | null;
  setSession: (s: Session | null) => void;
  showToast: (msg: string, kind?: ToastKind) => void;
  signOut: () => void;
};

const Ctx = createContext<AppCtx | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('session');
      setSessionState(raw ? (JSON.parse(raw) as Session) : null);
    } catch {
      setSessionState(null);
    }
  }, []);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    try {
      if (s) localStorage.setItem('session', JSON.stringify(s));
      else localStorage.removeItem('session');
    } catch {}
  };

  const showToast = (msg: string, kind: ToastKind = 'info') => {
    const tag = kind === 'error' ? '❌' : kind === 'success' ? '✅' : 'ℹ️';
    console.log(`${tag} ${msg}`);
  };

  const signOut = () => {
    try { localStorage.removeItem('session'); } catch {}
    setSessionState(null);
  };

  return (
      <Ctx.Provider value={{ session, setSession, showToast, signOut }}>
        {children}
      </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// 🔁 Alias for any old imports expecting `useAuth`
export const useAuth = useApp;
