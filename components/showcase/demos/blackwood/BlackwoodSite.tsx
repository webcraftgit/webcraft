"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import DemoHeading from "@/components/showcase/DemoHeading";
import { useBlackwoodCopy } from "./copy";
/* CP4_46: the serif is SELF-HOSTED. The old stack named "Playfair Display",
 * which was never loaded anywhere — every headline fell back to Times New Roman
 * on Windows/Linux. EB Garamond (variable, roman + italic, latin + latin-ext,
 * OFL) is an old-style face in the Scotch-label tradition. Same-origin woff2,
 * so the CSP is untouched; the CSS lands in this demo's lazy chunk only. */
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource-variable/eb-garamond/wght-italic.css";

const BlackwoodScene = dynamic(() => import("./BlackwoodScene"), { ssr: false });

/* Blackwood tokens — cellar dark: cold blue-black ground, lantern amber.
 * Deliberately cooler in the shadows than Verre's warm nocturne, so the two
 * demos don't read as the same amber site twice. */
const T = {
  bg: "#07080A",
  surface: "#0E1013",
  ink: "#EDE4D4",
  inkSoft: "#8B8578",
  amber: "#D9974A",
  ember: "#B0561A",
  line: "rgba(217, 151, 74, 0.14)",
};
const SERIF = '"EB Garamond Variable", Garamond, "Times New Roman", serif';
/** Small-caps serif for every label that used to be uppercase monospace — the
 *  mono read as a developer portfolio, not a 140-year-old distillery. */
const CAPS: React.CSSProperties = { fontFamily: SERIF, fontVariantCaps: "all-small-caps" };

const EASE = [0.16, 1, 0.3, 1] as const;
const rise = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12%" },
  transition: { duration: 1, ease: EASE },
};

const SECTIONS = ["01", "02", "03", "04", "05", "06", "07"];

/* CP4_43: copy realigned to the bottle's label — Speyside single malt,
 * Est. 1887, 18 years, first-fill European oak + charred virgin oak finish.
 * The label is baked into the 3D asset; the words move to match it.
 *
 * The WORDS themselves now live in ./copy.ts (EN + PL). What stays here is
 * data that is the same in every language: the tasting-note bar widths. */
const NOTE_WEIGHTS = ["100%", "78%", "62%", "86%"];

/** CP4_46: the rail TRACKS the page. It used to print a fixed "01 … 07" inside
 *  the hero and scroll away with it. Now it lives in the sticky layer: current
 *  section over the total, with an amber fill for progress through the page. */
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
      <span className="text-[14px] tracking-[0.14em] tabular-nums" style={{ ...CAPS, color: T.ink }}>
        {SECTIONS[index - 1]}
      </span>
      <span className="relative h-24 w-px" style={{ background: T.line }}>
        <span
          ref={fill}
          className="absolute left-0 top-0 h-full w-px origin-top"
          style={{ background: T.amber, transform: "scaleY(0)" }}
        />
      </span>
      <span className="text-[14px] tracking-[0.14em] tabular-nums" style={{ ...CAPS, color: T.inkSoft }}>
        {SECTIONS[SECTIONS.length - 1]}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[15px] leading-[1.6] tracking-[0.16em]"
      style={{ ...CAPS, color: T.inkSoft }}
    >
      {children}
    </p>
  );
}

/* The copy column. The 3D cellar lives behind the whole page, so every section
 * is constrained to a narrow band on the LEFT and the right two-thirds of the
 * frame are left to the bottle. `lg:min-h-screen` is not decoration — it is
 * what makes one section ≈ one camera beat. */
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
      <div className="w-full lg:w-[26%] lg:min-w-[20rem] lg:max-w-[25rem]">{children}</div>
    </section>
  );
}

/**
 * Concept site #3 — Blackwood, a Speyside single malt distillery, in its warehouse (copy realigned to the bottle label, CP4_43).
 *
 * The hero canvas is a real cellar: stone floor, two lanterns, barrels
 * receding into fog, and the bottle in the front plane. The bottle turns with
 * the page's scroll and can be grabbed at any time. Below the fold the canvas
 * is released and the page runs on CSS atmosphere alone — per the locked rule,
 * a maximum of two WebGL canvases exist site-wide and this demo owns one.
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
      style={{ background: T.bg, color: T.ink, fontFamily: "var(--font-body)" }}
    >
      {/* one continuous canvas of atmosphere — no light sections, ever.
          Warm pockets sit where the lanterns would throw light if the cellar
          carried on down the page. */}
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

      {/* ————— the cellar, behind everything ————————————————————————
          STICKY, not hero-local. The camera dollies across the full page, so
          the canvas has to survive past the first screen — it used to fade out
          at 12% scroll, which would have hidden every beat after the descent.
          The wrapper is h-0 so the sticky layer costs no flow height. */}
      <div className="pointer-events-none sticky top-0 z-0 h-0">
        <div className="absolute left-0 top-0 h-[var(--bw-vh,100vh)] w-full">
          <BlackwoodScene
            quality={preview ? "preview" : "full"}
            progress={progress}
            scrollRot={scrollRot}
            className="!absolute inset-0"
          />
          {/* CP4_46: the CSS radial vignette is gone — it stacked on the
              composer's Vignette, and its blue-black tint muddied the amber. */}
          {/* left scrim — the copy column sits on this, not on bare lantern light */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-[38%] lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,5,4,0.92) 0%, rgba(6,5,4,0.7) 46%, transparent 100%)",
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

      {/* ————— chrome ————— */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-[2px]"
        style={{ borderColor: T.line, background: "rgba(7,8,10,0.62)" }}
      >
        <div className="flex h-[34px] items-center justify-center">
          <Eyebrow>{c.announce}</Eyebrow>
        </div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-8 py-7 lg:px-14">
        <span
          className="text-[15px] tracking-[0.34em]"
          style={{ fontFamily: SERIF, color: T.ink }}
        >
          BLACKWOOD
        </span>
        <nav className="hidden items-center gap-10 md:flex">
          {c.nav.map((l) => (
            <span
              key={l}
              className="text-[14px] tracking-[0.14em]"
              style={{ ...CAPS, color: T.inkSoft }}
            >
              {l}
            </span>
          ))}
        </nav>
        <span
          className="border px-5 py-2 text-[14px] tracking-[0.14em]"
          style={{ ...CAPS, borderColor: T.line, color: T.ink }}
        >
          {c.navCta}
        </span>
      </header>

      {/* ————— 01 · hero ————— */}
      <Band first>
        <motion.div {...rise}>
          <Eyebrow>
            {c.hero.region}
            <br />
            {c.hero.est}
          </Eyebrow>
          <span className="mt-6 block h-px w-12" style={{ background: T.amber }} />
          <DemoHeading
            className="mt-7 text-[clamp(2.9rem,5vw,4.2rem)] font-medium leading-[0.98]"
            style={{ fontFamily: SERIF, color: T.ink }}
          >
            {c.hero.titleA}
            <br />
            <em style={{ color: T.amber }}>{c.hero.titleB}</em>
          </DemoHeading>
          <p
            className="mt-7 max-w-[22rem] text-[16px] leading-[1.7] tracking-[0.14em]"
            style={{ ...CAPS, color: T.inkSoft }}
          >
            {c.hero.lead}
          </p>
          <span
            className="mt-9 inline-block border-b pb-1 text-[14px] tracking-[0.14em]"
            style={{ ...CAPS, borderColor: T.amber, color: T.ink }}
          >
            {c.hero.link}
          </span>
          <div className="mt-14 flex items-center gap-3">
            <span className="text-[14px] tracking-[0.14em]" style={{ ...CAPS, color: T.inkSoft }}>
              ↓
            </span>
            <span
              className="text-[14px] tracking-[0.14em]"
              style={{ ...CAPS, color: T.inkSoft }}
            >
              {c.hero.scroll}
            </span>
          </div>
        </motion.div>
      </Band>

      {/* ————— 02 · the whisky ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.whisky.eyebrow}</Eyebrow>
          <h2
            className="mt-6 max-w-[20ch] text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.08]"
            style={{ fontFamily: SERIF }}
          >
            {c.whisky.heading}
          </h2>
        </motion.div>

        <div className="mt-12 flex flex-col gap-px" style={{ background: T.line }}>
          {c.whisky.mash.map(({ pct, grain, copy }) => (
            <motion.div
              key={grain}
              {...rise}
              className="flex items-baseline gap-6 p-6"
              style={{ background: "rgba(14,16,19,0.72)" }}
            >
              <span
                className="w-[3.4rem] shrink-0 text-[1.9rem] leading-none"
                style={{ fontFamily: SERIF, color: T.amber }}
              >
                {pct}
              </span>
              <div>
                <h3 className="text-[15px] tracking-[0.02em]" style={{ fontFamily: SERIF }}>
                  {grain}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.75]" style={{ color: T.inkSoft }}>
                  {copy}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 03 · craft ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.craft.eyebrow}</Eyebrow>
          <h2
            className="mt-6 text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.08]"
            style={{ fontFamily: SERIF }}
          >
            {c.craft.heading}
          </h2>
          <p className="mt-6 text-[14px] leading-[1.9]" style={{ color: T.inkSoft }}>
            {c.craft.body}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {c.craft.items.map(({ label, copy }) => (
            <motion.div key={label} {...rise}>
              <span className="block h-px w-8" style={{ background: T.amber }} />
              <h3 className="mt-4 text-[16px]" style={{ fontFamily: SERIF }}>
                {label}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.8]" style={{ color: T.inkSoft }}>
                {copy}
              </p>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 04 · tasting notes ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.notes.eyebrow}</Eyebrow>
          <h2
            className="mt-6 max-w-[18ch] text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.08]"
            style={{ fontFamily: SERIF }}
          >
            {c.notes.heading}
          </h2>
        </motion.div>

        <div className="mt-10 flex flex-col">
          {c.notes.items.map((n, i) => (
            <motion.div
              key={n.name}
              {...rise}
              className="border-t py-6"
              style={{ borderColor: T.line }}
            >
              <h3 className="text-[17px]" style={{ fontFamily: SERIF }}>
                {n.name}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.8]" style={{ color: T.inkSoft }}>
                {n.note}
              </p>
              <span className="relative mt-4 block h-px w-full" style={{ background: T.line }}>
                <motion.span
                  initial={{ width: 0 }}
                  whileInView={{ width: NOTE_WEIGHTS[i] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, ease: EASE }}
                  className="absolute left-0 top-0 h-px"
                  style={{ background: T.amber }}
                />
              </span>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 05 · our story ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.story.eyebrow}</Eyebrow>
          <p
            className="mt-8 text-[clamp(1.3rem,2vw,1.75rem)] leading-[1.5]"
            style={{ fontFamily: SERIF }}
          >
            {c.story.quote}
          </p>
          <p
            className="mt-8 text-[14px] tracking-[0.14em]"
            style={{ ...CAPS, color: T.inkSoft }}
          >
            {c.story.attribution}
          </p>
        </motion.div>
      </Band>

      {/* ————— 06 · the barrel ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.barrel.eyebrow}</Eyebrow>
          <h2
            className="mt-6 text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.08]"
            style={{ fontFamily: SERIF }}
          >
            {c.barrel.heading}
          </h2>
          <p className="mt-6 text-[14px] leading-[1.9]" style={{ color: T.inkSoft }}>
            {c.barrel.body}
          </p>
        </motion.div>
      </Band>

      {/* ————— 07 · find a bottle ————— */}
      <Band>
        <motion.div {...rise}>
          <Eyebrow>{c.find.eyebrow}</Eyebrow>
          <h2
            className="mt-7 max-w-[16ch] text-[clamp(2rem,3.2vw,2.9rem)] leading-[1.05]"
            style={{ fontFamily: SERIF }}
          >
            {c.find.heading}
          </h2>
          <span
            className="mt-10 inline-block border px-9 py-3.5 text-[14px] tracking-[0.14em]"
            style={{ ...CAPS, borderColor: T.amber, color: T.ink }}
          >
            {c.find.cta}
          </span>
          <p
            className="mt-14 text-[13px] leading-[1.7] tracking-[0.14em]"
            style={{ ...CAPS, color: T.inkSoft }}
          >
            {c.find.disclaimer}
          </p>
        </motion.div>
      </Band>

    </div>
  );
}
