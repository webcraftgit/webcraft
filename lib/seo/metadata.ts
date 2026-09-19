/**
 * Shared metadata helpers (CP4_17-seo).
 *
 * WHY THE TITLES CHANGED. The old title was the brand line — "Webcraft —
 * Strony, które zamieniają wejścia w sprzedaż". It reads well and nobody
 * types it into Google. A title has two jobs: match the query, then sell the
 * click. So the query-shaped phrase goes first and the brand line survives as
 * the description and as the on-page H1, where it belongs.
 *
 * It also said "wejścia", which CP5.1 retired site-wide in favour of
 * "wyświetlenia" — the metadata was simply never updated with the copy.
 *
 * LOCALE, STATED PLAINLY: metadata is server-rendered and the i18n layer is
 * client-side, so everything here is Polish (DEFAULT_LOCALE). There is no EN
 * URL for Google to index and therefore no honest hreflang to emit — an
 * alternates.languages block pointing both locales at the same URL would be a
 * lie about content that does not exist. Fixing that means per-URL locales;
 * see lib/i18n/config.ts.
 */
import type { Metadata } from "next";
import { SITE_URL, SITE_URL_IS_PLACEHOLDER } from "@/lib/site";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Webcraft — strony, które zamieniają wyświetlenia w sprzedaż",
};

/**
 * Snippet directives. `max-snippet:-1` + `max-image-preview:large` is what
 * lets Google use a full-length snippet and the OG image in rich results and
 * AI Overviews; the defaults are conservative and quietly truncate you.
 *
 * If NEXT_PUBLIC_SITE_URL was never set, the whole site goes noindex. A
 * preview deploy indexed under the wrong hostname is a duplicate-content
 * problem that outlives the deploy — better to be invisible until configured.
 */
export const ROBOTS: Metadata["robots"] = SITE_URL_IS_PLACEHOLDER
  ? { index: false, follow: false }
  : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    };

/** Absolute URL for a site-relative path. */
export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Per-page metadata with the canonical, OG and locale bits already correct. */
export function pageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  return {
    // `absolute` on purpose: the root layout sets template "%s | Webcraft",
    // and every title below already ends in the brand. Without this you get
    // "… | Webcraft | Webcraft", which Google truncates and users read as a bug.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: abs(path),
      siteName: "Webcraft",
      locale: DEFAULT_LOCALE === "pl" ? "pl_PL" : "en_US",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
