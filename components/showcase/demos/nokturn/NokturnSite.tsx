"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Easing,
  type MotionValue,
  type Transition,
} from "framer-motion";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/* Self-hosted, so `font-src 'self'` in next.config.mjs covers them with no CSP
   edit. Imported HERE rather than in app/layout.tsx on purpose: this component
   is dynamically imported by the showcase gallery, so Next puts these in the
   demo's own CSS chunk and `/` only pays for them once the demo mounts.
   `wght.css` carries every subset as separate @font-face rules with
   unicode-range, so the browser fetches latin + latin-ext and skips the
   cyrillic/greek/math files unless those characters actually appear. */
import "@fontsource-variable/bodoni-moda/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource/unifrakturmaguntia/latin-400.css";
import "./fonts.css";
import "./hero.css";

import {
  BRAND,
  ACTIVE_CATEGORIES,
  FREE_SHIPPING_AT,
  PRODUCTS,
  PROMO,
  SHOT_SIZE,
  SIZE_CHART,
  SIZES,
  cwTotal,
  type Category,
  type Colorway,
  type Product,
  type Shot,
  type Size,
} from "./data";
import DemoHeading from "@/components/showcase/DemoHeading";
import { useNokturnCopy } from "./copy";

/* ————————————————————————————————————————————————————————————————
 * NOKTURN — sklep odzieżowy. Concept site #4 (replaces Żelazna).
 *
 * ART DIRECTION, on purpose:
 *  - CHAOTIC BRAND, DISCIPLINED INTERFACE. The garment artwork is meant to
 *    be extreme; the store around it is a quiet, gallery-like grid. If the
 *    navigation, sizes, stock and cart also screamed, nothing would have
 *    hierarchy and the "we understand UX" argument would collapse. The
 *    contrast IS the demo.
 *  - OXBLOOD, NOT VERMILION. Near-black + a bright red accent is the single
 *    most common generated dark aesthetic on the internet right now. #7E0F16
 *    reads dried and liturgical instead of "error state". Bright #D9535E is
 *    used ONLY for text on dark, where oxblood would fail contrast.
 *  - RED IS A SIGNAL, NOT A SECOND PRIMARY: sale tags, low stock, selected
 *    states, the free-shipping bar. Never a surface, never body text.
 *
 * TYPOGRAPHY — DECIDED (CP4_24). Three faces, each with one job.
 *  Previously DISPLAY and UI were assigned the identical Inter string, i.e.
 *  there was no display face at all and every gothic signal in the store was
 *  being carried by the garment photography alone.
 *
 *   UnifrakturMaguntia  the wordmark, and nothing else.
 *   Bodoni Moda         headings, product names, prices.
 *   Inter               interface text, body copy.
 *   JetBrains Mono      genuinely tabular data only.
 *
 *  WHY BLACKLETTER IS QUARANTINED TO THE WORDMARK. The store's copy is Polish,
 *  and most blackletter faces have no glyphs for ą ć ę ł ń ś ź ż — a display
 *  face that breaks on `ł` cannot set "Materiał i krój". "NOKTURN" contains no
 *  Polish diacritics, so it is the one string that can safely use one. It also
 *  matches the brand mark already screen-printed on the back of the hoodies,
 *  which is blackletter.
 *
 *  Bodoni carries the headings instead: high-contrast, engraved, liturgical
 *  rather than costume-gothic, and its latin + latin-ext subsets cover Polish
 *  completely. All four faces are npm packages served from our own origin, so
 *  none of this touches CSP, and none of it is Clash Display — Webcraft's own
 *  face, which would make the client's store look like the agency.
 *
 *  MONO IS RATIONED. It used to set the nav, the footer headings, the
 *  accordion bodies and most buttons; a monospace face doing all the small
 *  text is one of the most reliable tells of a generated dark UI, and the old
 *  stack was system-only, so the store changed typeface between macOS and
 *  Windows. It is now self-hosted and reserved for things that are actually
 *  tabular: prices, sizes, stock counts, the spec and totals tables.
 *
 * ZERO IMAGES SHIP WITH THIS FILE. Every slot renders a registration frame
 * naming the file it wants and the pixel size it should be exported at.
 * Drop files into public/demo/nokturn/ and they take over with no code edit.
 * This is also why the demo can run as a LIVE preview card on the home page
 * — the hero is type-only, so `/` pays nothing for a catalogue it can't see.
 *
 * LAYOUT CONSTRAINT, LEARNED FROM THE PLAYER: this component is rendered
 * inside a transform-scaled virtual viewport in the showcase card. `fixed`
 * would escape the card and cover the real page, and 100vh/100vw would
 * measure the browser rather than the frame. So: the root is a relative,
 * overflow-hidden box; the page scrolls in an inner div; the cart drawer is
 * an ABSOLUTE sibling of that div. Never reach for `fixed` in here.
 *
 * Copy is Polish. Fictional brand — the footer says so plainly, same rule as
 * every other concept site: never imply a real client or a real testimonial.
 * ———————————————————————————————————————————————————————————————— */

const T = {
  /* Pure black since CP4_27 — the hero is the logo on nothing, and the page
     continues that black rather than seaming into a near-black. */
  void: "#000000",
  pitch: "#050506",
  well: "#111114",
  /* Image tiles ONLY. The catalogue is black garments exported on transparency,
     and on `well` (#111114) their shadowed folds go DARKER than the tile — the
     shoulders and outer sleeves lose their silhouette and the garment reads as
     a floating print panel. Measured: median garment luminance 24 vs a tile of
     18. This is the lightest step that restores the edge without the tile
     reading as grey. One const to retune if the shoot's lighting changes.

     WARMED from #26262C (CP4_24): the old value was blue-grey, which made the
     tile the only cold surface on a page whose other two colours — oxblood and
     bone — are both warm. Same luminance, so the silhouette measurement above
     still holds; it just stops fighting the palette. */
  tile: "#2A2724",
  bone: "#E6E1D6",
  ash: "#8A867E",
  oxblood: "#7E0F16",
  signal: "#D9535E",
  rule: "rgba(230,225,214,0.13)",
  ruleSoft: "rgba(230,225,214,0.07)",
};

/** The wordmark, and nothing else — see the note above on Polish diacritics.
 *  Metal Macabre is the brand's chosen face; it is not redistributable through
 *  npm, so fonts.css declares it against a drop-in path and the stack falls
 *  through to UnifrakturMaguntia until the file is in public/fonts/.
 *  See public/fonts/README.txt. */
const WORDMARK =
  '"Metal Macabre", "UnifrakturMaguntia", "Bodoni Moda Variable", Georgia, serif';
const DISPLAY = '"Bodoni Moda Variable", "Times New Roman", Times, serif';
const UI = '"Inter Variable", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace';

/* Film grain. One inert layer over the whole store, which buys more atmosphere
   per byte than any amount of added ornament — and unlike ornament it cannot
   compete with the garment photography for attention. Kept under 6%: above
   that it starts eating the fine hand-drawn linework in the prints. */
/* CP4_29: monochrome and fully opaque. The old tile was raw feTurbulence —
   four independent noise channels, so it speckled in colour and its alpha was
   noise too. Grey noise with alpha 1 gives a predictable lift under `screen`. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0' intercept='1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const DIR = "/demo/nokturn";
/* Probe order matters: every miss is a real 404 on the wire. WEBP IS FIRST
   because the delivered catalogue is entirely WebP — with jpg leading, each
   image cost two wasted round-trips and the grid fired 16 x 404 per load. */
const EXTS = ["webp", "jpg", "jpeg", "png"] as const;

/* ———————————————————— cart ———————————————————— */

type Line = {
  key: string;
  productId: string;
  colorwayId: string;
  size: Size;
  qty: number;
};

type CartAction =
  | { type: "add"; productId: string; colorwayId: string; size: Size }
  | { type: "qty"; key: string; delta: number }
  | { type: "remove"; key: string };

function cartReducer(state: Line[], a: CartAction): Line[] {
  switch (a.type) {
    case "add": {
      const key = `${a.productId}:${a.colorwayId}:${a.size}`;
      const hit = state.find((l) => l.key === key);
      /* Cap at what's actually on the shelf — a store that lets you add 40 of
         a garment with 2 in stock is the tell that nothing behind it is real. */
      const max = stockOf(a.productId, a.colorwayId, a.size);
      if (hit) {
        return state.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, max) } : l));
      }
      return [...state, { key, productId: a.productId, colorwayId: a.colorwayId, size: a.size, qty: 1 }];
    }
    case "qty":
      return state
        .map((l) => {
          if (l.key !== a.key) return l;
          const max = stockOf(l.productId, l.colorwayId, l.size);
          return { ...l, qty: Math.max(0, Math.min(l.qty + a.delta, max)) };
        })
        .filter((l) => l.qty > 0);
    case "remove":
      return state.filter((l) => l.key !== a.key);
  }
}

const productOf = (id: string) => PRODUCTS.find((p) => p.id === id)!;
const colorwayOf = (pid: string, cid: string) =>
  productOf(pid).colorways.find((c) => c.id === cid)!;
const stockOf = (pid: string, cid: string, s: Size) => colorwayOf(pid, cid).stock[s] ?? 0;

/* ———————————————————— image slot ————————————————————
 * Local-first with extension probing, exactly like wisniowa/photos.tsx —
 * except there is no stock-photo fallback tier here, because no free library
 * contains "washed black oversize tee, occult back print". When the file is
 * missing the frame says which file it wanted and how big to export it.
 * That is the honest empty state: it tells you how to fix it.
 */
function Frame({
  productId,
  shot,
  ratio = "4 / 5",
  priority = false,
  className = "",
  onResolved,
}: {
  productId: string;
  shot: Shot;
  ratio?: string;
  priority?: boolean;
  className?: string;
  /** Fires true once a file loads, false once every extension has 404'd.
   *  CardImage needs this: fading a photo into an empty registration frame
   *  reads as broken, so a missing back shot must disable the swap rather
   *  than reveal the placeholder. */
  onResolved?: (ok: boolean) => void;
}) {
  const c = useNokturnCopy();
  const base = `${DIR}/${productId}-${shot}`;
  const urls = EXTS.map((e) => `${base}.${e}`);

  /* Probing state is keyed to the slot. ProductPage swaps `shot` on ONE
     mounted Frame, so without this reset a shot that exhausted its four
     extensions would leave the next shot stuck on the placeholder — the
     gallery would go permanently empty after visiting a missing thumbnail. */
  const [probe, setProbe] = useState({ base, attempt: 0 });
  if (probe.base !== base) setProbe({ base, attempt: 0 });
  const attempt = probe.base === base ? probe.attempt : 0;
  const exhausted = attempt >= urls.length;

  if (!exhausted) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio: ratio, background: T.tile }}
      >
        <img
          key={urls[attempt]}
          src={urls[attempt]}
          alt={c.frame.alt(productOf(productId).name, c.shots[shot])}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => onResolved?.(true)}
          onError={() => {
            const next = attempt + 1;
            setProbe({ base, attempt: next });
            if (next >= urls.length) onResolved?.(false);
          }}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={c.frame.missing(c.shots[shot])}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: ratio, background: T.tile }}
    >
      {/* centre axis — the reference compositions are all axially symmetrical,
          so the frame previews the axis the artwork will be built around */}
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px" style={{ background: T.ruleSoft }} />
      {/* registration corners */}
      {[
        "left-3 top-3 border-l border-t",
        "right-3 top-3 border-r border-t",
        "left-3 bottom-3 border-l border-b",
        "right-3 bottom-3 border-r border-b",
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute h-3 w-3 ${pos}`}
          style={{ borderColor: "rgba(230,225,214,0.22)" }}
        />
      ))}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
        <span
          className="text-[13px] uppercase tracking-[0.22em]"
          style={{ fontFamily: MONO, color: "rgba(230,225,214,0.42)" }}
        >
          {c.shots[shot]}
        </span>
        <span className="text-[11px]" style={{ fontFamily: MONO, color: "rgba(230,225,214,0.22)" }}>
          {productId}-{shot}.jpg · {SHOT_SIZE[shot]}
        </span>
      </span>
    </div>
  );
}

/* ———————————————————— grid card image ————————————————————
 * Front shot, with the BACK shot cross-faded in on hover. This is the standard
 * apparel-grid move and it earns its place here specifically: this label puts
 * its artwork on the back of the garment ("nadruk na całych plecach"), so the
 * front thumbnail is the least interesting view of almost every product. The
 * hover is how the grid sells the thing the grid can't show.
 *
 * Four decisions worth keeping:
 *  - IT DOES NOT MOUNT THE BACK IMAGE IN `preview`. The home-page card is
 *    pointer-inert and scaled to ~0.28, so nothing can ever hover it. Mounting
 *    the second image there would double the catalogue's cost on `/` to enable
 *    an interaction that is physically unreachable.
 *  - IT DOES NOT SWAP ON TOUCH. `pointerType` is checked explicitly instead of
 *    leaning on CSS :hover, which sticks after a tap on mobile Safari and would
 *    strand the card showing the back print with no way to undo it.
 *  - IT DOES NOT SWAP TO A MISSING FILE. If all four extensions 404, `backOk`
 *    stays false and the card simply stops reacting. Fading a real photograph
 *    into a registration frame looks like a bug; not reacting looks like a
 *    product that has nothing on its back — which is the truth for Vigil,
 *    whose description says the back is deliberately clean.
 *  - THE BACK IMAGE STAYS `lazy`. It only needs to be decoded by the time a
 *    cursor can reach it, and by then the card is on screen and the browser
 *    has already fetched it.
 */
function CardImage({
  product,
  priority,
  preview,
  reduced,
}: {
  product: Product;
  priority: boolean;
  preview: boolean;
  reduced: boolean;
}) {
  const [altOk, setAltOk] = useState(false);
  const [hover, setHover] = useState(false);
  /* The dip veil must not exist before the first hover, or its keyframe fires
     once on mount — the moment the alt shot resolves — and the whole grid
     blinks black on page load. */
  const [engaged, setEngaged] = useState(false);

  /* Lead shot is per product, not a global constant. Burn The Churches leads
     with its back because its front is a small cross on an otherwise empty
     black tee — as a 300px thumbnail that is a black rectangle, and all of its
     artwork is on the other side. Everything else leads with the front. */
  const lead: Shot = product.lead ?? "front";
  const alt: Shot = lead === "front" ? "back" : "front";

  const canSwap = product.shots.includes(alt) && !preview;
  const swapped = canSwap && altOk && hover;

  return (
    <div
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        setHover(true);
        setEngaged(true);
      }}
      onPointerLeave={() => setHover(false)}
    >
      <Frame productId={product.id} shot={lead} priority={priority} />

      {canSwap && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: swapped ? 1 : 0,
              transition: reduced ? "none" : "opacity 360ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <Frame productId={product.id} shot={alt} onResolved={setAltOk} />
          </div>

          {/* DIP TO BLACK. A straight A→B dissolve briefly shows both garments
              at once, which on two near-identical black silhouettes reads as a
              smeared double exposure. Passing through a beat of darkness makes
              the same swap read as the garment being turned over instead.
              `key` restarts the keyframe on every direction change, so it dips
              on the way in and on the way out. */}
          {!reduced && altOk && engaged && (
            <motion.div
              key={swapped ? "in" : "out"}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.36, times: [0, 0.5, 1], ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0"
              style={{ background: T.pitch }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ———————————————————— small pieces ———————————————————— */

function StockNote({ n }: { n: number }) {
  const c = useNokturnCopy();
  if (n === 0) return <span style={{ color: T.ash }}>{c.stock.soldOut}</span>;
  if (n <= 2) return <span style={{ color: T.signal }}>{c.stock.left(n)}</span>;
  return <span style={{ color: T.ash }}>{c.stock.available}</span>;
}

/* ———————————————————— brand mark ————————————————————
 * The supplied logo — the barbed cross with NOKTURN set vertically — as the
 * client's full-colour artwork: white brushed cross, oxblood-red lettering.
 *
 * WHY A RASTER, NOT THE SVG. The CorelDRAW export is a thin vector skeleton
 * with 39 PNG textures laid over it, and the textures ARE the logo — the brush
 * strokes, the red letter fills, the frayed thorn tips. The vector alone
 * (mark.svg, the CP4_25 stand-in) is a flat white silhouette. Shipping the
 * SVG + 39 PNGs would be 3.2 MB and 40 requests; the textures are raster
 * anyway (the cross texture tops out at ~3100 px for the full height), so it
 * is flattened once to a transparent WebP: 710×1400, ~110 KB, one request.
 * 1400 px covers the largest hero size (480 px) at 2.9× DPR.
 *
 * It is TWO colours now, so the old CSS-mask/currentColor trick no longer
 * applies — colour is baked in. mark.svg stays in /public as the mono version
 * for any future single-colour use (favicon, footer stamp, print).
 *
 * WHERE IT IS NOT. The obvious placement — a big watermark behind the product
 * grid — was built and then cut, because it cannot work here: the garment
 * tiles are opaque and there is only ~32px of gutter between them, so a
 * centred mark is hidden behind the very shirts it is supposed to sit behind.
 * So the mark goes where there is actually canvas: the hero, full strength.
 */
const MARK = `${DIR}/mark.webp`;
const MARK_W = 710;
const MARK_H = 1400;
const MARK_ASPECT = MARK_W / MARK_H; // ≈0.507, from the artwork's own bounds

const MARK_GLOW = `${DIR}/mark-glow.webp`;

/* THE GLOW (CP4_28: bigger, and grainy rather than neon).
 *
 * mark-glow.webp is a SHAPE, not a colour: the red letter work cut from the
 * artwork by redness, dilated and blurred at two radii (tight halo + wide
 * bloom), stored as white-on-alpha at half size — it is pure gradient, so it
 * compresses to ~14 KB. Colour is applied here, through CSS masks:
 *
 *   1. a soft layer in deep oxblood — the body of the glow;
 *   2. a GRAIN layer: the same shape intersected with a fractal-noise alpha
 *      mask, in a brighter blood red. This is what stops it reading as neon —
 *      a smooth gradient halo is exactly what a neon sign looks like; breaking
 *      it into grain makes it read as pigment, dust, printed ink.
 *
 * Grain is sized in CSS px (not scaled with the logo) so it looks the same
 * texture at every hero size. Both layers sit BEHIND the artwork.
 * The dials: GLOW_SOFT / GLOW_GRAIN opacities and NOISE's frequency. */
const GLOW_SOFT = 0.45;
const GLOW_GRAIN = 0.8;
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3.2 0 0 0 -1.25'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

function glowLayer(colour: string, grain: boolean): React.CSSProperties {
  const shape = `url(${MARK_GLOW})`;
  return {
    background: colour,
    WebkitMaskImage: grain ? `${shape}, ${NOISE}` : shape,
    maskImage: grain ? `${shape}, ${NOISE}` : shape,
    WebkitMaskSize: grain ? "contain, 160px 160px" : "contain",
    maskSize: grain ? "contain, 160px 160px" : "contain",
    WebkitMaskRepeat: grain ? "no-repeat, repeat" : "no-repeat",
    maskRepeat: grain ? "no-repeat, repeat" : "no-repeat",
    WebkitMaskPosition: grain ? "center, 0 0" : "center",
    maskPosition: grain ? "center, 0 0" : "center",
    ...(grain ? { WebkitMaskComposite: "source-in", maskComposite: "intersect" } : {}),
  } as React.CSSProperties;
}

/* CP4_29: the mark is split into its two halves so the hero can
 * choreograph them separately — the glow is lit first, as an ember, and the
 * cross rises through it (see the intro note on Hero). Previously both sat in
 * one clipped box, so the glow could only ever arrive with the wipe.
 * The two boxes are the same size and both `contain`-fit, so they register. */
function MarkGlow({ boost }: { boost?: MotionValue<number> }) {
  return (
    <span aria-hidden className="absolute inset-0 block">
      <span className="absolute inset-0" style={{ ...glowLayer("#7A0C12", false), opacity: GLOW_SOFT }} />
      <span className="absolute inset-0" style={{ ...glowLayer("#B41D25", true), opacity: GLOW_GRAIN }} />
      {/* scroll-driven: the mark burns hotter as you leave the hero */}
      {boost && (
        <motion.span
          className="absolute inset-0"
          style={{ ...glowLayer("#D0262F", true), opacity: boost }}
        />
      )}
    </span>
  );
}

function MarkArt({ onReady }: { onReady: () => void }) {
  /* `complete` covers the cached case, where onLoad fires before hydration. */
  const art = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (art.current?.complete && art.current.naturalWidth) onReady();
  }, [onReady]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={art}
      src={MARK}
      alt=""
      aria-hidden
      onLoad={onReady}
      width={MARK_W}
      height={MARK_H}
      decoding="async"
      fetchPriority="high"
      draggable={false}
      className="absolute inset-0 h-full w-full select-none object-contain"
    />
  );
}

/* ———————————————————— atmosphere ————————————————————
 * Two inert layers over the whole store. They sit ABOVE the scrolling content
 * and BELOW the cart drawer, so they read as a property of the screen rather
 * than of the page — grain that scrolled with the catalogue would look like a
 * texture applied to the photographs.
 */
function Atmosphere() {
  /* The edge vignette that used to sit here is GONE (CP4_28). On a pure-black
     page it had nothing to darken except content, and it darkened the bottom
     of the screen by up to 42% — which is exactly why the lower third of the
     hero logo read as grey (core white measured ~150 instead of ~250 in the
     client's mockup). Grain stays: it is what keeps the black from looking
     like a dead screen.

     CP4_29: it was `mix-blend-overlay`, and overlay on black is black
     (2 × 0 × grain = 0) — on this pure-black page the grain was invisible
     everywhere except over photographs, i.e. the one place it wasn't meant to
     be. `screen` lifts black by opacity × noise (~4–6 of 255 at 0.025, measured in Chromium), which is
     the intended film-grain floor. GRAIN_OPACITY is the dial. */
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[35] mix-blend-screen"
      style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: GRAIN_OPACITY }}
    />
  );
}
const GRAIN_OPACITY = 0.025;

/* ———————————————————— modal plumbing ————————————————————
 * The cart drawer already carried role="dialog", but none of the behaviour
 * that makes a dialog a dialog: no Escape, no focus trap, no focus return, no
 * aria-modal. Tabbing out of the open drawer walked into the catalogue behind
 * the overlay. One hook, used by both the drawer and the size chart.
 *
 * The container is scoped to `root` rather than `document` because this whole
 * component may be running inside a transform-scaled preview card — querying
 * the document would trap focus against the real page's chrome.
 */
function useDialog(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return panel;
}

/* ———————————————————— hero ————————————————————
 * CP4_27: THE HERO IS THE LOGO. Opening the store shows the mark, big, on pure
 * black, and nothing else — the catalogue starts below the fold. This reverses
 * the earlier "keep the first row of garments above the fold" rule on purpose:
 * the client wants the brand moment first, and the hero is being built up
 * (hanging chains, background pattern, chain animation — assets in progress).
 *
 * SIZING. The hero fills exactly what is left of the store's scroll viewport
 * under the announcement bar and header (`above`, measured by the parent), so
 * it is correct in the fullscreen player AND inside the 850px preview card —
 * `100vh` would be wrong in both, since the store scrolls inside its own box.
 * The mark is `object-contain`ed into that box with breathing room, so it is
 * height-limited on desktop and width-limited on a phone.
 *
 * LAYERING FOR WHAT'S COMING. The section is `relative` with the mark on
 * `z-10`: chains and pattern slot in as absolute layers at z-0 (behind) or
 * z-20 (hanging in front) without touching this.
 *
 * The one orchestrated reveal is kept: the mark wipes up from its base.
 */
/* ———————————————————— hanging chains ————————————————————
 * Cut from the client's hero mockup (herosectionmockup.png, 6002 px wide):
 * luminance → alpha, white fill, logo masked out, halved to 3000 px.
 *
 *   rail  — barbed wire + the drapes. Static.
 *   v1–v3 — the three vertical chains. Each swings about its hitch.
 *
 * v1 is cut BELOW the point where it crosses the left drape: above that the
 * two chains overlap pixel-for-pixel and cannot be separated from a flat
 * image. So v1's upper run stays in the rail and the free end swings from
 * where it is caught on the drape — which is also how a real chain would
 * behave. When the client's layered source files arrive, drop them in at the
 * same paths (and a full-length v1) — nothing else changes.
 *
 * Geometry is in `cqw` of the hero width, taken straight from the mockup, so
 * the composition scales exactly as it was drawn. `pivot` = hitch x in % of
 * the chain's own width, measured from the artwork's top rows. */
type Chain = { src: string; left: number; top: number; width: number; pivot?: number; swing?: number; period?: number; delay?: number; desktopOnly?: boolean };
const CHAIN_DIR = `${DIR}/chains`;
const RAIL: Chain = { src: `${CHAIN_DIR}/rail.webp`, left: 0, top: -1.1, width: 100 };
/* SWING_GAIN scales every chain's amplitude together (CP4_29: +5%). */
const SWING_GAIN = 1.05;
const HANGING: Chain[] = [
  { src: `${CHAIN_DIR}/v1.webp`, left: 33.1, top: 9.233, width: 1.967, pivot: 53.1, swing: 2.4, period: 2.7, delay: -1.1 },
  { src: `${CHAIN_DIR}/v2.webp`, left: 72.417, top: 1.4, width: 2.05, pivot: 70.3, swing: 1.6, period: 3.8, delay: -2.3 },
  /* desktopOnly (CP4_33): on phones the far-right chain hugs the screen edge
     and reads as a scratch on the glass. */
  { src: `${CHAIN_DIR}/v3.webp`, left: 94.95, top: 1.4, width: 2.833, pivot: 79.5, swing: 1.2, period: 4.7, delay: -0.4, desktopOnly: true },
];

/* DEPTH (CP4_31). At full white the thin chain line-art out-shouted the
 * solid cross. Now planes, brightest nearest:
 *   cross 1.0 → hanging chains → rail,
 * and the rail — the furthest plane — is also softened slightly. */
const DEPTH = { hanging: 0.6, rail: 0.48, railBlur: 0.7 };

function HeroChains({ still, ready, y }: { still: boolean; ready: boolean; y: MotionValue<number> }) {
  const place = (c: Chain): React.CSSProperties => ({
    position: "absolute",
    left: `${c.left}cqw`,
    top: `${c.top}cqw`,
    width: `${c.width}cqw`,
    height: "auto",
  });
  return (
    /* outer = scroll parallax, inner = intro drop. Kept on separate elements so
       the two transforms never fight over `y`. */
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none"
      style={still ? undefined : { y }}
    >
      <motion.div
        initial={still ? false : { opacity: 0, y: -28 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
        transition={{ delay: INTRO.chains, duration: 1.1, ease: [0.34, 1.35, 0.64, 1] }}
        className="absolute inset-0"
      >
       {/* MOBILE (CP4_33, rebuilt CP4_53): the chains are drawn in cqw of THIS
           element, so on a 390px phone the whole rail shrank to ~55px and every
           chain became a 1–2px scribble. Below `sm` hero.css widens this frame
           to 160% and re-centres it, which widens 1cqw by the same 1.6 and so
           enlarges every chain — at layout time, so they rasterize sharp. It
           was a `transform: scale(1.6)` until CP4_53; that painted the same
           rectangle but upscaled a 1x bitmap, which is what made the chains
           read as smears. The cross itself goes the other way — smaller — see
           the mark box in Hero. */}
       <div className="nokturn-chains-frame absolute inset-0" style={{ containerType: "inline-size" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={RAIL.src}
          alt=""
          decoding="async"
          draggable={false}
          style={{ ...place(RAIL), opacity: DEPTH.rail, filter: `blur(${DEPTH.railBlur}px)` }}
        />
        {HANGING.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.src}
            src={c.src}
            alt=""
            decoding="async"
            draggable={false}
            className={[still ? "" : "nokturn-chain", c.desktopOnly ? "max-sm:hidden" : ""].join(" ").trim() || undefined}
            style={
              {
                ...place(c),
                opacity: DEPTH.hanging,
                transformOrigin: `${c.pivot}% 0%`,
                "--swing": `${(c.swing ?? 1.5) * SWING_GAIN}deg`,
                "--period": `${c.period}s`,
                "--delay": `${c.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
       </div>
      </motion.div>
    </motion.div>
  );
}

/* ———————————————————— cursor light ————————————————————
 * CP4_29. A faint warm pool that trails the pointer across the hero — a
 * lantern in the dark, not a cursor. Positioned in % of the hero, not px, so
 * it tracks correctly inside the transform-scaled preview card too (the site's
 * own HeroCursorLight measures px against #hero and would drift there).
 * Sits above the chains and below the mark, screen-blended: it tints the black
 * and the chains it passes over, and leaves the cross itself untouched.
 * Fine pointers only; off for touch, reduced motion and the preview card.
 * CP4_31: red, per client — blood light, same family as the mark's glow.
 * Stronger core than the old warm white: red is darker, so it needs more
 * alpha to register at the same brightness on black. */
const LIGHT = "rgba(190,28,36,0.17)";
const LIGHT_EDGE = "rgba(150,16,24,0.06)";
const LIGHT_SPRING = { stiffness: 1000, damping: 32, mass: 0.25 };

function HeroLight({ still }: { still: boolean }) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const on = fine && !still;
  const x = useMotionValue(50);
  const y = useMotionValue(40);
  /* CP4_33: near-stick. Critically damped (damping = 2·√(k·m) ≈ 32), ω ≈ 63
     rad/s, so it settles in ~60 ms: glued to the cursor, but still smooths
     jittery mice instead of snapping pixel to pixel. Was k140/m0.6 (~400 ms
     trail). */
  const sx = useSpring(x, LIGHT_SPRING);
  const sy = useSpring(y, LIGHT_SPRING);
  const [visible, setVisible] = useState(false);
  const bg = useMotionTemplate`radial-gradient(560px circle at ${sx}% ${sy}%, ${LIGHT}, ${LIGHT_EDGE} 38%, transparent 70%)`;
  const layer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = layer.current?.parentElement;
    if (!on || !section) return;
    const move = (e: PointerEvent) => {
      const r = section.getBoundingClientRect(); // scaled, but so is clientX — % cancels it
      x.set(((e.clientX - r.left) / r.width) * 100);
      y.set(((e.clientY - r.top) / r.height) * 100);
      setVisible(true);
    };
    const leave = () => setVisible(false);
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, [on, x, y]);

  return (
    <motion.div
      ref={layer}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ background: on ? bg : "none", mixBlendMode: "screen" }}
      animate={{ opacity: on && visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}

/* CP4_29: the hero was one exact screen of logo with nothing to say it was a
 * shop or that anything was below — the fold read as the end of the page.
 * A single bottom row now does both jobs: the drop line (what this is and why
 * now) at the sides, and a real scroll cue in the centre, sitting on the
 * cross's axis so the blade points into it. The mark's box stops above the
 * row (CUE_H) so the two never touch at any hero height. The cue is a button,
 * not decoration: it scrolls to the catalogue and moves focus there. */
const CUE_H = 108;

/* CP4_32: the suspension chains (two chains holding the crossbar, with a
 * parallelogram sway) were built in CP4_31 and cut at the client's request.
 * The sway went with them — a cross sliding sideways with nothing holding it
 * reads as floating, not hanging. */

/* ———————————————————— fog (CP4_31) ————————————————————
 * The lower half of the hero was empty black. Low mist now rises from the
 * bottom edge, in two planes: one BEHIND the cross, and a thinner one IN FRONT
 * of it, so the blade sinks into the fog instead of stopping on nothing.
 *
 * The fog is fractal noise, stretched wide (baseFrequency x ≪ y), rendered
 * once from an inline SVG as a stitched, repeat-x tile. Drift is a transform
 * on an element one tile wider than the hero, translated by exactly one tile
 * — composited, seamless, zero repaint. The fade to nothing is a mask on the
 * static parent, so it stays anchored while the fog moves under it.
 * Colour is bone, not grey: it belongs to the palette. */
const fogTile = (w: number, h: number, seed: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Cfilter id='f' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0032 0.011' numOctaves='4' seed='${seed}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.90 0 0 0 0 0.88 0 0 0 0 0.84 1.5 0 0 0 -0.48'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;

/* period = seconds per tile of horizontal drift; swell = seconds per rise.
 * CP4_34: the drift was ~10 px/s on soft, low-contrast noise — technically
 * moving, practically invisible. Drift roughly doubled, and each plane now
 * also SWELLS: it slowly rises a few percent and thickens, then settles, on
 * its own period, so the planes breathe out of step and the fog reads as
 * alive rather than as a scrolling texture. Still ambient — nothing should
 * pull the eye off the cross. */
type FogPlane = { tile: number; seed: number; height: string; opacity: number; period: number; dir: 1 | -1; swell: number; swellDelay: number };
/* Tuned in Chromium at 1440×900: the first pass (58% tall, 0.20) read as a
   storm sky rather than ground mist. Keep it low and quiet. */
const FOG_BACK: FogPlane[] = [
  { tile: 1400, seed: 3, height: "42%", opacity: 0.13, period: 60, dir: 1, swell: 11, swellDelay: 0 },
  { tile: 1900, seed: 11, height: "32%", opacity: 0.09, period: 85, dir: -1, swell: 14, swellDelay: -5 },
];
const FOG_FRONT: FogPlane[] = [
  { tile: 1600, seed: 7, height: "20%", opacity: 0.08, period: 70, dir: 1, swell: 9, swellDelay: -3 },
];

function HeroFog({ planes, still, z }: { planes: FogPlane[]; still: boolean; z: number }) {
  return (
    <>
      {planes.map((f) => (
        <div
          key={f.seed}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
          style={{
            height: f.height,
            zIndex: z,
            opacity: f.opacity,
            WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 22%, transparent 100%)",
            maskImage: "linear-gradient(to top, #000 0%, #000 22%, transparent 100%)",
          }}
        >
          {/* swell sits between the anchored mask and the drift, so the fade
              stays put while the fog rises and falls under it */}
          <div
            className={still ? "absolute inset-0" : "nokturn-fog-swell absolute inset-0"}
            style={
              {
                "--swell-period": `${f.swell}s`,
                "--swell-delay": `${f.swellDelay}s`,
              } as React.CSSProperties
            }
          >
          <div
            className={still ? "absolute inset-y-0 left-0" : "nokturn-fog absolute inset-y-0 left-0"}
            style={
              {
                width: `calc(100% + ${f.tile}px)`,
                left: f.dir === 1 ? 0 : -f.tile,
                backgroundImage: fogTile(f.tile, 520, f.seed),
                backgroundSize: `${f.tile}px 100%`,
                backgroundRepeat: "repeat-x",
                "--fog-shift": `${-f.tile * f.dir}px`,
                "--fog-period": `${f.period}s`,
              } as React.CSSProperties
            }
          />
          </div>
        </div>
      ))}
    </>
  );
}

/* INTRO (CP4_29) — one sequence, gated on the artwork having decoded so it
 * never plays over an empty box (with a fallback, so a failed load can't hold
 * the hero black forever):
 *   black → the glow is lit, alone, like an ember → the cross wipes up through
 *   it → the chains drop in and settle into their swing → the bottom row.
 * ~2.3 s end to end. Nothing in it blocks scrolling or input.
 * Values are seconds from `ready`. */
const INTRO = { glow: 0.15, art: 0.6, chains: 1.35, row: 2.0 };
const READY_FALLBACK_MS = 2500;

/* SCROLL EXIT (CP4_29) — driven by the store's own scroll div, as 0→1 over the
 * hero's height:
 *   cue row   fades out in the first 12%, before anything else moves;
 *   glow      burns up to full boost by 50%;
 *   mark      shrinks to EXIT_SCALE and fades out between 35% and 90%;
 *   chains    rise PARALLAX × faster than the page, clearing the stage.
 * Motion values straight to style — no React render per scroll frame. */
const EXIT_SCALE = 0.86;
const PARALLAX = 0.35;

function Hero({
  still,
  above,
  sectionRef,
  scrollerRef,
  onCue,
}: {
  still: boolean;
  above: number;
  sectionRef: React.RefObject<HTMLElement | null>;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onCue: () => void;
}) {
  const c = useNokturnCopy();
  const n = PRODUCTS.length;

  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const t = window.setTimeout(markReady, READY_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [markReady]);

  /* hero height as a motion value, so the scroll maths never goes stale */
  const heroH = useMotionValue(800);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const m = () => heroH.set(el.offsetHeight || 800);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sectionRef, heroH]);

  const { scrollY } = useScroll({ container: scrollerRef });
  const p = useTransform([scrollY, heroH], ([s, h]: number[]) => Math.min(1, Math.max(0, s / h)));
  const rowOpacity = useTransform(p, [0, 0.12], [1, 0]);
  const boost = useTransform(p, [0, 0.5], [0, 0.75]);
  const markScale = useTransform(p, [0, 1], [1, EXIT_SCALE]);
  const markOpacity = useTransform(p, [0.35, 0.9], [1, 0]);
  const chainsY = useTransform([scrollY, heroH], ([s, h]: number[]) => -Math.min(s, h) * PARALLAX);

  const t = (delay: number, duration: number, ease: Easing | Easing[] = [0.16, 1, 0.3, 1]): Transition =>
    still ? { duration: 0 } : { delay, duration, ease };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: `calc(100% - ${above}px)`, minHeight: 420, background: T.void }}
    >
      <HeroChains still={still} ready={ready} y={chainsY} />
      <HeroFog planes={FOG_BACK} still={still} z={1} />
      <HeroLight still={still} />

      {/* outer = scroll exit, inner layers = intro */}
      <motion.div
        /* Phones (CP4_33): the cross filled the screen edge to edge with its
           top tangled in the chains. Below `sm` it is held to ~72% of the
           width and starts under the (now larger) chain layer. */
        className="absolute inset-x-[14%] top-[12%] z-10 sm:inset-x-5 sm:top-[4%] lg:inset-x-12"
        style={still ? { bottom: CUE_H } : { bottom: CUE_H, scale: markScale, opacity: markOpacity }}
      >
        <motion.div
          className="absolute inset-0"
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={t(INTRO.glow, 1.0, "easeOut")}
        >
          <MarkGlow boost={still ? undefined : boost} />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          initial={still ? false : { clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: ready || still ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)" }}
          transition={t(INTRO.art, 1.3)}
        >
          <MarkArt onReady={markReady} />
        </motion.div>
        <DemoHeading className="sr-only">{BRAND}</DemoHeading>
      </motion.div>

      <HeroFog planes={FOG_FRONT} still={still} z={15} />

      <motion.div
        className="absolute inset-x-5 bottom-0 z-20 lg:inset-x-12"
        style={still ? undefined : { opacity: rowOpacity }}
      >
        <motion.div
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={t(INTRO.row, 0.8, "easeOut")}
          className="grid grid-cols-[1fr_auto_1fr] items-end pb-5 lg:pb-7"
        >
          <p
            className="hidden text-[11px] uppercase tracking-[0.24em] sm:block"
            style={{ fontFamily: MONO, color: T.ash }}
          >
            <span style={{ color: T.signal }}>{c.hero.collection}</span> · {c.hero.limited}
          </p>

          <button
            type="button"
            onClick={onCue}
            className="group col-start-2 flex flex-col items-center gap-3 px-4 pt-2"
          >
            <span className="nokturn-cue-label text-[11px] uppercase tracking-[0.28em] transition-colors">
              {c.hero.cue}
            </span>
            <span
              aria-hidden
              className="relative block h-9 w-px overflow-hidden"
              style={{ background: T.rule }}
            >
              <span
                className={still ? "absolute inset-x-0 top-0 h-1/2" : "nokturn-cue absolute inset-x-0 top-0 h-1/2"}
                style={{ background: T.bone }}
              />
            </span>
          </button>

          <p
            className="hidden justify-self-end text-[11px] uppercase tracking-[0.24em] sm:block"
            style={{ fontFamily: MONO, color: T.ash }}
          >
            {c.hero.count(n)}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* The copy that used to sit under the mark. It moved out of the hero with the
 * catalogue, so the first screen is the logo alone. */
function Intro({ introRef }: { introRef: React.RefObject<HTMLDivElement | null> }) {
  const c = useNokturnCopy();
  return (
    <div
      ref={introRef}
      tabIndex={-1}
      aria-label={c.hero.collection}
      className="outline-none flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-y px-5 py-9 lg:px-12 lg:py-11"
      style={{ borderColor: T.rule }}
    >
      <p className="max-w-[46ch] text-[15px] leading-[1.75]" style={{ color: T.ash }}>
        {c.intro}
      </p>
      {/* "Kolekcja 01" moved to the hero's bottom row (CP4_29) — it was the
          same label twice, one scroll apart. */}
    </div>
  );
}

/* ———————————————————— size chart ————————————————————
 * "Tabela rozmiarów" used to appear twice as an underlined span that did
 * nothing — a dead affordance sitting next to the exact control a customer
 * hesitates over. It is now a real dialog, and it opens on the tab matching
 * whatever the customer is currently looking at.
 */
function SizeChart({
  category,
  onClose,
  still,
}: {
  category: Category;
  onClose: () => void;
  still: boolean;
}) {
  const c = useNokturnCopy();
  const [tab, setTab] = useState<Category>(category);
  const panel = useDialog(true, onClose);
  const rows = SIZE_CHART[tab];

  return (
    <>
      <motion.button
        type="button"
        aria-label={c.sizeChart.closeAria}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: still ? 0 : 0.25 }}
        className="absolute inset-0 z-40 cursor-default"
        style={{ background: "rgba(5,5,6,0.78)" }}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={c.sizeChart.title}
        initial={still ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={still ? { opacity: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: still ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 z-50 w-[min(560px,92%)] -translate-x-1/2 -translate-y-1/2 border p-6 lg:p-8"
        style={{ background: T.void, borderColor: T.rule }}
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-[26px] leading-none" style={{ fontFamily: DISPLAY }}>
            {c.sizeChart.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] uppercase tracking-[0.2em]"
            style={{ color: T.ash }}
          >
            {c.sizeChart.close}
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          {ACTIVE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={tab === cat}
              onClick={() => setTab(cat)}
              className="border px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] transition-colors"
              style={{
                borderColor: tab === cat ? T.bone : T.rule,
                background: tab === cat ? T.bone : "transparent",
                color: tab === cat ? T.pitch : T.ash,
              }}
            >
              {c.categories[cat]}
            </button>
          ))}
        </div>

        <table className="mt-6 w-full text-[14px]" style={{ fontFamily: MONO }}>
          <thead>
            <tr style={{ color: T.ash }}>
              <th scope="col" className="pb-3 text-left font-normal">
                {c.sizeChart.size}
              </th>
              {(["chest", "length", "sleeve"] as const).map((k) => (
                <th key={k} scope="col" className="pb-3 text-right font-normal">
                  {c.measures[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-t" style={{ borderColor: T.ruleSoft }}>
                <th scope="row" className="py-2.5 text-left font-normal">
                  {r.size}
                </th>
                <td className="py-2.5 text-right">{r.chest} cm</td>
                <td className="py-2.5 text-right">{r.length} cm</td>
                <td className="py-2.5 text-right">{r.sleeve} cm</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-5 text-[13px] leading-[1.7]" style={{ color: T.ash }}>
          {c.sizeChart.note}
        </p>
      </motion.div>
    </>
  );
}

/* ———————————————————— the site ———————————————————— */

export default function NokturnSite({ preview = false }: { preview?: boolean }) {
  const c = useNokturnCopy();
  const reduced = usePrefersReducedMotion();
  const still = preview || reduced;

  const [view, setView] = useState<string | null>(null); // null = shop, else product id
  const [cat, setCat] = useState<Category | "all">("all");
  const [sort, setSort] = useState<"new" | "asc" | "desc">("new");
  const [lines, dispatch] = useReducer(cartReducer, []);
  const [bagOpen, setBagOpen] = useState(false);
  const [chartFor, setChartFor] = useState<Category | null>(null);
  const [promo, setPromo] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  /* The promo error used to be gated on `promo && !promoOk`, so the store told
     you the code was wrong after the first keystroke. It should only speak
     once you have actually submitted something. */
  const [promoTried, setPromoTried] = useState(false);
  /* Announced to screen readers on add-to-cart. Nothing in this store used to
     be announced at all: the cart count, the stock note and the promo result
     all changed silently. */
  const [announce, setAnnounce] = useState("");
  /* Adding the same size twice produces the same sentence, and an aria-live
     region only speaks when its text CHANGES — so the second add would be
     silent. Alternating a trailing no-break space keeps the message identical
     to a listener while guaranteeing the node's text differs each time. */
  const echo = useRef(0);
  const say = useCallback((msg: string) => {
    echo.current ^= 1;
    setAnnounce(echo.current ? msg : `${msg}\u00A0`);
  }, []);

  /* The page scrolls in this div, not the window — the demo runs inside a
     transform-scaled virtual viewport, so `fixed` and 100vh are both off the
     table (see the header note). That also means nothing resets the scroll
     position when the view swaps, which it must: opening a product from
     halfway down the grid used to land you halfway down the product page. */
  const scroller = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const closeBag = useCallback(() => setBagOpen(false), []);
  const bagPanel = useDialog(bagOpen, closeBag);

  /* The filter bar sticks directly beneath the header. That offset used to be
     a hardcoded `top-[65px]`, which happened to be right to within a pixel and
     was guaranteed to drift the moment the header's type changed — which it
     just did, when the wordmark became blackletter. Measured instead. */
  const header = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(65);
  /* Hero height = scroll viewport minus header. offsetHeight, not
     getBoundingClientRect: inside the preview card the store is
     transform-scaled, and BCR would report the scaled size.
     CP4_29: the announcement bar left the top of the page (the hero is the
     logo on nothing), so only the header is measured now. */
  const [aboveH, setAboveH] = useState(65);
  useEffect(() => {
    const h = header.current;
    if (!h || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setAboveH(h.offsetHeight);
      setHeaderH(h.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

  /* CP4_29: the free-shipping line appears once the catalogue is reached, not
     on the first screen. Observed against the scroll div (the page does not
     scroll the window). Shown while the grid occupies the upper ~60% of the
     viewport below the header, so it leaves again on the way back up to the
     hero. The strip hangs absolutely under the sticky filter bar — it never
     takes layout space, so revealing it cannot shove the grid mid-scroll. */
  /* CP4_29 — HEADER HANDOFF. Over the hero the header is transparent and
     carries no wordmark: the giant mark IS the name, and a second NOKTURN in
     the corner competed with it on the one screen that is meant to be pure
     brand. Past the middle of the hero the header turns solid and the
     wordmark fades in. Hiding the wordmark there costs nothing — its only
     action is "back to the collection", and on the hero you are already on it.
     A scroll listener, not an observer: one number compared per event, and
     React bails on unchanged state. On the product page there is no hero, so
     the header is always solid. */
  const heroEl = useRef<HTMLElement>(null);
  const introEl = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const on = () => {
      const h = heroEl.current;
      setPastHero(!h || el.scrollTop > h.offsetHeight * 0.5);
    };
    on();
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [view]);
  const onHero = !view && !pastHero;

  const toCatalogue = useCallback(() => {
    const el = scroller.current;
    const h = heroEl.current;
    if (!el || !h) return;
    /* The hero sits directly under the sticky header, so scrolling by exactly
       its height parks the catalogue's top edge under the header. Not
       offsetTop: the scroll div isn't the offsetParent, so offsetTop would be
       measured against the root and drift with scroll. */
    el.scrollTo({ top: h.offsetHeight, behavior: still ? "auto" : "smooth" });
    introEl.current?.focus({ preventScroll: true });
  }, [still]);

  const grid = useRef<HTMLElement | null>(null);
  const [atGrid, setAtGrid] = useState(false);
  useEffect(() => {
    const g = grid.current;
    const root = scroller.current;
    if (!g || !root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setAtGrid(e.isIntersecting), {
      root,
      rootMargin: `-${headerH}px 0px -40% 0px`,
    });
    io.observe(g);
    return () => io.disconnect();
  }, [headerH, view]);

  const shown = useMemo(() => {
    const f = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
    const s = [...f];
    if (sort === "asc") s.sort((a, b) => a.price - b.price);
    if (sort === "desc") s.sort((a, b) => b.price - a.price);
    if (sort === "new") s.sort((a, b) => b.dropped - a.dropped);
    return s;
  }, [cat, sort]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + productOf(l.productId).price * l.qty, 0);
  const discount = promoOk ? Math.round((subtotal * PROMO.percent) / 100) : 0;
  const total = subtotal - discount;
  const toFree = Math.max(0, FREE_SHIPPING_AT - total);

  const product = view ? productOf(view) : null;

  return (
    /* relative + overflow-hidden: the drawer anchors HERE, not to the browser */
    /* data-demo scopes the focus ring: globals.css sets an unscoped
       :focus-visible in Webcraft's sky blue, which this store inherited, so
       every keyboard focus ring in a near-black oxblood shop was cyan. */
    <div
      data-demo="nokturn"
      className="relative h-full overflow-hidden"
      style={{ background: T.void, color: T.bone, fontFamily: UI }}
    >
      <Atmosphere />

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div
        ref={scroller}
        data-lenis-prevent
        className="h-full overflow-y-auto overscroll-contain"
      >
        {/* ————— header ————— */}
        <header
          ref={header}
          className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b px-5 py-4 lg:px-12"
          style={{
            borderColor: onHero ? "transparent" : T.rule,
            background: onHero ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.92)",
            backdropFilter: onHero ? "none" : "blur(10px)",
            transition: still ? "none" : "background-color 500ms ease, border-color 500ms ease",
          }}
        >
          <button
            type="button"
            onClick={() => setView(null)}
            aria-label={c.shop.backToCollection(BRAND)}
            aria-hidden={onHero || undefined}
            tabIndex={onHero ? -1 : 0}
            className="text-[26px] leading-none"
            style={{
              fontFamily: WORDMARK,
              opacity: onHero ? 0 : 1,
              transform: onHero ? "translateY(6px)" : "none",
              pointerEvents: onHero ? "none" : "auto",
              transition: still ? "none" : "opacity 500ms ease, transform 500ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {BRAND}
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {(["all", ...ACTIVE_CATEGORIES] as const).map((cid) => (
              <button
                key={cid}
                type="button"
                onClick={() => {
                  setCat(cid);
                  setView(null);
                }}
                className="border-b pb-0.5 text-[14px] transition-colors"
                style={{
                  color: cat === cid && !view ? T.bone : T.ash,
                  borderColor: cat === cid && !view ? T.bone : "transparent",
                }}
              >
                {cid === "all" ? c.shop.all : c.categories[cid]}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setBagOpen(true)}
            className="flex items-center gap-2 border px-4 py-2 text-[13px] transition-colors"
            style={{ borderColor: T.rule, color: T.bone }}
          >
            {c.shop.bag}
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center px-1 text-[12px]"
              style={{
                fontFamily: MONO,
                background: count ? T.signal : "transparent",
                color: count ? T.pitch : T.ash,
              }}
            >
              {count}
            </span>
          </button>
        </header>

        {product ? (
          /* ————————————— product page ————————————— */
          <ProductPage
            product={product}
            still={still}
            onBack={() => setView(null)}
            onAdd={(cid, size) => {
              dispatch({ type: "add", productId: product.id, colorwayId: cid, size });
              say(c.cart.added(product.name, size));
              setBagOpen(true);
            }}
            onSizeChart={() => setChartFor(product.category)}
          />
        ) : (
          <>
            <Hero still={still} above={aboveH} sectionRef={heroEl} scrollerRef={scroller} onCue={toCatalogue} />
            <Intro introRef={introEl} />

            {/* ————— filter bar ————— */}
            <div
              className="sticky z-20 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-3 md:justify-end lg:px-12"
              style={{
                top: headerH,
                borderColor: T.rule,
                background: "rgba(10,10,12,0.92)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* ————— announcement (revealed at the catalogue) ————— */}
              <AnimatePresence>
                {atGrid && (
                  <motion.div
                    key="ship"
                    role="status"
                    initial={still ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none absolute inset-x-0 top-full px-5 py-2 text-center text-[13px] lg:px-12"
                    style={{ background: T.oxblood, color: T.bone }}
                  >
                    {c.shop.freeShipping(c.zl(FREE_SHIPPING_AT))}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Category chips are MOBILE-ONLY (CP4_35). From md up the header nav
                  carries the same filter, and two rows of identical tabs one above
                  the other read as a template. The header nav is `hidden md:flex`,
                  so below md these chips are the only way to filter — keep them. */}
              <div className="flex flex-wrap items-center gap-2 md:hidden">
                {(["all", ...ACTIVE_CATEGORIES] as const).map((cid) => (
                  <button
                    key={cid}
                    type="button"
                    aria-pressed={cat === cid}
                    onClick={() => setCat(cid)}
                    className="border px-3 py-1.5 text-[13px] transition-colors"
                    style={{
                      borderColor: cat === cid ? T.bone : T.rule,
                      background: cat === cid ? T.bone : "transparent",
                      color: cat === cid ? T.pitch : T.ash,
                    }}
                  >
                    {cid === "all" ? c.shop.all : c.categories[cid]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[13px]" style={{ color: T.ash }}>
                  {c.hero.count(shown.length)}
                </span>
                <button
                  type="button"
                  onClick={() => setChartFor(cat === "all" ? "koszulki" : cat)}
                  className="border-b pb-0.5 text-[13px] transition-colors"
                  style={{ borderColor: T.ruleSoft, color: T.ash }}
                >
                  {c.shop.sizeChart}
                </button>
                <label className="flex items-center gap-2">
                  <span className="sr-only">{c.shop.sortLabel}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="border bg-transparent px-3 py-1.5 text-[13px] outline-none"
                    style={{ borderColor: T.rule, color: T.bone }}
                  >
                    <option value="new" style={{ background: T.void }}>{c.shop.sortNew}</option>
                    <option value="asc" style={{ background: T.void }}>{c.shop.sortAsc}</option>
                    <option value="desc" style={{ background: T.void }}>{c.shop.sortDesc}</option>
                  </select>
                </label>
              </div>
            </div>

            {/* ————— grid —————
                No entrance animation. Every card used to fade-and-slide up on
                scroll with a staggered delay, which is the default motion
                vocabulary of a generated page and was competing with the one
                reveal that should carry the demo (the wordmark in Hero). The
                catalogue simply exists; the hover swap is the grid's motion. */}
            <section ref={grid} className="px-5 py-12 lg:px-12 lg:py-16">
              <div className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
                {shown.map((p, i) => (
                  <article key={p.id}>
                    <button type="button" onClick={() => setView(p.id)} className="group block w-full text-left">
                      <div className="relative">
                        <CardImage
                          product={p}
                          priority={i < 3}
                          preview={preview}
                          reduced={reduced}
                        />
                        {p.compareAt && (
                          /* pointer-events-none: the badge overlaps the image,
                             and without this, dragging the cursor across it
                             fires pointerleave and flickers the hover swap. */
                          <span
                            className="pointer-events-none absolute left-0 top-0 px-2.5 py-1.5 text-[12px]"
                            style={{ fontFamily: MONO, background: T.oxblood, color: T.bone }}
                          >
                            −{Math.round((1 - p.price / p.compareAt) * 100)}%
                          </span>
                        )}
                      </div>
                      {/* MOBILE OVERFLOW FIX. This row used to be one flex
                          line with a `whitespace-nowrap` price block holding
                          BOTH the struck-through compare-at price and the
                          live one. In the two-up phone grid each card is about
                          175px wide, and two formatted prices on one unbroken
                          line measure ~190px — so every reduced product pushed
                          the whole demo into a sideways scroll. (Measured at
                          390px: the scroller was 475px wide in Polish, 493 in
                          English.) Name and price now stack below `sm`, and
                          the two prices are a flex-wrap pair — each price is
                          still unbreakable, the PAIR is not. */}
                      <div className="mt-4 flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                        <h3 className="text-[20px] leading-tight" style={{ fontFamily: DISPLAY }}>
                          {p.name}
                        </h3>
                        <span
                          className="flex flex-wrap gap-x-2 text-[15px] sm:justify-end"
                          style={{ fontFamily: MONO }}
                        >
                          {p.compareAt && (
                            <span className="whitespace-nowrap line-through" style={{ color: T.ash }}>
                              {c.zl(p.compareAt)}
                            </span>
                          )}
                          <span className="whitespace-nowrap">{c.zl(p.price)}</span>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: T.ash }}>
                        {c.products[p.id].blurb}
                      </p>
                      {/* Colour dots only when there is a CHOICE. A single dot
                          is not information, it is decoration that looks like a
                          disabled control. Conditional rather than deleted, so
                          adding a second colourway brings the row straight back. */}
                      {p.colorways.length > 1 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          {p.colorways.map((cw) => (
                            <span
                              key={cw.id}
                              title={c.colorways[cw.id] ?? cw.name}
                              className="h-3.5 w-3.5 border"
                              style={{
                                background: cw.hex,
                                borderColor: T.rule,
                                opacity: cwTotal(cw) === 0 ? 0.3 : 1,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ————— footer ————— */}
        <footer className="border-t px-5 py-14 lg:px-12" style={{ borderColor: T.rule, background: T.pitch }}>
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <span className="text-[30px] leading-none" style={{ fontFamily: WORDMARK }}>
                {BRAND}
              </span>
              <p className="mt-4 max-w-[30ch] text-[14px] leading-[1.85]" style={{ color: T.ash }}>
                {c.footer.tagline}
              </p>
            </div>
            {/* The Sklep column filters the catalogue and "Tabela rozmiarów"
                opens the chart — they are real controls, so they are buttons.
                Everything else has nowhere to go in a single-file demo, so it
                is plain text with no underline: eleven link-styled spans that
                did nothing was a row of dead affordances. */}
            <div>
              <p className="text-[13px]" style={{ color: T.bone }}>
                {c.footer.shop}
              </p>
              <ul className="mt-4 space-y-2.5">
                {(["all", ...ACTIVE_CATEGORIES] as const).map((cid) => (
                  <li key={cid}>
                    <button
                      type="button"
                      onClick={() => {
                        setCat(cid);
                        setView(null);
                      }}
                      className="border-b pb-0.5 text-[14px] transition-colors"
                      style={{ borderColor: T.ruleSoft, color: T.ash }}
                    >
                      {cid === "all" ? c.shop.all : c.categories[cid]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[13px]" style={{ color: T.bone }}>
                {c.footer.help}
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setChartFor(cat === "all" ? "koszulki" : cat)}
                    className="border-b pb-0.5 text-[14px] transition-colors"
                    style={{ borderColor: T.ruleSoft, color: T.ash }}
                  >
                    {c.shop.sizeChart}
                  </button>
                </li>
                {c.footer.helpItems.map((it) => (
                  <li key={it} className="text-[14px]" style={{ color: T.ash }}>
                    {it}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[13px]" style={{ color: T.bone }}>
                {c.footer.brand}
              </p>
              <ul className="mt-4 space-y-2.5">
                {c.footer.brandItems.map((it) => (
                  <li key={it} className="text-[14px]" style={{ color: T.ash }}>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-12 max-w-[64ch] border-t pt-8 text-[13px] leading-[1.9]" style={{ borderColor: T.rule, color: T.ash }}>
            {c.footer.disclaimer(BRAND)}
          </p>
        </footer>
      </div>

      {/* ————— size chart ————— */}
      <AnimatePresence>
        {chartFor && (
          <SizeChart
            category={chartFor}
            still={still}
            onClose={() => setChartFor(null)}
          />
        )}
      </AnimatePresence>

      {/* ————— cart drawer — ABSOLUTE, never fixed ————— */}
      <AnimatePresence>
        {bagOpen && (
          <>
            <motion.button
              type="button"
              aria-label={c.cart.closeAria}
              onClick={closeBag}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: still ? 0 : 0.25 }}
              className="absolute inset-0 z-40 cursor-default"
              style={{ background: "rgba(5,5,6,0.72)" }}
            />
            <motion.aside
              ref={bagPanel}
              role="dialog"
              aria-modal="true"
              aria-label={c.cart.title}
              initial={still ? { opacity: 0 } : { x: "100%" }}
              animate={still ? { opacity: 1 } : { x: 0 }}
              exit={still ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: still ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l"
              style={{ background: T.void, borderColor: T.rule }}
            >
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: T.rule }}>
                <p className="text-[19px] leading-none" style={{ fontFamily: DISPLAY }}>
                  {c.cart.title} <span style={{ fontFamily: MONO, fontSize: "14px", color: T.ash }}>({count})</span>
                </p>
                <button
                  type="button"
                  onClick={closeBag}
                  className="text-[13px]"
                  style={{ color: T.ash }}
                >
                  {c.cart.close}
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <p className="text-[15px]" style={{ color: T.ash }}>
                    {c.cart.empty}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeBag();
                      setView(null);
                    }}
                    className="border-b pb-0.5 text-[14px]"
                    style={{ borderColor: T.bone }}
                  >
                    {c.cart.backToCollection}
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
                    {lines.map((l) => {
                      const p = productOf(l.productId);
                      const cw = colorwayOf(l.productId, l.colorwayId);
                      const max = stockOf(l.productId, l.colorwayId, l.size);
                      return (
                        <div key={l.key} className="flex gap-4 border-b py-5" style={{ borderColor: T.ruleSoft }}>
                          <div className="w-20 shrink-0">
                            <Frame productId={p.id} shot="front" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-[15px] font-medium">{p.name}</p>
                              <span className="whitespace-nowrap text-[14px]" style={{ fontFamily: MONO }}>
                                {c.zl(p.price * l.qty)}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px]" style={{ fontFamily: MONO, color: T.ash }}>
                              {c.colorways[cw.id] ?? cw.name} · {l.size}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex items-center border" style={{ borderColor: T.rule }}>
                                <button
                                  type="button"
                                  aria-label={c.cart.less}
                                  onClick={() => dispatch({ type: "qty", key: l.key, delta: -1 })}
                                  className="px-2.5 py-1 text-[15px]"
                                  style={{ color: T.ash }}
                                >
                                  −
                                </button>
                                <span className="min-w-6 text-center text-[14px]" style={{ fontFamily: MONO }}>
                                  {l.qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={c.cart.more}
                                  disabled={l.qty >= max}
                                  onClick={() => dispatch({ type: "qty", key: l.key, delta: 1 })}
                                  className="px-2.5 py-1 text-[15px] disabled:opacity-30"
                                  style={{ color: T.ash }}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "remove", key: l.key })}
                                className="text-[13px]"
                                style={{ color: T.ash }}
                              >
                                {c.cart.remove}
                              </button>
                            </div>
                            {l.qty >= max && (
                              <p className="mt-2 text-[12px]" style={{ fontFamily: MONO, color: T.signal }}>
                                {c.cart.maxedOut}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <CartSuggestion
                      lines={lines}
                      toFree={toFree}
                      onAdd={(pid, cid, size) => dispatch({ type: "add", productId: pid, colorwayId: cid, size })}
                      onOpen={(pid) => {
                        closeBag();
                        setView(pid);
                      }}
                    />
                  </div>

                  <div className="border-t px-6 py-5" style={{ borderColor: T.rule }}>
                    {/* free shipping progress — the one place red is allowed to move */}
                    <div className="mb-5">
                      <p className="text-[13px]" style={{ fontFamily: MONO, color: toFree ? T.ash : T.signal }}>
                        {toFree ? c.cart.toFree(c.zl(toFree)) : c.cart.freeReached}
                      </p>
                      {/* 2px, not 1px. This is "the one place red is allowed
                          to move", but at a hairline nobody could see it move.
                          Spring rather than a linear tween so the fill has some
                          weight to it when a line is added or removed. */}
                      <div className="mt-2 h-0.5 w-full" style={{ background: T.rule }}>
                        <motion.div
                          className="h-0.5"
                          initial={false}
                          animate={{ width: `${Math.min(100, (total / FREE_SHIPPING_AT) * 100)}%` }}
                          transition={still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                          style={{ background: T.signal }}
                        />
                      </div>
                    </div>

                    <div className="mb-4 flex gap-2">
                      <input
                        value={promo}
                        onChange={(e) => {
                          setPromo(e.target.value);
                          setPromoOk(false);
                          setPromoTried(false);
                        }}
                        placeholder={c.cart.promoPlaceholder}
                        className="min-w-0 flex-1 border bg-transparent px-3 py-2 text-[13px] uppercase tracking-[0.14em] outline-none placeholder:normal-case"
                        style={{ fontFamily: MONO, borderColor: T.rule, color: T.bone }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const ok = promo.trim().toUpperCase() === PROMO.code;
                          setPromoOk(ok);
                          setPromoTried(true);
                          say(ok ? c.cart.promoOk(PROMO.code, PROMO.percent) : c.cart.promoBadShort);
                        }}
                        className="border px-4 text-[13px]"
                        style={{ borderColor: T.rule, color: T.ash }}
                      >
                        {c.cart.promoApply}
                      </button>
                    </div>
                    {promoTried && !promoOk && (
                      <p className="mb-4 text-[12px]" style={{ fontFamily: MONO, color: T.ash }}>
                        {c.cart.promoBad}
                      </p>
                    )}

                    <dl className="space-y-2 text-[14px]" style={{ fontFamily: MONO }}>
                      <div className="flex justify-between">
                        <dt style={{ color: T.ash }}>{c.cart.subtotal}</dt>
                        <dd>{c.zl(subtotal)}</dd>
                      </div>
                      {promoOk && (
                        <div className="flex justify-between" style={{ color: T.signal }}>
                          <dt>{c.cart.discount(PROMO.code)}</dt>
                          <dd>−{c.zl(discount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 text-[16px]" style={{ borderColor: T.rule }}>
                        <dt>{c.cart.total}</dt>
                        <dd>{c.zl(total)}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="mt-5 w-full py-3.5 text-[14px]"
                      style={{ background: T.bone, color: T.pitch }}
                    >
                      {c.cart.checkout}
                    </button>
                    <p className="mt-3 text-center text-[12.5px]" style={{ color: T.ash }}>
                      {c.cart.checkoutNote}
                    </p>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ———————————————————— product page ———————————————————— */

/* ————— cart upsell (CP4_35) —————
 * ONE suggestion, never a carousel: a drawer that turns into a second shop
 * page stops being a cart. Pick order:
 *   1. not already in the bag (any size),
 *   2. the other category from the last thing added (tee → hoodie and back),
 *   3. among those, the cheapest that CLOSES the free-shipping gap — the bar
 *      right above already says "brakuje 51 zł", so the suggestion answers it,
 *   4. otherwise the cheapest left.
 * Size chips add directly (a garment can't be added without a size, and a
 * trip to the PDP from inside the cart loses the sale). The last size the
 * customer chose is pre-highlighted when it's in stock — people buy one size.
 * Sold-out sizes aren't rendered at all; a struck chip here is just noise. */
function CartSuggestion({
  lines,
  toFree,
  onAdd,
  onOpen,
}: {
  lines: Line[];
  toFree: number;
  onAdd: (productId: string, colorwayId: string, size: Size) => void;
  onOpen: (productId: string) => void;
}) {
  const c = useNokturnCopy();
  const inBag = new Set(lines.map((l) => l.productId));
  const last = lines[lines.length - 1];
  const lastCat = last ? productOf(last.productId).category : null;
  const pool = PRODUCTS.filter((p) => !inBag.has(p.id));
  if (!pool.length) return null;

  const byPrice = (a: Product, b: Product) => a.price - b.price;
  const other = pool.filter((p) => p.category !== lastCat);
  const ranked = (other.length ? other : pool).slice().sort(byPrice);
  const pick = (toFree > 0 && ranked.find((p) => p.price >= toFree)) || ranked[0];

  const cw = pick.colorways[0];
  const sizes = SIZES.filter((sz) => (cw.stock[sz] ?? 0) > 0);
  if (!sizes.length) return null;
  const preferred = last && sizes.includes(last.size) ? last.size : null;

  return (
    <div className="py-6">
      <p className="text-[12px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: T.ash }}>
        {toFree > 0 && pick.price >= toFree ? c.suggestion.closesGap : c.suggestion.goesWith}
      </p>
      <div className="mt-4 flex gap-4">
        <button
          type="button"
          onClick={() => onOpen(pick.id)}
          className="w-20 shrink-0"
          aria-label={c.suggestion.view(pick.name)}
        >
          <Frame productId={pick.id} shot={pick.lead ?? "front"} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpen(pick.id)}
              className="truncate text-left text-[15px] font-medium"
            >
              {pick.name}
            </button>
            <span className="whitespace-nowrap text-[14px]" style={{ fontFamily: MONO }}>
              {c.zl(pick.price)}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px]" style={{ color: T.ash }}>
            {c.products[pick.id].blurb}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={c.suggestion.addGroup(pick.name)}>
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onAdd(pick.id, cw.id, sz)}
                aria-label={c.suggestion.addSize(pick.name, sz)}
                className="min-w-9 border px-2 py-1 text-[12px] transition-colors hover:border-current"
                style={{
                  fontFamily: MONO,
                  borderColor: sz === preferred ? T.bone : T.rule,
                  color: sz === preferred ? T.bone : T.ash,
                }}
              >
                + {sz}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPage({
  product,
  still,
  onBack,
  onAdd,
  onSizeChart,
}: {
  product: Product;
  still: boolean;
  onBack: () => void;
  onAdd: (colorwayId: string, size: Size) => void;
  onSizeChart: () => void;
}) {
  const c = useNokturnCopy();
  const [cw, setCw] = useState<Colorway>(product.colorways[0]);
  const [size, setSize] = useState<Size | null>(null);
  const [shot, setShot] = useState<Shot>(product.shots[0]);
  const [open, setOpen] = useState<string | null>("spec");

  const stock = size ? (cw.stock[size] ?? 0) : null;
  const canAdd = size !== null && stock !== null && stock > 0;

  return (
    <div className="px-5 pb-16 pt-8 lg:px-12 lg:pb-24">
      <button
        type="button"
        onClick={onBack}
        className="text-[14px]"
        style={{ color: T.ash }}
      >
        {c.product.back}
      </button>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        {/* gallery */}
        <div>
          <Frame productId={product.id} shot={shot} priority />
          <div className="mt-3 flex gap-3">
            {product.shots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShot(s)}
                aria-label={c.shots[s]}
                className="w-[78px] border transition-colors"
                style={{ borderColor: shot === s ? T.bone : "transparent" }}
              >
                <Frame productId={product.id} shot={s} />
              </button>
            ))}
          </div>
        </div>

        {/* info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* The tracked-out all-caps eyebrow that used to sit here is gone.
              On a product page it restated the category the customer had just
              filtered or navigated by, and a red label above every heading is
              the most template-looking thing a dark store can do. */}
          <DemoHeading
            className="text-[clamp(2.4rem,5.2vw,4rem)] leading-[1.02] tracking-[0.005em]"
            style={{ fontFamily: DISPLAY, fontWeight: 500 }}
          >
            {product.name}
          </DemoHeading>

          <p className="mt-4 text-[21px]" style={{ fontFamily: MONO }}>
            {product.compareAt && (
              <span className="mr-3 line-through" style={{ color: T.ash }}>
                {c.zl(product.compareAt)}
              </span>
            )}
            {c.zl(product.price)}
          </p>

          <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.8]" style={{ color: T.ash }}>
            {c.products[product.id].description}
          </p>

          {/* colourway — a picker only when there is something to pick.
              With one colourway the swatch grid becomes a single button that
              is already pressed and cannot be unpressed, which reads as a
              broken control. The colour is still real product information,
              so it stays as a stated fact. */}
          <div className="mt-9">
            <p className="text-[14px]" style={{ color: T.ash }}>
              {c.product.colour} <span style={{ color: T.bone }}>{c.colorways[cw.id] ?? cw.name}</span>
            </p>
            {product.colorways.length > 1 && (
              <div className="mt-3 flex gap-2.5">
                {product.colorways.map((opt) => {
                  const dead = cwTotal(opt) === 0;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-label={c.colorways[opt.id] ?? opt.name}
                      aria-pressed={cw.id === opt.id}
                      onClick={() => {
                        setCw(opt);
                        setSize(null);
                      }}
                      className="relative h-11 w-11 border transition-colors"
                      style={{
                        background: opt.hex,
                        borderColor: cw.id === opt.id ? T.bone : T.rule,
                        opacity: dead ? 0.35 : 1,
                      }}
                    >
                      {dead && (
                        <span
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center text-[11px]"
                          style={{ color: T.bone }}
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* size — sold-out sizes stay visible and disabled, never hidden */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="text-[14px]" style={{ color: T.ash }}>
                {c.product.size}
              </p>
              <button
                type="button"
                onClick={onSizeChart}
                className="border-b pb-0.5 text-[14px] transition-colors"
                style={{ borderColor: T.ruleSoft, color: T.ash }}
              >
                {c.shop.sizeChart}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((s) => {
                const n = cw.stock[s];
                const made = n !== undefined;
                const out = !made || n === 0;
                return (
                  /* aria-disabled, NOT disabled. Keeping sold-out sizes visible
                     rather than hiding them is a deliberate decision — but
                     `disabled` also removes them from the tab order, so a
                     screen reader user never learned that XXL exists and is
                     gone, which defeats the point of showing them. Focusable
                     and announced, click is a no-op. */
                  <button
                    key={s}
                    type="button"
                    aria-disabled={out}
                    aria-pressed={size === s}
                    onClick={() => {
                      if (!out) setSize(s);
                    }}
                    className="relative min-w-[62px] border px-4 py-3 text-[14px] transition-colors"
                    style={{
                      fontFamily: MONO,
                      cursor: out ? "not-allowed" : "pointer",
                      borderColor: size === s ? T.bone : T.rule,
                      background: size === s ? T.bone : "transparent",
                      color: size === s ? T.pitch : out ? "rgba(138,134,126,0.65)" : T.bone,
                    }}
                  >
                    {s}
                    {out && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 -translate-y-1/2 rotate-[-16deg]"
                        style={{ background: "rgba(138,134,126,0.65)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 h-4 text-[13px]" style={{ fontFamily: MONO }} aria-live="polite">
              {size ? <StockNote n={stock ?? 0} /> : <span style={{ color: T.ash }}>{c.product.pickSize}</span>}
            </p>
          </div>

          <button
            type="button"
            disabled={!canAdd}
            onClick={() => size && onAdd(cw.id, size)}
            className="mt-7 w-full py-4 text-[15px] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ background: T.bone, color: T.pitch }}
          >
            {size ? c.product.addToBag : c.product.pickSize}
          </button>

          {/* accordions */}
          <div className="mt-10 border-t" style={{ borderColor: T.rule }}>
            {[
              {
                id: "spec",
                head: c.product.specHead,
                body: (
                  <dl className="space-y-2.5" style={{ fontFamily: MONO }}>
                    {[
                      [c.product.gsm, `${product.spec.gsm} g/m²`],
                      [c.product.composition, c.products[product.id].composition],
                      [c.product.fit, c.products[product.id].fit],
                      [c.product.origin, c.products[product.id].origin],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-6">
                        <dt style={{ color: T.ash }}>{k}</dt>
                        <dd className="text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ),
              },
              {
                id: "print",
                head: c.product.printHead,
                body: (
                  <p className="leading-[1.85]" style={{ color: T.ash }}>
                    {c.product.printBody}
                  </p>
                ),
              },
              {
                id: "ship",
                head: c.product.shipHead,
                body: (
                  <p className="leading-[1.85]" style={{ color: T.ash }}>
                    {c.product.shipBody(c.zl(FREE_SHIPPING_AT))}
                  </p>
                ),
              },
            ].map((row) => (
              <div key={row.id} className="border-b" style={{ borderColor: T.rule }}>
                <button
                  type="button"
                  aria-expanded={open === row.id}
                  onClick={() => setOpen(open === row.id ? null : row.id)}
                  className="flex w-full items-center justify-between py-4 text-left text-[15px]"
                >
                  {row.head}
                  <span style={{ color: T.ash }}>{open === row.id ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === row.id && (
                    <motion.div
                      initial={still ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: still ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 text-[14.5px]">{row.body}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
