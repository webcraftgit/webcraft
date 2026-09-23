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
import { motion, useReducedMotion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { CherryMark, Wordmark } from "./mark";
import { Figure } from "./photos";
import { useWisCopy, type Claim as CopyClaim } from "./copy";
import { MAIL, PHONE, PHONE_HREF, T, openStatus, type OpenStatus } from "./tokens";
import Booking from "./booking";

/* fonts — SELF-HOSTED, deliberately (CSP connect-src trap, see CP6-hdr-fix).
 * latin-ext is NOT optional: without it ś/ó/ż/ę/ł fall back mid-word. */
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/dm-serif-display/latin-ext-400.css";
import "@fontsource-variable/manrope/wght.css";
import DemoHeading from "@/components/showcase/DemoHeading";

/* ————————————————————————————————————————————————————————————————
 * WIŚNIOWA · stomatologia — v6, CONVERSION + ACCESSIBILITY PASS.
 *
 * v5 set the photo-led editorial structure (full-bleed hero, claim lists,
 * founder quote, ticker, contact rail, captioned gallery). v6 keeps that
 * look and fixes what stood between a visitor and an appointment:
 *   · The booking card now runs end to end (see ./booking.tsx). Its "Next"
 *     button used to do nothing.
 *   · Sections follow the order a patient's questions arrive in — what do
 *     you treat → what is it like → what happens first → what does it cost →
 *     book — and the nav lists them in that same order, with the current
 *     section marked.
 *   · A "Book a visit" button joins the header once the hero's own CTA has
 *     scrolled away, so there are never two on screen at once (the client's
 *     reason for removing it) but there is always one.
 *   · "Open now / opens at…" next to every phone number, in Warsaw time.
 *   · Reduced-motion users no longer get a blank page (see `rise`).
 *   · Contrast: text-sized amber and muted greys raised to AA; nothing
 *     meaningful under 12px; a focus ring that reads on every band.
 *
 * HONESTY RULES, UNCHANGED AND NON-NEGOTIABLE
 *   · No fake availability — booking asks for a time-of-day preference, never
 *     a slot, and the confirmation says nothing was sent.
 *   · No invented patient reviews — PROMISES are commitments, labelled so.
 *   · No stock faces under invented doctor names — team stays monogrammed.
 *   · Webcraft is named in the top strip and the footer.
 *
 * Fonts scoped to .wis-root; component contract ({ preview }) unchanged.
 * ———————————————————————————————————————————————————————————————— */

type Claim = CopyClaim;

/* Structure only — which photo slot and whether the tile is the tall one.
 * Captions are `copy.gallery[i]`, matched BY INDEX. */
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
          <p className="wis-sans" style={{ fontSize: 16, lineHeight: 1.7, color: T.body }}>
            <ClaimText claim={c} />
          </p>
        </li>
      ))}
    </ul>
  );
}

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  const color = onDark ? T.amberOnDark : T.amberText;
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className="h-px w-7" style={{ background: onDark ? T.amberOnDark : T.amber }} />
      <span
        className="wis-sans uppercase"
        style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color }}
      >
        {children}
      </span>
    </span>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3h1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** "Open now · until 20:00" — rendered after mount only, so the server and
 *  the grid preview never disagree with the client about the time. */
function OpenNow({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  const c = useWisCopy();
  const [s, setS] = useState<OpenStatus | null>(null);
  useEffect(() => {
    setS(openStatus());
    const id = window.setInterval(() => setS(openStatus()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!s) return null;
  const dot = s.open ? (onDark ? "#7BD39B" : "#2F8A55") : onDark ? "rgba(246,239,227,.5)" : "#9A9185";
  return (
    <p
      className={`wis-sans inline-flex items-center gap-2 ${className}`}
      style={{ fontSize: 14, fontWeight: 600, color: onDark ? "rgba(246,239,227,.92)" : T.body }}
    >
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: dot }} />
      {s.open ? c.status.open(s.until) : c.status.closed(s.when, s.at)}
    </p>
  );
}

/* ————————————————————————————————————————————————————————————————
 * IN-DEMO NAVIGATION
 *
 * WHY A CONTEXT AND NOT `document.getElementById`
 * The showcase mounts this component TWICE at once: once inert and scaled
 * inside the grid card, once live inside the fullscreen player. Both copies
 * carry the same ids, and `getElementById` returns the FIRST — the grid card —
 * so the live player used to scroll a container that never moves. Everything
 * below is scoped to THIS instance's root node via a ref. Do not reintroduce
 * `getElementById` here, and do not assume these ids are unique in the DOM.
 * ———————————————————————————————————————————————————————————————— */

type NavCtx = { scrollTo: (id: string) => boolean };
const WisNav = createContext<NavCtx | null>(null);

/** onClick for any anchor pointing at an in-demo `#id`. */
function useAnchorClick(href: string, after?: () => void) {
  const nav = useContext(WisNav);
  return (e: React.MouseEvent) => {
    after?.();
    if (!href.startsWith("#") || !nav) return;
    /* preventDefault ONLY once we know we can handle it ourselves — otherwise
     * an unknown target would swallow the click and do nothing at all. */
    if (nav.scrollTo(href.slice(1))) e.preventDefault();
  };
}

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/* Native smooth scroll is distance-proportional and uninterruptible in
 * Chrome. This tween is clamped regardless of distance and aborts the moment
 * the user touches the wheel or the screen. Every real jump on this layout is
 * 1500px+, so SCROLL_MAX_MS is the number that decides how it feels. */
const SCROLL_MIN_MS = 320;
const SCROLL_MAX_MS = 540;
const SCROLL_MS_PER_PX = 0.35;

/* Header height, used for the scroll landing offset, the tone probe and the
 * active-section probe. */
const HEADER_H = 72;

function Primary({
  children,
  href = "#rezerwacja",
  full = false,
  big = false,
  heroXl = false,
  small = false,
  inverse = false,
  onNavigate,
}: {
  children: React.ReactNode;
  href?: string;
  full?: boolean;
  big?: boolean;
  heroXl?: boolean;
  small?: boolean;
  /** cream pill, for use on the espresso header */
  inverse?: boolean;
  onNavigate?: () => void;
}) {
  /* heroXl is the one dial for the main hero CTA — 78px at the client's
   * "thinner" (CP4_9). `px-16` keeps it out-weighing the phone button below;
   * below ~68px tall the stack stops reading as a hierarchy. On phones the
   * padding comes in so the Polish label never touches the pill's edge. */
  const size = heroXl
    ? "min-h-[72px] px-12 text-[23px] sm:min-h-[78px] sm:px-16 sm:text-[26px]"
    : big
      ? "min-h-[56px] px-8 text-[16px]"
      : small
        ? "min-h-[44px] px-5 text-[14px]"
        : "min-h-[50px] px-7 text-[15px]";
  const onClick = useAnchorClick(href, onNavigate);
  return (
    <a
      href={href}
      onClick={onClick}
      className={`wis-sans wis-btn inline-flex items-center justify-center rounded-full ${size} ${
        full ? "w-full" : ""
      }`}
      style={
        inverse
          ? { background: T.cream, color: T.ink, fontWeight: 700 }
          : { background: T.green, color: T.cream, fontWeight: 700 }
      }
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
  phone = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  href: string;
  full?: boolean;
  onDark?: boolean;
  hero?: boolean;
  /** leading phone glyph */
  phone?: boolean;
  ariaLabel?: string;
}) {
  const onClick = useAnchorClick(href);
  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`wis-sans wis-btn inline-flex items-center justify-center gap-2.5 rounded-full border ${
        hero ? "min-h-[58px] px-9 text-[17px]" : "min-h-[50px] px-7 text-[15px]"
      } ${full ? "w-full" : ""}`}
      style={
        onDark
          ? {
              borderColor: "rgba(246,239,227,.6)",
              background: hero ? "rgba(20,14,10,.32)" : "transparent",
              backdropFilter: hero ? "blur(6px)" : undefined,
              color: T.cream,
              fontWeight: 600,
            }
          : { borderColor: T.lineStrong, background: T.card, color: T.ink, fontWeight: 600 }
      }
    >
      {phone && <PhoneIcon size={hero ? 18 : 16} />}
      {children}
    </a>
  );
}

function H2({ children, className = "", size = "lg" }: { children: React.ReactNode; className?: string; size?: "lg" | "md" }) {
  return (
    <h2
      className={`wis-serif mt-5 ${className}`}
      style={{
        fontSize: size === "lg" ? "clamp(32px, 4.2vw, 48px)" : "clamp(30px, 3.6vw, 42px)",
        lineHeight: 1.08,
        letterSpacing: "-0.012em",
      }}
    >
      {children}
    </h2>
  );
}

/* ——————————————————————————————————————————————————— the site ——— */

export default function WisniowaSite({ preview = false }: { preview?: boolean }) {
  const c = useWisCopy();
  const [locale, setLocale] = useLocale();
  const reduced = usePrefersReducedMotion();
  /* framer's hook reads matchMedia synchronously on the first client render,
   * which is what `initial` needs — see `rise`. */
  const fmReduced = useReducedMotion() ?? false;
  const still = preview || reduced;
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  /* Tone of whatever band currently sits behind the sticky header. Drives BOTH
   * the header's backdrop and its foreground. */
  const [headerTone, setHeaderTone] = useState<"light" | "dark">("dark");
  const scroller = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const tween = useRef(0);
  const faqBase = useId();
  const navIds = useMemo(() => c.nav.items.map((i) => i.id), [c.nav.items]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const onScroll = () => {
      const rootTop = el.getBoundingClientRect().top;
      const probe = rootTop + HEADER_H + 4;
      setScrolled(el.scrollTop > 80);
      setPastHero(el.scrollTop > (hero.current?.offsetHeight ?? 700) - HEADER_H * 2);

      /* Only DARK bands are tagged, so "nothing here" correctly means light. */
      let dark = false;
      el.querySelectorAll<HTMLElement>("[data-wis-dark]").forEach((band) => {
        const r = band.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) dark = true;
      });
      setHeaderTone(dark ? "dark" : "light");

      /* Active nav item: the last listed section whose top has passed a line
       * a third of the way down the viewport. */
      const line = rootTop + el.clientHeight / 3;
      let current: string | null = null;
      for (const id of navIds) {
        const s = el.querySelector<HTMLElement>(`#${id}`);
        if (s && s.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);

      /* The mobile bar duplicates the booking card's own buttons — hide it
       * while the card is on screen instead of covering it. */
      const b = el.querySelector<HTMLElement>("#rezerwacja")?.getBoundingClientRect();
      setBookingInView(!!b && b.top < rootTop + el.clientHeight && b.bottom > rootTop);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(tween.current);
    };
  }, [navIds]);

  /* Escape closes the mobile menu and hands focus back to its toggle. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // the showcase player also closes on Escape
      setMenuOpen(false);
      menuBtn.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [menuOpen]);

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

      /* Move focus so keyboard and screen-reader users land where sighted
       * users do; the native hash jump used to do this for free. */
      const land = () => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      };

      cancelAnimationFrame(tween.current);
      if (Math.abs(dist) < 2) {
        land();
        return true;
      }
      if (reduced) {
        root.scrollTop = to;
        land();
        return true;
      }

      const dur = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, Math.abs(dist) * SCROLL_MS_PER_PX));
      const t0 = performance.now();

      /* Hand control straight back if the user starts scrolling themselves. */
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
          land();
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

  /* WHY THE PROP SHAPE NEVER CHANGES. The old version returned `{}` once the
   * reduced-motion media query resolved — but that query resolves in an
   * effect, AFTER framer had already mounted every block at `initial`
   * (opacity 0). Dropping `whileInView` then left nothing to ever fade them
   * back in: reduced-motion visitors got the photo and an empty page. Now
   * `whileInView` is always passed, so something always brings content to
   * opacity 1; under reduced motion `initial={false}` means nothing starts
   * hidden at all (a jump link would otherwise land past sections that never
   * intersected). framer's own hook resolves on the first render, which is
   * the only render `initial` reads. Preview is fixed at mount, so it can
   * safely take the static path. */
  const rise = preview
    ? {}
    : {
        initial: fmReduced ? (false as const) : { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: fmReduced ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      };

  const darkHeader = headerTone === "dark" || menuOpen;

  return (
    <WisNav.Provider value={nav}>
    <div
      ref={scroller}
      id="wis-scroller"
      lang={locale}
      data-lenis-prevent
      className="wis-root relative h-full overflow-y-auto overscroll-contain"
      style={{ background: T.bg, color: T.ink }}
    >
      <style>{`
        .wis-root { font-family: "Manrope Variable", ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .wis-root .wis-serif { font-family: "DM Serif Display", Georgia, "Times New Roman", serif; font-weight: 400; }
        .wis-root .wis-sans { font-family: "Manrope Variable", ui-sans-serif, system-ui, sans-serif; }
        .wis-root .wis-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .wis-root ::selection { background: ${T.soft}; }
        .wis-root .wis-btn { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1), filter .25s; }
        @media (hover:hover) {
          .wis-root .wis-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px -14px rgba(28,20,15,.55); }
          .wis-root .wis-opt:hover { border-color: ${T.lineStrong} !important; }
        }
        .wis-root .wis-btn:active { transform: translateY(0); filter: brightness(.95); }
        .wis-root .wis-navlink { position: relative; }
        .wis-root .wis-navlink::after { content:""; position:absolute; left:0; right:100%; bottom:-6px; height:1.5px; background:currentColor; opacity:.7; transition: right .3s cubic-bezier(.16,1,.3,1); }
        .wis-root .wis-navlink[aria-current]::after { right:0; }
        @media (hover:hover) { .wis-root .wis-navlink:hover::after { right:0; } }
        .wis-root .wis-hero-type { text-shadow: 0 2px 28px rgba(20,14,10,.6), 0 1px 4px rgba(20,14,10,.4); }
        .wis-root .wis-tick { display:flex; width:max-content; animation: wis-marquee 32s linear infinite; }
        .wis-root .wis-tick:hover { animation-play-state: paused; }
        @keyframes wis-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .wis-root .wis-still .wis-tick { animation: none; }

        /* FOCUS. The old amber ring was 2.7:1 on cream — under the 3:1 a
           focus indicator needs. Green on light bands, light amber on dark
           ones, and back to green inside the white booking card. */
        .wis-root :focus-visible { outline: 2.5px solid ${T.green}; outline-offset: 3px; }
        .wis-root [data-wis-dark] :focus-visible { outline-color: ${T.amberOnDark}; }
        .wis-root [data-wis-dark] [data-wis-light] :focus-visible { outline-color: ${T.green}; }
        .wis-root label:has(input:focus-visible) { outline: 2.5px solid ${T.green}; outline-offset: 2px; }
        .wis-root h2:focus, .wis-root h3:focus, .wis-root section:focus, .wis-root [tabindex="-1"]:focus { outline: none; }
        .wis-root .wis-field { transition: border-color .2s, box-shadow .2s; }
        .wis-root .wis-field:focus { outline: none; border-color: ${T.green} !important; box-shadow: 0 0 0 3px rgba(46,71,55,.2); }
        .wis-root .wis-field::placeholder { color: #8F877B; }


        @media (prefers-reduced-motion: reduce) {
          .wis-root .wis-tick { animation: none; }
          .wis-root .wis-btn, .wis-root .wis-navlink::after, .wis-root .wis-field { transition: none; }
          .wis-root .wis-btn:hover { transform: none; }
        }
      `}</style>

      <div className={still ? "wis-still" : ""}>
        {!preview && (
          <a
            href="#rezerwacja"
            onClick={goTo("rezerwacja")}
            className="wis-sans sr-only rounded-full px-5 py-3 text-[15px] focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60]"
            style={{ background: T.cream, color: T.ink, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}
          >
            {c.nav.skip}
          </a>
        )}

        {/* demo disclaimer — the honesty register, Webcraft named outright.
          * The PL/EN control lives here, in Webcraft's own meta-layer, not in
          * the clinic header. Hidden in `preview`: the grid card is inert and
          * scaled, so a focusable control inside it would be a trap. */}
        <div
          className="wis-sans flex items-center justify-center gap-4 px-4 py-2 text-center"
          data-wis-dark
          style={{ background: "#150F0A", color: "rgba(246,239,227,.82)", fontSize: 12, lineHeight: 1.45 }}
        >
          <span>{c.meta.disclaimer}</span>
          {!preview && (
            <span role="group" aria-label={c.meta.langLabel} className="flex shrink-0 items-center gap-1">
              {(["pl", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                  className="wis-sans min-h-[28px] min-w-[36px] rounded-full px-2.5 uppercase"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    background: locale === l ? "rgba(246,239,227,.92)" : "transparent",
                    color: locale === l ? "#150F0A" : "rgba(246,239,227,.75)",
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
            /* 1400px, not xl (1280): below that the 1240px column's gutter is
             * narrower than the rail and it sat on top of section text. */
            className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-r-2xl px-2 py-4 min-[1400px]:flex"
            data-wis-dark
            style={{ background: T.green, color: T.cream }}
          >
            <a
              href={PHONE_HREF}
              aria-label={`${c.nav.callAria} ${PHONE}`}
              title={`${c.nav.callAria} ${PHONE}`}
              className="flex h-10 w-10 items-center justify-center rounded-full"
            >
              <PhoneIcon size={18} />
            </a>
            <span aria-hidden className="h-px w-4" style={{ background: T.lineOnDark }} />
            <a
              href={`mailto:${MAIL}`}
              aria-label={`${c.nav.mailAria}: ${MAIL}`}
              title={MAIL}
              className="flex h-10 w-10 items-center justify-center rounded-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="m3.6 6.5 8.4 6 8.4-6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
            <span aria-hidden className="h-px w-4" style={{ background: T.lineOnDark }} />
            <span
              className="wis-sans pb-1"
              style={{ writingMode: "vertical-rl", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.14em" }}
            >
              {c.nav.railHours}
            </span>
          </div>
        )}

        {/* ————————————————————————————————————— sticky header ——— */}
        {/* Takes its tone from the band underneath: espresso + cream over the
          * dark bands, cream + ink over the light ones, transparent over the
          * top of the hero. The mobile menu now lives INSIDE the header — it
          * used to render in the page flow at the top of the document, so
          * opening it after scrolling showed nothing at all. */}
        <header
          className="sticky top-0 z-20"
          style={{
            background: menuOpen
              ? T.dark
              : !scrolled
                ? "transparent"
                : headerTone === "dark"
                  ? "rgba(28,20,15,.94)"
                  : "rgba(244,237,225,.95)",
            backdropFilter: scrolled ? "blur(10px)" : "none",
            borderBottom: scrolled || menuOpen
              ? `1px solid ${darkHeader ? T.lineOnDark : T.line}`
              : "1px solid transparent",
            transition: reduced ? "none" : "background-color .3s, border-color .3s, color .3s",
            color: darkHeader ? T.cream : T.ink,
          }}
        >
          <div className="flex items-center justify-between gap-6 px-5 py-3.5 md:px-10">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                scroller.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
              }}
              aria-label="Stomatologia Wiśniowa"
              className="rounded-md"
            >
              <Wordmark onDark={darkHeader} />
            </a>

            <nav className="hidden items-center gap-7 lg:flex" aria-label={c.nav.main}>
              {c.nav.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={goTo(item.id)}
                  aria-current={active === item.id ? "true" : undefined}
                  className="wis-sans wis-navlink text-[15px]"
                  style={{ fontWeight: active === item.id ? 700 : 500 }}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-5 lg:flex">
              <a
                href={PHONE_HREF}
                aria-label={`${c.nav.callAria} ${PHONE}`}
                className="wis-sans inline-flex items-center gap-2 text-[15px]"
                style={{ fontWeight: 700 }}
              >
                <PhoneIcon />
                {PHONE}
              </a>
              {/* Appears only once the hero's own CTA has scrolled away — the
                * client removed a permanent header CTA because two identical
                * buttons on one screen split the click. This keeps that rule
                * and still leaves a booking button on every screen after. */}
              {pastHero && !preview && (
                <Primary small inverse={headerTone === "dark"}>
                  {c.nav.book}
                </Primary>
              )}
            </div>

            <div className="flex items-center gap-1 lg:hidden">
              <a
                href={PHONE_HREF}
                aria-label={`${c.nav.callAria} ${PHONE}`}
                className="flex h-11 w-11 items-center justify-center rounded-full"
              >
                <PhoneIcon size={20} />
              </a>
              <button
                ref={menuBtn}
                type="button"
                aria-label={menuOpen ? c.nav.close : c.nav.open}
                aria-expanded={menuOpen}
                aria-controls="wis-mobile-nav"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-full"
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
            </div>
          </div>

          {menuOpen && (
            <nav
              id="wis-mobile-nav"
              aria-label={c.nav.mobile}
              data-wis-dark
              className="absolute inset-x-0 top-full max-h-[calc(100vh-140px)] overflow-y-auto border-b px-5 pb-6 pt-1 lg:hidden"
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
                      aria-current={active === item.id ? "true" : undefined}
                      className="wis-sans flex min-h-[52px] items-center text-[17px]"
                      style={{ color: T.cream, fontWeight: active === item.id ? 700 : 500 }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3">
                <Primary full big inverse onNavigate={() => setMenuOpen(false)}>
                  {c.hero.cta}
                </Primary>
                <Secondary href={PHONE_HREF} full onDark phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
                  {PHONE}
                </Secondary>
                <OpenNow onDark className="justify-center" />
              </div>
            </nav>
          )}
        </header>

        <main>
        {/* ——————————————————————————————————— full-bleed photo hero ——— */}
        <section ref={hero} className="relative" data-wis-dark style={{ marginTop: -73 }}>
          <Figure
            slot="hero"
            priority
            scrim
            rounded="rounded-none"
            className="h-[88vh] min-h-[640px] w-full"
          />

          <div className="absolute inset-0 flex items-center justify-center pt-[73px]">
            <div className="mx-auto w-full max-w-[1240px] px-5 text-center md:px-10">
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
                  style={{ fontSize: "clamp(17px, 1.5vw, 19px)", lineHeight: 1.6, color: "rgba(246,239,227,.95)", fontWeight: 500 }}
                >
                  {c.hero.lead}
                </p>

                {/* Primary scaled up and standing alone; the phone UNDER it.
                  * Stacking is what makes the size difference read as a
                  * hierarchy instead of two mismatched buttons. */}
                <div className="mt-10 flex w-full flex-col items-center gap-4">
                  <Primary heroXl>{c.hero.cta}</Primary>
                  <Secondary href={PHONE_HREF} onDark hero phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
                    {PHONE}
                  </Secondary>
                  <OpenNow onDark className="mt-1" />
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
                      style={{ fontSize: 12, letterSpacing: "0.2em", fontWeight: 600 }}
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
          <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <motion.div {...rise} className="lg:sticky lg:top-28">
              <Figure slot="reception" className="aspect-[4/5] w-full" rounded="rounded-[26px]" />
            </motion.div>

            <motion.div {...rise}>
              <Eyebrow>{c.offer.eyebrow}</Eyebrow>
              <H2>
                {c.offer.titleA}
                <br />
                {c.offer.titleB}
              </H2>
              <ClaimList items={c.offer.claims} />
              <div className="mt-4 flex flex-wrap gap-3">
                <Primary>{c.hero.cta}</Primary>
                <Secondary href="#cennik">{c.offer.cta}</Secondary>
              </div>
            </motion.div>
          </div>
        </section>

        {/* —————————————————————————————— founder quote (dark band) ——— */}
        <section className="px-5 py-4 md:px-10">
          <motion.figure
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
                style={{ fontSize: "clamp(22px, 2.5vw, 31px)", lineHeight: 1.32, letterSpacing: "-0.005em" }}
              >
                {c.quote.text}
              </blockquote>
              {/* ATTRIBUTION stays in the abbreviated form on purpose (CP4_8/9):
                * this is the one name on the page beside a real face. If this
                * layout is reused for a real clinic, either the name becomes
                * real or the portrait goes. */}
              <figcaption className="mt-8">
                <p className="wis-sans" style={{ fontSize: 15, fontWeight: 700 }}>
                  {c.quote.name}
                </p>
                <p className="wis-sans mt-0.5" style={{ fontSize: 14, color: T.creamDim }}>
                  {c.quote.role}
                </p>
              </figcaption>
            </div>
          </motion.figure>
        </section>

        {/* ————————————————————————————————— o nas: claims + photo ——— */}
        <section id="gabinet" className="px-0 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.about.eyebrow}</Eyebrow>
              <H2>
                {c.about.titleA}
                <br />
                {c.about.titleB}
              </H2>
              <ClaimList items={c.about.claims} />
            </motion.div>

            <motion.div {...rise} className="lg:sticky lg:top-28">
              <Figure slot="detail" className="aspect-[4/5] w-full" rounded="rounded-[26px]" />
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————— captioned gallery strip ——— */}
        <section className="px-5 pb-16 md:px-10 md:pb-24">
          <div className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-3 md:gap-6">
            {GALLERY.map((g, i) => (
              <motion.figure key={g.slot} {...rise}>
                <Figure
                  slot={g.slot}
                  rounded="rounded-[22px]"
                  className={g.tall ? "aspect-[3/4] w-full" : "aspect-[4/3] w-full md:mt-10"}
                />
                <figcaption
                  className="wis-sans mt-4"
                  style={{ fontSize: 14, lineHeight: 1.65, color: T.body }}
                >
                  {c.gallery[i]}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>

        {/* ——————————————————————————————————— fear statement ——— */}
        <section className="px-5 py-24 text-center md:px-10 md:py-32" data-wis-dark style={{ background: T.dark, color: T.cream }}>
          <motion.div {...rise} className="mx-auto max-w-[900px]">
            <CherryMark size={28} className="mx-auto" />
            <p
              className="wis-serif mt-9"
              style={{ fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.2, letterSpacing: "-0.012em" }}
            >
              {c.fear.line}
            </p>
            <div className="mt-10">
              <Primary big inverse>
                {c.fear.cta}
              </Primary>
            </div>
          </motion.div>
        </section>

        {/* ——————————————————————————————— first visit (steps) ——— */}
        {/* IMMEDIATELY after the fear statement on purpose: that band names
          * the fear, this removes the unknown behind it. Two columns — the
          * bodies are long enough that 4-up would set ~18-character lines. */}
        <section id="pierwsza-wizyta" className="px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.firstVisit.eyebrow}</Eyebrow>
              <H2 size="md" className="max-w-[22ch]">
                {c.firstVisit.title}
              </H2>
              {/* 30 min / 150 zł must stay in step with the booking scopes and
                * the first pricing row — three places, all on one page. */}
              <p
                className="wis-sans mt-5 max-w-[54ch]"
                style={{ fontSize: 17, lineHeight: 1.65, color: T.body }}
              >
                {c.firstVisit.lead}
              </p>
            </motion.div>

            <ol className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
              {c.firstVisit.steps.map((step, i) => (
                <motion.li key={step.title} {...rise} className="flex gap-5">
                  <span
                    className="wis-serif flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ fontSize: 18, color: T.green, background: "rgba(46,71,55,.09)" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="wis-sans block" style={{ fontSize: 17, fontWeight: 700 }}>
                      {step.title}
                    </span>
                    <span
                      className="wis-sans mt-2 block"
                      style={{ fontSize: 15, lineHeight: 1.65, color: T.body }}
                    >
                      {step.body}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ol>

            {/* The one exception to the sequence above, and the single most
              * reassuring line on the page for someone in pain right now — so
              * it gets its own card with a real call button, not a number
              * buried at the end of a sentence. Phrased as what we DO, not as
              * a promised slot: no availability claim. */}
            <motion.div
              {...rise}
              className="mt-12 flex flex-col gap-5 rounded-[20px] px-7 py-7 md:flex-row md:items-center md:justify-between md:px-9"
              style={{ background: T.card, border: `1px solid ${T.line}`, boxShadow: `inset 4px 0 0 ${T.cherry}` }}
            >
              <p className="wis-sans max-w-[62ch]" style={{ fontSize: 16, lineHeight: 1.6, color: T.body }}>
                <strong className="block" style={{ fontWeight: 700, color: T.ink, fontSize: 17 }}>
                  {c.firstVisit.painTitle}
                </strong>
                <span className="mt-1 block">{c.firstVisit.painBody}</span>
              </p>
              <Secondary href={PHONE_HREF} phone ariaLabel={`${c.firstVisit.painCta} ${PHONE}`}>
                {c.firstVisit.painCta}: {PHONE}
              </Secondary>
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————————————————— pricing ——— */}
        <section id="cennik" className="px-5 py-16 md:px-10 md:py-24" style={{ background: T.card }}>
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.4fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
              <H2 size="md">
                {c.pricing.titleA}
                <br />
                {c.pricing.titleB}
              </H2>
              <p className="wis-sans mt-5 max-w-[24rem]" style={{ fontSize: 15.5, lineHeight: 1.68, color: T.body }}>
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
                    <dt className="wis-sans" style={{ fontSize: 16 }}>
                      {name}
                    </dt>
                    <dd className="wis-serif whitespace-nowrap" style={{ fontSize: 21 }}>
                      {price}
                    </dd>
                  </div>
                ))}
              </dl>
              <div
                className="mt-4 flex flex-col gap-5 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: T.line }}
              >
                <p className="wis-sans" style={{ fontSize: 14, lineHeight: 1.65, color: T.muted }}>
                  {c.pricing.note}
                </p>
                <Primary>{c.pricing.cta}</Primary>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ————————————————————————————— booking (green) ——— */}
        <section
          id="rezerwacja"
          className="px-5 py-16 md:px-10 md:py-24"
          data-wis-dark
          style={{ background: T.green, color: T.cream }}
        >
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.35fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow onDark>{c.booking.eyebrow}</Eyebrow>
              <H2 size="md">
                {c.booking.titleA}
                <br />
                {c.booking.titleB}
              </H2>
              <p
                className="wis-sans mt-5 max-w-[26rem]"
                style={{ fontSize: 16, lineHeight: 1.68, color: "rgba(246,239,227,.86)" }}
              >
                {c.booking.lead}
              </p>
              <div className="mt-7 flex flex-col items-start gap-3">
                <span className="wis-sans" style={{ fontSize: 14, color: "rgba(246,239,227,.86)" }}>
                  {c.booking.phone}
                </span>
                <Secondary href={PHONE_HREF} onDark phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
                  {PHONE}
                </Secondary>
                <OpenNow onDark />
              </div>
            </motion.div>

            <motion.div
              {...rise}
              data-wis-light
              className="rounded-[24px] p-6 md:p-8"
              style={{ background: T.card, color: T.ink, boxShadow: "0 34px 64px -34px rgba(0,0,0,.5)" }}
            >
              <Booking reduced={reduced} />
            </motion.div>
          </div>
        </section>

        {/* —————————————————————————————————— team: wide photo + list ——— */}
        <section id="zespol" className="px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.team.eyebrow}</Eyebrow>
              <H2 className="max-w-[18ch]">{c.team.title}</H2>
            </motion.div>

            <motion.div {...rise} className="mt-10">
              <Figure slot="team" className="aspect-[4/3] w-full sm:aspect-[2/1]" rounded="rounded-[26px]" />
            </motion.div>

            <ul className="mt-10 grid gap-x-12 gap-y-0 sm:grid-cols-2">
              {c.team.members.map((m, i) => (
                <motion.li
                  key={m.initials}
                  {...rise}
                  /* one column: rule between every item; two columns: none
                   * above the first row */
                  className={`flex items-center gap-5 py-5 ${i === 0 ? "" : "border-t"} ${i === 1 ? "sm:border-t-0" : ""}`}
                  style={{ borderColor: T.line }}
                >
                  <span
                    className="wis-serif flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: T.green, color: T.cream, fontSize: 18 }}
                    aria-hidden
                  >
                    {m.initials}
                  </span>
                  <span>
                    <span className="wis-sans block" style={{ fontSize: 16, fontWeight: 700 }}>
                      {m.name}
                    </span>
                    <span className="wis-sans mt-0.5 block" style={{ fontSize: 14, color: T.body }}>
                      {m.role}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <p
              className="wis-sans mt-6 border-t pt-5"
              style={{ fontSize: 13, lineHeight: 1.6, color: T.muted, borderColor: T.line }}
            >
              {c.team.note}
            </p>
          </div>
        </section>

        {/* —————————————————————————————— promises (not reviews) ——— */}
        <section className="px-5 py-16 md:px-10 md:py-24" style={{ background: T.card }}>
          <div className="mx-auto max-w-[1240px]">
            <motion.div {...rise}>
              <Eyebrow>{c.promises.eyebrow}</Eyebrow>
              <H2 size="md" className="max-w-[20ch]">
                {c.promises.title}
              </H2>
            </motion.div>

            {/* A 2×2 on wide screens: the four commitments are short enough to
              * scan side by side, and the single stacked column was a long
              * run of identical boxes. The tick is deliberately NOT a cherry —
              * the cherry is the brand mark and stays scarce. */}
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {c.promises.items.map((p, i) => (
                <motion.li
                  key={i}
                  {...rise}
                  className="flex items-start gap-5 rounded-[20px] px-7 py-7"
                  style={{ background: T.bg, border: `1px solid ${T.line}` }}
                >
                  <span
                    aria-hidden
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: T.green }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        stroke={T.cream}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="wis-serif" style={{ fontSize: "clamp(20px, 1.9vw, 23px)", lineHeight: 1.36 }}>
                    {p}
                  </p>
                </motion.li>
              ))}
            </ul>

            <p className="wis-sans mt-8" style={{ fontSize: 13, lineHeight: 1.6, color: T.muted }}>
              {c.promises.note}
            </p>
          </div>
        </section>

        {/* ————————————————————————————————————————— faq ——— */}
        <section className="px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.4fr)] lg:gap-16">
            <motion.div {...rise}>
              <Eyebrow>{c.faq.eyebrow}</Eyebrow>
              <H2 size="md">
                {c.faq.titleA}
                <br />
                {c.faq.titleB}
              </H2>
              <p className="wis-sans mt-5 max-w-[22rem]" style={{ fontSize: 15.5, lineHeight: 1.68, color: T.body }}>
                {c.faq.lead}
              </p>
              <div className="mt-6">
                <Secondary href={PHONE_HREF} phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
                  {PHONE}
                </Secondary>
              </div>
            </motion.div>

            <motion.div {...rise}>
              <ul>
                {c.faq.items.map((item, i) => {
                  const open = openFaq === i;
                  const panelId = `${faqBase}-p${i}`;
                  const btnId = `${faqBase}-b${i}`;
                  return (
                    <li key={item.q} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
                      <h3>
                        <button
                          type="button"
                          id={btnId}
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => setOpenFaq(open ? -1 : i)}
                          className="flex min-h-[64px] w-full items-center justify-between gap-6 py-4 text-left"
                        >
                          <span className="wis-sans" style={{ fontSize: 17, fontWeight: 600 }}>
                            {item.q}
                          </span>
                          <span
                            aria-hidden
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{
                              border: `1.5px solid ${open ? T.green : T.lineStrong}`,
                              background: open ? T.green : "transparent",
                              color: open ? T.cream : T.ink,
                              transition: reduced ? "none" : "background-color .2s, border-color .2s",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              style={{
                                transform: open ? "rotate(45deg)" : "none",
                                transition: reduced ? "none" : "transform .25s cubic-bezier(.16,1,.3,1)",
                              }}
                            >
                              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          </span>
                        </button>
                      </h3>
                      <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open}>
                        <p
                          className="wis-sans pb-6"
                          style={{ fontSize: 16, lineHeight: 1.72, color: T.body, maxWidth: "42rem" }}
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

        {/* ————————————————————————————————— closing CTA (green) ——— */}
        <section id="kontakt" className="px-5 py-20 text-center md:px-10 md:py-24" data-wis-dark style={{ background: T.greenDeep, color: T.cream }}>
          <motion.div {...rise} className="mx-auto max-w-[720px]">
            <h2 className="wis-serif" style={{ fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.12 }}>
              {c.contact.title}
            </h2>
            <p className="wis-sans mt-4" style={{ fontSize: 16.5, lineHeight: 1.65, color: "rgba(246,239,227,.86)" }}>
              {c.contact.lead}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Primary big inverse>
                {c.hero.cta}
              </Primary>
              <Secondary href={PHONE_HREF} onDark phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
                {PHONE}
              </Secondary>
            </div>
            <div className="mt-5">
              <OpenNow onDark />
            </div>
          </motion.div>

          {/* Address, hours, how to get here. Left-aligned against the
            * centred headline on purpose: this is reference material, and
            * centred label/value pairs are markedly harder to scan. */}
          <motion.div {...rise} className="mx-auto mt-14 max-w-[980px] text-left">
            <div
              className="grid gap-y-9 border-t pt-10 sm:grid-cols-3 sm:gap-x-10"
              style={{ borderColor: T.lineOnDark }}
            >
              <div>
                <h3
                  className="wis-sans"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amberOnDark }}
                >
                  {c.contact.labelAddress}
                </h3>
                <p className="wis-sans mt-3" style={{ fontSize: 16, lineHeight: 1.7 }}>
                  {c.contact.addressA}
                  <br />
                  {c.contact.addressB}
                </p>
              </div>

              <div>
                <h3
                  className="wis-sans"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amberOnDark }}
                >
                  {c.contact.labelHours}
                </h3>
                <dl className="mt-3">
                  {c.hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between gap-4 py-[3px]">
                      <dt className="wis-sans" style={{ fontSize: 15, color: T.creamDim }}>
                        {day}
                      </dt>
                      <dd className="wis-sans tabular-nums" style={{ fontSize: 15, fontWeight: 600 }}>
                        {time}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h3
                  className="wis-sans"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amberOnDark }}
                >
                  {c.contact.labelContact}
                </h3>
                <p className="wis-sans mt-3 flex flex-col gap-1.5" style={{ fontSize: 16 }}>
                  <a href={PHONE_HREF} className="underline-offset-4 hover:underline" style={{ color: T.cream, fontWeight: 700 }}>
                    {PHONE}
                  </a>
                  <a href={`mailto:${MAIL}`} className="break-all underline underline-offset-4" style={{ color: T.creamDim }}>
                    {MAIL}
                  </a>
                </p>
              </div>
            </div>

            {/* Dojazd / parking / wejście — the three things someone needs on
              * the morning of the appointment. Access is listed, not buried:
              * for a wheelchair user it is the deciding fact. */}
            <div
              className="mt-9 grid gap-y-7 border-t pt-9 sm:grid-cols-3 sm:gap-x-10"
              style={{ borderColor: T.lineOnDark }}
            >
              {c.contact.travel.map(({ label, body }) => (
                <div key={label}>
                  <h3 className="wis-sans" style={{ fontSize: 15, fontWeight: 700 }}>
                    {label}
                  </h3>
                  <p className="wis-sans mt-2" style={{ fontSize: 15, lineHeight: 1.65, color: T.creamDim }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>

            {/* ul. Wiśniowa is a REAL street in Mokotów, so no house number,
              * postcode or map: those would send someone to a real building
              * whose owners never agreed to host a fictional practice. If this
              * layout is reused for a real clinic, the number and map go in. */}
            <p
              className="wis-sans mt-9 border-t pt-6"
              style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(246,239,227,.66)", borderColor: T.lineOnDark }}
            >
              {c.contact.note}
            </p>
          </motion.div>
        </section>
        </main>

        {/* ————————————————————————————————————————————— footer ——— */}
        <footer className="px-5 py-14 md:px-10" data-wis-dark style={{ background: T.dark, color: T.cream }}>
          <div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Wordmark onDark />
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 14, fontWeight: 700 }}>
                {c.footer.practice}
              </h3>
              <p className="wis-sans mt-3" style={{ fontSize: 14.5, lineHeight: 1.7, color: T.creamDim }}>
                {c.footer.addressA}
                <br />
                {c.footer.addressB}
              </p>
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 14, fontWeight: 700 }}>
                {c.footer.hours}
              </h3>
              {/* The `short` field of the SAME `hours` array the contact block
                * renders `day` from, so the two cannot disagree. */}
              <p className="wis-sans mt-3 tabular-nums" style={{ fontSize: 14.5, lineHeight: 1.8, color: T.creamDim }}>
                {c.hours.map(({ short, time }, i) => (
                  <span key={short}>
                    {i > 0 && <br />}
                    {short} {time}
                  </span>
                ))}
              </p>
            </div>

            <div>
              <h3 className="wis-sans" style={{ fontSize: 14, fontWeight: 700 }}>
                {c.footer.contact}
              </h3>
              <a href={PHONE_HREF} className="wis-sans mt-3 block" style={{ fontSize: 14.5, color: T.cream, fontWeight: 600 }}>
                {PHONE}
              </a>
              <a href={`mailto:${MAIL}`} className="wis-sans mt-1 block break-all" style={{ fontSize: 14.5, color: T.creamDim }}>
                {MAIL}
              </a>
            </div>
          </div>

          <div
            className="mx-auto mt-12 flex max-w-[1240px] flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: T.lineOnDark }}
          >
            <p className="wis-sans" style={{ fontSize: 12.5, lineHeight: 1.6, color: "rgba(246,239,227,.64)" }}>
              {c.footer.note}
            </p>
            <p className="wis-sans" style={{ fontSize: 12.5, color: "rgba(246,239,227,.64)" }}>
              {c.footer.credit}
            </p>
          </div>
        </footer>

        {/* mobile sticky bar — after the hero, and out of the way while the
          * booking card (which has its own buttons) is on screen */}
        {pastHero && !bookingInView && !menuOpen && !preview && (
          <div
            className="sticky bottom-0 z-20 flex gap-3 border-t px-4 pt-3 lg:hidden"
            style={{
              background: "rgba(244,237,225,.97)",
              borderColor: T.line,
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              boxShadow: "0 -10px 30px -18px rgba(28,20,15,.35)",
            }}
          >
            <Secondary href={PHONE_HREF} full phone ariaLabel={`${c.nav.callAria} ${PHONE}`}>
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
