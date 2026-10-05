/**
 * Site-wide constants (CP4.2 → CP5-i18n → CP4_17-seo).
 *
 * SITE_URL is the single source of truth for every absolute URL the app
 * produces: metadataBase, canonicals, the sitemap, robots.txt and the JSON-LD
 * @id graph. It reads NEXT_PUBLIC_SITE_URL — the same variable /api/contact
 * already uses for its CSRF Origin check — so the canonical origin cannot
 * drift between the two.
 *
 * ⚠️ THE FALLBACK IS A SENTINEL AND MUST NOT REACH PRODUCTION. It is a
 * deliberately unreachable host (RFC 2606 .invalid), NOT the real domain: the
 * real domain is weturnstudio.app, set via NEXT_PUBLIC_SITE_URL in the host's env.
 * The two must stay different — SITE_URL_IS_PLACEHOLDER below treats "env equals
 * the fallback" as unconfigured, so if the fallback were weturnstudio.app, setting
 * the real production URL would wrongly noindex the live site. Shipping with the
 * sentinel points canonicals/OG/sitemap at a dead host; a real deploy always
 * sets NEXT_PUBLIC_SITE_URL=https://weturnstudio.app first.
 */
const FALLBACK_SITE_URL = "https://example.invalid"; // sentinel — real domain is weturnstudio.app (set via env)

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
).replace(/\/+$/, ""); // no trailing slash — everything below concatenates onto it

/** True when the placeholder is still in play. Used to keep a half-configured
 *  deploy out of the index rather than letting it be indexed at a wrong host. */
export const SITE_URL_IS_PLACEHOLDER =
  !process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL.includes("localhost") ||
  process.env.NEXT_PUBLIC_SITE_URL === FALLBACK_SITE_URL;

export const CONTACT_EMAIL = "krzysztof@weturnstudio.app";

/** Display form + E.164 for tel: links and JSON-LD. Keep the two in step. */
export const CONTACT_PHONE = "+48 516 991 588";
export const CONTACT_PHONE_E164 = "+48516991588";

/** Studio identity, used by the JSON-LD graph. Keep in step with /privacy and
 *  with the Google Business Profile — an entity that describes itself
 *  differently in three places is an entity search engines cannot resolve. */
export const ORG = {
  name: "Weturn",
  legalName: "Weturn", // TODO(launch): registered name if/when one exists
  /** City-level only. There is no public street address yet, and inventing one
   *  is worse than omitting it — see the Wiśniowa demo's address note. */
  city: "Warszawa",
  region: "Mazowieckie",
  country: "PL",
  /** Where clients can actually be served. Remote-first, so the country. */
  areaServed: ["PL"],
  /** Profiles that prove the entity is the same one elsewhere. Empty until
   *  they exist — a sameAs pointing nowhere is noise. */
  sameAs: [] as string[],
  founded: "2025",
} as const;

// REPLY_PROMISE moved to lib/i18n/dictionaries.ts (contact.replyPromise) — it's
// user-facing copy and needs both languages.
