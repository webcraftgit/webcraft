"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useProgress } from "@react-three/drei";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import pourData from "./pour.json";

/* lottie-react v3 ships its component with "use client", but its barrel
 * (index.js) has none — so `import { Lottie }` through it resolves to an
 * undefined client-reference under the App Router. Resolving the named export
 * at runtime via next/dynamic (client-only) sidesteps that. */
const Lottie = dynamic(
  () => import("lottie-react").then((m) => ({ default: m.Lottie })),
  { ssr: false }
);

/* ————————————————————————————————————————————————————————————————
 * BLACKWOOD — the loading screen.
 *
 * The cellar is a real WebGL scene: five draco'd GLBs, an HDR-less procedural
 * environment and a heavy post stack. On a weak PC / phone the first seconds
 * are the worst — decode + compile + first frame — and `Suspense fallback={null}`
 * used to show bare gradient while it happened. This overlay covers that: a
 * whiskey pour (Lottie) on a loop, held over the canvas until drei's global
 * loading manager reports every asset in, then faded out.
 *
 * The supplied Lottie was drawn dark-on-light; pour.json is the recoloured cut
 * (cream linework, no baked wordmark) so it reads on the cellar dark and hands
 * off seamlessly into the scene. The type is Blackwood's own — Playfair +
 * Tenor — not the animation's baked letters. Reduced-motion freezes frame 0.
 *
 * It is a DOM sibling of the <Canvas> (NOT inside it), so `useProgress` reads
 * THREE's DefaultLoadingManager from ordinary React.
 * ———————————————————————————————————————————————————————————————— */

const T = {
  bg: "#07080A",
  ink: "#EDE4D4",
  inkSoft: "#8B8578",
  amber: "#D9974A",
  ember: "#B0561A",
};
const SERIF = '"Playfair Display Variable", "Playfair Display", Georgia, serif';
const SANS = '"Tenor Sans", Optima, "Gill Sans", "Segoe UI", sans-serif';

/** A floor under the hold, so nothing flashes; the real gate for motion users
 *  is one full pour (the Lottie's loopCompleted), which runs ~4s. */
const MIN_MS = 600;

export default function BlackwoodLoader() {
  const { active, progress } = useProgress();
  const reduced = usePrefersReducedMotion();
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pouredOnce, setPouredOnce] = useState(false);
  const mounted = useRef(Date.now());

  // Leave once the assets are in AND the pour has played through once, so the
  // whole animation is always seen at least once — but never before MIN_MS, and
  // force-drop after a hard ceiling so a dropped asset can't trap the site.
  // Reduced-motion shows a still, so it does not wait for a loop that never runs.
  useEffect(() => {
    const assetsIn = !active && progress >= 100;
    const sawFullPour = reduced || pouredOnce;
    if (!assetsIn || !sawFullPour) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - mounted.current));
    const t = setTimeout(() => setLeaving(true), wait);
    return () => clearTimeout(t);
  }, [active, progress, reduced, pouredOnce]);

  useEffect(() => {
    const ceiling = setTimeout(() => setLeaving(true), 12000);
    return () => clearTimeout(ceiling);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setGone(true), 760); // matches the fade
    return () => clearTimeout(t);
  }, [leaving]);

  if (gone) return null;

  const pct = Math.min(100, Math.round(progress));

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: [
          // lantern warmth pooled behind the pour, over a deep cold cellar floor
          "radial-gradient(34rem 26rem at 50% 42%, rgba(217,151,74,0.13) 0%, rgba(176,86,26,0.05) 42%, transparent 70%)",
          "radial-gradient(120% 90% at 50% 8%, #0A0B0E 0%, #050608 55%, #030405 100%)",
        ].join(", "),
        opacity: leaving ? 0 : 1,
        transition: "opacity 740ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* corner vignette — pulls the eye to the centre, reads as candlelit */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 14rem 4rem rgba(0,0,0,0.85)" }}
      />

      {/* wordmark */}
      <div className="relative flex flex-col items-center">
        <p
          className="text-[22px] leading-none"
          style={{ fontFamily: SERIF, letterSpacing: "0.02em", color: T.ink }}
        >
          Blackwood
        </p>
        <span
          className="mt-2 block h-px w-10"
          style={{ background: `linear-gradient(90deg, transparent, ${T.amber}, transparent)` }}
        />
      </div>

      {/* the pour */}
      <div className="relative mt-3" style={{ width: 208, height: 208 }}>
        <Lottie
          src={pourData}
          loop
          autoplay={!reduced}
          segment={reduced ? [44, 45] : undefined}
          subscriptions={{ loopCompleted: () => setPouredOnce(true) }}
          style={{ width: "100%", height: "100%" }}
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        />
      </div>

      {/* progress — a slim filling rule, premium and quiet */}
      <div
        className="relative mt-1 h-px w-44 overflow-hidden"
        style={{ background: "rgba(217,151,74,0.16)" }}
      >
        <span
          className="absolute left-0 top-0 h-full origin-left"
          style={{
            width: "100%",
            transform: `scaleX(${pct / 100})`,
            background: `linear-gradient(90deg, ${T.ember}, ${T.amber})`,
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <p
        className="mt-3 text-[11px] uppercase tabular-nums"
        style={{ fontFamily: SANS, letterSpacing: "0.28em", color: T.inkSoft }}
      >
        Pouring · {pct}%
      </p>
    </div>
  );
}
