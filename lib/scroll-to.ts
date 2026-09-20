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

export function scrollWindowTo(top: number, duration = 0.7) {
  if (typeof window === "undefined") return;
  const y = Math.max(0, Math.round(top));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(y, reduced ? { immediate: true } : { duration });
    return;
  }
  window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
}
