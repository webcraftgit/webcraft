import type { Metadata } from "next";
import localFont from "next/font/local";
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
/**
 * Clash Display, self-hosted (SEO pass, 2026-10-01). The hero H1 is set in it,
 * so it sits on the LCP path. It used to come from api.fontshare.com: a
 * render-blocking third-party stylesheet that then asked cdn.fontshare.com for
 * the woff2, i.e. two extra handshakes on every cold load. The files in
 * app/fonts are the unmodified woff2 originals Fontshare serves (free for
 * commercial use). next/font preloads them and generates a metric-matched
 * fallback, so the swap does not shift the layout. --font-display in
 * globals.css reads the variable.
 */
const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-clash",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // The brand line is the H1 on the page; the tab and the SERP get the
    // phrase people actually type. Template keeps sub-pages consistent.
    default: "Tworzenie stron internetowych Warszawa | Weturn Studio",
    template: "%s | Weturn Studio",
  },
  description:
    "Projektujemy i budujemy strony, które zamieniają wyświetlenia w sprzedaż. Do tego opieka, wideo i materiały marki. Wycena ustalona przed startem prac.",
  applicationName: "Weturn",
  robots: ROBOTS,
  // Files live in /public and are declared explicitly rather than relying on
  // the app/icon.* convention, because the convention emits hashed URLs that
  // app/manifest.ts cannot reference by a stable path.
  icons: {
    // Google's search-result favicon wants a square raster in a multiple of
    // 48px and falls back to /favicon.ico; the SVG alone was not picked up.
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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
    <html lang={DEFAULT_LOCALE} className={clashDisplay.variable} suppressHydrationWarning>
      <body>
        {/* Navbar + Lenis + consent live in app/(site)/layout.tsx, NOT here:
            /admin must never inherit smooth-scroll, the marketing chrome, or
            the analytics tracker. Route groups keep the URLs identical. */}
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
