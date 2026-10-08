"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LanguageProvider";
import Footer from "@/components/layout/Footer";
import { LANDINGS, LANDING_PATHS, type LandingPath } from "@/lib/seo/landings";
import { ABOUT, ABOUT_PATH } from "@/lib/seo/about";

/**
 * Shared layout for the indexable landing pages (SEO pass, 2026-10-01).
 *
 * Deliberately plain: no WebGL, no scroll-driven reveals. These pages exist to
 * be read by a crawler and by someone who arrived from a search result, so the
 * text is in the server HTML at full opacity and the page is light enough to
 * be fast on a phone. Styling reuses the /privacy page's tokens so the two
 * read as one site.
 *
 * /about (lib/seo/about.ts) rides on the same template: same shape, and the
 * same job of being read rather than watched.
 */
export default function LandingPage({ path }: { path: LandingPath | typeof ABOUT_PATH }) {
  const [locale] = useLocale();
  const copy = path === ABOUT_PATH ? ABOUT : LANDINGS[path];
  const c = copy[locale] ?? copy.pl;
  const related = LANDING_PATHS.filter((p) => p !== path);

  return (
    <>
      <main className="container-x py-[clamp(120px,14vw,180px)]">
        <article className="max-w-[70ch]">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="heading-2 mt-3">{c.h1}</h1>
          <p className="mt-5 text-body text-ink-soft">{c.intro}</p>

          <div className="mt-12 space-y-10">
            {c.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-display text-title font-medium text-ink">{s.h}</h2>
                {s.list && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-ink-soft marker:text-brand-500">
                    {s.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
                {s.p?.map((para) => (
                  <p key={para} className="mt-3 leading-relaxed text-ink-soft">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <section className="mt-14">
            <h2 className="font-display text-title font-medium text-ink">{c.faqHeading}</h2>
            <dl className="mt-4 space-y-6">
              {c.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium text-ink">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-soft">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="glass mt-14 rounded-3xl p-7 md:p-9">
            <h2 className="font-display text-title font-medium text-ink">{c.ctaHeading}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{c.ctaBody}</p>
            <Link
              href="/#contact"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-brand-400 px-7 text-ui font-semibold text-[#05080F] hover:bg-brand-300"
            >
              {c.cta}
            </Link>
          </section>

          <nav aria-label={c.relatedHeading} className="mt-14">
            <p className="eyebrow">{c.relatedHeading}</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {related.map((p) => (
                <li key={p}>
                  <Link
                    href={p}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--glass-border-hover)] px-5 text-ui text-ink hover:bg-[rgba(56,189,248,0.08)]"
                  >
                    {LANDINGS[p][locale]?.label ?? LANDINGS[p].pl.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}
