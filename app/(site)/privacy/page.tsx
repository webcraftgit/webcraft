"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { useConsent } from "@/components/analytics/ConsentProvider";
import { PRIVACY_COPY as COPY } from "@/lib/privacy";

/**
 * Privacy policy (CP6-backend).
 *
 * ⚠️  DRAFT — accurate about what the code actually does, but NOT legal advice.
 * A Polish lawyer must review this before launch. The controller-identity
 * fields below are legally required (Art. 13(1)(a) RODO). The site is run by a
 * private individual, not a registered company, so the controller is that
 * person — Krzysztof Powierża, kristofpow@gmail.com (there is no company name
 * or NIP to list). If this ever becomes a registered business, swap those in.
 *
 * Copy lives in lib/privacy.ts rather than the shared dictionary on purpose: it is
 * long-form legal text that changes on a different schedule from the marketing
 * copy, and bumping POLICY_VERSION is what re-triggers the consent banner.
 */

export default function PrivacyPage() {
  const [locale] = useLocale();
  const { reopen } = useConsent();
  const c = COPY[locale] ?? COPY.pl;

  return (
    <main className="container-x py-[clamp(120px,14vw,180px)]">
      <div className="max-w-[70ch]">
        <p className="eyebrow">{c.updated}</p>
        <h1 className="heading-2 mt-3">{c.title}</h1>
        <p className="mt-5 text-body text-ink-soft">{c.intro}</p>

        <div className="mt-12 space-y-10">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-title font-medium text-ink">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reopen}
            className="min-h-[48px] rounded-full bg-brand-400 px-7 text-ui font-semibold text-[#05080F] hover:bg-brand-300"
          >
            {c.manage}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center rounded-full border border-[var(--glass-border-hover)] px-7 text-ui font-medium text-ink hover:bg-[rgba(56,189,248,0.08)]"
          >
            {c.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
