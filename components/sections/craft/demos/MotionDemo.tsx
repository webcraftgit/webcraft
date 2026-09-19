"use client";

import { useCallback, useRef, useState } from "react";
import { animate, motion, useMotionValue, type MotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "@/animations/variants";
import { useT } from "@/components/i18n/LanguageProvider";

// id + behaviour only; name/note come from the dictionary (t.demos.motion.moves)
type MoveId = "linear" | "expo" | "spring";
type Move = {
  id: MoveId;
  run: (v: MotionValue<number>, to: number) => void;
};

const MOVES: Move[] = [
  { id: "linear", run: (v, to) => void animate(v, to, { duration: 0.9, ease: "linear" }) },
  { id: "expo", run: (v, to) => void animate(v, to, { duration: 0.9, ease: [...EASE_OUT_EXPO] }) },
  { id: "spring", run: (v, to) => void animate(v, to, { type: "spring", stiffness: 300, damping: 24 }) },
];

/**
 * Same move, three temperaments. Each pick replays the puck across the track
 * with that easing — the fastest way to show why motion tokens matter.
 */
export default function MotionDemo() {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [move, setMove] = useState(MOVES[1]);
  const side = useRef<0 | 1>(0);

  const play = useCallback(
    (m: Move) => {
      setMove(m);
      const w = track.current ? track.current.clientWidth - 48 : 200;
      side.current = side.current === 0 ? 1 : 0;
      const to = side.current * w;
      if (reduced) {
        x.set(to);
        return;
      }
      m.run(x, to);
    },
    [reduced, x]
  );

  return (
    <div className="flex h-full flex-col">
      {/* easing picks */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.demos.motion.aria}>
        {MOVES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={m.id === move.id}
            data-cursor={t.demos.motion.cursor}
            onClick={() => play(m)}
            className={cn(
              "rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors duration-300",
              m.id === move.id
                ? "bg-brand-400 text-[#05080F]"
                : "glass text-ink hover:border-[var(--glass-border-hover)]"
            )}
          >
            {t.demos.motion.moves[m.id].name}
          </button>
        ))}
      </div>

      {/* track */}
      <div
        ref={track}
        data-cursor={t.demos.motion.cursor}
        onClick={() => play(move)}
        className="relative mt-5 h-16 cursor-pointer rounded-card border border-brand-400/15 bg-bg"
      >
        <span className="absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-brand-700/50" aria-hidden />
        <motion.span
          style={{ x }}
          className="absolute left-2.5 top-1/2 block h-9 w-9 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 shadow-[0_0_20px_rgba(56,189,248,0.45)]"
          aria-hidden
        />
      </div>

      <p className="mt-4 min-h-[2.6em] text-[13px] leading-relaxed text-ink-soft" aria-live="polite">
        {t.demos.motion.moves[move.id].note}
      </p>
    </div>
  );
}
