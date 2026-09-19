import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml (CP4_17-seo).
 *
 * TWO URLS. That is not an oversight — it is the honest shape of a one-page
 * site, and it is the clearest possible statement of the ceiling: anchors are
 * not URLs, so `#services`, `#pricing` and `#faq` cannot rank separately no
 * matter how good the copy is. When those become real routes, they come back
 * here and this file stops being a two-line joke.
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
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
