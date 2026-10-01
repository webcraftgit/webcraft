import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LANDING_PATHS } from "@/lib/seo/landings";

/**
 * sitemap.xml (CP4_17-seo).
 *
 * Home, the landing pages from lib/seo/landings.ts, and /privacy. Anchors are
 * not URLs, so `#services` or `#pricing` cannot rank on their own; the landing
 * pages are the real routes for those queries, and they are listed here from
 * the same LANDING_PATHS the footer links to, so the two cannot drift.
 *
 * /showcase is absent deliberately: it is a permanent redirect to /#showcase
 * (see next.config.mjs), and listing a redirect in a sitemap tells a crawler
 * to spend budget confirming something we already declared.
 *
 * lastModified uses build time. For a site that ships as a whole on each
 * deploy that is accurate; per-URL dates would be invented precision.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // No trailing slash: Next emits the canonical for "/" as the bare origin, and
    // a sitemap that disagrees with the canonical makes a crawler resolve which
    // of two forms is real. Same string, both places.
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...LANDING_PATHS.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
