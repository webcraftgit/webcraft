/**
 * Site-wide constants (CP4.2 → CP5-i18n → CP4_17-seo).
 *
 * SITE_URL is the single source of truth for every absolute URL the app
 * produces: metadataBase, canonicals, the sitemap, robots.txt and the JSON-LD
 * @id graph. It reads NEXT_PUBLIC_SITE_URL — the same variable /api/contact
 * already uses for its CSRF Origin check — so the canonical origin cannot
 * drift between the two.
 *
 * ⚠️ THE FALLBACK IS A PLACEHOLDER AND MUST NOT REACH PRODUCTION. Shipping
 * with it makes every canonical, every OG image URL and every sitemap entry
 * point at a domain you do not own, which is worse than having none at all:
 * Google would be told the real pages are duplicates of someone else's site.
 * Set NEXT_PUBLIC_SITE_URL in the host's env before the first deploy.
 */
const FALLBACK_SITE_URL = "https://webcraft.studio"; // TODO(launch): real domain

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
).replace(/\/+$/, ""); // no trailing slash — everything below concatenates onto it

/** True when the placeholder is still in play. Used to keep a half-configured
 *  deploy out of the index rather than letting it be indexed at a wrong host. */
export const SITE_URL_IS_PLACEHOLDER =
  !process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL.includes("localhost") ||
  process.env.NEXT_PUBLIC_SITE_URL === FALLBACK_SITE_URL;

export const CONTACT_EMAIL = "hello@webcraft.studio"; // TODO: real address before launch

/** Studio identity, used by the JSON-LD graph. Keep in step with /privacy and
 *  with the Google Business Profile — an entity that describes itself
 *  differently in three places is an entity search engines cannot resolve. */
export const ORG = {
  name: "Webcraft",
  legalName: "Webcraft", // TODO(launch): registered name if/when one exists
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
