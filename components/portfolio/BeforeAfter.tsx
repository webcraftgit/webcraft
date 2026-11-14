"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollWindowTo } from "@/lib/scroll-to";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { EFKAPOWA as E, frameSrc } from "@/lib/portfolio/efkapowa";
import type { CaseCopy } from "@/lib/seo/portfolio";

/**
 * The Efkapowa case: the old site and a recording of the new one, side by side, driven by ONE scroll.
 *
 * The card is CSS-sticky inside a tall holder, so the browser holds it on screen and the page's own scroll
 * (Lenis included) plays the recording; no scroll box of its own that could trap the wheel. A ScrollTrigger
 * only maps the held scroll onto 0 to 1. The old page moves the same number of pixels as the new one until it
 * runs out of page, which is the whole comparison.
 *
 * The recording is still frames of the real site, one every 6px of scroll through the animation
 * (lib/portfolio/efkapowa.ts), fetched only around the
 * current position and decoded into a small bitmap cache, so a visitor who scrolls part way downloads part.
 * With reduced motion nothing is pinned or played: the stage buttons just swap the frame.
 */

const N = E.positions.length;
const BEHIND = 4;
const AHEAD = 24;
const KEEP = 48;
/** frames closer together than this (in recorded px of scroll) are cross-faded */
const BLEND_GAP = 7;
const PLAY_SECONDS = 28;
const OLD_MAX = E.old.height - E.viewportHeight;
/** the stage buttons' places on the 0 to 1 line (share of the recorded page scroll) */
const STAGE_P = E.stages.map((f) => (f === null ? 0 : (E.storyStart + f * (E.storyEnd - E.storyStart)) / E.end));

const stageIndex = (p: number) => STAGE_P.reduce((s, sp, i) => (p >= sp - 1e-4 ? i : s), 0);

/** the last frame at or before scroll position y, and how far it is on towards the next */
function frameAt(y: number) {
  let lo = 0;
  let hi = N - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (E.positions[m] <= y) lo = m;
    else hi = m - 1;
  }
  const t = lo < N - 1 ? (y - E.positions[lo]) / (E.positions[lo + 1] - E.positions[lo]) : 0;
  return { i: lo, t: Math.min(1, Math.max(0, t)) };
}

export default function BeforeAfter({ c }: { c: CaseCopy }) {
  const reduced = usePrefersReducedMotion();
  const headReveal = useReveal<HTMLDivElement>();
  const factsReveal = useReveal<HTMLUListElement>();
  const holder = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const oldPage = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const engine = useRef<{ setPos: (p: number) => void } | null>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Frames: fetched around the current position, decoded into a small cache, painted on a canvas.
  useEffect(() => {
    const cv = canvas.current;
    const root = holder.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx || !root) return;

    const cache = new Map<number, ImageBitmap>();
    const inflight = new Set<number>();
    let alive = true;
    let near = false;
    let raf = 0;
    let pos = 0;
    let focus = 0;
    let shown = 0;

    const trim = () => {
      if (cache.size <= KEEP) return;
      const far = [...cache.keys()].sort((a, b) => Math.abs(b - focus) - Math.abs(a - focus));
      while (cache.size > KEEP) {
        const k = far.shift()!;
        cache.get(k)?.close();
        cache.delete(k);
      }
    };
    const nearest = (i: number) => {
      for (let d = 0; d < N; d++) {
        if (cache.has(i - d)) return i - d;
        if (cache.has(i + d)) return i + d;
      }
      return -1;
    };
    const load = (i: number) => {
      if (i < 0 || i >= N || cache.has(i) || inflight.has(i)) return;
      inflight.add(i);
      fetch(frameSrc(i))
        .then((r) => r.blob())
        .then((b) => createImageBitmap(b))
        .then((bm) => {
          inflight.delete(i);
          if (!alive) return bm.close();
          cache.set(i, bm);
          trim();
          request();
        })
        .catch(() => inflight.delete(i));
    };
    const draw = () => {
      raf = 0;
      const { i, t } = frameAt(pos * E.end);
      focus = i;
      for (let k = -BEHIND; k <= AHEAD; k++) load(i + k);
      const a = nearest(i);
      if (a < 0) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(cache.get(a)!, 0, 0, cv.width, cv.height);
      // Blend only through the animation, where frames are 6px apart. Where the page just scrolls (opening,
      // letter) the frames are further apart and blending would double-expose the text, so those snap.
      const next = cache.get(i + 1);
      if (a === i && next && t > 0.04 && E.positions[i + 1] - E.positions[i] <= BLEND_GAP) {
        ctx.globalAlpha = t;
        ctx.drawImage(next, 0, 0, cv.width, cv.height);
        ctx.globalAlpha = 1;
      }
    };
    function request() {
      if (alive && near && !raf) raf = requestAnimationFrame(draw);
    }

    engine.current = {
      setPos(p) {
        pos = Math.min(1, Math.max(0, p));
        const y = pos * E.end;
        // the old page travels the same distance, until it runs out of page
        if (oldPage.current) oldPage.current.style.transform = `translate3d(0,${((-Math.min(OLD_MAX, y) / E.old.height) * 100).toFixed(3)}%,0)`;
        if (fill.current) fill.current.style.transform = `scaleX(${pos.toFixed(4)})`;
        const s = stageIndex(pos);
        if (s !== shown) {
          shown = s;
          setStage(s);
        }
        request();
      },
    };

    // nothing is fetched until the card is within a screen or so
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) request();
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(root);

    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(raf);
      cache.forEach((bm) => bm.close());
      cache.clear();
      engine.current = null;
    };
  }, []);

  // The held scroll drives it (not with reduced motion: there nothing is pinned).
  useEffect(() => {
    const h = holder.current;
    const s = sticky.current;
    if (reduced || !h || !s) return;
    const top = () => parseFloat(getComputedStyle(s).top) || 0;
    const st = ScrollTrigger.create({
      trigger: h,
      start: () => `top ${top()}px`,
      end: () => `bottom top+=${top() + s.offsetHeight}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        engine.current?.setPos(self.progress);
        if (self.progress > 0.004) setScrolled(true);
      },
      onRefresh: (self) => engine.current?.setPos(self.progress),
    });
    trigger.current = st;
    return () => {
      st.kill();
      trigger.current = null;
    };
  }, [reduced]);

  // Play: the page scrolls itself through the held range; any wheel, touch or key from the visitor takes over.
  useEffect(() => {
    if (!playing) return;
    const st = trigger.current;
    if (!st) return setPlaying(false);
    const from = st.progress >= 0.995 ? 0 : st.progress;
    const t0 = performance.now();
    const ms = PLAY_SECONDS * 1000 * (1 - from);
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      scrollWindowTo(st.start + (from + (1 - from) * k) * (st.end - st.start), { immediate: true });
      if (k < 1) raf = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(step);
    const stop = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-play]")) return;
      setPlaying(false);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [playing]);

  const go = (p: number) => {
    setPlaying(false);
    const st = trigger.current;
    if (reduced || !st) return engine.current?.setPos(p);
    scrollWindowTo(st.start + p * (st.end - st.start), { duration: 0.9 });
  };

  return (
    <div>
      <div ref={headReveal} className="max-w-[62ch]">
        <p data-reveal className="eyebrow">{c.eyebrow}</p>
        <h2 data-reveal className="mt-3 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1]">
          {c.title}
        </h2>
        <p data-reveal className="mt-4 text-body text-ink-soft">{c.intro}</p>
      </div>

      {/* The holder is as tall as the scroll that plays the recording; the card stays on screen inside it. */}
      <div ref={holder} className="mt-8 md:mt-10">
        <div
          ref={sticky}
          className={cn("glass rounded-3xl p-3 md:p-5", !reduced && "sticky top-[max(88px,calc(50svh-250px))]")}
        >
          {/* Each screen carries its own label above it, so nothing sits on top of the recording. The width is
              capped (stacked on a phone, side by side from 640px) so both screens, the labels and the timeline
              still fit in a short window. */}
          <div
            role="img"
            aria-label={c.summary}
            className="mx-auto grid max-w-[max(240px,calc((100svh-330px)/1.25))] gap-3 sm:max-w-[max(560px,calc(3.2*(100svh-330px)))] sm:grid-cols-2 sm:gap-4"
          >
            <Screen label={c.before} note={c.beforeCaption}>
              <div ref={oldPage} className="absolute left-0 top-0 w-full will-change-transform">
                <Image
                  src={E.old.src}
                  alt=""
                  width={E.old.width}
                  height={E.old.height}
                  unoptimized
                  draggable={false}
                  className="block h-auto w-full max-w-none"
                />
              </div>
            </Screen>
            <Screen label={c.after} note={c.stages[stage]}>
              <Image
                src={frameSrc(0)}
                alt=""
                width={E.width}
                height={E.height}
                unoptimized
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <canvas ref={canvas} width={E.width} height={E.height} aria-hidden className="absolute inset-0 h-full w-full" />
              {!reduced && (
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bg/80 px-3.5 py-1.5 text-[12px] font-semibold text-ink backdrop-blur transition-opacity duration-500",
                    scrolled && "opacity-0",
                  )}
                >
                  {c.hint}
                </span>
              )}
            </Screen>
          </div>

          <div className="mt-2 flex items-center gap-2 md:gap-3">
            {!reduced && (
              <button
                type="button"
                data-play
                aria-pressed={playing}
                aria-label={playing ? c.pause : c.play}
                onClick={() => setPlaying((p) => !p)}
                className="grid size-11 flex-none place-items-center rounded-full border border-white/10 bg-white/[0.06] text-ink transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                {playing ? (
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M4 1.5v13l10-6.5z" />
                  </svg>
                )}
              </button>
            )}
            {/* Left margin clears the first stage's name ("Początek") from the play button. */}
            <div role="group" aria-label={c.stagesLabel} className="relative ml-5 mr-3 h-11 flex-1 md:mb-5 md:ml-11">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/10" />
              <span
                ref={fill}
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-[3px] origin-left -translate-y-1/2 scale-x-0 rounded-full bg-brand-400"
              />
              {STAGE_P.map((p, i) => (
                <button
                  key={c.stages[i]}
                  type="button"
                  aria-label={c.stages[i]}
                  aria-current={i === stage ? "step" : undefined}
                  onClick={() => go(p)}
                  style={{ left: `${p * 100}%` }}
                  className="group absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-brand-400"
                >
                  <span
                    className={cn(
                      "block size-2.5 rounded-full border transition-[transform,background-color,border-color] duration-200",
                      i === stage
                        ? "scale-125 border-brand-400 bg-brand-400"
                        : i < stage
                          ? "border-brand-400/60 bg-brand-400/60"
                          : "border-white/30 bg-bg group-hover:border-brand-400",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-[calc(50%+13px)] hidden -translate-x-1/2 whitespace-nowrap text-[12px] transition-colors md:block",
                      i === stage ? "text-ink" : "text-ink-soft group-hover:text-ink",
                    )}
                  >
                    {c.stages[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* The scroll that plays it. A real element, not padding: a sticky box only travels inside its parent's content box. */}
        {!reduced && <div aria-hidden style={{ height: "300svh" }} />}
      </div>

      <ul ref={factsReveal} className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3">
        {c.facts.map((f) => (
          <li key={f.h} data-reveal className="border-t border-white/10 pt-5">
            <h3 className="font-display text-title font-medium text-ink">{f.h}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{f.p}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[13px] text-ink-soft">{c.note}</p>
    </div>
  );
}

/** One of the two screens: a label row (name, then a quiet note), then a 16:10 window. */
function Screen({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2 px-1 text-[13px] text-ink-soft">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink">{label}</span>
        <span aria-hidden>{note}</span>
      </p>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">{children}</div>
    </div>
  );
}
