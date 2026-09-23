import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { privacyGraph } from "@/lib/seo/schema";

/**
 * Metadata shell for /privacy (CP4_17-seo).
 *
 * The page itself is a client component (it reads the locale and the consent
 * context), and a client component cannot export `metadata` — so the title,
 * description and canonical live in this layout instead. Before this, /privacy
 * inherited the home page's title and had no canonical of its own.
 *
 * INDEXED, NOT NOINDEXED. A privacy policy is a trust signal: it is one of the
 * pages both search engines and answer engines check when deciding whether a
 * small site is a real business. Hiding it gains nothing.
 */
export const metadata: Metadata = pageMetadata({
  title: "Polityka prywatności | Webcraft",
  description:
    "Co zbieramy, po co i jak to wyłączyć. Opis tego, co faktycznie robi kod tej strony, bez formułek.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={privacyGraph} />
      {children}
    </>
  );
}
