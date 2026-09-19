/**
 * i18n config (CP5-i18n). The site is a single page with in-page anchors, so
 * we localize via a client-side dictionary + a PL/EN toggle rather than
 * per-locale routes (/pl, /en). That keeps every existing anchor link,
 * ScrollTrigger, Lenis and R3F wiring untouched.
 *
 * DEFAULT_LOCALE drives the server render (and thus the initial HTML lang +
 * metadata). It's Polish: the studio sells to a Polish market. Flip this one
 * constant to change the default everywhere.
 *
 * Known limitation (revisit in CP6 with real SEO): metadata + the very first
 * paint are the default locale; a returning visitor who picked the other
 * language sees a brief flip after hydration. Proper per-URL locales would
 * fix that but is a larger change we deferred until after the backend.
 */
export const LOCALES = ["pl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pl";
export const LOCALE_STORAGE_KEY = "wc-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  pl: "PL",
  en: "EN",
};
