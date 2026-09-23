"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { DICTS, type Dictionary } from "@/lib/i18n/dictionaries";
import { typeset } from "@/lib/i18n/typography";

/** What the UI renders: the dictionaries with no-break spaces applied (see
 *  lib/i18n/typography.ts). Built once — DICTS itself stays plain for the
 *  JSON-LD and llms.txt consumers. */
const TYPESET: Record<Locale, Dictionary> = {
  en: typeset(DICTS.en, "en"),
  pl: typeset(DICTS.pl, "pl"),
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<Ctx | null>(null);

/**
 * Holds the active locale and swaps the dictionary. Initial state is the
 * server default so hydration matches; a returning visitor's stored choice is
 * applied in an effect (with a brief flip for the non-default language — see
 * the note in lib/i18n/config.ts). Persists to localStorage and keeps
 * <html lang> in sync for a11y + SEO of the current view.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved && LOCALES.includes(saved as Locale) && saved !== locale) {
        setLocaleState(saved as Locale);
      }
    } catch {
      /* localStorage unavailable — stay on default */
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, setLocale, t: TYPESET[locale] }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** Current dictionary — `const t = useT()` then `t.hero.title`. */
export function useT(): Dictionary {
  return useLanguage().t;
}

/** `[locale, setLocale]` for the toggle and locale-dependent formatting. */
export function useLocale(): [Locale, (l: Locale) => void] {
  const { locale, setLocale } = useLanguage();
  return [locale, setLocale];
}
