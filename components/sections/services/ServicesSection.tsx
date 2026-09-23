"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ScrollTrigger } from "@/lib/gsap";
import ServiceCard, { type Service } from "./ServiceCard";
import { useReveal } from "@/hooks/useReveal";
import { useIsMobile, usePrefersReducedMotion, useMediaQuery } from "@/hooks/useMediaQuery";
import { servicesScroll } from "@/lib/scroll-state";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const ServicesScene = dynamic(() => import("./ServicesScene"), { ssr: false });

const I = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

// Icons + ids only; the text (title/body/outcome) comes from the dictionary,
// keyed by id, and is assembled per-locale inside the component.
type ServiceKey = keyof Dictionary["services"]["items"];
const ICONS: { key: ServiceKey; icon: React.ReactNode }[] = [
  {
    key: "sell",
    icon: (
      <I>
        <rect x="2.5" y="4" width="19" height="13" rx="2" />
        <path d="M8.5 20h7M12 17v3M8 9l2.5 2.5L8 14M13 14h3.5" />
      </I>
    ),
  },
  {
    key: "care",
    icon: (
      <I>
        <path d="M14.7 6.4a4.2 4.2 0 0 0-5.6 5.6L3.5 17.6V20.5h2.9l5.6-5.6a4.2 4.2 0 0 0 5.6-5.6l-2.9 2.9-2.5-2.5 2.5-3.3z" />
      </I>
    ),
  },
  {
    key: "video",
    icon: (
      <I>
        <rect x="2.5" y="5" width="19" height="14" rx="4" />
        <path d="M10 9.2l4.8 2.8-4.8 2.8z" fill="currentColor" stroke="none" />
      </I>
    ),
  },
  {
    key: "print",
    icon: (
      <I>
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <circle cx="8" cy="11" r="1.7" />
        <path d="M5.6 15.4c.5-1.3 1.4-2 2.4-2s1.9.7 2.4 2M14 9.8h4.5M14 12.6h3" />
      </I>
    ),
  },
];

/* ---------- rotary wheel geometry ----------
 * `rotation` is a continuous, UNBOUNDED index — the wheel spins forever.
 * Each disc lives at pos = wrap(i - rotation) into [-n/2, n/2) so the four
 * discs cycle around the rim (with n=4 the wrap jump happens at |pos|=2,
 * deep inside the hidden zone, so it is never visible). Placement on the rim:
 *   x = sin(pos·θ)·R          (horizontal swing)
 *   y = -(1 - cos(pos·θ))·R   (side discs RISE up the rim — wheel center sits below)
 *   rotate = pos·SPIN         (the disc itself turns with the wheel)
 * Only |pos| ≤ 1 is visible — always one disc in the middle + one on each side. */
const THETA = (Math.PI / 180) * 40; // 40° between neighbouring discs
const SPIN = 12; // deg of self-rotation per step
const MAX_POS = 1.6; // transforms clamp here; fully hidden past 1.45
const WHEEL_SPRING = { type: "spring", stiffness: 240, damping: 30 } as const;
const N = ICONS.length;
const mod = (v: number) => ((v % N) + N) % N;
/** signed shortest wrap distance from slot `from` to slot `to` */
const shortest = (from: number, to: number) => {
  let d = mod(to - from);
  if (d > N / 2) d -= N;
  return d;
};

type SlideProps = {
  i: number;
  rotation: MotionValue<number>;
  active: boolean;
  service: Service;
  onFocus: () => void;
};

function WheelSlide({ i, rotation, active, service, onFocus }: SlideProps) {
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  // 3-tier wheel: phone / tablet / desktop — tablet discs used to render at
  // desktop size and spill off a 768px viewport (CP4.1)
  const step = isMobile ? 195 : isDesktop ? 370 : 300; // px between disc centers
  const R = step / Math.sin(THETA); // wheel radius in px

  const pos = useTransform(rotation, (r) => {
    let p = mod(i - r); // wrap into [0, n)
    if (p >= N / 2) p -= N; // …then into [-n/2, n/2)
    return Math.max(-MAX_POS, Math.min(MAX_POS, p));
  });
  const x = useTransform(pos, (p) => Math.sin(p * THETA) * R);
  const y = useTransform(pos, (p) => -(1 - Math.cos(p * THETA)) * R * 0.5);
  const rotate = useTransform(pos, (p) => p * SPIN);
  const scale = useTransform(pos, (p) => 1 - Math.abs(p) * 0.14);
  const opacity = useTransform(pos, (p) => {
    const a = Math.abs(p);
    return a <= 1 ? 1 - a * 0.4 : Math.max(0, 0.6 - (a - 1) * (0.6 / 0.45));
  });
  /* CP4_54 — MOBILE SCROLL JANK. Every disc carried a live `filter`
   * (blur + brightness) even at rest, where it evaluates to `blur(0px)`.
   * A non-none filter is not free: it forces the disc onto its own
   * composited layer, and a phone re-rasterizes that layer — 340px wide,
   * with an inset sheen and a 70px shadow — whenever the layer's texture
   * is evicted. Scrolling past evicts it, which is exactly the "the
   * bubbles blink out for a frame" the client is seeing.
   * Desktop keeps the depth-of-field; mobile gets scale + opacity only,
   * which the compositor animates without repainting anything. */
  const filter = useTransform(pos, (p) => {
    const a = Math.min(Math.abs(p), 1.2);
    return `blur(${(a * 6).toFixed(2)}px) brightness(${(1 - a * 0.24).toFixed(3)})`;
  });
  const zIndex = useTransform(pos, (p) => 100 - Math.round(Math.abs(p) * 30));
  const pointerEvents = useTransform(pos, (p) =>
    Math.abs(p) > 1.45 ? ("none" as const) : ("auto" as const)
  );

  return (
    <motion.li
      style={{ zIndex }}
      aria-hidden={!active}
      className="pointer-events-none absolute inset-x-0 top-16 flex list-none justify-center md:top-24"
    >
      <motion.div
        style={{
          x,
          y,
          rotate,
          scale,
          opacity,
          // static string on phones: no filter, no extra layer, no repaint
          filter: isMobile ? "none" : filter,
          pointerEvents,
        }}
        onClick={onFocus}
        className={cn(
          "w-[min(86vw,340px)] md:w-[460px] lg:w-[560px]",
          // four permanently promoted layers is a lot of texture memory on a
          // phone; only the disc in focus keeps the hint
          active && "will-change-transform",
          !active && "cursor-pointer"
        )}
      >
        <ServiceCard service={service} active={active} index={i} />
      </motion.div>
    </motion.li>
  );
}

export default function ServicesSection() {
  const t = useT();
  const SERVICES: (Service & { key: string })[] = ICONS.map((x) => ({
    key: x.key,
    icon: x.icon,
    ...t.services.items[x.key],
  }));
  const band = useRef<HTMLDivElement>(null);
  const reveal = useReveal<HTMLDivElement>();
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);

  /* ---------- rotary carousel state ---------- */
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const rotation = useMotionValue(0); // continuous index driving the wheel
  const dragging = useRef(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const dragStep = isMobile ? 195 : isDesktop ? 370 : 300; // px of drag per disc — must match `step` in WheelSlide

  /** spin to an absolute (unbounded) wheel position */
  const goTo = useCallback(
    (target: number) => {
      indexRef.current = target;
      setIndex(target);
      animate(rotation, target, reduced ? { duration: 0 } : WHEEL_SPRING);
    },
    [reduced, rotation]
  );

  /** spin to service slot i (0..n-1) via the shortest arc */
  const goToItem = useCallback(
    (i: number) => goTo(indexRef.current + shortest(mod(indexRef.current), i)),
    [goTo]
  );

  /* ---------- band lifecycle (unchanged) ---------- */
  useEffect(() => {
    const el = band.current;
    if (!el) return;

    const mountObs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          mountObs.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    const activeObs = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: "80px 0px",
    });
    mountObs.observe(el);
    activeObs.observe(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        servicesScroll.progress = self.progress;
      },
    });

    return () => {
      mountObs.disconnect();
      activeObs.disconnect();
      st.kill();
      servicesScroll.progress = 0;
    };
  }, []);

  return (
    <section id="services" aria-labelledby="services-heading" className="-mt-[10vh]">
      <div ref={band} className="relative">
        {/* atmosphere — masked top & bottom so the band melts into the page */}
        <div className="fade-band absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_10%,#0C1424_0%,rgba(12,20,36,0)_70%)]" />
          {!isMobile && near ? (
            <div className="absolute inset-0">
              <ServicesScene active={active} />
            </div>
          ) : (
            <div className="absolute inset-0">
              {[...Array(isMobile ? 8 : 14)].map((_, i) => (
                <span
                  key={i}
                  className="drift-dot absolute block rounded-full bg-brand-400/40"
                  style={{
                    width: 7 + (i % 3) * 4,
                    height: 7 + (i % 3) * 4,
                    left: `${(i * 71) % 100}%`,
                    top: `${(i * 37) % 100}%`,
                    animation: `drift ${14 + (i % 5) * 4}s ease-in-out ${i * 0.7}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* content */}
        <div ref={reveal}>
          <div className="container-x relative py-[clamp(96px,12vw,160px)] pb-0 md:pb-0">
            <h2 data-reveal id="services-heading" className="heading-2 max-w-[16ch]">
              {t.services.heading}
            </h2>
          </div>

          {/* rotary wheel — full-bleed so the side discs peek in from the edges */}
          <div data-reveal className="relative pb-[clamp(96px,12vw,160px)] pt-12 md:pt-16">
            <motion.ul
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={() => (dragging.current = true)}
              onDrag={(_, info) => {
                rotation.set(indexRef.current - info.offset.x / dragStep);
              }}
              onDragEnd={(_, info) => {
                setTimeout(() => (dragging.current = false), 0);
                const flick = info.velocity.x < -400 ? 1 : info.velocity.x > 400 ? -1 : 0;
                goTo(
                  flick !== 0
                    ? indexRef.current + flick
                    : Math.round(rotation.get())
                );
              }}
              className="relative mx-auto h-[calc(min(86vw,340px)+112px)] w-full max-w-[1400px] cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing md:h-[620px] lg:h-[712px]"
            >
              {SERVICES.map((service, i) => (
                <WheelSlide
                  key={service.key}
                  i={i}
                  rotation={rotation}
                  active={i === mod(index)}
                  service={service}
                  onFocus={() => {
                    if (!dragging.current && i !== mod(index)) goToItem(i);
                  }}
                />
              ))}
            </motion.ul>

            {/* controls */}
            <div className="container-x mt-4 flex items-center justify-between">
              <div className="flex gap-2.5" role="tablist" aria-label={t.services.tablist}>
                {SERVICES.map((svc, i) => (
                  <button
                    key={svc.key}
                    role="tab"
                    aria-selected={i === mod(index)}
                    aria-label={svc.title}
                    onClick={() => goToItem(i)}
                    className={cn(
                      "relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']",
                      i === mod(index) ? "w-8 bg-brand-400" : "w-2 bg-brand-700 hover:bg-brand-500"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                {[
                  { label: t.services.prev, dir: -1, d: "M15 18l-6-6 6-6" },
                  { label: t.services.next, dir: 1, d: "M9 6l6 6-6 6" },
                ].map((b) => (
                  <button
                    key={b.label}
                    aria-label={b.label}
                    onClick={() => goTo(indexRef.current + b.dir)}
                    className="glass flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:border-[var(--glass-border-hover)]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={b.d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
