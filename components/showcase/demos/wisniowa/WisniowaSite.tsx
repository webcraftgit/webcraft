"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { CherryMark, Wordmark } from "./mark";
import { Figure } from "./photos";
import { useWisCopy, type Claim as CopyClaim } from "./copy";

/* fonts — SELF-HOSTED, deliberately (CSP connect-src trap, see CP6-hdr-fix).
 * latin-ext is NOT optional: without it ś/ó/ż/ę/ł fall back mid-word. */
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/dm-serif-display/latin-ext-400.css";
import "@fontsource-variable/manrope/wght.css";
import DemoHeading from "@/components/showcase/DemoHeading";

/* ————————————————————————————————————————————————————————————————
 * WIŚNIOWA · stomatologia — v5, PHOTO-LED EDITORIAL.
 *
 * WHY v4 STILL READ AS GENERATED, AND WHAT THIS CHANGES
 * v4 was a well-behaved component page: split hero, four-up strip, panel,
 * list, accordion, band, footer. Every section was a box of text with an
 * image beside it, all at the same width, all at the same rhythm. That
 * silhouette — not the colours, not the fonts — is the tell.
 *
 * The client's reference (klinikanugat9.pl) works differently, and this
 * rebuild follows its structure:
 *   1. FULL-BLEED PHOTOGRAPHY CARRIES THE PAGE. The hero is a photograph
 *      with the headline over it, not a card next to it. Photos are edge-to-
 *      edge, tall, and sized differently from each other.
 *   2. EDITORIAL CLAIM LISTS. Instead of four equal feature tiles, long
 *      claims run as arrow-marked paragraphs with the specifics in bold —
 *      the eye catches "mikroskop", "sedacja wziewna", "bez limitów NFZ"
 *      rather than four interchangeable two-word headings.
 *   3. A FOUNDER'S QUOTE at the emotional centre, portrait beside it.
 *   4. A MARQUEE TICKER between bands, so the page has one moment of motion
 *      that isn't a fade-in.
 *   5. A FIXED CONTACT RAIL on the left edge (desktop) — phone, mail, hours
 *      always one click away without a sticky bar eating the layout.
 *   6. A CAPTIONED GALLERY STRIP, three photos at unequal heights.
 * Sections now alternate full-bleed / inset / band / strip instead of
 * repeating one container width.
 *
 * PHOTOS ARE NOW DROP-IN. ./photos.tsx points every slot at a real path under
 * public/demo/wisniowa/ and falls back to a labelled placeholder on 404, so
 * adding photography is a file copy. See the shot list in that file.
 *
 * HONESTY RULES, UNCHANGED AND NON-NEGOTIABLE
 *   · No fake availability — the booking prototype picks a treatment type
 *     only, and says so beside the button.
 *   · No invented patient reviews. The reference's testimonial wall is
 *     replaced here by OUR OWN PROMISES, labelled as promises. A fictional
 *     clinic cannot have satisfied patients.
 *   · No stock faces under invented doctor names — team stays monogrammed.
 *   · Webcraft is named in the top strip and the footer.
 *
 * Fonts scoped to .wis-root; component contract ({ preview }) unchanged.
 * ———————————————————————————————————————————————————————————————— */

const T = {
  bg: "#F4EDE1",
  card: "#FDFAF3",
  ink: "#221A14",
  dark: "#1C140F",
  cream: "#F6EFE3",
  creamDim: "rgba(246,239,227,.7)",
  green: "#2E4737",
  greenDeep: "#263B2E",
  soft: "#DFE5DC",
  cherry: "#B33A45",
  amber: "#BE8746",
  muted: "#8B8377",
  body: "#4E463B",
  line: "rgba(34, 26, 20, 0.12)",
  lineOnDark: "rgba(246,239,227,.15)",
};

const PHONE = "22 000 00 00";
const PHONE_HREF = "tel:+48220000000";
const MAIL = "recepcja@wisniowa-demo.pl";

/* ALL COPY MOVED TO ./copy.ts (CP4_13) — PL + EN, `en` typed as source of
 * truth and `pl: typeof en`, so a key added to one language and missing from
 * the other fails the build. The rationale that used to sit on each constant
 * moved with it; the notes that are about STRUCTURE rather than wording stay
 * below.
 *
 * STILL TRUE, AND STILL LOAD-BEARING:
 *  · SCOPES ids are React state values, not copy — identical in both languages
 *    so switching language cannot reset the booking selection.
 *  · The team roster stays MONOGRAMMED in both languages. A full name plus a
 *    dental title asserts a specific licensed dentist exists; a photographed
 *    face beside it makes that assertion about a real person. The English
 *    roster uses "Dr", not "DDS" — nobody here holds a US credential.
 *  · PROMISES are commitments, never restyled as quotes with names attached.
 *    A fictional clinic cannot have satisfied patients.
 *  · The booking prototype offers a treatment type and no dates or times.
 *  · `hours` is the single source for opening times; the footer renders the
 *    `short` field and the contact block the `day` field, so the two cannot
 *    drift the way they had before CP4_12.
 */

type Claim = CopyClaim;

/* Structure only — which photo slot and whether the tile is the tall one.
 * The captions used to live here and are now `copy.gallery[i]`, matched BY
 * INDEX, so this array and that one must stay the same length and order. */
const GALLERY: { slot: "gallery1" | "gallery2" | "gallery3"; tall: boolean }[] = [
  { slot: "gallery1", tall: false },
  { slot: "gallery2", tall: true },
  { slot: "gallery3", tall: false },
];

/* ——————————————————————————————————————————————— small pieces ——— */

/** Renders a claim with its bold fragments emphasised in place. */
function ClaimText({ claim }: { claim: Claim }) {
  let parts: (string | { b: string })[] = [claim.text];
  for (const b of claim.bold) {
    const next: (string | { b: string })[] = [];
    for (const p of parts) {
      if (typeof p !== "string") {
        next.push(p);
        continue;
      }
      const i = p.indexOf(b);
      if (i === -1) {
        next.push(p);
        continue;
      }
      if (i > 0) next.push(p.slice(0, i));
      next.push({ b });
      const rest = p.slice(i + b.length);
      if (rest) next.push(rest);
    }
    parts = next;
  }
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <strong key={i} style={{ fontWeight: 700, color: T.ink }}>
            {p.b}
          </strong>
        ),
      )}
    </>
  );
}

function ClaimList({ items }: { items: Claim[] }) {
  return (
    <ul className="mt-8">
      {items.map((c, i) => (
        <li
          key={i}
          className="flex gap-4 py-5"
          style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="mt-1 shrink-0">
            <path
              d="M3 10h13M11 5l5 5-5 5"
              fill="none"
              stroke={T.amber}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="wis-sans" style={{ fontSize: 15.5, lineHeight: 1.72, color: T.body }}>
            <ClaimText claim={c} />
          </p>
        </li>
      ))}
    </ul>
  );
}

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className="h-px w-7" style={{ background: onDark ? "#D9A868" : T.amber }} />
      <span
        className="wis-sans uppercase"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.22em",
          color: onDark ? "#D9A868" : T.amber,
        }}
      >
        {children}
      </span>
    </span>
  );
}

/* ————————————————————————————————————————————————————————————————
 * IN-DEMO NAVIGATION
 *
 * WHY A CONTEXT AND NOT `document.getElementById`
 * The showcase mounts this component TWICE at once: once inert and scaled
 * inside the grid card, once live inside the fullscreen player. Both copies
 * carried `id="wis-scroller"` and both carry `id="rezerwacja"`, `id="zespol"`
 * and so on. `document.getElementById` returns the FIRST match in document
 * order, which is the grid card — so the live player was attaching its scroll
 * listener to, and calling `scrollTo` on, a container that never moves.
 * That single bug produced all three visible symptoms:
 *   · `scrolled` never flipped, so the header kept `background: transparent`
 *     all the way down the page and cream links sat on cream sections;
 *   · nav links called preventDefault and then scrolled the wrong element,
 *     so they looked dead;
 *   · the hero CTA fell through to the browser's native hash jump — the
 *     "teleport".
 * Everything below is scoped to THIS instance's root node via a ref, so a
 * second copy on the page cannot be addressed by accident. Do not reintroduce
 * `getElementById` here, and do not assume these ids are unique in the DOM.
 * ———————————————————————————————————————————————————————————————— */

type NavCtx = { scrollTo: (id: string) => boolean };
const WisNav = createContext<NavCtx | null>(null);

/** onClick for any anchor pointing at an in-demo `#id`. */
function useAnchorClick(href: string) {
  const nav = useContext(WisNav);
  return (e: React.MouseEvent) => {
    if (!href.startsWith("#") || !nav) return;
    /* preventDefault ONLY once we know we can handle it ourselves — otherwise
     * an unknown target would swallow the click and do nothing at all. */
    if (nav.scrollTo(href.slice(1))) e.preventDefault();
  };
}

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/* Native `scrollTo({behavior:"smooth"})` is distance-proportional and
 * uninterruptible in Chrome — a jump from the hero to the booking form runs
 * well over a second and ignores the wheel while it does. This tween is
 * clamped regardless of distance ("quick but smooth") and aborts the moment
 * the user touches the wheel or the screen.
 *
 * MEASURED: every real in-page jump on this layout is 1500px+, so
 * distance × MS_PER_PX always exceeds the ceiling and clamps. SCROLL_MAX_MS is
 * therefore the number that actually decides how the page feels — the other two
 * only matter for short hops between adjacent sections. Tune the ceiling first. */
const SCROLL_MIN_MS = 320;
const SCROLL_MAX_MS = 540;
const SCROLL_MS_PER_PX = 0.35;

/* Header height, used for BOTH the scroll landing offset and the tone probe.
 * It was a bare `88` inside the old scroll maths; the two now have to agree,
 * so it lives in one place. Matches py-4 + content at the current type sizes. */
const HEADER_H = 72;

function Primary({
  children,
  href = "#rezerwacja",
  full = false,
  big = false,
  hero = false,
  heroXl = false,
}: {
  children: React.ReactNode;
  href?: string;
  full?: boolean;
  big?: boolean;
  hero?: boolean;
  heroXl?: boolean;
}) {
  /* heroXl is the one dial for the main hero CTA. A literal 2.5× of the old
   * 62px would be 155px tall, which stops reading as a button and starts
   * reading as a banner; 124px with 30px type was the practical maximum before
   * it did that.
   * CP4_9: slimmed to 78px — the client's word was "thinner". HEIGHT came down,
   * `px-16` did NOT, so the pill keeps its width and still outweighs the phone
   * button below it; shrinking both would have collapsed the hierarchy the
   * stacked layout exists to create. 26px type keeps ~26px of optical padding
   * top and bottom at 78px. Below ~68px it stops out-ranking the `hero` variant
   * (62px) underneath it and the stack reads as two similar buttons again. */
  const size = heroXl
    ? "min-h-[78px] px-16 text-[26px]"
    : hero
      ? "min-h-[62px] px-11 text-[17px]"
      : big
        ? "min-h-[54px] px-8 text-[15px]"
        : "min-h-[48px] px-7 text-[14px]";
  const onClick = useAnchorClick(href);
  return (
    <a
      href={href}
      onClick={onClick}
      className={`wis-sans wis-btn inline-flex items-center justify-center rounded-full ${size} ${
        full ? "w-full" : ""
      }`}
      style={{ background: T.green, color: T.cream, fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

function Secondary({
  children,
  href,
  full = false,
  onDark = false,
  hero = false,
}: {
  children: React.ReactNode;
  href: string;
  full?: boolean;
  onDark?: boolean;
  hero?: boolean;
}) {
  const onClick = useAnchorClick(href);
  return (
    <a
      href={href}
      onClick={onClick}
      className={`wis-sans wis-btn inline-flex items-center justify-center rounded-full border ${
        hero ? "min-h-[62px] px-11 text-[17px]" : "min-h-[48px] px-7 text-[14px]"
      } ${full ? "w-full" : ""}`}
      style={
        onDark
          ? { borderColor: "rgba(246,239,227,.42)", background: "transparent", color: T.cream, fontWeight: 600 }
          : { borderColor: T.line, background: T.card, color: T.ink, fontWeight: 600 }
      }
    >
      {children}
    </a>
  );
}

/* ——————————————————————————————————————————————————— the site ——— */

export default function WisniowaSite({ preview = false }: { preview?: boolean }) {
  const c = useWisCopy();
  const [locale, setLocale] = useLocale();
  const reduced = usePrefersReducedMotion();
  const still = preview || reduced;
  const [scope, setScope] = useState<string>("konsultacja");
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBar, setShowBar] = useState(false);
  /* Tone of whatever band currently sits behind the sticky header. Drives BOTH
   * the header's backdrop and its foreground — see the header's style block. */
  const [headerTone, setHeaderTone] = useState<"light" | "dark">("dark");
  const scroller = useRef<HTMLDivElement>(null);
  const tween = useRef(0);
  const faqBase = useId();

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const onScroll = () => {
      setScrolled(el.scrollTop > 80);
      setShowBar(el.scrollTop > 620);

      /* Probe a few px below the header's bottom edge and ask which tagged
       * band owns that line. Only DARK bands are tagged, so "nothing here"
       * correctly means light. Bands are tagged on the element that actually
       * paints the colour, which for the inset quote card is the card and not
       * its transparent wrapper section. */
      const rootTop = el.getBoundingClientRect().top;
      const probe = rootTop + HEADER_H + 4;
      let dark = false;
      el.querySelectorAll<HTMLElement>("[data-wis-dark]").forEach((band) => {
        const r = band.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) dark = true;
      });
      setHeaderTone(dark ? "dark" : "light");
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    /* The bands move under the header on resize too, not just on scroll. */
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(tween.current);
    };
    /* `preview` is no longer a bail-out condition: the grid card never scrolls,
     * so the listener costs nothing there, and bailing was half of why the
     * live copy read the wrong element. */
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const root = scroller.current;
      /* Scoped to this instance — a second mounted copy shares these ids. */
      const target = root?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!root || !target) return false;

      const max = root.scrollHeight - root.clientHeight;
      const from = root.scrollTop;
      const to = Math.max(
        0,
        Math.min(max, target.getBoundingClientRect().top - root.getBoundingClientRect().top + from - HEADER_H - 16),
      );
      const dist = to - from;

      cancelAnimationFrame(tween.current);
      if (Math.abs(dist) < 2) return true;
      if (reduced) {
        root.scrollTop = to;
        return true;
      }

      const dur = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, Math.abs(dist) * SCROLL_MS_PER_PX));
      const t0 = performance.now();

      /* Hand control straight back if the user starts scrolling themselves —
       * fighting the wheel is the thing people hate most about scripted
       * scrolling. `once` so the listeners clean themselves up. */
      const opts = { passive: true } as const;
      const stop = () => {
        root.removeEventListener("wheel", abort);
        root.removeEventListener("touchstart", abort);
      };
      function abort() {
        cancelAnimationFrame(tween.current);
        stop();
      }
      root.addEventListener("wheel", abort, opts);
      root.addEventListener("touchstart", abort, opts);

      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        root.scrollTop = from + dist * EASE_OUT_CUBIC(p);
        if (p < 1) tween.current = requestAnimationFrame(step);
        else {
          stop();
          /* Move focus so keyboard and screen-reader users land where sighted
           * users do; the native hash jump used to do this for free. */
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      };
      tween.current = requestAnimationFrame(step);
      return true;
    },
    [reduced],
  );

  const goTo = (id: string) => (e: React.MouseEvent) => {
    if (scrollTo(id)) e.preventDefault();
  };

  const nav = useMemo(() => ({ scrollTo }), [scrollTo]);

  const rise = still
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <WisNav.Provider value={nav}>
    <div
      ref={scroller}
      id="wis-scroller"
      data-lenis-prevent
      className="wis-root relative h-full overflow-y-auto overscroll-contain"
      style={{ background: T.bg, color: T.ink }}
    >
      <style>{`
        .wis-root { font-family: "Manrope Variable", ui-sans-serif, system-ui, sans-serif; }
        .wis-root .wis-serif { font-family: "DM Serif Display", Georgia, "Times New Roman", serif; font-weight: 400; }
        .wis-root .wis-sans { font-family: "Manrope Variable", ui-sans-serif, system-ui, sans-serif; }
        .wis-root .wis-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .wis-root ::selection { background: ${T.soft}; }
        .wis-root .wis-btn { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1); }
        @media (hover:hover) {
          .wis-root .wis-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px -14px rgba(28,20,15,.55); }
        }
        .wis-root .wis-navlink { position: relative; }
        .wis-root .wis-navlink::after { content:""; position:absolute; left:0; right:100%; bottom:-5px; height:1.5px; background:${T.amber}; transition: right .3s cubic-bezier(.16,1,.3,1); }
        @media (hover:hover) { .wis-root .wis-navlink:hover::after { right:0; } }
        /* Lets the scrim be light: the type defends its own legibility rather
           than relying on a haze over the whole photograph. */
        .wis-root .wis-hero-type { text-shadow: 0 2px 28px rgba(20,14,10,.55), 0 1px 4px rgba(20,14,10,.35); }
        .wis-root .wis-tick { display:flex; width:max-content; animation: wis-marquee 32s linear infinite; }
        @keyframes wis-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .wis-root .wis-still .wis-tick { animation: none; }
        /* Keyboard users had NO visible focus anywhere in this demo: links,
           buttons and the booking radios were all indistinguishable when
           tabbed to. Amber ring reads on cream, espresso and green alike. */
        .wis-root a:focus-visible,
        .wis-root button:focus-visible,
        .wis-root input:focus-visible + span {
          outline: 2px solid ${T.amber};
          outline-offset: 3px;
          border-radius: 999px;
        }
        .wis-root label:has(input:focus-visible) {
          outline: 2px solid ${T.amber};
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          /* Lets the scrim be light: the type defends its own legibility rather
           than relying on a haze over the whole photograph. */
        .wis-root .wis-hero-type { text-shadow: 0 2px 28px rgba(20,14,10,.55), 0 1px 4px rgba(20,14,10,.35); }
        .wis-root .wis-tick { animation: none; }
          .wis-root .wis-btn { transition: none; }
        }
      `}</style>

      <div className={still ? "wis-still" : ""}>
        {/* demo disclaimer — the honesty register, Webcraft named outright */}
        {/* The PL/EN control lives in the DISCLAIMER STRIP, not in the clinic
          * header, and that is a deliberate placement rather than a space
          * saving. This strip is Webcraft's own meta-layer — it already says
          * "this brand is fictional" in the studio's voice — and the language
          * switch belongs to the same layer. Putting it in the header would
          * also have pushed the six-item nav past what fits at the lg
          * breakpoint (measured 519px of nav at 1440 in CP4_12).
          * Hidden in `preview`: the grid card is inert and scaled, so a
          * focusable control inside it is reachable by keyboard while being
          * visually 0.28× and pointer-inert. */}
        <div
          className="wis-mono flex items-center justify-center gap-4 px-4 py-2 text-center"
          style={{ background: "#150F0A", color: "rgba(246,239,227,.8)", fontSize: 10.5 }}
        >
          <span>{c.meta.disclaimer}</span>
          {!preview && (
            <span role="group" aria-label={c.meta.langLabel} className="flex shrink-0 items-center gap-1">
              {(["pl", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                  className="wis-mono rounded-full px-2 py-0.5 uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    background: locale === l ? "rgba(246,239,227,.92)" : "transparent",
                    color: locale === l ? "#150F0A" : "rgba(246,239,227,.6)",
                    transition: reduced ? "none" : "background-color .2s, color .2s",
                  }}
                >
                  {l}
                </button>
              ))}
            </span>
          )}
        </div>

        {/* ————————————————————————————————— fixed contact rail (desktop) ——— */}
        {!preview && (
          <div
            className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 rounded-r-2xl px-2.5 py-4 xl:flex"
            style={{ background: T.green, color: T.cream }}
          >
            <a href={PHONE_HREF} aria-label={`${c.nav.callAria} ${PHONE}`} className="p-1.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3h1z"
                  stroke={T.cream}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <span className="h-px w-4" style={{ background: T.lineOnDark }} />
            <a href={`mailto:${MAIL}`} aria-label="Napisz e-mail" className="p-1.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke={T.cream} strokeWidth="1.5" />
                <path d="m3.6 6.5 8.4 6 8.4-6" stroke={T.cream} strokeWidth="1.5" />
              </svg>
            </a>
            <span className="h-px w-4" style={{ background: T.lineOnDark }} />
            <span
              className="wis-mono"
              style={{ writingMode: "vertical-rl", fontSize: 9.5, letterSpacing: "0.14em" }}
            >
              {c.nav.railHours}
            </span>
          </div>
        )}

        {/* ————————————————————————————————————— sticky header ——— */}
        {/* CP4_9: the header used to be cream-on-transparent until 80px and
          * near-black after. With the scroller bug fixed it would at least have
          * been legible, but a permanently ink-black bar over the cream half of
          * the page is heavy. It now takes its cue from the band underneath:
          * ink backdrop + cream links over the dark bands, cream backdrop + ink
          * links over the light ones. Transparent until 80px either way, so the
          * hero is never cut by a bar. */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-6 px-6 py-4 md:px-10"
          style={{
            background: !scrolled
              ? "transparent"
              : headerTone === "dark"
                ? "rgba(28,20,15,.94)"
                : "rgba(244,237,225,.94)",
            backdropFilter: scrolled ? "blur(10px)" : "none",
            borderBottom: scrolled
              ? `1px solid ${headerTone === "dark" ? T.lineOnDark : T.line}`
              : "1px solid transparent",
            transition: reduced ? "none" : "background-color .3s, border-color .3s, color .3s",
            color: headerTone === "dark" ? T.cream : T.ink,
          }}
        >
          <Wordmark onDark={headerTone === "dark"} />

          <nav className="hidden items-center gap-8 lg:flex" aria-label={c.nav.main}>
            {c.nav.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={goTo(item.id)}
                className="wis-sans wis-navlink text-[14px]"
                /* colour inherited from <header> so it flips with the tone */
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Header CTA removed at client request — the hero now carries one
            * large centred call to action, and two competing "Umów wizytę"
            * buttons on the same screen split the click rather than doubling
            * it. The phone stays: it is the other real conversion path. */}
          <a
            href={PHONE_HREF}
            className="wis-sans hidden text-[15px] lg:block"
            style={{ fontWeight: 600 }}
          >
            {PHONE}
          </a>

          <button
            type="button"
            aria-label={menuOpen ? c.nav.close : c.nav.open}
            aria-expanded={menuOpen}
            aria-controls="wis-mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span
                className="block h-[1.5px] w-5"
                style={{
                  background: "currentColor",
                  transform: menuOpen ? "translateY(3.5px) rotate(45deg)" : "none",
                  transition: reduced ? "none" : "transform .25s cubic-bezier(.16,1,.3,1)",
                }}
              />
              <span
                className="block h-[1.5px] w-5"
                style={{
                  background: "currentColor",
                  transform: menuOpen ? "translateY(-3.5px) rotate(-45deg)" : "none",
                  transition: reduced ? "none" : "transform .25s cubic-bezier(.16,1,.3,1)",
                }}
              />
            </span>
          </button>
        </header>

        {/* The hamburger used to be decorative — it opened nothing, which on a
          * demo people actually poke at reads as a broken site. */}
        {menuOpen && (
          <nav
            id="wis-mobile-nav"
            aria-label={c.nav.mobile}
            className="border-b px-6 pb-6 pt-2 lg:hidden"
            style={{ background: T.dark, color: T.cream, borderColor: T.lineOnDark }}
          >
            <ul className="flex flex-col">
              {c.nav.items.map((item) => (
                <li key={item.id} style={{ borderTop: `1px solid ${T.lineOnDark}` }}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      setMenuOpen(false);
                      goTo(item.id)(e);
                    }}
                    className="wis-sans block py-4 text-[16px]"
                    style={{ color: T.cream }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-3">
              <Primary full>{c.hero.cta}</Primary>
              <Secondary href={PHONE_HREF} full onDark>
                {PHONE}
              </Secondary>
            </div>
          </nav>
        )}

        {/* ——————————————————————————————————— full-bleed photo hero ——— */}
        <section className="relative" data-wis-dark style={{ marginTop: -76 }}>
          <Figure
            slot="hero"
            priority
            scrim
            rounded="rounded-none"
            className="h-[86vh] min-h-[560px] w-full"
          />

          {/* Centred stack. The scrim in photos.tsx had to change with it: it
            * used to be a left-weighted horizontal gradient built for
            * bottom-left text, which left the right half bright and made
            * centred type unreadable over it. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-auto w-full max-w-[1240px] px-6 text-center md:px-10">
              <motion.div
                {...rise}
                style={{ color: T.cream }}
                className="wis-hero-type flex flex-col items-center"
              >
                <Eyebrow onDark>{c.hero.eyebrow}</Eyebrow>

                <DemoHeading
                  className="wis-serif mt-6 max-w-[14ch]"
                  style={{ fontSize: "clamp(46px, 8vw, 96px)", lineHeight: 1.0, letterSpacing: "-0.02em" }}
                >
                  {c.hero.title}
                </DemoHeading>

                <p
                  className="wis-sans mt-7 max-w-[34rem]"
                  style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(246,239,227,.86)" }}
                >
                  {c.hero.lead}
                </p>

                {/* Primary scaled up hard and standing alone; the phone sits
                  * UNDER it at the previous size. Stacking rather than pairing
                  * them side by side is what makes the size difference read as
                  * a hierarchy instead of two mismatched buttons. */}
                <div className="mt-10 flex w-full flex-col items-center gap-4">
                  <Primary heroXl>{c.hero.cta}</Primary>
                  <Secondary href={PHONE_HREF} onDark hero>
                    {PHONE}
                  </Secondary>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ——————————————————————————————————————— ticker ——— */}
        <div
          className="overflow-hidden py-3.5"
          data-wis-dark
          style={{ background: T.green, color: T.cream }}
          aria-hidden
        >
          <div className="wis-tick">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {c.ticker.map((word) => (
                  <span key={word} className="flex items-center">
                    <span
                      className="wis-sans px-6 uppercase"
                      style={{ fontSize: 11.5, letterSpacing: "0.2em", fontWeight: 600 }}
                    >
                      {word}
                    </span>
                    <CherryMark size={13} plain />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ————————————————————————————————— oferta: photo + claims ——— */}
        <section id="oferta" className="px-0 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <motion.div {...rise} className="lg:sticky lg:top-28">
              <Figure slot="reception" className="aspect-[4/5] w-full" rounded="rounded-[26px]" />
            </motion.div>

            <motion.div {...rise}>
              <Eyebrow>{c.offer.eyebrow}</Eyebrow>
              <h2
                className="wis-serif mt-5"
                style={{ fontSize: "clamp(30px, 4.2vw, 48px)", lineHeight: 1.08, letterSpacing: "-0.012em" }}
              >
                {c.offer.titleA}
                <br />
                {c.offer.titleB}
              </h2>
              <ClaimList items={c.offer.claims} />
              <div className="mt-4">
                <Secondary href="#rezerwacja">{c.offer.cta}</Secondary>
              </div>
            </motion.div>
          </div>
        </section>

        {/* —————————————————————————————— founder quote (dark band) ——— */}
        <section className="px-6 py-4 md:px-10">
          <motion.div
            {...rise}
            className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[28px] md:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]"
            data-wis-dark
            style={{ background: T.dark, color: T.cream }}
          >
            <Figure slot="quote" rounded="rounded-none" className="aspect-[4/5] w-full md:aspect-auto md:h-full" />
            <div className="flex flex-col justify-center px-7 py-12 md:px-14 md:py-16">
              <CherryMark size={24} />
              <blockquote
                className="wis-serif mt-7"
                style={{ fontSize: "clamp(21px, 2.5vw, 31px)", lineHeight: 1.32, letterSpacing: "-0.005em" }}
              >
                {c.quote.text}
              </blockquote>
              {/* ATTRIBUTION: name restored at the client's explicit direction
                * (CP4_8), after the role-only version at CP4_6. Standing note for
                * whoever picks this up: the face beside this quote is a real,
                * identifiable person, and this line attaches an invented name,
                * an invented dental licence and invented first-person words to
                * her. The page-top disclaimer states the brand is fictional,
                * which is what makes it defensible here — if this layout is ever
                * reused on a REAL clinic site, either the name becomes real or
                * the portrait goes.
                * CP4_9: the roster in TEAM went to full first names, THIS LINE
                * DID NOT — deliberately, so do not "fix" the inconsistency by
                * expanding it. This is the one name on the page that sits
                * beside a real face, so it stays in the weaker abbreviated
                * form. If you want them consistent, shorten the roster back
                * rather than lengthening this. */}
              <div className="mt-8">
                <p className="wis-sans" style={{ fontSize: 14.5, fontWeight: 600 }}>
                  {c.quote.name}
                </p>
                <p className="wis-sans mt-0.5" style={{ fontSize: 13, color: T.creamDim }}>
                  {c.quote.role}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ————————————————————————————————— o nas: claims + photo ——— */}
        <section id="gabinet" className="px-0 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.about.eyebrow}</Eyebrow>
              <h2
                className="wis-serif mt-5"
                style={{ fontSize: "clamp(30px, 4.2vw, 48px)", lineHeight: 1.08, letterSpacing: "-0.012em" }}
              >
                {c.about.titleA}
                <br />
                {c.about.titleB}
              </h2>
              <ClaimList items={c.about.claims} />
            </motion.div>

            <motion.div {...rise} className="lg:sticky lg:top-28">
              <Figure slot="detail" className="aspect-[4/5] w-full" rounded="rounded-[26px]" />
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————— captioned gallery strip ——— */}
        <section className="px-6 pb-6 md:px-10">
          <div className="mx-auto grid max-w-[1240px] gap-6 md:grid-cols-3">
            {GALLERY.map((g, i) => (
              <motion.figure key={g.slot} {...rise}>
                <Figure
                  slot={g.slot}
                  rounded="rounded-[22px]"
                  className={g.tall ? "aspect-[3/4] w-full" : "aspect-[4/3] w-full md:mt-10"}
                />
                <figcaption
                  className="wis-sans mt-4"
                  style={{ fontSize: 13.5, lineHeight: 1.65, color: T.body }}
                >
                  {c.gallery[i]}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>

        {/* ————————————————————————————— booking prototype (green) ——— */}
        <section
          id="rezerwacja"
          className="mt-16 px-6 py-16 md:mt-24 md:px-10 md:py-24"
          data-wis-dark
          style={{ background: T.green, color: T.cream }}
        >
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.35fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow onDark>{c.booking.eyebrow}</Eyebrow>
              <h2 className="wis-serif mt-5" style={{ fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.1 }}>
                {c.booking.titleA}
                <br />
                {c.booking.titleB}
              </h2>
              <p
                className="wis-sans mt-5 max-w-[24rem]"
                style={{ fontSize: 15, lineHeight: 1.68, color: "rgba(246,239,227,.74)" }}
              >
                {c.booking.lead}
              </p>
              <a
                href={PHONE_HREF}
                className="wis-sans mt-6 inline-block text-[14px] underline underline-offset-4"
                style={{ color: "rgba(246,239,227,.88)" }}
              >
                {c.booking.phone} {PHONE}
              </a>
            </motion.div>

            <motion.div
              {...rise}
              className="rounded-[24px] p-6 md:p-8"
              style={{ background: T.card, color: T.ink, boxShadow: "0 34px 64px -34px rgba(0,0,0,.5)" }}
            >
              <ol className="flex items-center gap-3" aria-label={c.booking.stepsAria}>
                {c.booking.steps.map((label, i) => (
                  <li key={label} className="flex flex-1 items-center gap-3">
                    <span
                      className="wis-mono flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: i === 0 ? T.green : "transparent",
                        border: i === 0 ? "none" : `1px solid ${T.line}`,
                        color: i === 0 ? T.cream : T.muted,
                        fontSize: 10,
                      }}
                      aria-current={i === 0 ? "step" : undefined}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="wis-sans whitespace-nowrap"
                      style={{ fontSize: 12.5, color: i === 0 ? T.ink : T.muted }}
                    >
                      {label}
                    </span>
                    {i < 2 && <span className="h-px flex-1" style={{ background: T.line }} />}
                  </li>
                ))}
              </ol>

              <fieldset className="mt-8 border-0 p-0">
                <legend className="wis-sans mb-4" style={{ fontSize: 14.5, fontWeight: 700 }}>
                  {c.booking.legend}
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {c.booking.scopes.map((s) => {
                    const active = scope === s.id;
                    return (
                      <label
                        key={s.id}
                        className="flex min-h-[64px] cursor-pointer items-center justify-between gap-4 rounded-[14px] px-4 py-3"
                        style={{
                          border: `1.5px solid ${active ? T.green : T.line}`,
                          background: active ? "rgba(46,71,55,.06)" : T.card,
                          transition: reduced ? "none" : "border-color .2s, background-color .2s",
                        }}
                      >
                        <span>
                          <span
                            className="wis-sans block"
                            style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}
                          >
                            {s.name}
                          </span>
                          <span className="wis-sans mt-0.5 block" style={{ fontSize: 12.5, color: T.muted }}>
                            {s.meta}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="wis-scope"
                          value={s.id}
                          checked={active}
                          onChange={() => setScope(s.id)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                          style={{ border: `1.5px solid ${active ? T.green : "#C9C4B8"}` }}
                        >
                          {active && (
                            <span className="h-[9px] w-[9px] rounded-full" style={{ background: T.green }} />
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="wis-mono max-w-[26rem]" style={{ fontSize: 10.5, lineHeight: 1.5, color: T.muted }}>
                  {c.booking.note}
                </p>
                <button
                  type="button"
                  className="wis-sans wis-btn inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full px-6 text-[14px]"
                  style={{ background: T.green, color: T.cream, fontWeight: 600 }}
                >
                  {c.booking.next}
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* —————————————————————————————————— team: wide photo + list ——— */}
        <section id="zespol" className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.team.eyebrow}</Eyebrow>
              <h2
                className="wis-serif mt-5 max-w-[18ch]"
                style={{ fontSize: "clamp(30px, 4.2vw, 48px)", lineHeight: 1.08, letterSpacing: "-0.012em" }}
              >
                {c.team.title}
              </h2>
            </motion.div>

            <motion.div {...rise} className="mt-10">
              <Figure slot="team" className="aspect-[2/1] w-full" rounded="rounded-[26px]" />
            </motion.div>

            <div className="mt-10 grid gap-x-12 gap-y-0 sm:grid-cols-2">
              {c.team.members.map((m, i) => (
                <motion.div
                  key={m.initials}
                  {...rise}
                  className="flex items-center gap-5 py-5"
                  style={{ borderTop: i < 2 ? "none" : `1px solid ${T.line}` }}
                >
                  <span
                    className="wis-serif flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: T.green, color: T.cream, fontSize: 18 }}
                    aria-hidden
                  >
                    {m.initials}
                  </span>
                  <span>
                    <span className="wis-sans block" style={{ fontSize: 15.5, fontWeight: 600 }}>
                      {m.name}
                    </span>
                    <span className="wis-sans mt-0.5 block" style={{ fontSize: 13.5, color: "#655C4F" }}>
                      {m.role}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>

            <p
              className="wis-mono mt-6 border-t pt-5"
              style={{ fontSize: 10.5, lineHeight: 1.6, color: T.muted, borderColor: T.line }}
            >
              {c.team.note}
            </p>
          </div>
        </section>

        {/* —————————————————————————————— promises (not reviews) ——— */}
        <section className="px-6 py-16 md:px-10 md:py-24" style={{ background: T.card }}>
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.promises.eyebrow}</Eyebrow>
              <h2
                className="wis-serif mt-5 max-w-[20ch]"
                style={{ fontSize: "clamp(28px, 3.8vw, 42px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
              >
                {c.promises.title}
              </h2>
            </motion.div>

            {/* Single stacked column, not a 2x2 grid: these read as a list of
              * commitments you go down one by one, and the checkmark is the
              * trust signal the client asked for. The mark is a plain tick in
              * a soft green disc — deliberately NOT a cherry here, because the
              * cherry is the brand mark and should stay scarce. */}
            <ul className="mt-10 flex flex-col gap-4">
              {c.promises.items.map((p, i) => (
                <motion.li
                  key={i}
                  {...rise}
                  className="flex items-start gap-5 rounded-[20px] px-7 py-7 md:items-center md:px-9"
                  style={{ background: T.bg, border: `1px solid ${T.line}` }}
                >
                  <span
                    aria-hidden
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(46,71,55,.10)" }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        stroke={T.green}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p
                    className="wis-serif"
                    style={{ fontSize: "clamp(19px, 2.1vw, 24px)", lineHeight: 1.36 }}
                  >
                    {p}
                  </p>
                </motion.li>
              ))}
            </ul>

            <p className="wis-mono mt-8" style={{ fontSize: 10.5, lineHeight: 1.6, color: T.muted }}>
              {c.promises.note}
            </p>
          </div>
        </section>

        {/* ——————————————————————————————————— fear statement ——— */}
        <section className="px-6 py-24 text-center md:px-10 md:py-32" data-wis-dark style={{ background: T.dark, color: T.cream }}>
          <motion.div {...rise} className="mx-auto max-w-[900px]">
            <CherryMark size={28} className="mx-auto" />
            <p
              className="wis-serif mt-9"
              style={{ fontSize: "clamp(28px, 4.2vw, 50px)", lineHeight: 1.2, letterSpacing: "-0.012em" }}
            >
              {c.fear.line}
            </p>
            <div className="mt-10">
              <Primary big>{c.fear.cta}</Primary>
            </div>
          </motion.div>
        </section>

        {/* ——————————————————————————————— first visit (steps) ——— */}
        {/* Placed IMMEDIATELY after the fear statement on purpose: that section
          * names the fear and then stops, so the page's answer to "why should I
          * feel safe here" was previously just a button. This is the answer —
          * the fear is of the unknown, so the fix is to remove the unknown.
          * Two columns rather than four across: the bodies are long enough that
          * a 4-up row would set ~18-character lines on a laptop. */}
        <section id="pierwsza-wizyta" className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.firstVisit.eyebrow}</Eyebrow>
              <h2
                className="wis-serif mt-5 max-w-[22ch]"
                style={{ fontSize: "clamp(28px, 3.8vw, 42px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
              >
                {c.firstVisit.title}
              </h2>
              {/* 30 min / 150 zł must stay in step with SCOPES[0].meta and
                * PRICES[0] — three places, all visible on one page. */}
              <p
                className="wis-sans mt-5 max-w-[54ch]"
                style={{ fontSize: 16, lineHeight: 1.65, color: "#5C5346" }}
              >
                {c.firstVisit.lead}
              </p>
            </motion.div>

            <ol className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
              {c.firstVisit.steps.map((step, i) => (
                <motion.li key={step.title} {...rise} className="flex gap-5">
                  <span
                    className="wis-mono shrink-0 pt-1"
                    style={{ fontSize: 12, fontWeight: 600, color: T.amber, letterSpacing: "0.08em" }}
                    aria-hidden
                  >
                    0{i + 1}
                  </span>
                  <span>
                    <span className="wis-sans block" style={{ fontSize: 16.5, fontWeight: 700 }}>
                      {step.title}
                    </span>
                    <span
                      className="wis-sans mt-2 block"
                      style={{ fontSize: 14.5, lineHeight: 1.65, color: "#655C4F" }}
                    >
                      {step.body}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ol>

            {/* The one exception to the sequence above, and the single most
              * reassuring line on the page for someone in pain right now — so
              * it gets a box rather than a footnote. Deliberately phrased as
              * what we DO, not as a promised time slot: no availability claim. */}
            <motion.div
              {...rise}
              className="mt-11 rounded-[20px] px-7 py-6 md:px-9"
              style={{ background: "rgba(46,71,55,.10)", border: `1px solid ${T.line}` }}
            >
              <p className="wis-sans" style={{ fontSize: 15.5, lineHeight: 1.6 }}>
                <strong style={{ fontWeight: 700 }}>{c.firstVisit.painTitle}</strong>{" "}
                {c.firstVisit.painBody}{" "}
                <a href={PHONE_HREF} className="wis-sans" style={{ fontWeight: 700, color: T.green }}>
                  {PHONE}
                </a>
                .
              </p>
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————————————————— faq ——— */}
        <section className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.4fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.faq.eyebrow}</Eyebrow>
              <h2 className="wis-serif mt-5" style={{ fontSize: "clamp(28px, 3.6vw, 40px)", lineHeight: 1.12 }}>
                {c.faq.titleA}
                <br />
                {c.faq.titleB}
              </h2>
              <p className="wis-sans mt-5 max-w-[22rem]" style={{ fontSize: 14.5, lineHeight: 1.68, color: "#655C4F" }}>
                {c.faq.lead}
              </p>
            </motion.div>

            <motion.div {...rise}>
              <ul>
                {c.faq.items.map((item, i) => {
                  const open = openFaq === i;
                  const panelId = `${faqBase}-p${i}`;
                  const btnId = `${faqBase}-b${i}`;
                  return (
                    <li key={item.q} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
                      <button
                        type="button"
                        id={btnId}
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(open ? -1 : i)}
                        className="flex w-full items-center justify-between gap-6 py-5 text-left"
                      >
                        <span className="wis-sans" style={{ fontSize: 16, fontWeight: 600 }}>
                          {item.q}
                        </span>
                        <span
                          aria-hidden
                          className="wis-serif shrink-0"
                          style={{
                            fontSize: 22,
                            color: T.amber,
                            transform: open ? "rotate(45deg)" : "none",
                            transition: reduced ? "none" : "transform .25s cubic-bezier(.16,1,.3,1)",
                          }}
                        >
                          +
                        </span>
                      </button>
                      <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open}>
                        <p
                          className="wis-sans pb-6"
                          style={{ fontSize: 15, lineHeight: 1.72, color: T.body, maxWidth: "42rem" }}
                        >
                          {item.a}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————————————————— pricing ——— */}
        <section id="cennik" className="px-6 py-16 md:px-10 md:py-24" style={{ background: T.card }}>
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.4fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
              <h2 className="wis-serif mt-5" style={{ fontSize: "clamp(28px, 3.6vw, 40px)", lineHeight: 1.12 }}>
                {c.pricing.titleA}
                <br />
                {c.pricing.titleB}
              </h2>
              <p className="wis-sans mt-5 max-w-[22rem]" style={{ fontSize: 14.5, lineHeight: 1.68, color: "#655C4F" }}>
                {c.pricing.lead}
              </p>
            </motion.div>

            <motion.div {...rise}>
              <dl>
                {c.pricing.rows.map(({ name, price }, i) => (
                  <div
                    key={name}
                    className="flex items-baseline justify-between gap-6 py-5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}
                  >
                    <dt className="wis-sans" style={{ fontSize: 15.5 }}>
                      {name}
                    </dt>
                    <dd className="wis-serif whitespace-nowrap" style={{ fontSize: 19 }}>
                      {price}
                    </dd>
                  </div>
                ))}
              </dl>
              <p
                className="wis-sans mt-6 border-t pt-6"
                style={{ fontSize: 13, lineHeight: 1.65, color: T.muted, borderColor: T.line }}
              >
                {c.pricing.note}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————————— closing CTA (green) ——— */}
        <section id="kontakt" className="px-6 py-20 text-center md:px-10 md:py-24" data-wis-dark style={{ background: T.greenDeep, color: T.cream }}>
          <motion.div {...rise} className="mx-auto max-w-[720px]">
            <h2 className="wis-serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.12 }}>
              {c.contact.title}
            </h2>
            <p className="wis-sans mt-4" style={{ fontSize: 15.5, lineHeight: 1.65, color: "rgba(246,239,227,.74)" }}>
              {c.contact.lead}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Primary big>{c.hero.cta}</Primary>
              <Secondary href={PHONE_HREF} onDark>
                {PHONE}
              </Secondary>
            </div>
          </motion.div>

          {/* CP4_12: everything below is new. This section used to be a headline,
            * a phone number and two buttons — no address, no hours, no way to
            * work out how to actually get here. The street sat only in the
            * footer. For a clinic that is the second question after price, so
            * it now answers it in the place people scroll to when they have
            * decided to come. Left-aligned against the centred headline on
            * purpose: this is reference material, and centred label/value pairs
            * are markedly harder to scan. */}
          <motion.div {...rise} className="mx-auto mt-14 max-w-[980px] text-left">
            <div
              className="grid gap-y-9 border-t pt-10 sm:grid-cols-3 sm:gap-x-10"
              style={{ borderColor: T.lineOnDark }}
            >
              <div>
                <h3
                  className="wis-mono"
                  style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#D9A868" }}
                >
                  {c.contact.labelAddress}
                </h3>
                <p className="wis-sans mt-3" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  {c.contact.addressA}
                  <br />
                  {c.contact.addressB}
                </p>
              </div>

              <div>
                <h3
                  className="wis-mono"
                  style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#D9A868" }}
                >
                  {c.contact.labelHours}
                </h3>
                <dl className="mt-3">
                  {c.hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between gap-4 py-[3px]">
                      <dt className="wis-sans" style={{ fontSize: 14, color: T.creamDim }}>
                        {day}
                      </dt>
                      <dd className="wis-mono" style={{ fontSize: 12.5 }}>
                        {time}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h3
                  className="wis-mono"
                  style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#D9A868" }}
                >
                  {c.contact.labelContact}
                </h3>
                <p className="wis-sans mt-3 flex flex-col gap-1.5" style={{ fontSize: 15 }}>
                  <a href={PHONE_HREF} style={{ color: T.cream, fontWeight: 600 }}>
                    {PHONE}
                  </a>
                  <a href={`mailto:${MAIL}`} style={{ color: T.creamDim }}>
                    {MAIL}
                  </a>
                </p>
              </div>
            </div>

            {/* Dojazd / parking / wejście — the three things someone actually
              * needs on the morning of the appointment, and the ones a clinic
              * site most often omits. Access is listed with them rather than
              * buried: for a wheelchair user or a parent with a pushchair it is
              * not a footnote, it is the deciding fact. */}
            <div
              className="mt-9 grid gap-y-7 border-t pt-9 sm:grid-cols-3 sm:gap-x-10"
              style={{ borderColor: T.lineOnDark }}
            >
              {c.contact.travel.map(({ label, body }) => (
                <div key={label}>
                  <h3 className="wis-sans" style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {label}
                  </h3>
                  <p
                    className="wis-sans mt-2"
                    style={{ fontSize: 13.5, lineHeight: 1.65, color: T.creamDim }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>

            {/* ul. Wiśniowa is a REAL street in Mokotów. A house number, a
              * postcode or an embedded map would send someone to a real
              * building belonging to real people who never agreed to host a
              * fictional dental practice — so the number is omitted and the
              * omission is stated rather than left looking like an oversight.
              * Same reason there is no map embed here (which would also mean
              * widening frame-src in next.config.mjs). If this layout is reused
              * for a real clinic, the number and the map go in and this note
              * comes out. */}
            <p
              className="wis-mono mt-9 border-t pt-6"
              style={{ fontSize: 10.5, lineHeight: 1.7, color: "rgba(246,239,227,.55)", borderColor: T.lineOnDark }}
            >
              {c.contact.note}
            </p>
          </motion.div>
        </section>

        {/* ————————————————————————————————————————————— footer ——— */}
        <footer className="px-6 py-14 md:px-10" data-wis-dark style={{ background: T.dark, color: T.cream }}>
          <div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Wordmark onDark />
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 12.5, fontWeight: 700 }}>
                {c.footer.practice}
              </h3>
              <p className="wis-sans mt-3" style={{ fontSize: 13.5, lineHeight: 1.7, color: T.creamDim }}>
                {c.footer.addressA}
                <br />
                {c.footer.addressB}
              </p>
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 12.5, fontWeight: 700 }}>
                {c.footer.hours}
              </h3>
              {/* Renders the `short` field of the SAME `hours` array the contact
                * block renders `day` from, so the two cannot disagree. This
                * used to be a chain of .replace() calls turning the long labels
                * into abbreviations — which silently produced the untouched
                * long form the moment the copy was translated. Abbreviations
                * are now translated data, not string surgery. */}
              <p className="wis-mono mt-3" style={{ fontSize: 11.5, lineHeight: 1.8, color: T.creamDim }}>
                {c.hours.map(({ short, time }, i) => (
                  <span key={short}>
                    {i > 0 && <br />}
                    {short} {time}
                  </span>
                ))}
              </p>
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 12.5, fontWeight: 700 }}>
                {c.footer.contact}
              </h3>
              <a href={PHONE_HREF} className="wis-sans mt-3 block" style={{ fontSize: 13.5, color: T.creamDim }}>
                {PHONE}
              </a>
              <a href={`mailto:${MAIL}`} className="wis-sans mt-1 block" style={{ fontSize: 13.5, color: T.creamDim }}>
                {MAIL}
              </a>
            </div>
          </div>

          <div
            className="mx-auto mt-12 flex max-w-[1240px] flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: T.lineOnDark }}
          >
            <p className="wis-mono" style={{ fontSize: 10, lineHeight: 1.6, color: "rgba(246,239,227,.5)" }}>
              {c.footer.note}
            </p>
            <p className="wis-mono" style={{ fontSize: 10, color: "rgba(246,239,227,.5)" }}>
              {c.footer.credit}
            </p>
          </div>
        </footer>

        {/* mobile sticky bar */}
        {showBar && !preview && (
          <div
            className="sticky bottom-0 z-20 flex gap-3 border-t px-4 py-3 lg:hidden"
            style={{ background: T.bg, borderColor: T.line }}
          >
            <Secondary href={PHONE_HREF} full>
              {c.bar.call}
            </Secondary>
            <Primary full>{c.bar.book}</Primary>
          </div>
        )}
      </div>
    </div>
    </WisNav.Provider>
  );
}
