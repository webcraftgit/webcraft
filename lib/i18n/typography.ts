import type { Locale } from "./config";

/**
 * Typesetting pass over display copy (CP4_64).
 *
 * Swaps chosen spaces for NO-BREAK SPACES so the browser cannot break a line
 * where a typesetter would not:
 *   · both languages — inside grouped numbers ("3 000"), between a number and
 *     its unit ("3 500 zł", "2–3 dni"), and before a spaced em dash (a line
 *     never starts with "—").
 *   · Polish only — after one-letter words (a, i, o, u, w, z). Polish
 *     typography never leaves them at the end of a line; the hero H1 used to
 *     end a line on "…wyświetlenia w".
 *
 * Applied once per dictionary, at module load, for what the UI RENDERS. The
 * raw dictionaries stay plain for JSON-LD and llms.txt. Functions in a
 * dictionary are wrapped so their output is typeset too.
 */
const NBSP = String.fromCharCode(0xa0);
const UNITS =
  "zł|PLN|%|dni|dnia|tygodni|tygodnie|tydzień|days?|weeks?|miesięcy|months?|min|ml|lat|years?|butelek|bottles|klientów|clients";
const NUM_GROUP = /(\d) (?=\d{3}(?!\d))/g;
const NUM_UNIT = new RegExp(`(\\d) (?=(?:${UNITS})(?![\\p{L}]))`, "gu");
const DASH = / (?=—)/g;
// Preceded by start, whitespace or an opening bracket/quote.
const PL_SINGLE = /(^|[\s(„"])([aiouwzAIOUWZ]) /g;

export function typesetString(s: string, locale: Locale): string {
  let out = s.replace(NUM_GROUP, `$1${NBSP}`).replace(NUM_UNIT, `$1${NBSP}`).replace(DASH, NBSP);
  if (locale === "pl") {
    // twice, for runs like "i w" where the second match starts inside the first
    out = out.replace(PL_SINGLE, `$1$2${NBSP}`).replace(PL_SINGLE, `$1$2${NBSP}`);
  }
  return out;
}

export function typeset<T>(value: T, locale: Locale): T {
  if (typeof value === "string") return typesetString(value, locale) as T;
  if (typeof value === "function") {
    const fn = value as (...a: unknown[]) => unknown;
    return ((...a: unknown[]) => typeset(fn(...a), locale)) as T;
  }
  if (Array.isArray(value)) return value.map((v) => typeset(v, locale)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = typeset(v, locale);
    return out as T;
  }
  return value;
}
