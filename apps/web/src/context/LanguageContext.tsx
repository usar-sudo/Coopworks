'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Lang, translate } from '../lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a chrome key, optionally filling {name} placeholders. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = 'cw_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('en');

  // Apply the saved language after mount (avoid mismatch during SSR/hydration).
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) as
      | Lang
      | null;
    if (saved === 'en' || saved === 'hi') setLangState(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — language still applies for this session
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
