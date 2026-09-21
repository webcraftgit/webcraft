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

/* ————— TYPE SCALE (CP4_62) ———————————————————————————————————————
 * Five steps, each clearly apart from the next. Before this, eyebrow / h3 /
 * body all sat between 13 and 17px, so nothing led.
 *   label   12px Tenor caps, tracked .24em   — eyebrows, nav, CTAs, spec keys
 *   body    16px Tenor, 1.75                 — lead is 18px
 *   h3      20px Playfair
 *   h2      32 → 46px Playfair
 *   h1      48 → 74px Playfair
 * Small caps are for labels only; no paragraph is ever set in caps. */
const LABEL: React.CSSProperties = {
  fontFamily: SANS,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
};
const labelCls = "text-[12px] leading-[1.6]";
const bodyCls = "text-[16px] leading-[1.75]";
const h3Cls = "text-[20px] leading-[1.3]";
const h2Cls = "text-[clamp(2rem,3vw,2.9rem)] leading-[1.1]";

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
/** header nav order → section anchors (copy.nav is in the same order) */
const NAV_TARGETS = ["cask", "distillery", "tasting"] as const;
const SECTION_OF: Record<string, number> = { cask: 2, distillery: 3, tasting: 4 };

/** The rail TRACKS the page (CP4_46): current section over the total, with an
 *  amber fill for progress. CP4_63: the section number comes from an
 *  IntersectionObserver on the real sections; the fill is still progress. */
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
  id,
  index,
  first = false,
  wide = false,
}: {
  children: React.ReactNode;
  /** anchor target for the header links — `bw-${id}` */
  id: string;
  /** 1-based; the rail's IntersectionObserver reads it (CP4_63) */
  index: number;
  first?: boolean;
  /** CP4_63: the quote breaks the column — wider band, the scrim widens with it */
  wide?: boolean;
}) {
  return (
    <section
      id={`bw-${id}`}
      data-bw-i={index}
      tabIndex={-1}
      className={`relative z-10 flex px-8 outline-none lg:min-h-screen lg:items-center lg:pl-24 lg:pr-8 ${
        /* CP4_63 mobile: the hero copy sits in the LOWER part of the first
           screen so the bottle keeps the top half; the mobile scrim is
           darkest at the bottom for the same reason. */
        first ? "min-h-[82vh] items-end pb-12 lg:pb-0" : "items-center py-24 lg:py-0"
      }`}
    >
      <div
        className={`w-full ${
          wide ? "lg:w-[40%] lg:min-w-[24rem] lg:max-w-[35rem]" : "lg:w-[28%] lg:min-w-[21rem] lg:max-w-[27rem]"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

/** Focus ring for every interactive element — amber, offset, keyboard only. */
const focusCls =
  "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#D9974A]";

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
  const mobileScrim = useRef<HTMLDivElement>(null);

  /* CP4_63 (plan item 6): the header and hero links SCROLL THIS CONTAINER.
   * Not hash navigation — the demo lives inside the studio page's fullscreen
   * player, and a #hash would move the studio page (and its URL) instead.
   * Focus moves to the section so keyboard and screen-reader users land
   * where sighted users do. */
  const jump = (id: string) => {
    const el = scroller.current;
    const target = el?.querySelector<HTMLElement>(`#bw-${id}`);
    if (!el || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: id === "top" ? 0 : target.offsetTop, behavior: reduce ? "auto" : "smooth" });
    target.focus({ preventScroll: true });
  };

  /* CP4_63 (plan item 7): the rail follows the section that actually crosses
   * the middle of the viewport. It used to be floor(progress × N), which was
   * wrong whenever sections had different heights — i.e. always. */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSection(Number((e.target as HTMLElement).dataset.bwI) || 1);
        }
      },
      { root: el, rootMargin: "-49% 0px -49% 0px", threshold: 0 },
    );
    el.querySelectorAll("section[data-bw-i]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

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
      // mobile: the full-screen veil fades in over the first half-screen of scroll
      if (mobileScrim.current)
        mobileScrim.current.style.opacity = String(Math.min(1, el.scrollTop / (el.clientHeight * 0.5)));
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
      style={{ background: T.bg, color: T.ink, fontFamily: SANS, fontVariantNumeric: "lining-nums" }}
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
          {/* left scrim — the copy column sits on this, not on bare lantern light.
              CP4_63: widens for the quote (section 5), whose band is wider. */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden transition-[width] duration-700 ease-out lg:block"
            style={{
              width: section === 5 ? "54%" : "40%",
              background:
                "linear-gradient(90deg, rgba(6,5,4,0.92) 0%, rgba(6,5,4,0.72) 50%, transparent 100%)",
            }}
          />
          {/* CP4_63 (plan item 8) MOBILE SCRIM. Below lg the copy runs full
              width straight over the scene, lanterns and all. Two layers:
              a bottom-weighted gradient (the hero copy sits low, the bottle
              keeps the top), and a flat veil that fades in once the hero is
              half scrolled away — from then on every line of copy is on
              ≥ ~0.8 black. */}
          <div
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,5,4,0.25) 0%, rgba(6,5,4,0.5) 38%, rgba(6,5,4,0.9) 72%)",
            }}
          />
          <div
            ref={mobileScrim}
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{ background: "rgba(6,5,4,0.72)", opacity: 0 }}
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
        <div className="flex h-[34px] items-center justify-center px-4">
          <p className="truncate text-[11px] leading-[1.6]" style={{ ...LABEL, letterSpacing: "0.2em", color: T.inkSoft }}>
            {c.announce}
          </p>
        </div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-8 py-7 lg:px-14">
        {/* Wordmark as on the label: the heaviest thing on it, in gold. */}
        <a
          href="#bw-top"
          onClick={(e) => {
            e.preventDefault();
            jump("top");
          }}
          className={`text-[21px] font-semibold leading-none tracking-[0.18em] text-[#D9974A] ${focusCls}`}
          style={{ fontFamily: SERIF }}
        >
          BLACKWOOD
        </a>
        {/* CP4_63 (plan item 6): real links, with hover + focus states. Colour
            lives in classes, not inline styles, so :hover can change it. */}
        <nav className="hidden items-center gap-10 md:flex">
          {c.nav.map((l, i) => {
            const id = NAV_TARGETS[i];
            return (
              <a
                key={l}
                href={`#bw-${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  jump(id);
                }}
                className={`group relative py-1 text-[#8B8578] transition-colors duration-300 hover:text-[#EDE4D4] ${labelCls} ${focusCls}`}
                style={LABEL}
                aria-current={section === SECTION_OF[id] ? "true" : undefined}
              >
                {l}
                <span
                  aria-hidden
                  className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-[#D9974A] transition-transform duration-500 ${
                    section === SECTION_OF[id] ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            );
          })}
        </nav>
        <a
          href="#bw-find"
          onClick={(e) => {
            e.preventDefault();
            jump("find");
          }}
          className={`whitespace-nowrap border border-[#D9974A] px-4 py-2.5 text-[#EDE4D4] transition-colors duration-300 hover:bg-[#D9974A] hover:text-[#07080A] lg:px-5 ${labelCls} ${focusCls}`}
          style={LABEL}
        >
          {c.navCta}
        </a>
      </header>

      {/* ————— 01 · hero ————— */}
      <Band id="top" index={1} first>
        <motion.div {...rise}>
          <Eyebrow>
            01 — {c.hero.region} · {c.hero.est}
          </Eyebrow>
          <span className="mt-6 block h-px w-12" style={{ background: T.amber }} />
          <DemoHeading
            className="mt-6 text-[clamp(3rem,5.4vw,4.6rem)] font-medium leading-[1.02]"
            style={{ fontFamily: SERIF, color: T.ink }}
          >
            {c.hero.titleA}
            <br />
            <em style={{ color: T.amber }}>{c.hero.titleB}</em>
          </DemoHeading>
          <p
            className="mt-6 max-w-[25rem] text-[17px] leading-[1.7] lg:text-[18px]"
            style={{ color: T.inkBody }}
          >
            {c.hero.lead}
          </p>
          <a
            href="#bw-cask"
            onClick={(e) => {
              e.preventDefault();
              jump("cask");
            }}
            className={`mt-8 inline-block border-b border-[#D9974A] pb-1.5 text-[#EDE4D4] transition-colors duration-300 hover:text-[#D9974A] ${labelCls} ${focusCls}`}
            style={LABEL}
          >
            {c.hero.link}
          </a>
          <div className="mt-10 flex items-center gap-3">
            <span aria-hidden className={labelCls} style={{ color: T.inkSoft }}>
              ↓
            </span>
            <span className={labelCls} style={{ ...LABEL, color: T.inkSoft }}>
              {c.hero.scroll}
            </span>
          </div>
        </motion.div>
      </Band>

      {/* ————— 02 · the cask ————— */}
      <Band id="cask" index={2}>
        <motion.div {...rise}>
          <Eyebrow>{c.cask.eyebrow}</Eyebrow>
          <h2 className={`mt-6 max-w-[16ch] ${h2Cls}`} style={{ fontFamily: SERIF }}>
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
                className="border-t py-3.5 text-[17px] leading-[1.35]"
                style={{ fontFamily: SERIF, color: T.ink, borderColor: T.line }}
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
      <Band id="distillery" index={3}>
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
              <h3 className={h3Cls} style={{ fontFamily: SERIF }}>
                {label}
              </h3>
              <p className="mt-1.5 text-[15px] leading-[1.65]" style={{ color: T.inkBody }}>
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
      <Band id="tasting" index={4}>
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
              <h3 className={`mt-2 ${h3Cls}`} style={{ fontFamily: SERIF }}>
                {n.notes}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.7]" style={{ color: T.inkBody }}>
                {n.comment}
              </p>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* ————— 05 · in the warehouse ————— */}
      <Band id="voice" index={5} wide>
        <motion.figure {...rise}>
          <Eyebrow>{c.voice.eyebrow}</Eyebrow>
          <span aria-hidden className="mt-8 block h-px w-12" style={{ background: T.amber }} />
          <blockquote
            className="mt-8 text-[clamp(1.6rem,2.5vw,2.35rem)] italic leading-[1.4]"
            style={{ fontFamily: SERIF, color: T.ink, hangingPunctuation: "first" }}
          >
            {c.voice.quote}
          </blockquote>
          <figcaption className="mt-8">
            <span className="block text-[18px]" style={{ fontFamily: SERIF, color: T.ink }}>
              {c.voice.name}
            </span>
            <span className={`mt-1.5 block ${labelCls}`} style={{ ...LABEL, color: T.inkSoft }}>
              {c.voice.role}
            </span>
          </figcaption>
        </motion.figure>
      </Band>

      {/* ————— 06 · find a bottle ————— */}
      <Band id="find" index={6}>
        <motion.div {...rise}>
          <Eyebrow>{c.find.eyebrow}</Eyebrow>
          <h2
            className="mt-7 text-[clamp(2.6rem,3.9vw,3.5rem)] font-medium leading-[1.04]"
            style={{ fontFamily: SERIF }}
          >
            {c.find.heading}
          </h2>
          <Body className="mt-6">{c.find.body}</Body>
          <p className={`mt-6 ${labelCls}`} style={{ ...LABEL, color: T.amber }}>
            {c.find.bottle}
          </p>
          {/* CP4_63: the ONE filled button on the page — every other control
              is outlined or underlined, so the page ends on its strongest note. */}
          <button
            type="button"
            className={`mt-10 inline-block bg-[#D9974A] px-10 py-4 text-[#07080A] transition-colors duration-300 hover:bg-[#EDE4D4] ${labelCls} ${focusCls}`}
            style={LABEL}
          >
            {c.find.cta}
          </button>
          <p className="mt-14 text-[12px] leading-[1.7]" style={{ color: T.inkSoft }}>
            {c.find.disclaimer}
          </p>
        </motion.div>
      </Band>
    </div>
  );
}
