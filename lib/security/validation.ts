/**
 * Hand-rolled validators (CP6-backend).
 *
 * Rule for every field: an ALLOW-LIST, never a deny-list. Anything not
 * explicitly recognised becomes null. The database repeats these constraints
 * as CHECKs — belt and braces, because the route is not the only thing that
 * could ever write.
 */

export const TIERS = ["launch", "business", "signature"] as const;
export const READINESS = ["ready", "partly", "none"] as const;
export const BUDGETS = ["lt5k", "b5to10k", "b10to20k", "gt20k", "unsure"] as const;
export const LOCALES = ["pl", "en"] as const;
export const DEVICES = ["mobile", "tablet", "desktop"] as const;

export const EVENT_NAMES = [
  "page_view", "session_start", "section_view", "form_start", "form_submit",
  "tier_select", "budget_select", "readiness_select", "cta_click",
  "demo_open", "lang_switch", "faq_open", "scroll_depth",
] as const;

export const MAX = { name: 120, email: 200, message: 4000, ua: 512, path: 256 } as const;

/** Not an RFC-5322 parser — a sanity gate. Real validation is "the reply arrives". */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const oneOf = <T extends readonly string[]>(v: unknown, set: T): T[number] | null =>
  typeof v === "string" && (set as readonly string[]).includes(v) ? (v as T[number]) : null;

export const uuid = (v: unknown): string | null =>
  typeof v === "string" && UUID_RE.test(v) ? v : null;

/** Strip control chars; they have no business in a name and they break logs. */
export const str = (v: unknown, max: number): string => {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
};

export const email = (v: unknown): string => {
  const s = str(v, MAX.email).toLowerCase();
  return EMAIL_RE.test(s) ? s : "";
};

export const int = (v: unknown, lo: number, hi: number): number | null => {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

/**
 * We store the referrer HOST, never the full URL. A full referrer can carry
 * someone else's query string (search terms, session tokens) — data we did not
 * ask for and do not want to be the custodian of.
 */
export const host = (v: unknown): string | null => {
  const s = str(v, 2048);
  if (!s) return null;
  try {
    const h = new URL(s).hostname.toLowerCase();
    return h.length <= 253 ? h : null;
  } catch {
    return null;
  }
};

/** utm_* values are attacker-controlled strings in a URL. Keep them boring. */
export const utm = (v: unknown): string | null => {
  const s = str(v, 64).toLowerCase();
  return s && /^[a-z0-9._\-+ ]+$/.test(s) ? s : null;
};
