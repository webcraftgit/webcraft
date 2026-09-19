"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LanguageProvider";

const LOAD_MS = 740; // where the replay lands — our real-world LCP target zone
const MILESTONES = [
  { at: 120, label: "TTFB" },
  { at: 380, label: "FCP" },
  { at: 740, label: "LCP" },
];

/**
 * Replays a page load: skeleton shimmer → content, while a real ms counter
 * runs and milestone ticks light up along a timing bar. Auto-plays once when
 * scrolled into view; the button replays it.
 */
export default function SpeedDemo() {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const clock = useMotionValue(0);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const played = useRef(false);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => () => anim.current?.stop(), []);

  const run = useCallback(() => {
    if (reduced) {
      clock.set(LOAD_MS);
      setMs(LOAD_MS);
      setPlaying(false);
      played.current = true;
      return;
    }
    setPlaying(true);
    clock.set(0);
    anim.current?.stop();
    anim.current = animate(clock, LOAD_MS, {
      duration: LOAD_MS / 1000,
      ease: "linear",
      onUpdate: (v) => setMs(Math.round(v)),
      onComplete: () => setPlaying(false),
    });
    played.current = true;
  }, [clock, reduced]);

  /* auto-play once on first view */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !played.current) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [run]);

  const loaded = !playing && ms >= LOAD_MS;
  const pct = Math.min(1, ms / LOAD_MS);

  return (
    <div ref={root} className="flex h-full flex-col">
      {/* mini page: skeleton → content */}
      <div className="flex-1 rounded-card border border-brand-400/15 bg-bg p-4">
        {loaded ? (
          <div>
            <p className="font-display text-[15px] font-medium text-ink">{t.demos.speed.headline}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
              {t.demos.speed.sub}
            </p>
            <span className="mt-3 inline-block rounded-full bg-brand-400 px-3.5 py-1.5 text-[11.5px] font-semibold text-[#05080F]">
              {t.demos.speed.cta}
            </span>
          </div>
        ) : (
          <div aria-hidden>
            {["w-3/4 h-3.5", "w-full h-2.5 mt-2.5", "w-2/3 h-2.5 mt-1.5", "w-24 h-6 mt-3 rounded-full"].map(
              (c, i) => (
                <span key={i} className={cn("skeleton block rounded-[6px]", c)} />
              )
            )}
          </div>
        )}
      </div>

      {/* timing bar */}
      <div className="mt-4">
        <div className="relative h-1.5 overflow-visible rounded-full bg-bg-soft">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
            style={{ width: `${pct * 100}%` }}
          />
          {MILESTONES.map((m) => {
            const hit = ms >= m.at;
            return (
              <span
                key={m.label}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(m.at / LOAD_MS) * 100}%` }}
              >
                <span
                  className={cn(
                    "block h-2.5 w-2.5 -translate-x-1/2 rounded-full border transition-colors duration-200",
                    hit ? "border-brand-300 bg-brand-400" : "border-brand-700 bg-bg-soft"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-3.5 -translate-x-1/2 text-[10px] font-medium tracking-[0.05em] transition-colors duration-200",
                    hit ? "text-brand-300" : "text-ink-soft/60"
                  )}
                >
                  {m.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* counter + replay */}
      <div className="mt-8 flex items-center justify-between">
        <p className="font-mono text-[13px] tabular-nums text-ink" aria-live="polite">
          <span className="text-[17px] font-semibold text-brand-300">{ms}</span>
          <span className="text-ink-soft">{t.demos.speed.msLabel}</span>
        </p>
        <button
          type="button"
          data-cursor={t.demos.speed.cursor}
          onClick={run}
          disabled={playing}
          className="glass flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-ink transition-colors hover:border-[var(--glass-border-hover)] disabled:opacity-50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </svg>
          {t.demos.speed.replay}
        </button>
      </div>
    </div>
  );
}
