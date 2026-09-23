"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReveal } from "@/hooks/useReveal";
import FunnelPanel, { TIERS } from "./FunnelPanel";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";

/**
 * Process (CP4) — the views→sales funnel narrative.
 *
 * Left column: our four process steps on a progress spine (scroll-driven,
 * so GSAP/ScrollTrigger owns it — locked architecture rule). Right column
 * (desktop): a sticky funnel that lights up tier by tier as the matching
 * step crosses the viewport line. On mobile the funnel tier is embedded
 * in each step card instead — no sticky, no duplicate panel.
 *
 * Atmosphere: no WebGL (2-canvas budget stays Hero + Services) — a single
 * off-center glow pocket under .fade-band, one surface step darker than
 * the Craft band so the page keeps sinking toward the footer.
 */

const STEP_KEYS = ["discover", "design", "build", "launch"] as const;

export default function ProcessSection() {
  const t = useT();
  const [locale] = useLocale();
  const numLocale = locale === "pl" ? "pl-PL" : "en-US";
  const STEPS = STEP_KEYS.map((k) => ({ k, ...t.process.steps[k] }));
  const reveal = useReveal<HTMLDivElement>();
  const stepsRef = useRef<HTMLOListElement>(null);
  const spineRef = useRef<HTMLSpanElement>(null);
  // -1 = nothing lit yet; N = tiers 0..N lit
  const [active, setActive] = useState(-1);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setReduced(true);
      setActive(STEPS.length - 1); // everything visible, nothing animates
      return;
    }

    const list = stepsRef.current;
    const spine = spineRef.current;
    if (!list) return;

    const triggers: ScrollTrigger[] = [];

    // progress spine — fills with scroll (scrub), scroll-driven → GSAP
    if (spine) {
      gsap.set(spine, { scaleY: 0, transformOrigin: "top center" });
      const tween = gsap.to(spine, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top 62%",
          end: "bottom 62%",
          scrub: true,
        },
      });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }

    // one trigger per step — lights the matching funnel tier
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-step]"));
    items.forEach((el, i) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 62%",
          onEnter: () => setActive((a) => Math.max(a, i)),
          onLeaveBack: () => setActive(i - 1),
        })
      );
    });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section id="process" aria-labelledby="process-heading" className="relative">
      {/* atmosphere — one deep glow pocket, melted into the page */}
      <div className="fade-band pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_82%_22%,rgba(13,26,46,0.85)_0%,rgba(13,26,46,0)_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_12%_78%,rgba(7,89,133,0.22)_0%,rgba(7,89,133,0)_70%)]" />
      </div>

      <div ref={reveal} className="container-x relative py-[clamp(96px,12vw,160px)]">
        <h2 data-reveal id="process-heading" className="heading-2 max-w-[20ch]">
          {t.process.heading}
        </h2>
        <p data-reveal className="mt-5 max-w-[56ch] text-body text-ink-soft">
          {t.process.introPre}
          <span className="text-ink">{t.process.introStrong}</span>
          {t.process.introPost}
        </p>

        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          {/* ——— steps + spine ——— */}
          <div>
            <ol ref={stepsRef} className="relative space-y-10 md:space-y-14">
            {/* spine track + progress fill */}
            <span
              aria-hidden
              className="absolute bottom-6 left-[23px] top-6 w-px bg-[rgba(56,189,248,0.14)]"
            />
            <span
              ref={spineRef}
              aria-hidden
              className="absolute bottom-6 left-[23px] top-6 w-px bg-gradient-to-b from-brand-300 via-brand-400 to-brand-500"
              style={reduced ? undefined : { transform: "scaleY(0)" }}
            />

            {STEPS.map((s, i) => {
              const lit = active >= i;
              const tier = TIERS[i];
              return (
                <li key={s.k} data-step className="relative pl-16 md:pl-20">
                  {/* node */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border transition-colors duration-500"
                    style={{
                      borderColor: lit ? "rgba(56,189,248,0.55)" : "rgba(56,189,248,0.18)",
                      background: lit
                        ? "radial-gradient(120% 120% at 30% 25%, rgba(56,189,248,0.28), rgba(12,20,36,0.9) 70%)"
                        : "rgba(12,20,36,0.7)",
                      boxShadow: lit ? "0 0 24px -6px rgba(56,189,248,0.55)" : "none",
                    }}
                  >
                    <span
                      className="font-display text-ui font-medium transition-colors duration-500"
                      style={{ color: lit ? "#A5F3FC" : "#8FA3BF" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-[clamp(1.25rem,2vw,1.6rem)] font-medium leading-tight text-ink">
                      {s.title}
                    </h3>
                    <span className="rounded-full border border-[var(--glass-border)] bg-[rgba(14,24,41,0.55)] px-3 py-1 text-small font-medium text-ink-soft">
                      {s.time}
                    </span>
                  </div>
                  <p className="mt-2.5 max-w-[52ch] leading-relaxed text-ink-soft">{s.body}</p>

                  <p className="mt-4 flex items-center gap-2 text-small font-medium text-brand-300">
                    <span className="h-1 w-1 rounded-full bg-brand-400" aria-hidden />
                    {s.deliverable}
                  </p>

                  {/* mobile-only funnel chip — the sticky panel is desktop-only */}
                  <p className="mt-3 inline-flex items-center gap-2 rounded-input border border-[var(--glass-border)] bg-[rgba(14,24,41,0.55)] px-3 py-1.5 text-small text-ink-soft lg:hidden">
                    <span className="text-ink">{tier.count.toLocaleString(numLocale)}</span>
                    <span aria-hidden>·</span>
                    {t.process.funnel.tiers[i]}
                  </p>
                </li>
              );
            })}
            </ol>
            <p className="mt-8 pl-16 text-small text-ink-soft/70 md:pl-20">
              {t.process.footnote}
            </p>
          </div>

          {/* ——— sticky funnel (desktop) ——— */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <FunnelPanel active={active} reduced={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
