"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";

/**
 * The views→sales funnel. Four tiers narrow toward the bottom; each lights up
 * (and counts up) when the matching process step crosses the viewport line.
 * Numbers are explicitly illustrative — we never invent real-sounding client
 * stats (same reason there are no fake testimonials).
 *
 * i18n: tier labels + surrounding copy come from the dictionary; the numeric
 * shape (counts/widths) stays here. Count-up numbers format to the active
 * locale's grouping.
 *
 * accent-green budget (≤1 per viewport) is spent on the final "Act" tier.
 */

// numeric shape only — labels come from t.process.funnel.tiers[i].
// Widths narrow to signal the funnel but bottom out at 62%: the old 32% floor
// clipped longer (e.g. Polish) labels. Combined with wrapping labels + a
// min-width, every tier now fits its text in any language.
export const TIERS = [
  { count: 1000, width: "100%" },
  { count: 620, width: "88%" },
  { count: 210, width: "75%" },
  { count: 38, width: "62%" },
];

type Props = {
  /** highest lit tier index; -1 = none */
  active: number;
  reduced: boolean;
};

export default function FunnelPanel({ active, reduced }: Props) {
  const t = useT();
  const [locale] = useLocale();
  const numLocale = locale === "pl" ? "pl-PL" : "en-US";
  const fmtNum = (n: number) => n.toLocaleString(numLocale);

  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shown = useRef<Set<number>>(new Set());
  const [visits, setVisits] = useState(1000);
  const scaled = (i: number) => Math.max(1, Math.round((TIERS[i].count / 1000) * visits));

  // count a tier's number up the first time it lights; re-glide on visits change
  useEffect(() => {
    if (reduced) return;
    TIERS.forEach((_, i) => {
      const el = numRefs.current[i];
      if (!el) return;
      if (active >= i && !shown.current.has(i)) {
        shown.current.add(i);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: scaled(i),
          duration: 1.1,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent = fmtNum(Math.round(obj.v));
          },
        });
      } else if (shown.current.has(i)) {
        const from = parseInt(el.textContent!.replace(/[^0-9]/g, ""), 10) || 0;
        const obj = { v: from };
        gsap.to(obj, {
          v: scaled(i),
          duration: 0.6,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent = fmtNum(Math.round(obj.v));
          },
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced, visits, locale]);

  return (
    <aside aria-label={t.process.funnel.aria} className="glass relative rounded-panel p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(165,243,252,0.5) 50%, transparent)",
        }}
      />

      <p className="eyebrow">{t.process.funnel.eyebrow}</p>
      <label className="mt-3 flex items-center gap-2.5 text-[14px] text-ink-soft" htmlFor="funnel-visits">
        {t.process.funnel.outOfPre}
        <input
          id="funnel-visits"
          type="number"
          min={100}
          max={1000000}
          step={100}
          value={visits}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) setVisits(Math.min(1000000, Math.max(0, Math.round(v))));
          }}
          onBlur={() => setVisits((v) => Math.max(100, v))}
          className="w-[110px] rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-1.5 text-[15px] font-medium text-ink outline-none transition-colors focus:border-brand-400"
        />
        {t.process.funnel.outOfPost}
      </label>

      <div className="mt-6 space-y-3">
        {TIERS.map((tier, i) => {
          const lit = reduced || active >= i;
          const isFinal = i === TIERS.length - 1;
          const litColor = isFinal ? "#34D399" : "#38BDF8";
          const label = t.process.funnel.tiers[i];
          return (
            <div key={label} className="flex flex-col items-center">
              <div
                className="relative min-w-[13rem] max-w-full rounded-input border px-4 py-3 transition-all duration-500"
                style={{
                  width: tier.width,
                  borderColor: lit
                    ? isFinal
                      ? "rgba(52,211,153,0.45)"
                      : "rgba(56,189,248,0.4)"
                    : "rgba(56,189,248,0.12)",
                  background: lit
                    ? `linear-gradient(180deg, ${
                        isFinal ? "rgba(52,211,153,0.12)" : "rgba(56,189,248,0.12)"
                      }, rgba(12,20,36,0.6))`
                    : "rgba(12,20,36,0.45)",
                  boxShadow: lit
                    ? `0 0 28px -10px ${isFinal ? "rgba(52,211,153,0.5)" : "rgba(56,189,248,0.45)"}`
                    : "none",
                  opacity: lit ? 1 : 0.55,
                }}
              >
                <p
                  className="font-display text-[clamp(1.15rem,1.4vw,1.35rem)] font-medium leading-none transition-colors duration-500"
                  style={{ color: lit ? litColor : "#8FA3BF" }}
                >
                  <span ref={(el) => void (numRefs.current[i] = el)}>
                    {reduced ? fmtNum(scaled(i)) : "0"}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">
                  {label}
                </p>
              </div>
              {i < TIERS.length - 1 && (
                <span
                  aria-hidden
                  className="my-0.5 h-3 w-px transition-colors duration-500"
                  style={{
                    background: reduced || active > i ? "rgba(56,189,248,0.5)" : "rgba(56,189,248,0.14)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-ink-soft/80">
        {t.process.funnel.footnote}
      </p>
    </aside>
  );
}
