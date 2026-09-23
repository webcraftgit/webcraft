import type { Metadata } from "next";
import "@fontsource-variable/inter"; // self-hosted — no third-party font request
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";
import { ROBOTS } from "@/lib/seo/metadata";

/**
 * Root layout (CP6-backend route groups → CP4_17-seo).
 *
 * WHAT LIVES HERE vs PER PAGE: this file owns only what is true of every
 * route — metadataBase, the title template, the icon set and the robots
 * directives. CANONICALS ARE DELIBERATELY NOT SET HERE. A canonical in the
 * root layout is inherited by every page that does not override it, so one
 * forgotten metadata export would silently tell Google that a new page is a
 * duplicate of the home page. Each page declares its own via pageMetadata().
 *
 * metadataBase comes from SITE_URL (i.e. NEXT_PUBLIC_SITE_URL), which is also
 * what /api/contact checks Origin against — one origin, one variable.
 *
 * Metadata is server-rendered and the i18n layer is client-side, so all of it
 * is Polish (DEFAULT_LOCALE). See lib/seo/metadata.ts for why there is no
 * hreflang block.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // The brand line is the H1 on the page; the tab and the SERP get the
    // phrase people actually type. Template keeps sub-pages consistent.
    default: "Tworzenie stron internetowych Warszawa | Webcraft",
    template: "%s | Webcraft",
  },
  description:
    "Projektujemy i budujemy strony, które zamieniają wyświetlenia w sprzedaż. Do tego opieka, wideo i materiały marki. Wycena ustalona przed startem prac.",
  applicationName: "Webcraft",
  robots: ROBOTS,
  // Files live in /public and are declared explicitly rather than relying on
  // the app/icon.* convention, because the convention emits hashed URLs that
  // app/manifest.ts cannot reference by a stable path.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#05080F",
  colorScheme: "dark" as const,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        {/* Clash Display is still a third-party, render-blocking request on the
            LCP path — the hero H1 is set in it. Preconnecting BOTH hosts is a
            stopgap: api.fontshare.com serves the CSS, cdn.fontshare.com serves
            the woff2 the CSS then asks for, and only the first was warmed, so
            the font file paid a fresh DNS+TLS handshake every cold load.
            The real fix is self-hosting the woff2 (see PROJECT_STATE CP4_17)
            — it also removes a CDN this project has already been burned by
            twice (CP6-hdr-fix, CP3.9). */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        {/* Clash Display — free for commercial use via Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Navbar + Lenis + consent live in app/(site)/layout.tsx, NOT here:
            /admin must never inherit smooth-scroll, the marketing chrome, or
            the analytics tracker. Route groups keep the URLs identical. */}
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
