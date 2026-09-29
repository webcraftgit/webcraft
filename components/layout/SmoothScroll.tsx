"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { hashTarget, scrollToHash } from "@/lib/scroll-to";

/**
 * Single Lenis instance for the whole app, synced to GSAP's ticker.
 * This sync is mandatory — without it ScrollTrigger positions drift.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  /* ONE path for every in-page link. Only MagneticButton used to go through
   * scrollToHash; nav links, pricing CTAs, the sticky CTA, FAQ and footer links
   * were plain anchors, so the browser jumped instantly — and to the section
   * top, not the form ([data-scroll-focus]). Delegated in the capture phase so
   * it runs before next/link's own handler (which then sees defaultPrevented
   * and stands down). Registered outside the reduced-motion early return:
   * scrollToHash already jumps instead of animating when motion is reduced.
   *
   * The scroll starts on the next task, so a click that also closes the mobile
   * menu lands after the menu has released its scroll lock. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || (a as HTMLAnchorElement).target === "_blank") return;
      const href = a.getAttribute("href") ?? "";
      if (!href.includes("#") || !hashTarget(href)) return;
      e.preventDefault();
      setTimeout(() => scrollToHash(href), 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // out-expo
    });

    lenis.on("scroll", ScrollTrigger.update);

    /* Published so anything that needs to move the page programmatically can
       go THROUGH Lenis instead of fighting it — see lib/scroll-to.ts. */
    window.__lenis = lenis;

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  /* reducedMotion="user": the global CSS rule only stops CSS animations —
     every Framer Motion transform (hero reveal, navbar slide-in, scroll cue)
     ran regardless. This makes Framer honour the OS setting site-wide. */
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
