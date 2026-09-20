"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import "@/lib/scroll-to"; // window.__lenis type

/**
 * Single Lenis instance for the whole app, synced to GSAP's ticker.
 * This sync is mandatory — without it ScrollTrigger positions drift.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
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

  return <>{children}</>;
}
