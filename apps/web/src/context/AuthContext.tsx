'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthSession } from 'shared-types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  mode: 'demo' | 'live' | null;
  refresh: () => Promise<void>;
  signInDemo: (personaId: string) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as { session: AuthSession | null };
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'anonymous');
    } catch (err) {
      console.warn('Failed to load session:', err);
      setSession(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signInDemo = useCallback(async (personaId: string) => {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId })
    });
    const data = (await res.json()) as { session?: AuthSession; error?: string };
    if (!res.ok || !data.session) {
      throw new Error(data.error ?? 'Sign-in failed.');
    }
    setSession(data.session);
    setStatus('authenticated');
    return data.session;
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setSession(null);
    setStatus('anonymous');
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, session, mode: session?.mode ?? null, refresh, signInDemo, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
