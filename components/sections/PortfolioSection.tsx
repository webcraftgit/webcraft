"use client";

import BeforeAfter from "@/components/portfolio/BeforeAfter";
import { useLocale, useT } from "@/components/i18n/LanguageProvider";
import { PORTFOLIO } from "@/lib/seo/portfolio";

/**
 * Portfolio, embedded on the home page (replaces the old Craft band).
 * The same Efkapowa before/after as /portfolio: copy and frames come from
 * lib/seo/portfolio.ts and lib/portfolio/efkapowa.ts, so the two never drift.
 */
export default function PortfolioSection() {
  const [locale] = useLocale();
  const t = useT();
  const c = PORTFOLIO[locale] ?? PORTFOLIO.pl;

  return (
    <section id="portfolio" aria-label={c.h1} className="container-x py-[clamp(96px,12vw,160px)]">
      <BeforeAfter
        c={c.case}
        footer={
          /* Held with the title and the frame, so it is visible from the first moment. */
          <a
            href="#contact"
            className="inline-flex min-h-[48px] items-center rounded-full bg-[#10b981] px-8 text-ui font-semibold text-bg shadow-[0_0_24px_4px_rgba(16,185,129,0.45),0_0_60px_10px_rgba(16,185,129,0.2)] transition-shadow hover:shadow-[0_0_32px_8px_rgba(16,185,129,0.6),0_0_80px_16px_rgba(16,185,129,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#10b981]"
          >
            {t.hero.formSubmit}
          </a>
        }
      />
    </section>
  );
}
