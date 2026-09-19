"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import DemoHeading from "@/components/showcase/DemoHeading";
import {
  DAYS,
  SCHEDULE,
  STAT_VALUES,
  ROSTER_PEOPLE,
  useZelaznaCopy,
  type Day,
} from "./copy";

/* ————————————————————————————————————————————————————————————————
 * ŻELAZNA — klub siłowy. Concept site #2 (CP3.13).
 *
 * ART DIRECTION, on purpose:
 *  - BONE PAPER, not black-and-neon-green. Every gym site on the internet is
 *    a dark page with an acid accent and a photo of someone mid-deadlift.
 *    This one is a printed timetable: paper stock, heavy grotesque, tabular
 *    monospace data, hairline rules. It reads as designed, not generated.
 *  - ZERO IMAGES. No stock photos, no icons, no emoji. Type, rules and
 *    negative space only — which is also why this whole demo weighs nothing
 *    and can run as a LIVE preview card on the home page.
 *  - The structural idea is the GRAFIK: a real weekly timetable, filterable
 *    by day. A gym site's actual job is answering "when can I come in".
 *    Decoration is not the demo — the useful thing is.
 *
 * Copy is Polish (these demos sell to Polish businesses). It is a fictional
 * brand — the disclaimer in the footer says so plainly, same rule as the
 * other concept sites: never imply real testimonials or a real client.
 * An EN pass is a swap of the COPY object below, nothing else.
 * ———————————————————————————————————————————————————————————————— */

const T = {
  paper: "#E7E3D9",
  paperDeep: "#DCD7CA",
  ink: "#15161A",
  inkSoft: "#5E5C55",
  oxide: "#A93A18",
  rule: "rgba(21, 22, 26, 0.16)",
};

/* Heavy grotesque from the stack the browser already has — no webfont, so no
 * network request and no CSP surface. The character comes from scale and
 * tracking, not from an exotic face we would have to ship. */
const GROTESK =
  '"Inter Variable", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* DAYS / SCHEDULE / STAT_VALUES / ROSTER_PEOPLE and every visible string now
 * live in ./copy.ts (PL + EN). What is left here is art direction only. */

export default function ZelaznaSite({ preview = false }: { preview?: boolean }) {
  const c = useZelaznaCopy();
  const reduced = usePrefersReducedMotion();
  const [day, setDay] = useState<Day>("mon");
  const rows = SCHEDULE.filter((s) => s.day === day);

  /* reveals are suppressed in the preview card (nothing scrolls in there, so
     whileInView would leave the page half-invisible) and under reduced motion */
  const still = preview || reduced;
  const rise = still
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-10%" },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div
      data-lenis-prevent
      className="relative h-full overflow-y-auto overscroll-contain"
      style={{ background: T.paper, color: T.ink, fontFamily: GROTESK }}
    >
      {/* ————— utility bar ————— */}
      <div
        className="flex items-center justify-between border-b px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] lg:px-12"
        style={{ borderColor: T.rule, color: T.inkSoft }}
      >
        <span>{c.bar.address}</span>
        <span className="hidden sm:inline">{c.bar.hours}</span>
        <span>{c.bar.phone}</span>
      </div>

      {/* ————— header ————— */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b px-5 py-4 lg:px-12"
        style={{ borderColor: T.rule, background: T.paper }}
      >
        <span className="text-[17px] font-extrabold tracking-[0.3em]">ŻELAZNA</span>
        <nav className="hidden items-center gap-9 md:flex">
          {c.nav.map((l) => (
            <span key={l} className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: T.inkSoft }}>
              {l}
            </span>
          ))}
        </nav>
        <span
          className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white"
          style={{ background: T.ink }}
        >
          {c.navCta}
        </span>
      </header>

      {/* ————— 01 hero ————— */}
      <section className="border-b px-5 pb-14 pt-16 lg:px-12 lg:pb-20 lg:pt-24" style={{ borderColor: T.rule }}>
        <motion.div {...rise}>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: T.oxide }}>
            {c.hero.eyebrow}
          </p>
          <DemoHeading
            className="mt-7 max-w-[16ch] text-[clamp(2.6rem,8.5vw,6.4rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.035em]"
          >
            {c.hero.titleA}
            <br />
            <span style={{ color: T.oxide }}>{c.hero.titleAccent}</span>
            {c.hero.titleMid}
            <br />
            {c.hero.titleB}
          </DemoHeading>
          <div className="mt-10 grid max-w-4xl gap-8 border-t pt-8 sm:grid-cols-2" style={{ borderColor: T.rule }}>
            <p className="max-w-[46ch] text-[15px] leading-[1.7]" style={{ color: T.inkSoft }}>
              {c.hero.lead}
            </p>
            <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
              <span className="border-b-2 pb-1 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ borderColor: T.ink }}>
                {c.hero.linkSchedule}
              </span>
              <span className="border-b pb-1 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ borderColor: T.rule, color: T.inkSoft }}>
                {c.hero.linkPrices}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ————— 02 stats — tabular, not "feature cards" ————— */}
      <section className="border-b" style={{ borderColor: T.rule }}>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {STAT_VALUES.map((n, i) => (
            <motion.div
              {...rise}
              transition={still ? undefined : { duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              key={n}
              className="border-b border-r px-5 py-8 lg:border-b-0 lg:px-8 lg:py-10"
              style={{ borderColor: T.rule }}
            >
              <span className="block text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-none tracking-[-0.04em]">
                {n}
              </span>
              <span className="mt-3 block font-mono text-[10px] uppercase leading-[1.7] tracking-[0.16em]" style={{ color: T.inkSoft }}>
                {c.stats[i]}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ————— 03 grafik — the structural centrepiece ————— */}
      <section className="border-b px-5 py-16 lg:px-12 lg:py-24" style={{ borderColor: T.rule }}>
        <motion.div {...rise} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: T.oxide }}>
              {c.schedule.eyebrow}
            </p>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em]">
              {c.schedule.heading}
            </h2>
          </div>
          <p className="max-w-[34ch] font-mono text-[10.5px] uppercase leading-[1.9] tracking-[0.14em]" style={{ color: T.inkSoft }}>
            {c.schedule.note}
          </p>
        </motion.div>

        {/* day filter */}
        <div className="mt-9 flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-pressed={active}
                className="min-h-[40px] px-5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors"
                style={{
                  background: active ? T.ink : "transparent",
                  color: active ? T.paper : T.inkSoft,
                  border: `1px solid ${active ? T.ink : T.rule}`,
                }}
              >
                {c.schedule.dayLabels[d]}
              </button>
            );
          })}
        </div>

        {/* the timetable itself */}
        <div className="mt-8 border-t" style={{ borderColor: T.ink }}>
          {rows.map((s) => (
            <div
              key={s.time + s.classId}
              className="group grid grid-cols-[4.4rem_1fr] items-baseline gap-x-4 gap-y-1 border-b py-5 transition-colors hover:bg-[color:var(--zl-hover)] md:grid-cols-[6rem_1fr_11rem_5.5rem] md:gap-x-6"
              style={{ borderColor: T.rule, ["--zl-hover" as string]: T.paperDeep }}
            >
              <span className="font-mono text-[15px] tabular-nums tracking-tight md:text-[17px]">{s.time}</span>
              <span className="text-[15px] font-semibold leading-snug md:text-[17px]">
                {c.schedule.classNames[s.classId]}
              </span>
              <span className="col-start-2 font-mono text-[10.5px] uppercase tracking-[0.14em] md:col-start-3" style={{ color: T.inkSoft }}>
                {s.coach ?? c.schedule.noCoach}
              </span>
              <span
                className="col-start-2 font-mono text-[10.5px] uppercase tracking-[0.14em] md:col-start-4 md:text-right"
                style={{ color: s.spots <= 2 ? T.oxide : T.inkSoft }}
              >
                {s.spots <= 2 ? c.schedule.lastSpots(s.spots) : c.schedule.spots(s.spots)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ————— 04 trenerzy — a roster, not three identical cards ————— */}
      <section className="border-b px-5 py-16 lg:px-12 lg:py-24" style={{ borderColor: T.rule }}>
        <motion.p {...rise} className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: T.oxide }}>
          {c.roster.eyebrow}
        </motion.p>
        <div className="mt-8 border-t" style={{ borderColor: T.ink }}>
          {ROSTER_PEOPLE.map(({ n, name, years }, i) => (
            <div
              key={n}
              className="grid grid-cols-[2.4rem_1fr] items-baseline gap-x-4 gap-y-2 border-b py-7 md:grid-cols-[3.5rem_16rem_1fr_6rem] md:gap-x-8"
              style={{ borderColor: T.rule }}
            >
              <span className="font-mono text-[11px] tracking-[0.1em]" style={{ color: T.inkSoft }}>
                {n}
              </span>
              <span className="text-[clamp(1.15rem,2.2vw,1.6rem)] font-bold leading-tight tracking-[-0.02em]">
                {name}
              </span>
              <span className="col-start-2 text-[14px] leading-relaxed md:col-start-3" style={{ color: T.inkSoft }}>
                {c.roster.specialties[i]}
              </span>
              <span className="col-start-2 font-mono text-[10.5px] uppercase tracking-[0.16em] md:col-start-4 md:text-right" style={{ color: T.inkSoft }}>
                {c.roster.years(years)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ————— 05 cennik ————— */}
      <section className="border-b px-5 py-16 lg:px-12 lg:py-24" style={{ borderColor: T.rule }}>
        <motion.div {...rise} className="max-w-[40ch]">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: T.oxide }}>
            {c.prices.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em]">
            {c.prices.heading}
          </h2>
        </motion.div>
        <div className="mt-10 border-t" style={{ borderColor: T.ink }}>
          {c.prices.items.map(({ name, price, note, tag }) => (
            <div
              key={name}
              className="grid grid-cols-1 items-baseline gap-y-2 border-b py-7 md:grid-cols-[18rem_1fr_9rem] md:gap-x-8"
              style={{ borderColor: T.rule }}
            >
              <span className="flex flex-wrap items-center gap-3 text-[clamp(1.15rem,2.2vw,1.5rem)] font-bold tracking-[-0.02em]">
                {name}
                {tag && (
                  <span
                    className="px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-white"
                    style={{ background: T.oxide }}
                  >
                    {tag}
                  </span>
                )}
              </span>
              <span className="text-[14px] leading-relaxed" style={{ color: T.inkSoft }}>
                {note}
              </span>
              <span className="font-mono text-[1.35rem] font-semibold tabular-nums tracking-tight md:text-right">
                {price}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase leading-[1.9] tracking-[0.14em]" style={{ color: T.inkSoft }}>
          {c.prices.note}
        </p>
      </section>

      {/* ————— 06 CTA — the one inverted block on the page ————— */}
      <section className="px-5 py-16 lg:px-12 lg:py-20" style={{ background: T.ink, color: T.paper }}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: T.oxide }}>
              {c.cta.eyebrow}
            </p>
            <h2 className="mt-5 max-w-[18ch] text-[clamp(2rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em]">
              {c.cta.heading}
            </h2>
            <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.7]" style={{ color: "rgba(231,227,217,0.66)" }}>
              {c.cta.body}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span
              className="px-8 py-4 text-center font-mono text-[11px] uppercase tracking-[0.2em]"
              style={{ background: T.paper, color: T.ink }}
            >
              {c.cta.button}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(231,227,217,0.5)" }}>
              {c.cta.orCall}
            </span>
          </div>
        </div>
      </section>

      {/* ————— footer ————— */}
      <footer className="px-5 py-12 lg:px-12" style={{ background: T.ink, color: "rgba(231,227,217,0.5)" }}>
        <div className="grid gap-8 border-t pt-10 md:grid-cols-3" style={{ borderColor: "rgba(231,227,217,0.16)" }}>
          <div>
            <span className="text-[15px] font-extrabold tracking-[0.3em]" style={{ color: T.paper }}>
              ŻELAZNA
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase leading-[2] tracking-[0.14em]">
              {c.footer.addressLine1}
              <br />
              {c.footer.addressLine2}
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase leading-[2] tracking-[0.14em]">
            {c.footer.hours[0]}
            <br />
            {c.footer.hours[1]}
            <br />
            {c.footer.hours[2]}
          </p>
          <p className="font-mono text-[10px] uppercase leading-[2] tracking-[0.14em]">
            {c.footer.email}
            <br />
            {c.footer.phone}
          </p>
        </div>
        <p className="mt-10 max-w-[62ch] text-[11.5px] leading-[1.8]">
          {c.footer.disclaimer}
        </p>
      </footer>
    </div>
  );
}
