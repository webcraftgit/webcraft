"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Staggered entrance for children marked [data-reveal].
 * Order follows DOM order: eyebrow → heading → body → cards (80ms stagger).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = el.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y: 24 });
    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 72%", once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return ref;
}
