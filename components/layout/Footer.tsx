"use client";

import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConsent } from "@/components/analytics/ConsentProvider";

/**
 * Footer (CP4.2 minimal → CP5-i18n → CP6-backend).
 *
 * Carries the privacy link and the consent re-opener. Withdrawal of consent
 * must be "as easy as giving it" (GDPR Art. 7(3)) — so it lives in the footer
 * of every page, permanently, not buried in a policy document.
 */
const LINKS = [
  { key: "services", href: "/#services" },
  { key: "craft", href: "/#craft" },
  { key: "showcase", href: "/#showcase" },
  { key: "process", href: "/#process" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
] as const;

export default function Footer() {
  const t = useT();
  const { reopen } = useConsent();
  return (
    <footer className="relative border-t border-[rgba(56,189,248,0.12)]">
      <div className="container-x flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-medium text-ink">Webcraft</p>
          <p className="mt-1 text-[13.5px] text-ink-soft">{t.footer.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13.5px] text-ink-soft transition-colors hover:text-ink"
                >
                  {t.nav[l.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-[13.5px] text-ink-soft md:text-right">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand-300 transition-colors hover:text-brand-400"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-1">
            © {new Date().getFullYear()} Webcraft. {t.footer.rights}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              {t.consent.policy}
            </Link>
            <button
              type="button"
              onClick={reopen}
              className="text-left underline decoration-brand-500/30 underline-offset-4 transition-colors hover:text-ink"
            >
              {t.consent.settingsLink}
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
}
