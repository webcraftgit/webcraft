import type { MetadataRoute } from "next";
import { SITE_URL, SITE_URL_IS_PLACEHOLDER } from "@/lib/site";

/**
 * robots.txt (CP4_17-seo).
 *
 * AI CRAWLERS ARE ALLOWED, AND THAT IS A DECISION, NOT A DEFAULT. A studio
 * with no portfolio and no backlinks does not get found by outranking
 * incumbents — it gets found by being recommended. Every one of these bots
 * feeds a surface where someone asks "who builds websites in Warsaw" and gets
 * a short list. Being absent from that list costs more than the bandwidth.
 * Blocking is one `disallow` line away if the client ever changes their mind;
 * the honest reason to block would be not wanting the work used as training
 * data, which is a separate question from wanting to be cited.
 *
 * The distinction worth knowing: GPTBot / ClaudeBot / Google-Extended are
 * TRAINING and index crawlers, while ChatGPT-User / Claude-User / PerplexityBot
 * fetch a page live because a user just asked about it. If the client wants
 * "cite me but don't train on me", block the first group and keep the second.
 *
 * If NEXT_PUBLIC_SITE_URL is unset we disallow everything — an accidentally
 * public preview deploy should not be indexed under the wrong hostname.
 */
export default function robots(): MetadataRoute.Robots {
  if (SITE_URL_IS_PLACEHOLDER) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin is already noindex + auth-gated; keeping it out of robots.txt
        // discovery too. /api is machine-only and returns no indexable HTML.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
