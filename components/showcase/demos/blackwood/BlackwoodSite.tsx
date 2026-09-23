"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import DemoHeading from "@/components/showcase/DemoHeading";
import { useBlackwoodCopy } from "./copy";
/* CP4_62: TYPE FOLLOWS THE BOTTLE LABEL. The label (baked into the GLB) sets
 * its wordmark and the "18" in a high-contrast wedge serif and its secondary
 * lines in tracked caps, so the site now does the same:
 *   · Playfair Display (variable, roman + italic) — wordmark, headings, quote,
 *     numerals. NOTE: Playfair's DEFAULT figures are OLD-STYLE; the root sets
 *     `lining-nums` so "18", "0447" and "1,200" sit on the line. Do not remove.
 *   · Tenor Sans (single weight 400) — labels, nav, CTAs and body. There is
 *     NO bold: hierarchy comes from Playfair, size and tracking, never weight.
 * Replaces EB Garamond + the studio's Inter (Inter made the body read as SaaS).
 * Both self-hosted via @fontsource (same-origin woff2, CSP untouched), latin +
 * latin-ext for Polish, CSS in this demo's lazy chunk only. */
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource/tenor-sans/latin-400.css";
import "@fontsource/tenor-sans/latin-ext-400.css";

const BlackwoodScene = dynamic(() => import("./BlackwoodScene"), { ssr: false });
// Loader shares drei's global loading manager with the scene; it is a DOM
// sibling of the canvas, so it must stay outside the ssr:false chunk boundary
// only in that it renders in the browser — dynamic keeps drei out of SSR.
const BlackwoodLoader = dynamic(() => import("./BlackwoodLoader"), { ssr: false });

/* Blackwood tokens — cellar dark: cold blue-black ground, lantern amber. */
const T = {
  bg: "#07080A",
  surface: "#0E1013",
  ink: "#EDE4D4",
  /** running text — lighter than inkSoft: 16px body on near-black needs it */
  inkBody: "#B7AFA1",
  inkSoft: "#8B8578",
  amber: "#D9974A",
  ember: "#B0561A",
  line: "rgba(217, 151, 74, 0.16)",
};
const SERIF = '"Playfair Display Variable", "Playfair Display", Georgia, serif';
const SANS = '"Tenor Sans", Optima, "Gill Sans", "Segoe UI", sans-serif';

/* ————— TYPE SCALE (CP4_62, tightened in CP4_63) ———————————————————
 * Every size on the page is one of these. CP4_63 found 11/12/15/16/17/18/20px
 * plus four one-off clamps in use; 15 vs 16 and 17 vs 18 read as mistakes.
 *   label    12px Tenor caps, tracked .18em  — 1–3 word labels ONLY
 *   small    15px Tenor, 1.6                 — secondary copy, links
 *   body     17px Tenor, 1.6                 — body and hero lead
 *   h3       20px Playfair 480               — also spec values, attribution
 *   quote    24 → 30px Playfair italic
 *   h2       32 → 46px Playfair
 *   h1       48 → 74px Playfair
 *   figure   the cask's "18" — the page's one oversized piece of type
 * Caps are for SHORT labels: anything that reads as a sentence (announce bar,
 * scroll hint, a job title) is sentence case. Tenor is wide already, so .18em
 * rather than .24em. Playfair DISPLAY is drawn for large sizes and its
 * hairlines vanish light-on-black below ~24px, so small Playfair is 480. */
const TRACK = "0.18em";
const LABEL: React.CSSProperties = {
  fontFamily: SANS,
  textTransform: "uppercase",
  letterSpacing: TRACK,
};
const labelCls = "text-[12px] leading-[1.6]";
const smallCls = "text-[15px] leading-[1.6] text-pretty";
const bodyCls = "text-[17px] leading-[1.6] text-pretty";
const h3Cls = "text-[20px] leading-[1.3] text-balance";
const h2Cls = "text-[clamp(2rem,3vw,2.9rem)] leading-[1.1] text-balance";
/** wght for Playfair at h3 size and below — see the note above. */
const SMALL_SERIF = 480;

/** Letter-spacing also lands AFTER the last glyph, which pushes tracked text
 *  left of centre in a bordered button. This pulls the trailing space back. */
function Tracked({ children }: { children: React.ReactNode }) {
  return <span style={{ marginRight: `-${TRACK}` }}>{children}</span>;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const rise = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12%" },
  transition: { duration: 1, ease: EASE },
};

/* CP4_62: SEVEN SECTIONS → SIX. The old 06 "The barrel" repeated 02 and 03
 * almost word for word. The camera path is keyed to page PROGRESS (0–1), not
 * to a section count, so the beats still land; each section is just a
 * slightly longer slice of the dolly. */
const SECTIONS = ["01", "02", "03", "04", "05", "06"];

/** The rail TRACKS the page (CP4_46): current section over the total, with an
 *  amber fill for progress. Still computed from progress/N — see plan item 7. */
function Rail({
  index,
  fill,
  label,
}: {
  index: number;
  fill: MutableRefObject<HTMLSpanElement | null>;
  label: string;
}) {
  return (
    <div className="pointer-events-none absolute left-[42px] top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
      <span className={labelCls} style={{ ...LABEL, letterSpacing: "0.12em", color: T.ink }}>
        {SECTIONS[index - 1]}
      </span>
      <span className="relative h-24 w-px" style={{ background: T.line }}>
        <span
          ref={fill}
          className="absolute left-0 top-0 h-full w-px origin-top"
          style={{ background: T.amber, transform: "scaleY(0)" }}
        />
      </span>
      <span className={labelCls} style={{ ...LABEL, letterSpacing: "0.12em", color: T.inkSoft }}>
        {SECTIONS[SECTIONS.length - 1]}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className={labelCls} style={{ ...LABEL, color: T.inkSoft }}>
      {children}
    </p>
  );
}

function Body({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`${bodyCls} ${className}`} style={{ color: T.inkBody }}>
      {children}
    </p>
  );
}

/* The copy column. The 3D cellar lives behind the whole page, so every section
 * is constrained to a band on the LEFT and the right of the frame is left to
 * the bottle. Slightly wider than before (27rem max) because body text went
 * from 13–14px to 16px; that keeps lines at ~50–60 characters. */
function Band({
  children,
  first = false,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className={`relative z-10 flex items-center px-8 lg:min-h-screen lg:pl-24 lg:pr-8 ${
        first ? "min-h-[86vh] pt-4" : "py-28 lg:py-0"
      }`}
    >
      <div className="w-full lg:w-[28%] lg:min-w-[21rem] lg:max-w-[27rem]">{children}</div>
    </section>
  );
}

/**
 * Concept site #3 — Blackwood, a Speyside single malt distillery, in its warehouse.
 *
 * The canvas is a real cellar; the bottle sits in the front plane and the
 * camera dollies with the page's scroll. Copy + type rebuilt in CP4_62 to
 * follow the bottle label.
 */
export default function BlackwoodSite({ preview = false }: { preview?: boolean }) {
  const c = useBlackwoodCopy();
  const scroller = useRef<HTMLDivElement>(null);
  const scrollRot = useRef(0);
  /** 0–1 down the page. The SCENE'S CAMERA reads this.
   *
   *  Driven by a NATIVE scroll listener, NOT framer's useScroll({container}).
   *  framer measures the container once on mount, and this demo mounts inside
   *  a fullscreen player that animates in from a scaled/faded state — so it
   *  cached a scrollable height of zero and scrollYProgress never left 0,
   *  which pinned the camera on its first beat for the whole page. Measuring
   *  on every scroll event cannot go stale. */
  const progress = useRef(0);
  const [section, setSection] = useState(1);
  const railFill = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const read = () => {
      const span = el.scrollHeight - el.clientHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, el.scrollTop / span)) : 0;
      progress.current = p;
      scrollRot.current = p * Math.PI * 2.2;
      // CP4_46: the canvas layer is sized to the SCROLLER, not the window. It
      // was h-screen (100vh) inside a player that is 65px shorter, so the
      // bottom of every render was cropped and the framing sat off-centre.
      el.style.setProperty("--bw-vh", `${el.clientHeight}px`);
      if (railFill.current) railFill.current.style.transform = `scaleY(${p})`;
      const idx = Math.min(SECTIONS.length, Math.floor(p * SECTIONS.length) + 1);
      setSection((cur) => (cur === idx ? cur : idx));
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={scroller}
      data-lenis-prevent
      className="relative h-full overflow-y-auto overscroll-contain"
      style={{
        background: T.bg,
        color: T.ink,
        fontFamily: SANS,
        fontVariantNumeric: "lining-nums",
        // Tenor ships ONE weight and no italic: never let the browser fake them.
        fontSynthesis: "none",
      }}
    >
      {/* one continuous canvas of atmosphere — no light sections, ever. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            "radial-gradient(38rem 26rem at 18% 12%, rgba(217,151,74,0.10) 0%, transparent 70%)",
            "radial-gradient(44rem 30rem at 86% 34%, rgba(176,86,26,0.09) 0%, transparent 72%)",
            "radial-gradient(40rem 28rem at 12% 58%, rgba(217,151,74,0.07) 0%, transparent 70%)",
            "radial-gradient(52rem 32rem at 82% 84%, rgba(176,86,26,0.08) 0%, transparent 72%)",
            `linear-gradient(180deg, #040507 0%, ${T.bg} 22%, ${T.bg} 100%)`,
          ].join(", "),
        }}
      />

      {/* ————— the cellar, behind everything (sticky, h-0 wrapper) ————— */}
      <div className="pointer-events-none sticky top-0 z-0 h-0">
        <div className="absolute left-0 top-0 h-[var(--bw-vh,100vh)] w-full">
          <BlackwoodScene
            quality={preview ? "preview" : "full"}
            progress={progress}
            scrollRot={scrollRot}
            className="!absolute inset-0"
          />
          {/* left scrim — the copy column sits on this, not on bare lantern light */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-[40%] lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,5,4,0.92) 0%, rgba(6,5,4,0.72) 50%, transparent 100%)",
            }}
          />
          {!preview && (
            <Rail
              index={section}
              fill={railFill}
              label={c.railSection(section, SECTIONS.length)}
            />
          )}
        </div>
      </div>

      {/* ————— loading screen (sticky to the viewport, above the chrome) ————— */}
      {!preview && (
        <div className="pointer-events-none sticky top-0 z-40 h-0">
          <div className="absolute left-0 top-0 h-[var(--bw-vh,100vh)] w-full">
            <BlackwoodLoader />
          </div>
        </div>
      )}

      {/* ————— chrome ————— */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-[2px]"
        style={{ borderColor: T.line, background: "rgba(7,8,10,0.62)" }}
      >
        <div className="flex h-[34px] items-center justify-center px-4">
          {/* A sentence, so sentence case (CP4_63) — not 11px tracked caps. */}
          <p className="truncate text-[12px] leading-[1.6] tracking-[0.04em]" style={{ color: T.inkSoft }}>
            {c.announce}
          </p>
        </div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-8 py-7 lg:px-14">
        {/* Wordmark as on the label: the heaviest thing on it, in gold. */}
        <span
          className="text-[21px] font-semibold leading-none tracking-[0.18em]"
          style={{ fontFamily: SERIF, color: T.amber }}
        >
          <span style={{ marginRight: "-0.18em" }}>BLACKWOOD</span>
        </span>
        {/* No section nav: the three labels were plain spans that looked
            clickable and did nothing, wrapped to two lines, and pulled the eye
            off the bottle. One scroll story needs the wordmark and one CTA. */}
        <span
          className={`whitespace-nowrap border px-4 py-2.5 lg:px-5 ${labelCls}`}
          style={{ ...LABEL, borderColor: T.amber, color: T.ink }}
        >
          <Tracked>{c.navCta}</Tracked>
        </span>
      </header>

      {/* ————— 01 · hero ————— */}
      <Band first>
        <motion.div {...rise}>
          {/* CP4_63: no eyebrow — "Speyside · Est. 1887" is already in the
              announce bar directly above. The amber rule opens the column. */}
          <span className="block h-px w-12" style={{ background: T.amber }} />
          {/* The second line differs by italic alone; amber on it read as the
              stock "accent one phrase" headline. */}
          <DemoHeading
            className="mt-6 text-[clamp(3rem,5.4vw,4.6rem)] font-medium leading-[1.02] text-balance"
            style={{ fontFamily: SERIF, color: T.ink }}
          >
            {c.hero.titleA}
            <br />
            <em>{c.hero.titleB}</em>
          </DemoHeading>
          <p className={`mt-6 max-w-[25rem] ${bodyCls}`} style={{ color: T.inkBody }}>
            {c.hero.lead}
          </p>
          <span
            className={`mt-8 inline-block border-b pb-1 ${smallCls}`}
            style={{ borderColor: T.amber, color: T.ink }}
          >
            {c.hero.link}
          </span>
          {/* A drawn amber rule instead of a system "↓" glyph that matched
              neither typeface. */}
          <div className="mt-10 flex items-center gap-4">
            <span aria-hidden className="block h-7 w-px" style={{ background: T.amber }} />
            <span className={smallCls} style={{ color: T.inkSoft }}>
              {c.hero.scroll}
            </span>
          </div>
        </motion.div>
      </Band>

      {/* ————— 02 · the cask ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.cask.eyebrow}</Eyebrow>
          {/* CP4_63: the label's "18", set as large as the page allows. This is
              where the page spends its boldness; everything around it stays
              at the quiet scale. Replaces the spec sheet's "Age" row. */}
          <p className="mt-4 flex items-end gap-4" style={{ color: T.amber }}>
            <span
              className="block text-[clamp(7.5rem,11vw,10.5rem)] leading-[0.78]"
              style={{ fontFamily: SERIF, fontWeight: 400 }}
            >
              {c.cask.age.figure}
            </span>
            <span className={`pb-2 ${labelCls}`} style={{ ...LABEL, color: T.inkSoft }}>
              {c.cask.age.unit}
            </span>
          </p>
          <h2 className={`mt-8 max-w-[16ch] ${h2Cls}`} style={{ fontFamily: SERIF }}>
            {c.cask.heading}
          </h2>
        </motion.div>

        {/* spec sheet — the label's facts, in the label's order */}
        {/* One grid for the whole list (max-content key column), not a grid
            per row: a fixed 7rem key column let "LEŻAKOWANIE" run into its
            value on mobile (CP4_62). */}
        <motion.dl
          {...rise}
          className="mt-10 grid grid-cols-[max-content_1fr] border-b"
          style={{ borderColor: T.line }}
        >
          {c.cask.spec.map(({ label, value }) => (
            <div key={label} className="contents">
              <dt
                className={`border-t py-3.5 pr-6 pt-[1.15rem] ${labelCls}`}
                style={{ ...LABEL, color: T.inkSoft, borderColor: T.line }}
              >
                {label}
              </dt>
              <dd
                className="border-t py-3.5 text-[20px] leading-[1.3] text-balance"
                style={{ fontFamily: SERIF, fontWeight: SMALL_SERIF, color: T.ink, borderColor: T.line }}
              >
                {value}
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.div {...rise}>
          <Body className="mt-8">{c.cask.body}</Body>
        </motion.div>
      </Band>

      {/* ————— 03 · the distillery ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.distillery.eyebrow}</Eyebrow>
          <h2 className={`mt-6 ${h2Cls}`} style={{ fontFamily: SERIF }}>
            {c.distillery.heading}
          </h2>
          <Body className="mt-6">{c.distillery.body}</Body>
        </motion.div>

        {/* CP4_62: one column. Two columns inside a 27rem band gave ~12rem
            measures — four words a line at 15px. */}
        <div className="mt-10 flex flex-col gap-7">
          {c.distillery.items.map(({ label, copy }) => (
            <motion.div key={label} {...rise} className="border-l pl-5" style={{ borderColor: T.amber }}>
              <h3 className={h3Cls} style={{ fontFamily: SERIF, fontWeight: SMALL_SERIF }}>
                {label}
              </h3>
              <p className={`mt-1.5 ${smallCls}`} style={{ color: T.inkBody }}>
                {copy}
              </p>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 04 · tasting ————— 
          CP4_62: the animated "weight" bars are gone. They had no scale and no
          legend — decoration posing as data, on a page whose whole voice is
          now "facts, not adjectives". Structure follows the label. */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.tasting.eyebrow}</Eyebrow>
          <h2 className={`mt-6 max-w-[16ch] ${h2Cls}`} style={{ fontFamily: SERIF }}>
            {c.tasting.heading}
          </h2>
        </motion.div>

        <div className="mt-10 flex flex-col">
          {c.tasting.items.map((n) => (
            <motion.div
              key={n.stage}
              {...rise}
              className="border-t py-6"
              style={{ borderColor: T.line }}
            >
              <p className={labelCls} style={{ ...LABEL, color: T.amber }}>
                {n.stage}
              </p>
              <h3 className={`mt-2 ${h3Cls}`} style={{ fontFamily: SERIF, fontWeight: SMALL_SERIF }}>
                {n.notes}
              </h3>
              <p className={`mt-2 ${smallCls}`} style={{ color: T.inkBody }}>
                {n.comment}
              </p>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 05 · in the warehouse ————— */}
      <Band>
        <motion.figure {...rise}>
          <Eyebrow>{c.voice.eyebrow}</Eyebrow>
          {/* The opening quote mark hangs into the margin so the text edge
              stays straight. Done with text-indent, not hanging-punctuation,
              which only Safari supports. ~0.42em ≈ the width of “ and „ in
              Playfair italic at this size. */}
          <blockquote
            className="mt-8 text-[clamp(1.5rem,2.1vw,1.875rem)] italic leading-[1.45] text-pretty"
            style={{ fontFamily: SERIF, color: T.ink, textIndent: "-0.42em" }}
          >
            {c.voice.quote}
          </blockquote>
          <figcaption className="mt-8">
            <span
              className="block text-[20px] leading-[1.3]"
              style={{ fontFamily: SERIF, fontWeight: SMALL_SERIF, color: T.ink }}
            >
              {c.voice.name}
            </span>
            {/* A job title is a phrase, not a label: italic serif, not caps. */}
            <span
              className={`mt-1 block italic ${bodyCls}`}
              style={{ fontFamily: SERIF, fontWeight: SMALL_SERIF, color: T.inkBody }}
            >
              {c.voice.role}
            </span>
          </figcaption>
        </motion.figure>
      </Band>

      {/* ————— 06 · find a bottle ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.find.eyebrow}</Eyebrow>
          <h2 className={`mt-6 max-w-[14ch] ${h2Cls}`} style={{ fontFamily: SERIF }}>
            {c.find.heading}
          </h2>
          <Body className="mt-6">{c.find.body}</Body>
          <span
            className={`mt-10 inline-block whitespace-nowrap border px-9 py-4 ${labelCls}`}
            style={{ ...LABEL, borderColor: T.amber, color: T.ink }}
          >
            <Tracked>{c.find.cta}</Tracked>
          </span>
          <p className="mt-14 text-[12px] leading-[1.6]" style={{ color: T.inkSoft }}>
            {c.find.disclaimer}
          </p>
        </motion.div>
      </Band>
    </div>
  );
}
