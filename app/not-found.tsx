"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MagneticButton from "@/components/ui/MagneticButton";
import { useT } from "@/components/i18n/LanguageProvider";
import { revealContainer, revealItem } from "@/animations/variants";

/**
 * Custom 404 — hero grammar, no 3D. (CP4.4 → CP5-i18n → this pass)
 *
 * ROUTE FACT THAT SHAPES THIS WHOLE FILE: `app/not-found.tsx` renders inside
 * `app/layout.tsx` ONLY. Route-group layouts do not apply to it, and since
 * CP6-backend moved the marketing chrome into `app/(site)/layout.tsx`, this
 * page gets NO Navbar, NO Lenis, NO consent banner and NO analytics.
 * Two consequences, both handled deliberately below:
 *   1. It carries its OWN wordmark + section links. Without them a lost
 *      visitor has nothing to click but the back button — the previous
 *      version shipped exactly that (glass card, two links, no nav).
 *   2. It CANNOT render <Footer/>: Footer calls useConsent(), and
 *      ConsentProvider is not mounted on this branch of the tree, so it
 *      would throw at render. Same for anything that expects Lenis.
 * LanguageProvider IS in the root layout, so useT() is safe here.
 *
 * VISUAL: the hero's centred stack (eyebrow → display heading → body → CTA
 * pair) instead of the old centred glass card, so a wrong URL still lands
 * somewhere that looks like the front door. Same cyan bloom, same drifting
 * pixel cubes, same magnetic button pair.
 *
 * The cubes are CSS — reusing the `drift` keyframe already in globals.css —
 * NOT WebGL. An error page must not pay for three.js, and the 2-canvas
 * budget stays reserved for real pages. Their positions are HARDCODED, not
 * Math.random(): a random layout renders differently on the server and on
 * the client and trips a hydration mismatch. The global
 * prefers-reduced-motion rule in globals.css already flattens the animation.
 *
 * Accent-green is deliberately absent. The locked rule is ≤1 per viewport
 * and only at conversion moments; an error page is not one.
 *
 * Copy uses the five EXISTING `notFound` keys plus `nav.*` — no dictionary
 * edit, so this file cannot trip the `pl: typeof en` coherence guard.
 */

/** Hardcoded so SSR and hydration agree. l/t = %, s = px, d/dur = s. */
const CUBES = [
  { l: 12, t: 22, s: 9, d: 0.0, dur: 7.5, o: 0.5, r: 12 },
  { l: 22, t: 68, s: 5, d: 1.2, dur: 9.0, o: 0.35, r: 45 },
  { l: 31, t: 14, s: 6, d: 2.4, dur: 8.0, o: 0.4, r: 0 },
  { l: 41, t: 82, s: 11, d: 0.6, dur: 10.0, o: 0.3, r: 45 },
  { l: 47, t: 33, s: 4, d: 3.1, dur: 7.0, o: 0.55, r: 0 },
  { l: 58, t: 74, s: 7, d: 1.8, dur: 8.5, o: 0.45, r: 22 },
  { l: 63, t: 18, s: 13, d: 0.3, dur: 11.0, o: 0.28, r: 45 },
  { l: 71, t: 55, s: 5, d: 2.7, dur: 7.8, o: 0.5, r: 0 },
  { l: 79, t: 29, s: 8, d: 1.0, dur: 9.5, o: 0.38, r: 45 },
  { l: 86, t: 71, s: 6, d: 3.6, dur: 8.2, o: 0.42, r: 12 },
  { l: 92, t: 41, s: 10, d: 2.1, dur: 10.5, o: 0.25, r: 0 },
  { l: 6, t: 52, s: 7, d: 4.0, dur: 9.2, o: 0.32, r: 45 },
  { l: 36, t: 47, s: 4, d: 1.5, dur: 6.8, o: 0.6, r: 0 },
  { l: 68, t: 88, s: 6, d: 3.3, dur: 8.8, o: 0.34, r: 22 },
] as const;

/** Same set and order as the footer, so the two never drift apart. */
const SECTIONS = [
  { key: "services", href: "/#services" },
  { key: "craft", href: "/#craft" },
  { key: "showcase", href: "/#showcase" },
  { key: "process", href: "/#process" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
] as const;

export default function NotFound() {
  const t = useT();

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* ——— Atmosphere ——————————————————————————————————————————— */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* hero bloom — same values as components/sections/Hero.tsx */}
        <div
          className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 68%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(58%_48%_at_50%_28%,rgba(13,26,46,0.85)_0%,rgba(13,26,46,0)_66%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_82%_84%,rgba(7,89,133,0.20)_0%,rgba(7,89,133,0)_70%)]" />

        {/* ghost numerals — gradient-clipped text, the .text-gradient-brand
            technique at watermark alpha so it reads as depth, not as a label */}
        <span
          className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[52vw] font-semibold leading-none tracking-[-0.04em] md:text-[34vw]"
          style={{
            background:
              "linear-gradient(180deg, rgba(165,243,252,0.11) 0%, rgba(56,189,248,0.03) 62%, rgba(56,189,248,0) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </span>

        {/* drifting pixel cubes — the hero particle field, in CSS */}
        {CUBES.map((c, i) => (
          <span
            key={i}
            className="absolute block rounded-[2px]"
            style={{
              left: `${c.l}%`,
              top: `${c.t}%`,
              width: c.s,
              height: c.s,
              opacity: c.o,
              background:
                "linear-gradient(140deg, rgba(165,243,252,0.9), rgba(56,189,248,0.35))",
              boxShadow: "0 0 12px rgba(56,189,248,0.35)",
              rotate: `${c.r}deg`,
              animation: `drift ${c.dur}s ${c.d}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ——— Own chrome: this route has no Navbar ——————————————————— */}
      <header className="container-x relative z-10 flex items-center justify-between pt-7">
        <Link
          href="/"
          aria-label={t.nav.home}
          className="font-display text-body font-medium text-ink transition-colors hover:text-brand-300"
        >
          Webcraft
        </Link>
        <span className="eyebrow hidden sm:block">{t.notFound.eyebrow}</span>
      </header>

      {/* ——— Copy stack ——————————————————————————————————————————— */}
      <motion.div
        variants={revealContainer}
        initial="hidden"
        animate="visible"
        className="container-x relative z-10 flex flex-1 flex-col items-center justify-center py-16 text-center"
      >
        <motion.p variants={revealItem} className="eyebrow mb-5 sm:hidden">
          {t.notFound.eyebrow}
        </motion.p>

        <motion.h1 variants={revealItem} className="heading-display max-w-[16ch]">
          {t.notFound.heading}
        </motion.h1>

        <motion.p
          variants={revealItem}
          className="mt-6 max-w-[46ch] text-body text-ink-soft"
        >
          {t.notFound.body}
        </motion.p>

        <motion.div
          variants={revealItem}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="/">{t.notFound.home}</MagneticButton>
          <MagneticButton href="/#contact" variant="ghost">
            {t.notFound.start}
          </MagneticButton>
        </motion.div>

        {/* Section links: the only navigation this route has. Hairline rule
            borrowed from the footer's top border. */}
        <motion.nav
          variants={revealItem}
          aria-label="Sections"
          className="mt-14 w-full max-w-[620px] border-t border-[rgba(56,189,248,0.12)] pt-6"
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="text-ui text-ink-soft transition-colors hover:text-ink"
                >
                  {t.nav[s.key]}
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      </motion.div>
    </main>
  );
}
