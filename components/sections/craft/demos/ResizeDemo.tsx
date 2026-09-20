"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LanguageProvider";

const BP_TABLET = 560; // px — mini-viewport breakpoints, not real media queries
const BP_MOBILE = 420;

/* CP4_55 — THE DEMO WAS UNUSABLE ON A PHONE.
 *
 * The breakpoints above are REAL pixels of the mini viewport, and the mini
 * viewport can only ever be as wide as the card holding it. On a 390px phone
 * that card is ~300px — so the drag had about 60px of travel between the
 * floor and the card edge, and 560px (let alone "desktop") was not reachable
 * at any point. The handle worked; there was simply nowhere for it to go.
 *
 * The fix is the one every responsive-preview tool uses: on a narrow card the
 * mini viewport REPRESENTS a wider screen than it physically occupies. Drag
 * distance maps onto a virtual width via `scale`, and the breakpoints and the
 * px readout both read the VIRTUAL number — so the readout stays truthful
 * about the screen being simulated, which is the thing the demo is about.
 * Above REF_W the scale is exactly 1 and desktop behaviour is untouched.
 *
 * The floor moves with the card too (half its width, rather than a fixed
 * 240px that a 300px card cannot go meaningfully below), so there is real
 * travel on both sides of both breakpoints at any card size. */
const REF_W = 700; // card width at which the mini viewport is 1:1
const MIN_W = 240; // floor, in real px, on a card wide enough for it

type Bp = "desktop" | "tablet" | "mobile";
const bpOf = (w: number): Bp => (w < BP_MOBILE ? "mobile" : w < BP_TABLET ? "tablet" : "desktop");

/**
 * Drag the handle → the mini page reflows through desktop / tablet / mobile.
 * Width lives in a motionValue (no re-render per pixel); React state only
 * changes when the breakpoint changes, so the reflow is a discrete "rethink"
 * rather than a squeeze.
 */
export default function ResizeDemo() {
  const t = useT();
  const track = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [maxW, setMaxW] = useState(720);
  const width = useMotionValue<number>(720);
  const [bp, setBp] = useState<Bp>("desktop");

  /* 1 on a roomy card; >1 on a phone, where every real pixel of drag stands
     for more than one pixel of simulated screen. */
  const scale = maxW >= REF_W ? 1 : REF_W / maxW;
  const minW = maxW >= REF_W ? MIN_W : Math.round(maxW * 0.5);

  /* keep the mini viewport inside its card at any card size */
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const m = Math.max(160, e.contentRect.width);
      setMaxW(m);
      const floor = m >= REF_W ? MIN_W : Math.round(m * 0.5);
      if (width.get() > m) width.set(m);
      if (width.get() < floor) width.set(floor);
      if (width.get() === 720) width.set(m); // initial: fill
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  useMotionValueEvent(width, "change", (w) => {
    const next = bpOf(w * scale); // virtual width decides the breakpoint
    setBp((prev) => (prev === next ? prev : next));
  });
  /* the card can be resized under a parked handle — re-evaluate on scale change */
  useEffect(() => {
    setBp(bpOf(width.get() * scale));
  }, [scale, width]);

  const layout = {
    desktop: { cols: "grid-cols-3", navLinks: 3, stackNav: false },
    tablet: { cols: "grid-cols-2", navLinks: 2, stackNav: false },
    mobile: { cols: "grid-cols-1", navLinks: 0, stackNav: true },
  }[bp];

  const setFromPointer = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    width.set(Math.min(maxW, Math.max(minW, clientX - r.left)));
  };

  return (
    <div ref={track} className="relative select-none pr-3">
      {/* breakpoint badge */}
      <div className="mb-3 flex items-center gap-2" aria-live="polite">
        {(["desktop", "tablet", "mobile"] as Bp[]).map((b) => (
          <span
            key={b}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors duration-300",
              b === bp ? "bg-brand-400 text-[#05080F]" : "bg-bg-soft text-ink-soft"
            )}
          >
            {t.demos.resize.bp[b]}
          </span>
        ))}
      </div>

      {/* mini viewport */}
      <motion.div
        style={{ width }}
        className="relative overflow-hidden rounded-card border border-brand-400/20 bg-bg"
      >
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-brand-400/10 bg-bg-soft/60 px-3 py-2">
          {["#F87171", "#FBBF24", "#34D399"].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c, opacity: 0.7 }} />
          ))}
          <span className="ml-2 h-3.5 flex-1 rounded-full bg-bg" />
        </div>

        <div className="p-4">
          {/* mini nav */}
          <div className="flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold text-ink">{t.demos.resize.brand}</span>
            {layout.stackNav ? (
              <span className="flex h-5 w-5 flex-col items-end justify-center gap-[3px]">
                <span className="h-px w-4 bg-ink-soft" />
                <span className="h-px w-3 bg-ink-soft" />
              </span>
            ) : (
              <span className="flex gap-3">
                {[...Array(layout.navLinks)].map((_, i) => (
                  <span key={i} className="h-2 w-8 rounded-full bg-bg-soft" />
                ))}
                <span className="h-2 w-10 rounded-full bg-brand-500/70" />
              </span>
            )}
          </div>

          {/* mini hero */}
          <div className="mt-4">
            <span className={cn("block h-3 rounded-full bg-ink/85", bp === "mobile" ? "w-full" : "w-3/5")} />
            <span className={cn("mt-2 block h-3 rounded-full bg-ink/50", bp === "mobile" ? "w-5/6" : "w-2/5")} />
            <span className="mt-3 inline-block h-6 w-20 rounded-full bg-brand-400" />
          </div>

          {/* mini cards — the part that "rethinks" */}
          <div className={cn("mt-4 grid gap-2.5 transition-all duration-500", layout.cols)}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-input border border-brand-400/15 bg-bg-soft/70 p-2.5",
                  bp === "mobile" && "flex items-center gap-2.5"
                )}
              >
                <span
                  className={cn(
                    "block shrink-0 rounded-[8px] bg-brand-700/50",
                    bp === "mobile" ? "h-8 w-8" : "h-10 w-full"
                  )}
                />
                <span className={cn("block", bp !== "mobile" && "mt-2")}>
                  <span className="block h-2 w-4/5 rounded-full bg-ink/60" />
                  <span className="mt-1.5 block h-2 w-3/5 rounded-full bg-ink/30" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* width readout */}
        <WidthReadout width={width} scale={scale} />
      </motion.div>

      {/* drag handle — sits on the mini viewport's right edge */}
      <motion.button
        type="button"
        data-cursor={t.demos.resize.cursor}
        aria-label={t.demos.resize.aria}
        style={{ left: width }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
            setFromPointer(e.clientX);
          }
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 80 : 24;
          if (e.key === "ArrowLeft") width.set(Math.max(minW, width.get() - step));
          if (e.key === "ArrowRight") width.set(Math.min(maxW, width.get() + step));
        }}
        className={cn(
          "absolute top-[calc(50%+14px)] z-10 flex h-16 w-5 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full",
          // a 20px-wide target is fine for a mouse and poor for a thumb
          "after:absolute after:-inset-y-2 after:-inset-x-3 after:content-['']",
          "-ml-2.5 border border-brand-400/40 bg-bg-soft shadow-[0_0_16px_rgba(56,189,248,0.3)]",
          !reduced && "transition-shadow hover:shadow-[0_0_24px_rgba(56,189,248,0.55)]"
        )}
      >
        <span className="flex gap-[3px]" aria-hidden>
          <span className="h-5 w-px bg-brand-300/80" />
          <span className="h-5 w-px bg-brand-300/80" />
        </span>
      </motion.button>
    </div>
  );
}

/** live px readout without re-rendering the demo per pixel */
function WidthReadout({
  width,
  scale,
}: {
  width: ReturnType<typeof useMotionValue<number>>;
  scale: number;
}) {
  const [w, setW] = useState(0);
  // the SIMULATED width, which is what the demo is claiming to show
  useMotionValueEvent(width, "change", (v) => setW(Math.round(v * scale)));
  useEffect(() => setW(Math.round(width.get() * scale)), [width, scale]);
  return (
    <span className="pointer-events-none absolute bottom-2 right-2.5 font-mono text-[10.5px] tabular-nums text-ink-soft/80">
      {w}px
    </span>
  );
}
