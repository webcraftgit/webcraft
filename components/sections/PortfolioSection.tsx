"use client";

import BeforeAfter from "@/components/portfolio/BeforeAfter";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { PORTFOLIO } from "@/lib/seo/portfolio";

/**
 * Portfolio, embedded on the home page (replaces the old Craft band).
 * The same Efkapowa before/after as /portfolio: copy and frames come from
 * lib/seo/portfolio.ts and lib/portfolio/efkapowa.ts, so the two never drift.
 */
export default function PortfolioSection() {
  const [locale] = useLocale();
  const c = PORTFOLIO[locale] ?? PORTFOLIO.pl;

  return (
    <section id="portfolio" aria-label={c.h1} className="container-x py-[clamp(96px,12vw,160px)]">
      <BeforeAfter c={c.case} />
    </section>
  );
}
