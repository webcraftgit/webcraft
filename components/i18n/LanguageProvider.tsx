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
import { usePathname } from "next/navigation";
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
 * First visit, no stored choice: follow the browser. Anyone whose browser
 * lists Polish anywhere gets Polish; everyone else gets English instead of a
 * page they may not read. Crawlers are left on the default so Google keeps
 * rendering the Polish page it indexes (its renderer reports en-US).
 */
function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  if (/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)) {
    return DEFAULT_LOCALE;
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (langs.some((l) => l?.toLowerCase().startsWith("pl"))) return "pl";
  return langs.some((l) => l?.toLowerCase().startsWith("en")) ? "en" : DEFAULT_LOCALE;
}

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
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* localStorage unavailable — fall through to detection */
    }
    const next =
      saved && LOCALES.includes(saved as Locale) ? (saved as Locale) : detectLocale();
    if (next !== locale) setLocaleState(next);
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = locale;
    // Server metadata is always the default locale; keep the tab title in the
    // language the visitor is actually reading. Next streams the metadata
    // <title> in after hydration (and again on client navigation), which
    // would overwrite a one-off assignment — so watch <head> and re-apply.
    const title = TYPESET[locale].titles[pathname];
    if (!title) return;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [locale, pathname]);

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
