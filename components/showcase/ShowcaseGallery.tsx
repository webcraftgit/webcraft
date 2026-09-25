"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useReveal } from "@/hooks/useReveal";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LanguageProvider";
import { DemoPreviewContext } from "@/components/showcase/DemoHeading";
import { scrollWindowTo } from "@/lib/scroll-to";
import { ScrollTrigger } from "@/lib/gsap";

/* demo sites lazy-load — they carry their own R3F canvases */
const BlackwoodSite = dynamic(() => import("./demos/blackwood/BlackwoodSite"));
const WisniowaSite = dynamic(() => import("./demos/wisniowa/WisniowaSite"));
const ZelaznaSite = dynamic(() => import("./demos/zelazna/ZelaznaSite"));
const NokturnSite = dynamic(() => import("./demos/nokturn/NokturnSite"));

const PREVIEW_W = 1360; // virtual viewport the preview renders at
const PREVIEW_H = 850;

type Demo = {
  id: string;
  name: string;
  tagline: string;
  facts: string[];
  Site: ComponentType<{ preview?: boolean }>;
  posterBg: string;
  /** A still of the real site for poster-gated demos, so the card shows what
   *  opens instead of a bare gradient. Rendered object-cover over posterBg.
   *  posterImg is the wide (16:9) desktop crop; posterImgMobile is a tighter
   *  4:3 crop for the mobile card, framed so the key subject survives — a
   *  center-crop of the wide still would drop it. */
  posterImg?: string;
  posterImgMobile?: string;
  /** false = the card never mounts WebGL, it shows the poster and opens live
   *  on click. Blackwood carries ~1MB of models + textures (CP3.9) and the
   *  home page must not pay for that just to scroll past a card. */
  livePreview?: boolean;
  /** Poster-gated WebGL demos never touch the network until the click, so the
   *  scene chunk + GLBs + textures download only once the player is already
   *  on screen — the worst moment, over the loading screen. This warms all of
   *  it on the first hover/focus/tap of the card, so a click that lands a
   *  second later finds most bytes already cached. Runs at most once. */
  prewarm?: () => Promise<unknown>;
};

// Brand names + non-text config stay here; tagline/facts come from the
// dictionary (keyed by id). The demo site's own internals stay in character
// (i.e. not translated) by design — it is fictional client-style work.
type DemoId = "blackwood" | "wisniowa" | "nokturn";
const BASE: Omit<Demo, "tagline" | "facts">[] = [
  {
    id: "blackwood",
    name: "Blackwood · Speyside Single Malt",
    Site: BlackwoodSite,
    livePreview: false,
    posterImg: "/demo/blackwood/banner.svg",
    posterImgMobile: "/demo/blackwood/banner.svg",
    // Warm everything the click will need: importing the scene module runs its
    // useGLTF.preload() for all five GLBs and downloads the R3F/post chunk; the
    // fetches pull the floor + brick textures into the HTTP cache; and warming
    // the loader + Lottie player means the pour paints instantly on click
    // instead of after two async import hops.
    prewarm: async () => {
      [
        "/textures/dark_planks/diff_2k.webp",
        "/textures/dark_planks/nor_gl_1k.webp",
        "/textures/dark_planks/rough_1k.webp",
        "/textures/brick_wall/diff_1k.webp",
        "/textures/brick_wall/nor_gl_1k.webp",
        "/textures/brick_wall/rough_1k.webp",
      ].forEach((u) => fetch(u).catch(() => {}));
      await Promise.all([
        import("./demos/blackwood/BlackwoodLoader"),
        import("lottie-react"),
        import("./demos/blackwood/BlackwoodScene"),
      ]);
    },
    posterBg:
      "radial-gradient(46% 46% at 30% 62%, rgba(217,151,74,0.42) 0%, transparent 68%), radial-gradient(38% 40% at 72% 52%, rgba(176,86,26,0.26) 0%, transparent 70%), #07080A",
  },
  {
    id: "wisniowa",
    name: "Wiśniowa · stomatologia",
    Site: WisniowaSite,
    // no WebGL: cheap enough to run live in the card
    posterBg:
      "radial-gradient(60% 55% at 40% 40%, rgba(78,107,91,0.16) 0%, transparent 70%), #F5F2EA",
  },
  /* Żelazna (klub siłowy) was retired here in CP4_14 and replaced by the
   * Nokturn store. The file stays in the repo — it is a good demo and costs
   * nothing while unreferenced, and dynamic() means it is never bundled. To
   * bring it back, re-add an entry and its dictionary keys. */
  {
    id: "nokturn",
    name: "Nokturn · sklep odzieżowy",
    Site: NokturnSite,
    // no WebGL and a type-only hero: cheap enough to run live in the card
    posterBg:
      "radial-gradient(58% 52% at 44% 40%, rgba(126,17,22,0.20) 0%, transparent 70%), #0A0A0C",
  },
];

/**
 * The real site, running live inside the card: rendered at a fixed virtual
 * viewport and scaled to fit, inert to the pointer (the card itself is the
 * button). Mounts only while near the viewport; mobile and reduced-motion
 * get a lightweight gradient poster instead of a second WebGL context.
 */
function LivePreview({ demo }: { demo: Demo }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);
  const [near, setNear] = useState(false);
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const lite = isMobile || reduced || demo.livePreview === false;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / PREVIEW_W));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "300px 0px",
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={box} className="relative h-full w-full overflow-hidden" style={{ background: demo.posterBg }}>
      {!lite && near && (
        /* CP4_17-seo: this subtree is a whole third-party-looking site rendered
         * inside our home page. `aria-hidden` was already here for screen
         * readers, but it does nothing for crawlers — so:
         *   - `inert` takes the whole preview out of the tab order and the
         *     a11y tree properly (aria-hidden alone leaves focusable children
         *     reachable, which was already a latent keyboard bug);
         *   - `data-nosnippet` asks Google not to lift this text into a
         *     snippet for OUR url, which is the visible half of the problem;
         *   - DemoPreviewContext demotes the demo's <h1> to a <div> so the
         *     home page has exactly one H1 (see DemoHeading.tsx).
         * None of this hides the text from the index — nothing short of not
         * rendering it would — but it stops the copy competing for the page's
         * topic and stops three fictional brands claiming heading rank. */
        <div
          aria-hidden
          inert
          data-nosnippet
          className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
          style={{ width: PREVIEW_W, height: PREVIEW_H, transform: `scale(${scale})` }}
        >
          <DemoPreviewContext.Provider value={true}>
            <demo.Site preview />
          </DemoPreviewContext.Provider>
        </div>
      )}
      {lite && demo.posterImg && (
        <picture>
          {/* md card is 16:9, mobile card is 4:3 — serve a crop framed for each */}
          <source media="(min-width: 768px)" srcSet={demo.posterImg} />
          <img
            src={demo.posterImgMobile ?? demo.posterImg}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out will-change-transform group-hover:scale-[1.06]"
          />
        </picture>
      )}
      {lite && !demo.posterImg && (
        <span
          className="absolute inset-0 flex items-center justify-center font-display text-title font-medium text-ink/90"
        >
          {demo.name.split(" — ")[0]}
        </span>
      )}
    </div>
  );
}

/**
 * Live preview grid + fullscreen player. Click a running preview to open the
 * full site in a fixed overlay (Esc / Close), which owns its own scrolling
 * via [data-lenis-prevent]; the page behind is scroll-locked meanwhile.
 */
export default function ShowcaseGallery() {
  const t = useT();
  const DEMOS: Demo[] = BASE.map((d) => ({
    ...d,
    tagline: t.showcase.demos[d.id as DemoId].blurb,
    facts: t.showcase.demos[d.id as DemoId].facts,
  }));
  const reveal = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<Demo | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  /* CP4_55 — COMING BACK OUT OF A DEMO DUMPED YOU IN THE PROCESS SECTION.
   *
   * While the player is open the grid is `hidden` (deliberate — it is what
   * unmounts the previews' WebGL behind the overlay, CP3.6). But `hidden`
   * removes it from layout, so the document gets shorter by the full height
   * of the gallery while you are inside the demo. The browser clamps the
   * scroll position to the new, shorter page; closing restores the height but
   * NOT the position, so you came back somewhere else entirely — reliably a
   * section or two further down.
   *
   * So the card you just left is put back under the camera explicitly. Not
   * the old scroll number (it was already clamped away by the time we could
   * read it back) — the card's own position, measured after the grid is laid
   * out again, centred in the viewport. Instantly, not animated: this is
   * restoring a place the visitor already had, and gliding there would be a
   * scroll they never asked for.
   *
   * ScrollTrigger is refreshed in the same breath because the document height
   * changed twice while it was not looking, and every trigger below the
   * gallery is measured against it. */
  const cards = useRef<Record<string, HTMLElement | null>>({});
  const returningTo = useRef<string | null>(null);

  /* First hover/focus/tap on a card warms its heavy assets (see Demo.prewarm).
     Once per demo per page load — the Set guards re-entry. */
  const warmed = useRef<Set<string>>(new Set());
  const prewarm = useCallback((d: Demo) => {
    if (!d.prewarm || warmed.current.has(d.id)) return;
    warmed.current.add(d.id);
    d.prewarm().catch(() => warmed.current.delete(d.id));
  }, []);

  const close = useCallback(() => {
    setOpen((current) => {
      returningTo.current = current?.id ?? null;
      return null;
    });
  }, []);

  useEffect(() => {
    if (open) return;
    const id = returningTo.current;
    if (!id) return;
    returningTo.current = null;

    /* two frames: one for React to un-`hidden` the grid, one for the browser
       to lay it out, so the rect we measure is the final one. */
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = cards.current[id];
        if (!el) return;
        const r = el.getBoundingClientRect();
        scrollWindowTo(
          window.scrollY + r.top - (window.innerHeight - r.height) / 2,
          { immediate: true }
        );
        ScrollTrigger.refresh();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    // CP4_46: tell the home hero's WebGL canvas to stop rendering while a demo
    // owns the screen (LogoScene listens). Otherwise two render loops run.
    window.dispatchEvent(new CustomEvent("webcraft:demo-player", { detail: true }));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    closeBtn.current?.focus();
    return () => {
      document.documentElement.style.overflow = "";
      window.dispatchEvent(new CustomEvent("webcraft:demo-player", { detail: false }));
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={reveal}>
      {/* hidden while the player is open → previews leave the viewport and
          their observers unmount the WebGL contexts behind the overlay */}
      <div className={cn("grid grid-cols-1 gap-10", open && "hidden")}>
        {DEMOS.map((d) => (
          <article
            key={d.id}
            ref={(node) => {
              cards.current[d.id] = node;
            }}
            data-reveal
            className="glass group relative overflow-hidden rounded-panel transition-colors duration-300 hover:border-[var(--glass-border-hover)]"
          >
            {/* live preview — the whole frame is the button */}
            <button
              type="button"
              onClick={() => setOpen(d)}
              onMouseEnter={() => prewarm(d)}
              onFocus={() => prewarm(d)}
              onTouchStart={() => prewarm(d)}
              aria-label={t.showcase.openFullscreen(d.name)}
              className="relative block aspect-[4/3] w-full cursor-pointer overflow-hidden md:aspect-[16/9]"
            >
              <LivePreview demo={d} />
              {/* hover veil + CTA */}
              <span className="absolute inset-0 flex items-center justify-center bg-bg/0 transition-colors duration-300 group-hover:bg-bg/40">
                <span className="touch-show translate-y-2 rounded-full bg-brand-400 px-6 py-2.5 text-small font-semibold text-[#05080F] opacity-0 shadow-[0_0_30px_rgba(56,189,248,0.45)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {t.showcase.openBadge}
                </span>
              </span>
              {/* live badge */}
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-bg/70 px-3 py-1 text-label font-semibold uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-green" aria-hidden />
                {t.showcase.live}
              </span>
            </button>

            {/* meta */}
            <div className="p-6 md:p-7">
              <h3 className="font-display text-[clamp(1.2rem,1.8vw,1.5rem)] font-medium text-ink">
                {d.name}
              </h3>
              <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">{d.tagline}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {d.facts.map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-brand-400/20 bg-bg-soft/60 px-3 py-1 text-label font-medium uppercase tracking-[0.06em] text-brand-300"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* fullscreen player */}
      <AnimatePresence>
        {open && (
          <motion.div
            key={open.id}
            role="dialog"
            aria-modal="true"
            aria-label={t.showcase.demoLabel(open.name)}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-bg"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-brand-400/15 bg-bg px-4 py-2.5 md:px-6">
              <p className="flex items-center gap-3 text-small text-ink-soft">
                <span className="hidden items-center gap-1.5 md:flex" aria-hidden>
                  {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                    <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.8 }} />
                  ))}
                </span>
                <span className="font-medium text-ink">{open.name}</span>
                <span className="hidden md:inline">{t.showcase.playerCaption}</span>
              </p>
              <button
                ref={closeBtn}
                type="button"
                onClick={close}
                className="glass flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2 text-small font-medium text-ink transition-colors hover:border-[var(--glass-border-hover)]"
              >
                {t.showcase.close}
                <kbd className="hidden rounded-[5px] border border-brand-400/25 px-1.5 text-label text-ink-soft md:inline">esc</kbd>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <open.Site />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
