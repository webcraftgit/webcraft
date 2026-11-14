"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LanguageProvider";
import Footer from "@/components/layout/Footer";
import BeforeAfter from "@/components/portfolio/BeforeAfter";
import { useReveal } from "@/hooks/useReveal";
import { PORTFOLIO } from "@/lib/seo/portfolio";

/**
 * /portfolio (outline 2026-11-03; first case 2026-11-14).
 *
 * One case so far: the Efkapowa before/after. Green stays reserved for
 * conversion, so the only green button on the page is the final one.
 */
export default function PortfolioPage() {
  const [locale] = useLocale();
  const c = PORTFOLIO[locale] ?? PORTFOLIO.pl;
  const heroReveal = useReveal<HTMLElement>();

  return (
    <>
      <main>
        <header ref={heroReveal} className="container-x pb-[clamp(24px,3vw,40px)] pt-[clamp(104px,10vw,136px)]">
          <h1 data-reveal className="heading-2">{c.h1}</h1>
        </header>

        <section aria-label={c.workHeading} className="container-x">
          <BeforeAfter c={c.case} />
        </section>

        <section className="container-x pb-[clamp(96px,12vw,160px)] pt-[clamp(72px,9vw,120px)]">
          <div className="border-t border-white/10 pt-10 md:pt-14">
            <h2 className="heading-2 max-w-[20ch]">{c.nextHeading}</h2>
            <p className="mt-4 max-w-[52ch] text-body text-ink-soft">{c.nextBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/#contact"
                className="inline-flex min-h-[48px] items-center rounded-full bg-accent-green px-7 text-ui font-semibold text-bg hover:brightness-110"
              >
                {c.cta}
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex min-h-[48px] items-center px-2 text-ui font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {c.secondaryCta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

