"use client";

import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { TIERS, FOUNDING_SLOTS, CARE_PLAN, fmt } from "@/lib/pricing";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";

/**
 * Pricing (CP4.2) — four transparent tiers at FOUNDING RATES.
 *
 * Honesty rules baked in: real published prices (no fake strikethroughs —
 * we never charged more, so nothing is "crossed out"), the no-portfolio
 * situation stated plainly and turned into the offer, ranges instead of
 * false precision, and "prices rise as slots fill" as a true statement of
 * intent rather than a countdown-timer trick.
 *
 * Tier CTAs jump to #contact and prefill the form's project-type chip via
 * a CustomEvent — no global state needed.
 */

export function prefillContact(tierId: string) {
  window.dispatchEvent(new CustomEvent("wc:prefill-tier", { detail: tierId }));
}

export default function PricingSection() {
  const t = useT();
  const [locale] = useLocale();
  const price = (n: number) => fmt(n, locale, t.currency);
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative">
      {/* atmosphere — faint pocket, melted in */}
      <div className="fade-band pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_10%,rgba(13,26,46,0.8)_0%,rgba(13,26,46,0)_65%)]" />
      </div>

      <div ref={reveal} className="container-x relative py-[clamp(96px,12vw,160px)]">
        <h2 data-reveal id="pricing-heading" className="heading-2 max-w-[20ch]">
          {t.pricing.heading}
        </h2>
        <p data-reveal className="mt-5 max-w-[58ch] text-body text-ink-soft">
          {t.pricing.introPre}
          {FOUNDING_SLOTS}
          {t.pricing.introPost}
        </p>

        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "glass relative flex flex-col rounded-panel p-7 transition-colors duration-300 hover:border-[var(--glass-border-hover)]",
                /* the recommended tier has to read as recommended at a glance —
                   a slightly brighter border alone did not. Brighter edge, a
                   cyan wash from the top and a glow; on desktop it also sits
                   a step higher than its neighbours. */
                tier.highlight &&
                  "border-[rgba(56,189,248,0.6)] bg-[linear-gradient(180deg,rgba(56,189,248,0.12),rgba(14,24,41,0.55)_45%)] shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_30px_80px_-30px_rgba(56,189,248,0.45)] xl:-translate-y-3"
              )}
            >
              {/* rim-light hairline */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(165,243,252,0.5) 50%, transparent)",
                }}
              />
              {tier.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand-400 px-3 py-1 text-label font-semibold uppercase tracking-[0.06em] text-[#05080F]">
                  {t.pricing.mostProjects}
                </span>
              )}

              <h3 className="font-display text-[clamp(1.3rem,1.8vw,1.6rem)] font-medium text-ink">
                {t.pricing.tiers[tier.id].name}
              </h3>
              <p className="mt-1.5 min-h-[2.6em] text-ui leading-snug text-ink-soft">
                {t.pricing.tiers[tier.id].tagline}
              </p>

              <p className="mt-5">
                {tier.upTo !== undefined && <span className="text-small text-ink-soft">{t.pricing.from}&nbsp;</span>}
                <span className="font-display text-[clamp(2rem,3vw,2.6rem)] font-medium leading-none text-brand-300">
                  {price(tier.from)}
                </span>
              </p>
              <p className="mt-1 text-small text-ink-soft">
                {tier.upTo !== undefined && `${t.pricing.upToPre} ${price(tier.upTo)} · `}
                {t.pricing.tiers[tier.id].weeks}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-[var(--glass-border)] pt-6">
                {t.pricing.tiers[tier.id].includes.map((line) => (
                  <li key={line} className="flex gap-2.5 text-ui leading-snug text-ink-soft">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                onClick={() => prefillContact(tier.id)}
                className={cn(
                  "mt-7 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-2.5 text-ui font-semibold transition-colors",
                  tier.highlight
                    ? "bg-brand-400 text-[#05080F] hover:bg-brand-300"
                    : "glass text-ink hover:border-[var(--glass-border-hover)]"
                )}
              >
                {t.pricing.ctaPrefix} {t.pricing.tiers[tier.id].name}
              </a>
            </article>
          ))}
        </div>

        {/* Key terms. These used to be the second half of a grey footnote
            (fixed quote, case-study condition) and a chip repeated on every
            card (50/50) — the three things a buyer most needs to know. */}
        <ul data-reveal className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
          {t.pricing.terms.map((term) => (
            <li key={term.title} className="flex gap-3">
              <svg
                className="mt-1 h-4 w-4 shrink-0 text-accent-green"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-ui font-medium text-ink">{term.title}</p>
                <p className="mt-1 text-small leading-relaxed text-ink-soft">{term.body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* CP5.4: care plan — monthly hosting + maintenance + small changes.
            One price (no range), scope guard in the note. */}
        <aside
          data-reveal
          aria-labelledby="care-plan-heading"
          className="glass relative mt-8 rounded-panel p-7"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(165,243,252,0.5) 50%, transparent)",
            }}
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
            <div className="lg:w-[30%] lg:shrink-0">
              <h3
                id="care-plan-heading"
                className="font-display text-[clamp(1.2rem,1.6vw,1.45rem)] font-medium text-ink"
              >
                {t.pricing.care.title}
              </h3>
              <p className="mt-1.5 text-ui leading-snug text-ink-soft">
                {t.pricing.care.tagline}
              </p>
              <p className="mt-4">
                <span className="font-display text-[clamp(1.5rem,2vw,1.8rem)] font-medium text-brand-300">
                  {price(CARE_PLAN.monthly)}
                </span>
                <span className="text-small text-ink-soft">{t.pricing.care.perMonth}</span>
              </p>
            </div>
            <ul className="grid flex-1 gap-2.5 sm:grid-cols-2">
              {t.pricing.care.includes.map((line) => (
                <li key={line} className="flex gap-2.5 text-ui leading-snug text-ink-soft">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-small leading-relaxed text-ink-soft">
            {t.pricing.care.note}
          </p>
        </aside>

        <p data-reveal className="mt-8 max-w-[64ch] text-small leading-relaxed text-ink-soft">
          {t.pricing.footnote}
        </p>
      </div>
    </section>
  );
}
