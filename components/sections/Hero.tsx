"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { heroScroll } from "@/lib/scroll-state";
import SceneCanvas from "@/components/three/SceneCanvas";
import MagneticButton from "@/components/ui/MagneticButton";
import HeroCursorLight from "@/components/ui/HeroCursorLight";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";
import { TIERS, fmt } from "@/lib/pricing";

/** Ad links open the hero with /?h=<id>. Only ids listed in
 *  dictionaries.hero.variants are honoured, never free text from the URL.
 *  The server (and the first client render) show the default copy, so the
 *  static page and crawlers are unaffected. */
const subscribeNone = () => () => {};
const readVariant = () => new URLSearchParams(window.location.search).get("h");

export default function Hero() {
  const t = useT();
  const [locale] = useLocale();
  const param = useSyncExternalStore(subscribeNone, readVariant, () => null);
  const variant =
    param && Object.prototype.hasOwnProperty.call(t.hero.variants, param)
      ? (param as keyof typeof t.hero.variants)
      : null;
  const copy = variant
    ? {
        ...t.hero.variants[variant],
        subtitle: t.hero.variants[variant].subtitle(
          fmt(Math.min(...TIERS.map((x) => x.from)), locale, t.currency)
        ),
      }
    : { titleA: t.hero.titleA, titleAccent: t.hero.titleAccent, titleEnd: t.hero.titleEnd, subtitle: t.hero.subtitle };
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    // ScrollTrigger writes shared progress; the R3F scene reads it in useFrame.
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        heroScroll.progress = self.progress;
      },
    });

    // Copy drifts up + fades slightly faster than the scene — layered parallax
    const tween = gsap.to("[data-hero-copy]", {
      yPercent: -18,
      opacity: 0.15,
      ease: "none",
      scrollTrigger: {
        trigger: section.current,
        start: "top top",
        end: "70% top",
        scrub: true,
      },
    });

    return () => {
      st.kill();
      tween.scrollTrigger?.kill();
      tween.kill();
      heroScroll.progress = 0;
    };
  }, []);

  return (
    <section
      ref={section}
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden"
    >
      {/* Soft radial glow behind the scene.
          FULL BLEED, not a 70vmin disc. It used to be a square the size of the
          SHORT viewport edge, centred — which on a desktop reads as a wide
          pool behind the mark, but on a 390px phone is a 273px circle with a
          visible rim sitting in the middle of the screen. `inset-0` plus an
          ellipse sized in percentages means the glow always spans the whole
          hero and fades out at the edges instead of ending in a circle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 62% at 50% 46%, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0.07) 42%, rgba(56,189,248,0) 78%)",
        }}
      />

      {/* Cursor-follow light (replaces the old particle-repulsion bubble) */}
      <HeroCursorLight />

      {/* 3D scene layer — bottom-masked so particles dissolve into the page instead of clipping */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
        }}
      >
        <SceneCanvas />
      </div>

      {/* Copy layer. The entrance is a CSS animation (.hero-reveal in
          globals.css), not framer: framer server-renders the copy at opacity 0
          and fades it in only after hydration, so the LCP text waited ~5 s
          behind the 3D bundle on a phone. CSS starts on the first paint. */}
      <div
        data-hero-copy
        className="container-x pointer-events-none relative z-10 flex flex-col items-center pt-16 text-center"
      >
        {/* Legibility scrim. The lead paragraph sits on the glossy face of the
            W and a field of cubes; a text-shadow alone left it fighting the
            highlights. A soft, edgeless dark pool behind the copy calms the
            area under the text without reading as a box. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] -z-10 h-[70%] w-[min(110%,760px)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(5,8,15,0.62) 0%, rgba(5,8,15,0.38) 55%, rgba(5,8,15,0) 100%)",
          }}
        />
        {/* The query people type, stated on the page (SEO pass): the H1 is the
            brand line, so without this the phrase in the <title> appeared
            nowhere in the visible copy. */}
        <p className="hero-reveal eyebrow mb-5">{t.hero.eyebrow}</p>
        <h1
          className={
            variant
              ? "hero-reveal heading-display max-w-[22ch] [font-size:clamp(2.25rem,5.4vw,4.75rem)]"
              : "hero-reveal heading-display max-w-[13ch]"
          }
        >
          {copy.titleA}{" "}
          <span className="text-[var(--accent-green)]">{copy.titleAccent}</span>
          {copy.titleEnd}
        </h1>
        <p className="hero-reveal hero-lead mt-6 max-w-[46ch] text-body text-ink/80 [animation-delay:80ms]">
          {copy.subtitle}
        </p>
        {/* The hero's primary action scrolls to the full quote form (#contact),
            which collects project type, scope and budget. A 3-field hero form
            gave too little to price from, so it was removed. */}
        <div className="hero-reveal pointer-events-auto mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row [animation-delay:160ms]">
          <MagneticButton href="#contact" wrapperClassName="w-full max-w-[320px] sm:w-auto" className="w-full sm:w-auto">
            {t.hero.formSubmit}
          </MagneticButton>
          <MagneticButton href="#showcase" variant="ghost" wrapperClassName="w-full max-w-[320px] sm:w-auto" className="w-full sm:w-auto">
            {t.hero.ctaGhost}
          </MagneticButton>
        </div>
        <p className="hero-reveal mt-4 text-small text-ink-soft [animation-delay:200ms]">
          {t.contact.replyPromise}
        </p>
      </div>

      {/* Scroll cue — a mouse, so only for devices that have one */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 [@media(hover:hover)_and_(pointer:fine)]:block"
        aria-hidden
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-[var(--glass-border)] p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-brand-500"
          />
        </div>
      </motion.div>
    </section>
  );
}
