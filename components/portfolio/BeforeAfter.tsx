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
 * (lib/portfolio/efkapowa.ts), fetched only around the current position and decoded at the size they are
 * shown (not the 1280px master) into a small bitmap cache, so a visitor who scrolls part way downloads part
 * and a phone never holds hundreds of megabytes of pixels.
 *
 * On a phone one screen is shown at a time (Przed / Po toggle) and the timeline is a prev/next stepper that
 * names the stage. With reduced motion nothing is pinned or played: the layout is decided in CSS
 * (motion-reduce:), so there is no jump, and the stage buttons just swap the frame.
 */

const N = E.positions.length;
const BEHIND = 4;
/** frames closer together than this (in recorded px of scroll) are cross-faded */
const BLEND_GAP = 7;
const PLAY_SECONDS = 28;
const OLD_MAX = E.old.height - E.viewportHeight;
/** the stage buttons' places on the 0 to 1 line (share of the recorded page scroll) */
const STAGE_P = E.stages.map((f) => (f === null ? 0 : (E.storyStart + f * (E.storyEnd - E.storyStart)) / E.end));
const LAST = STAGE_P.length - 1;

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
  const holder = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const oldPage = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const fillM = useRef<HTMLSpanElement>(null);
  const engine = useRef<{ setPos: (p: number) => void } | null>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  /** phone only: which of the two screens is showing */
  const [side, setSide] = useState<"before" | "after">("after");
  const [failed, setFailed] = useState(false);

  // Frames: fetched around the current position, decoded at display size into a small cache, painted on a canvas.
  useEffect(() => {
    const cv = canvas.current;
    const root = holder.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx || !root) return;

    const small = window.innerWidth < 640;
    const AHEAD = small ? 14 : 24;
    const KEEP = small ? 24 : 48;
    const decodeWidth = () => {
      const panel = window.innerWidth < 640 ? root.clientWidth : root.clientWidth / 2;
      const w = Math.ceil((panel * Math.min(window.devicePixelRatio || 1, 2)) / 2) * 2;
      return Math.min(E.width, Math.max(640, w));
    };
    let W = decodeWidth();
    let H = Math.round((W * E.height) / E.width);
    cv.width = W;
    cv.height = H;

    const cache = new Map<number, ImageBitmap>();
    const inflight = new Map<number, AbortController>();
    let alive = true;
    let near = false;
    let raf = 0;
    let pos = 0;
    let focus = 0;
    let shown = 0;
    let fails = 0;
    let reported = false;

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
      const ac = new AbortController();
      inflight.set(i, ac);
      fetch(frameSrc(i), { signal: ac.signal })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.blob();
        })
        .then((b) =>
          createImageBitmap(b, { resizeWidth: W, resizeHeight: H, resizeQuality: "medium" }).catch(() => createImageBitmap(b)),
        )
        .then((bm) => {
          if (inflight.get(i) === ac) inflight.delete(i);
          if (!alive) return bm.close();
          fails = 0;
          if (reported) {
            reported = false;
            setFailed(false);
          }
          cache.set(i, bm);
          trim();
          request();
        })
        .catch((e) => {
          if (inflight.get(i) === ac) inflight.delete(i);
          if (e?.name === "AbortError" || !alive) return;
          // a few misses in a row with nothing to show: say so instead of leaving a still picture
          if (++fails >= 4 && cache.size === 0 && !reported) {
            reported = true;
            setFailed(true);
          }
        });
    };
    const draw = () => {
      raf = 0;
      const { i, t } = frameAt(pos * E.end);
      focus = i;
      // a seek leaves requests behind for frames nobody wants any more: stop them
      for (const [k, ac] of inflight) {
        if (k < i - BEHIND - 2 || k > i + AHEAD + 2) {
          ac.abort();
          inflight.delete(k);
        }
      }
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
        const sx = `scaleX(${pos.toFixed(4)})`;
        if (fill.current) fill.current.style.transform = sx;
        if (fillM.current) fillM.current.style.transform = sx;
        const s = stageIndex(pos);
        if (s !== shown) {
          shown = s;
          setStage(s);
        }
        request();
      },
    };

    // a bigger window needs sharper frames: start the cache again at the new size
    const onResize = () => {
      const nw = decodeWidth();
      if (nw <= W * 1.25) return;
      W = nw;
      H = Math.round((W * E.height) / E.width);
      inflight.forEach((ac) => ac.abort());
      inflight.clear();
      cache.forEach((bm) => bm.close());
      cache.clear();
      cv.width = W;
      cv.height = H;
      request();
    };
    window.addEventListener("resize", onResize);

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
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      inflight.forEach((ac) => ac.abort());
      inflight.clear();
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
      onUpdate: (self) => engine.current?.setPos(self.progress),
      onRefresh: (self) => engine.current?.setPos(self.progress),
    });
    trigger.current = st;
    return () => {
      st.kill();
      trigger.current = null;
    };
  }, [reduced]);

  // Play: the page scrolls itself through the held range; any wheel, touch, key or scrollbar grab takes over.
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
    // a press on the page's own scrollbar lands on the root element
    const grab = (e: Event) => {
      if (e.target === document.documentElement) setPlaying(false);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", stop);
    window.addEventListener("mousedown", grab);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("mousedown", grab);
    };
  }, [playing]);

  const go = (p: number) => {
    setPlaying(false);
    const st = trigger.current;
    if (reduced || !st) return engine.current?.setPos(p);
    scrollWindowTo(st.start + p * (st.end - st.start), { duration: 0.9 });
  };
  const step = (d: number) => go(STAGE_P[Math.min(LAST, Math.max(0, stage + d))]);

  return (
    <div>
      <div ref={headReveal} className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 data-reveal className="font-display text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.1]">
          {c.title}
        </h2>
        {/* The hint lives up here, not on the recording, so nothing covers the new site's own buttons. */}
        <p data-reveal className="flex items-center gap-2 text-[0.8125rem] text-ink-soft motion-reduce:hidden">
          {c.hint}
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 6 8 10.5 12.5 6" />
          </svg>
        </p>
      </div>

      {/* The holder is as tall as the scroll that plays the recording; the card stays on screen inside it. */}
      <div ref={holder} className="mt-6 md:mt-8">
        <div
          ref={sticky}
          className="glass rounded-3xl p-3 max-sm:-mx-3 max-sm:p-2 md:p-5 sticky top-[max(88px,calc(50svh-250px))] [@media(max-height:480px)]:top-[76px] motion-reduce:static"
        >
          {/* Phone: one screen at a time, switched here. From 640px both sit side by side. */}
          <div role="group" aria-label={c.viewLabel} className="mb-2 flex gap-1 rounded-full bg-white/[0.06] p-1 sm:hidden">
            {(["before", "after"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={side === s}
                onClick={() => setSide(s)}
                className={cn(
                  "min-h-11 flex-1 rounded-full text-[0.8125rem] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                  side === s ? "bg-white/[0.14] text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {c[s]}
              </button>
            ))}
          </div>

          {/* Each screen carries its own label above it, so nothing sits on top of the recording. The width is
              capped so both screens, the labels and the timeline still fit in a short window. */}
          <div
            role="img"
            aria-label={c.summary}
            className="mx-auto grid max-w-[max(280px,calc((100svh-300px)*1.6))] gap-3 sm:max-w-[max(560px,calc(3.2*(100svh-330px)))] sm:grid-cols-2 sm:gap-4"
          >
            <Screen label={c.before} note={c.beforeCaption} href="https://ewamyslowska.pl/" className={side === "after" ? "max-sm:hidden" : undefined}>
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
            <Screen label={c.after} note={c.stages[stage]} className={side === "before" ? "max-sm:hidden" : undefined}>
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
            </Screen>
          </div>

          <div className="mt-2 flex items-center gap-2 md:gap-3">
            <button
              type="button"
              data-play
              aria-label={playing ? c.pause : c.play}
              onClick={() => setPlaying((p) => !p)}
              className="grid size-11 flex-none place-items-center rounded-full border border-white/10 bg-white/[0.06] text-ink transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 motion-reduce:hidden"
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

            {/* Phone: seven dots would be too close to tap, so a stepper that names the stage. */}
            <div role="group" aria-label={c.stagesLabel} className="relative flex flex-1 items-center md:hidden">
              <StepButton dir="prev" label={c.prev} disabled={stage === 0} onClick={() => step(-1)} />
              <p className="min-w-0 flex-1 truncate px-1 text-center text-[0.8125rem] text-ink-soft">
                <span className="font-semibold text-ink">
                  {stage + 1}/{LAST + 1}
                </span>{" "}
                {c.stages[stage]}
              </p>
              <StepButton dir="next" label={c.next} disabled={stage === LAST} onClick={() => step(1)} />
              <span aria-hidden className="absolute inset-x-1 bottom-0 h-[3px] overflow-hidden rounded-full bg-white/10">
                <span ref={fillM} className="block h-full origin-left scale-x-0 bg-brand-400" />
              </span>
            </div>

            {/* Left margin clears the first stage's name ("Początek") from the play button. */}
            <div role="group" aria-label={c.stagesLabel} className="relative ml-5 mr-3 hidden h-11 flex-1 md:mb-5 md:ml-11 md:block">
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
                      "pointer-events-none absolute left-1/2 top-[calc(50%+13px)] -translate-x-1/2 whitespace-nowrap text-[0.75rem] transition-colors",
                      i === stage ? "text-ink" : "text-ink-soft group-hover:text-ink",
                    )}
                  >
                    {c.stages[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {failed && (
            <p role="status" className="mt-2 px-1 text-[0.8125rem] text-ink-soft">
              {c.loadError}
            </p>
          )}
        </div>
        {/* The scroll that plays it. A real element, not padding: a sticky box only travels inside its parent's content box. */}
        <div aria-hidden style={{ height: "300svh" }} className="motion-reduce:hidden" />
      </div>

    </div>
  );
}

/** A 44px previous / next arrow for the phone stepper. */
function StepButton({ dir, label, disabled, onClick }: { dir: "prev" | "next"; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 flex-none place-items-center rounded-full text-ink transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-400 disabled:text-ink-soft/40 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
      </svg>
    </button>
  );
}

/** One of the two screens: a label row (name, then a quiet note), then a 16:10 window. */
function Screen({
  label,
  note,
  href,
  className,
  children,
}: {
  label: string;
  note: string;
  /** makes the note a link that opens in a new tab */
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-2 flex items-baseline gap-2 px-1 text-[0.8125rem] text-ink-soft">
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ink">{label}</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            {note}
          </a>
        ) : (
          <span aria-hidden>{note}</span>
        )}
      </p>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">{children}</div>
    </div>
  );
}
