"use client";

import { useMemo, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Scales the hero mark down on viewports too narrow to hold it. Nothing else.
 *
 * THE BUG THIS FIXES: the camera is fixed (z 320, fov 45), so the visible
 * width in world units is 265 * aspect. On a 1440x900 desktop that is ~424
 * units and the ~360-unit-wide mark sits comfortably inside it. On a 390x844
 * phone it is ~122 units — the mark was nearly THREE TIMES the width of the
 * screen, so a phone visitor saw a slab of cyan with no readable silhouette.
 *
 * WHY A SCALE AND NOT A CAMERA CHANGE: pulling the camera back or widening the
 * fov would also change the perspective of the extrusion — the bevel and side
 * profile are the whole point of the Bold-tier hero and they flatten out fast
 * past fov ~60.
 *
 * ————— DO NOT REINTRODUCE A HEIGHT TERM —————
 * The first version of this file also divided by viewport HEIGHT. On a fixed
 * camera the visible height is a CONSTANT 265 world units at every screen size
 * and every aspect ratio — only the width follows the aspect. So that term was
 * not responsive at all: it evaluated to 0.663 everywhere and silently shrank
 * the mark by a third ON DESKTOP, which is exactly what the client saw. Height
 * cannot constrain this mark anyway: it is ~200 units tall against 265.
 *
 * The rule is therefore one-dimensional and anchored to the composition as it
 * was authored: shrink in proportion to how much narrower this viewport is
 * than a normal desktop, and NEVER scale up. At 16:10 and wider the result is
 * exactly 1, so every desktop renders byte-for-byte what it did before this
 * file existed.
 */

/** Visible world width at the reference desktop (16:10 — 265 * 1.6). Anything
 *  this wide or wider renders the mark at its authored size. */
const REFERENCE_WIDTH = 424;

/* Once the mark has to shrink, the hero copy is also at its narrowest and the
 * headline has wrapped to four lines — so the mark ends up directly behind the
 * type instead of framing it. Dropping it toward the CTA half of the screen,
 * in proportion to how much it had to shrink, turns it back into a watermark.
 * Exactly zero on desktop, where `scale` is 1 and nothing moves. */
const DROP_FRACTION = 0.07;

export default function FitGroup({ children }: { children: ReactNode }) {
  const width = useThree((s) => s.viewport.width);
  const height = useThree((s) => s.viewport.height);

  const scale = useMemo(() => Math.min(1, width / REFERENCE_WIDTH), [width]);

  /* position, not margin: this is scene space. Applied on the OUTER group so
     LogoMesh's own scroll-driven y damp is untouched. */
  const drop = (1 - scale) * height * DROP_FRACTION;

  return (
    <group scale={scale} position={[0, -drop, 0]}>
      {children}
    </group>
  );
}
