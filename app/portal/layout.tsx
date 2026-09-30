import type { Metadata } from "next";

/**
 * Client portal shell. Like /admin it sits outside the (site) group: no
 * navbar, no smooth scroll, no analytics. A client filling in a brief is
 * not a marketing visitor, and the URL carries a secret we don't want in
 * any tracker. Privacy headers for /portal live in next.config.mjs.
 */
export const metadata: Metadata = {
  title: "Portal klienta",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
