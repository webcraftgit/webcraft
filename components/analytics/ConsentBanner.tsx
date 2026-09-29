"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useConsent } from "./ConsentProvider";
import { cn } from "@/lib/utils";
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
 * Not modal, not blocking: a compact card in the bottom-left corner —
 * a cookie wall would also be a consent problem.
 */
export default function ConsentBanner() {
  const t = useT();
  const { decided, decide } = useConsent();
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  /* Equal prominence, literally: Accept used to be a filled cyan pill and
     Reject an outline, which is exactly the asymmetry the comment above
     rules out. Both are now the same button. */
  const btn =
    "min-h-[44px] flex-1 rounded-full border border-[var(--glass-border-hover)] bg-[rgba(56,189,248,0.12)] px-5 py-2.5 text-ui font-semibold text-ink transition-colors hover:bg-[rgba(56,189,248,0.22)]";

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
          /* md+: a compact corner card. It used to be 440px wide with
             body-size copy, which reached into the centred hero lead and CTA
             on laptop-width screens; at 360px with small copy it clears the
             centred hero column from ~1280px up and covers far less below. */
          className={cn(
            "glass fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-[440px] rounded-panel p-5 md:bottom-6 md:left-6 md:right-auto md:mx-0",
            managing ? "md:max-w-[440px] md:p-6" : "md:max-w-[360px] md:p-5"
          )}
        >
          {!managing ? (
            <div>
              <div>
                <p className="font-display text-title font-medium leading-snug text-ink">
                  {t.consent.title}
                </p>
                <p className="mt-2.5 text-ui leading-relaxed text-ink-soft md:mt-2 md:text-small">
                  {t.consent.body}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-small">
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
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                {/* equal prominence — deliberate */}
                <button type="button" onClick={() => decide(true)} className={btn}>
                  {t.consent.acceptAll}
                </button>
                <button type="button" onClick={() => decide(false)} className={btn}>
                  {t.consent.rejectAll}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-display text-title font-medium leading-snug text-ink">
                {t.consent.title}
              </p>
              <ul className="mt-4 space-y-3">
                <li className="rounded-input border border-[var(--glass-border)] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ui font-medium text-ink">{t.consent.necessaryLabel}</span>
                    <span className="text-label uppercase tracking-wide text-ink-soft">
                      {t.consent.always}
                    </span>
                  </div>
                  <p className="mt-1.5 text-small leading-relaxed text-ink-soft">
                    {t.consent.necessaryDesc}
                  </p>
                </li>

                <li className="rounded-input border border-[var(--glass-border)] p-3.5">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-ui font-medium text-ink">{t.consent.analyticsLabel}</span>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="h-5 w-5 accent-[var(--brand-400)]"
                    />
                  </label>
                  <p className="mt-1.5 text-small leading-relaxed text-ink-soft">
                    {t.consent.analyticsDesc}
                  </p>
                </li>
              </ul>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => decide(analytics)}
                  className={btn}
                >
                  {t.consent.save}
                </button>
                <button
                  type="button"
                  onClick={() => setManaging(false)}
                  className={btn}
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
