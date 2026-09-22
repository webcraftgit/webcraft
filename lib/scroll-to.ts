/**
 * Scroll the WINDOW to an absolute Y, through Lenis when it is running.
 *
 * The page's scroll is hijacked by a single Lenis instance
 * (components/layout/SmoothScroll.tsx), which keeps its own animated position.
 * Calling `window.scrollTo({behavior:"smooth"})` while that is running starts a
 * second animation against the first — the page stutters, or snaps back as
 * Lenis re-asserts its own target on the next frame. So: ask Lenis when it is
 * there, and fall back to the native scroll when it is not (reduced motion,
 * where SmoothScroll deliberately never starts one).
 *
 * SmoothScroll publishes the instance on `window.__lenis` for exactly this.
 */
type LenisLike = {
  scrollTo: (
    target: number,
    options?: { duration?: number; easing?: (t: number) => number; immediate?: boolean }
  ) => void;
};

declare global {
  interface Window {
    __lenis?: LenisLike;
  }
}

export function scrollWindowTo(
  top: number,
  opts: { duration?: number; immediate?: boolean } = {}
) {
  if (typeof window === "undefined") return;
  const y = Math.max(0, Math.round(top));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // `immediate` is for RESTORING a position the visitor already had (e.g.
  // coming back out of the demo player). Animating there would be a scroll
  // they never asked for, from a place they were never at.
  const jump = opts.immediate || reduced;

  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(y, jump ? { immediate: true } : { duration: opts.duration ?? 0.7 });
    return;
  }
  window.scrollTo({ top: y, behavior: jump ? "auto" : "smooth" });
}

// fixed navbar (~64px) + a little breathing room, kept in sync with FAQSection's own constant
const NAV_CLEARANCE = 96;

/**
 * Smooth-scroll to an in-page anchor ("#contact", "/#contact") through the
 * same Lenis-aware path as scrollWindowTo, instead of letting the browser's
 * default anchor jump fight the Lenis-driven scroll position.
 *
 * Returns true if `href` pointed at an in-page section that was found (and
 * scrolling was handled), so callers know whether to preventDefault.
 */
export function scrollToHash(href: string, opts: { duration?: number } = {}): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return false;

  const path = href.slice(0, hashIndex);
  const id = href.slice(hashIndex + 1);
  if (!id) return false;
  // only handle same-page anchors, not "/other-page#section"
  if (path && path !== "/" && path !== window.location.pathname) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - NAV_CLEARANCE;
  scrollWindowTo(top, { duration: opts.duration ?? 0.6 });

  if (window.location.hash !== `#${id}`) {
    window.history.pushState(null, "", `#${id}`);
  }

  return true;
}
