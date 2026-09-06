import React, { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { isSupabaseConfigured } from 'shared-lib';
import { useLanguage } from '../context/LanguageContext';

/**
 * Live-mode auth card: sign in / register (with role intent) and, for an
 * existing session, permanent account deletion. Rendered only when Supabase
 * is configured — but guarded so it can never throw in demo mode.
 */
export const AuthUI: React.FC<{ onAuthSuccess: () => void; onOpenRegister?: (mode?: 'customer' | 'worker') => void }> = ({ onAuthSuccess, onOpenRegister }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // Never construct the client unless real keys exist (demo mode must not crash).
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, [supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!supabase) return;
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Account could not be deleted.');
      }
      await supabase.auth.signOut();
      setHasSession(false);
      setNotice('Your account has been permanently deleted.');
    } catch (err: any) {
      setError(err.message || 'Delete failed. Are you signed in?');
    } finally {
      setDeleting(false);
    }
  };

  if (!configured) {
    // Demo-mode fallback — normally /login redirects home before rendering this.
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1B232E] rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xl p-8 text-center">
          <p className="text-sm text-[#71717A]">
            Authentication is disabled in demo mode. Run with Supabase keys to enable real logins.
          </p>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-3 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-xl text-sm focus:outline-none focus:border-[#FF7448]';
  const labelCls =
    'block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5';

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF9F6] dark:bg-[#0F151D] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1B232E] rounded-3xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FF7448]/10 text-[#FF7448] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl">handshake</span>
          </div>
          <h2 className="text-2xl font-['Outfit'] font-bold text-[#0F151D] dark:text-[#FBFBFB]">
            {t('auth.welcomeBack')}
          </h2>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-2">
            {t('auth.signInDesc')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">

          <div>
            <label className={labelCls}>{t('auth.emailAddress')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>{t('auth.password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-[#B23A2E] text-xs font-medium bg-[#B23A2E]/10 p-3 rounded-xl">{error}</p>
          )}
          {notice && (
            <p className="text-[#10B981] text-xs font-medium bg-[#10B981]/10 p-3 rounded-xl">{notice}</p>
          )}

          <button
            type="submit"
            disabled={loading || deleting}
            className="w-full py-3.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white font-['Outfit'] font-bold text-sm rounded-xl transition-colors shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? t('auth.processing') : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <button
            onClick={() => onOpenRegister ? onOpenRegister() : null}
            className="text-xs text-[#71717A] hover:text-[#FF7448] transition-colors block mx-auto"
          >
            {t('auth.noAccountRegister')}
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="text-[11px] text-[#71717A] hover:text-[#B23A2E] transition-colors block mx-auto mt-3 disabled:opacity-50 flex items-center gap-1 justify-center"
          >
            <span className="material-symbols-outlined text-[14px]">person_remove</span>
            {deleting ? 'Deleting…' : t('auth.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
