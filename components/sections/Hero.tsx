"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { heroScroll } from "@/lib/scroll-state";
import SceneCanvas from "@/components/three/SceneCanvas";
import MagneticButton from "@/components/ui/MagneticButton";
import HeroCursorLight from "@/components/ui/HeroCursorLight";
import { useT } from "@/components/i18n/LanguageProvider";
import { revealContainer, revealItem } from "@/animations/variants";

export default function Hero() {
  const t = useT();
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

      {/* Copy layer */}
      <motion.div
        data-hero-copy
        variants={revealContainer}
        initial="hidden"
        animate="visible"
        className="container-x pointer-events-none relative z-10 flex flex-col items-center pt-16 text-center"
      >
        <motion.p variants={revealItem} className="eyebrow mb-5">
          {t.hero.eyebrow}
        </motion.p>
        <motion.h1 variants={revealItem} className="heading-display max-w-[13ch]">
          {t.hero.titleA}{" "}
          <span className="text-[var(--accent-green)]">{t.hero.titleAccent}</span>
          {t.hero.titleEnd}
        </motion.h1>
        <motion.p
          variants={revealItem}
          className="mt-6 max-w-[46ch] text-lg text-ink-soft"
        >
          {t.hero.subtitle}
        </motion.p>
        <motion.div
          variants={revealItem}
          className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="#contact">{t.hero.ctaPrimary}</MagneticButton>
          <MagneticButton href="#craft" variant="ghost">
            {t.hero.ctaGhost}
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
