/**
 * Pricing — numeric single source of truth (CP4.x → CP5-i18n).
 *
 * Positioning (with client): NOT budget-tier. Founding rates — real published
 * prices lower than the target rate, framed as "first client slots while the
 * portfolio fills", never a fake crossed-out discount.
 *
 * i18n split: this file now holds ONLY numbers, ids and logic. Every piece of
 * user-facing text (tier names/taglines/includes/weeks, readiness + budget
 * labels, the estimate note) lives in lib/i18n/dictionaries.ts, keyed by the
 * ids below. Repricing is still a one-file edit here; retranslating is a
 * one-file edit there.
 *
 * Rate history: 4 900/11 900/24 900 → 3 900/9 900/19 900 → 3 500/9 900/19 900.
 */
import type { Locale } from "@/lib/i18n/config";

export const FOUNDING_SLOTS = 10;

/**
 * CP5.4: monthly care plan — hosting + maintenance + small changes.
 * Client range was 120–150; set at the top as ONE price (149) — a range on a
 * subscription invites haggling, a single number reads like a product. Scope
 * guard lives in the dictionary copy: small changes up to ~1h/mo, anything
 * bigger quoted separately BEFORE work starts.
 */
export const CARE_PLAN = { monthly: 149 };

/** Locale-aware price format. Currency label comes from the dictionary. */
export function fmt(n: number, locale: Locale, currency: string) {
  // useGrouping:"always" so 4-digit prices group too (pl CLDR skips them by
  // default → "3500"); this keeps "3 500 zł" consistent with copy elsewhere.
  const grouped = new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    useGrouping: "always",
  }).format(n);
  // no-break space: the amount and "zł" never land on separate lines
  return `${grouped}${String.fromCharCode(0xa0)}${currency}`;
}

export type TierId = "launch" | "business" | "signature";

export type Tier = {
  id: TierId;
  /** founding rate — real price, "from" */
  from: number;
  /** honest typical top of the range at this scope */
  upTo: number;
  highlight?: boolean;
};

export const TIERS: Tier[] = [
  { id: "launch", from: 3500, upTo: 6500 },
  { id: "business", from: 9900, upTo: 16000, highlight: true },
  { id: "signature", from: 19900, upTo: 36000 },
];

export const READINESS_IDS = ["ready", "partly", "none"] as const;
export type ContentReadiness = (typeof READINESS_IDS)[number];

export const BUDGET_IDS = ["lt5k", "b5to10k", "b10to20k", "gt20k", "unsure"] as const;
export type BudgetBand = (typeof BUDGET_IDS)[number];

/**
 * Honest numeric range for a tier + content situation (no text — the caller
 * renders localized weeks/note from the dictionary). Content work shifts where
 * in the range a project typically lands; it never exceeds the published range.
 */
export function estimate(tierId: TierId | null, readiness: ContentReadiness | null) {
  if (!tierId) return null;
  const tier = TIERS.find((t) => t.id === tierId)!;
  const bump = readiness === "none" ? 0.18 : readiness === "partly" ? 0.08 : 0;
  const low = Math.round((tier.from * (1 + bump)) / 100) * 100;
  return {
    tierId,
    low: Math.min(low, tier.upTo),
    high: tier.upTo,
    /** which localized note applies, if any */
    note: (readiness === "none" ? "none" : readiness === "partly" ? "partly" : null) as
      | "none"
      | "partly"
      | null,
  };
}
