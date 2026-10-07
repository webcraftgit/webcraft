"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

/**
 * Dynamic wrapper: the static SVG renders instantly (fast LCP),
 * then cross-fades to the 3D scene once Three.js is ready.
 */
const LogoScene = dynamic(() => import("./LogoScene"), {
  ssr: false,
  loading: () => null,
});

/* PHONES WAIT FOR THE PAGE BEFORE THEY BUILD THE SCENE.
 * Measured on a throttled mid-range phone (Lighthouse mobile, 2026-10-08):
 * mounting the canvas costs one ~2.7 s main-thread task (three.js parse,
 * shader compile, PMREM of the HDR) and it landed right in the middle of
 * hydration, so the hero was frozen and unclickable while it ran. Total
 * blocking time was 3.3 s with the scene and 70 ms without it.
 *
 * So on phones the scene is not requested until the page has loaded and the
 * main thread has gone idle. The static W is already on screen and the
 * cross-fade below hides the swap, so the visible change is only that the
 * mark comes alive a moment later. Desktop has the CPU to mount it at once. */
const PHONE = "(max-width: 767px)";
const IDLE_TIMEOUT_MS = 3000;

function whenIdleAfterLoad(run: () => void) {
  let idleId = 0;
  let timer = 0;
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    } else {
      // Safari has no requestIdleCallback
      timer = window.setTimeout(run, 1200);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idleId) window.cancelIdleCallback(idleId);
    if (timer) window.clearTimeout(timer);
  };
}

export default function SceneCanvas() {
  const [ready, setReady] = useState(false);
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(PHONE).matches) {
      const id = requestAnimationFrame(() => setMount(true));
      return () => cancelAnimationFrame(id);
    }
    return whenIdleAfterLoad(() => setMount(true));
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Static fallback — visually complete before any JS */}
      <motion.img
        src="/logo-w.svg"
        alt="Weturn logo"
        animate={{ opacity: ready ? 0 : 0.9 }}
        transition={{ duration: 0.8 }}
        className="absolute left-1/2 top-1/2 w-[52%] max-w-[420px] -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0"
      >
        {mount && <LogoScene onReady={() => setReady(true)} />}
      </motion.div>
    </div>
  );
}
