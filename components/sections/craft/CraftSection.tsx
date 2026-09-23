"use client";

import CraftCard from "./CraftCard";
import ResizeDemo from "./demos/ResizeDemo";
import ThemeDemo from "./demos/ThemeDemo";
import SpeedDemo from "./demos/SpeedDemo";
import MotionDemo from "./demos/MotionDemo";
import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Craft (CP3) — the capability-demo section that replaces a portfolio in v1.
 * Every tile is a live demo built with the same techniques we ship; the
 * CraftCard shell is generic so tiles can be swapped for case studies later.
 *
 * Atmosphere: NO WebGL here (2-canvas budget stays with Hero + Services).
 * This band's "surface step" is a faint blueprint grid + off-center glow —
 * the workshop behind the showroom.
 */
export default function CraftSection() {
  const t = useT();
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section
      id="craft"
      aria-labelledby="craft-heading"
      className="craft-cursor relative"
    >
      {/* atmosphere — blueprint grid + glow pocket, melted into the page */}
      <div className="fade-band pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="craft-grid absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_30%,rgba(13,26,46,0.9)_0%,rgba(13,26,46,0)_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_75%,rgba(7,89,133,0.25)_0%,rgba(7,89,133,0)_70%)]" />
      </div>

      <div ref={reveal} className="container-x relative py-[clamp(96px,12vw,160px)]">
        <h2 data-reveal id="craft-heading" className="heading-2 max-w-[18ch]">
          {t.craft.heading}
        </h2>
        <p data-reveal className="mt-5 max-w-[54ch] text-body text-ink-soft">
          {t.craft.intro}
        </p>

        {/* bento grid — spans chosen so each demo gets the room it needs */}
        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 lg:grid-cols-6">
          <CraftCard
            title={t.craft.cards.resize.title}
            caption={t.craft.cards.resize.caption}
            proof={t.craft.cards.resize.proof}
            className="md:col-span-2 lg:col-span-4"
          >
            <ResizeDemo />
          </CraftCard>

          <CraftCard
            title={t.craft.cards.theme.title}
            caption={t.craft.cards.theme.caption}
            proof={t.craft.cards.theme.proof}
            className="md:col-span-1 lg:col-span-2"
          >
            <ThemeDemo />
          </CraftCard>

          <CraftCard
            title={t.craft.cards.speed.title}
            caption={t.craft.cards.speed.caption}
            proof={t.craft.cards.speed.proof}
            className="md:col-span-1 lg:col-span-3"
          >
            <SpeedDemo />
          </CraftCard>

          <CraftCard
            title={t.craft.cards.motion.title}
            caption={t.craft.cards.motion.caption}
            proof={t.craft.cards.motion.proof}
            className="md:col-span-2 lg:col-span-3"
          >
            <MotionDemo />
          </CraftCard>
        </div>

      </div>
    </section>
  );
}
