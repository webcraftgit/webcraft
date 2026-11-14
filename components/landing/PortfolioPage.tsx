"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LanguageProvider";
import Footer from "@/components/layout/Footer";
import BeforeAfter from "@/components/portfolio/BeforeAfter";
import Skeleton from "@/components/ui/Skeleton";
import { useReveal } from "@/hooks/useReveal";
import { PORTFOLIO } from "@/lib/seo/portfolio";

/**
 * /portfolio (outline 2026-11-03; first case 2026-11-14).
 *
 * The featured slot is the Efkapowa before/after. The two cards under it are
 * skeleton placeholders until more real client projects exist, so a project
 * only has to replace a skeleton. Green stays reserved for conversion, so the
 * only green button on the page is the final one.
 */
export default function PortfolioPage() {
  const [locale] = useLocale();
  const c = PORTFOLIO[locale] ?? PORTFOLIO.pl;
  const heroReveal = useReveal<HTMLElement>();

  return (
    <>
      <main>
        <header ref={heroReveal} className="container-x pb-[clamp(32px,4vw,56px)] pt-[clamp(104px,10vw,136px)]">
          <p data-reveal className="eyebrow">{c.eyebrow}</p>
          <h1 data-reveal className="heading-2 mt-3 max-w-[22ch]">{c.h1}</h1>
          <p data-reveal className="mt-5 max-w-[56ch] text-body text-ink-soft">{c.intro}</p>
        </header>

        <section aria-label={c.workHeading} className="container-x">
          <BeforeAfter c={c.case} />
          <p role="status" className="sr-only">{c.placeholderStatus}</p>
          <div aria-hidden className="mt-16 grid gap-6 md:mt-24 md:grid-cols-2 md:gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>

        <section className="container-x pb-[clamp(96px,12vw,160px)] pt-[clamp(72px,9vw,120px)]">
          <div className="glass rounded-3xl p-7 md:p-12">
            <h2 className="heading-2 max-w-[20ch]">{c.nextHeading}</h2>
            <p className="mt-4 max-w-[52ch] text-body text-ink-soft">{c.nextBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/#contact"
                className="inline-flex min-h-[48px] items-center rounded-full bg-accent-green px-7 text-ui font-semibold text-[#05080F] hover:brightness-110"
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


/** Same frame a real project card will use: image area plus a text column. */
function SkeletonCard() {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="aspect-[4/3] bg-white/[0.04] motion-safe:animate-pulse md:aspect-[16/10]" />
      <div className="flex flex-col p-6 md:p-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mt-6 h-12 w-44" />
      </div>
    </div>
  );
}

