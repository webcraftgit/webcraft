"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * HeroCursorLight (CP4.4) — replaces the old particle-repulsion "bubble".
 *
 * A soft radial glow that trails the pointer inside the hero. Pure DOM layer,
 * pointer-events-none, so it never touches the 3D scene or the buttons. The
 * blob lags the cursor via a soft spring (never snaps), fades in on the first
 * move and out when the pointer leaves.
 *
 * Gated to fine pointers (mouse) that support real hover, and disabled under
 * prefers-reduced-motion — the locked "no global custom cursor" rule still
 * holds: this is a light, not a cursor, and it lives only in the hero.
 */
export default function HeroCursorLight() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  // Snappier than before (was stiffness 120 / mass 0.6, which trailed too far
  // behind the cursor). Still overdamped, so it keeps a soft glide with no jitter.
  const sx = useSpring(x, { stiffness: 350, damping: 35, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 350, damping: 35, mass: 0.4 });

  useEffect(() => {
    const fine =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;
    setEnabled(true);

    const section = document.getElementById("hero");
    if (!section) return;

    const move = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
      setVisible(true);
    };
    const leave = () => setVisible(false);

    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[5] h-[440px] w-[440px] rounded-full"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0.07) 34%, rgba(165,243,252,0.03) 55%, transparent 72%)",
        mixBlendMode: "screen",
      }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  );
}
