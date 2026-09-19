"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useConsent } from "./ConsentProvider";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Consent banner (CP6-backend).
 *
 * The rules this UI exists to satisfy, not decorate:
 *  - Analytics does not run before a choice. The tracker reads the same cookie.
 *  - "Reject" is the SAME size, weight and colour affordance as "Accept".
 *    A greyed-out reject button is a dark pattern and an EDPB finding waiting
 *    to happen. Both are real buttons; neither is pre-selected.
 *  - Closing is not consenting: there is no X. You choose, or the banner stays.
 *  - Withdrawal is one click, from the footer, forever (settingsLink).
 *
 * Not modal, not blocking: it sits bottom-left and never covers the content —
 * a cookie wall would also be a consent problem.
 */
export default function ConsentBanner() {
  const t = useT();
  const { decided, decide } = useConsent();
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const btn =
    "min-h-[44px] flex-1 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors";

  return (
    <AnimatePresence>
      {!decided && (
        <motion.div
          role="dialog"
          aria-modal={false}
          aria-label={t.consent.title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="glass fixed bottom-4 left-4 right-4 z-[90] max-w-[440px] rounded-panel p-5 md:bottom-6 md:left-6 md:right-auto md:p-6"
        >
          <p className="font-display text-[19px] font-medium leading-snug text-ink">
            {t.consent.title}
          </p>

          {!managing ? (
            <>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{t.consent.body}</p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                {/* equal prominence — deliberate */}
                <button
                  type="button"
                  onClick={() => decide(true)}
                  className={`${btn} bg-brand-400 text-[#05080F] hover:bg-brand-300`}
                >
                  {t.consent.acceptAll}
                </button>
                <button
                  type="button"
                  onClick={() => decide(false)}
                  className={`${btn} border border-[var(--glass-border-hover)] bg-transparent text-ink hover:bg-[rgba(56,189,248,0.08)]`}
                >
                  {t.consent.rejectAll}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                <button
                  type="button"
                  onClick={() => setManaging(true)}
                  className="text-ink-soft underline decoration-brand-500/40 underline-offset-4 hover:text-ink"
                >
                  {t.consent.manage}
                </button>
                <Link
                  href="/privacy"
                  className="text-brand-300 underline decoration-brand-500/40 underline-offset-4 hover:text-brand-400"
                >
                  {t.consent.policy}
                </Link>
              </div>
            </>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                <li className="rounded-input border border-[var(--glass-border)] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-medium text-ink">{t.consent.necessaryLabel}</span>
                    <span className="text-[12px] uppercase tracking-wide text-ink-soft">
                      {t.consent.always}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    {t.consent.necessaryDesc}
                  </p>
                </li>

                <li className="rounded-input border border-[var(--glass-border)] p-3.5">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-[14px] font-medium text-ink">{t.consent.analyticsLabel}</span>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="h-5 w-5 accent-[var(--brand-400)]"
                    />
                  </label>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    {t.consent.analyticsDesc}
                  </p>
                </li>
              </ul>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => decide(analytics)}
                  className={`${btn} bg-brand-400 text-[#05080F] hover:bg-brand-300`}
                >
                  {t.consent.save}
                </button>
                <button
                  type="button"
                  onClick={() => setManaging(false)}
                  className={`${btn} border border-[var(--glass-border-hover)] bg-transparent text-ink hover:bg-[rgba(56,189,248,0.08)]`}
                >
                  {t.consent.back}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
