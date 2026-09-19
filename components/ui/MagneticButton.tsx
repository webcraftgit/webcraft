"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 300, damping: 24 }; // spring-ui token
const PULL_RADIUS = 80;
const MAX_PULL = 8;

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
  href?: string;
  onClick?: () => void;
};

/**
 * Magnetic button — subtle pull toward the cursor inside an 80px radius.
 * Inner label counter-moves at half strength for depth.
 */
export default function MagneticButton({
  children,
  className,
  variant = "primary",
  href,
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  const tx = useSpring(useMotionValue(0), SPRING);
  const ty = useSpring(useMotionValue(0), SPRING);

  const onMove = (e: MouseEvent) => {
    // magnetic pull only on hover-capable pointers — on touch the synthetic
    // mousemove from a tap would nudge the button mid-press (CP4.1)
    if (reduced || !ref.current) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const strength = Math.max(0, 1 - dist / PULL_RADIUS);
    x.set(dx * strength * (MAX_PULL / PULL_RADIUS) * 10);
    y.set(dy * strength * (MAX_PULL / PULL_RADIUS) * 10);
    tx.set(dx * strength * 0.05);
    ty.set(dy * strength * 0.05);
  };

  const reset = () => {
    x.set(0); y.set(0); tx.set(0); ty.set(0);
  };

  const styles =
    variant === "primary"
      ? "bg-brand-400 text-[#05080F] hover:bg-brand-300"
      : "glass text-ink hover:border-[var(--glass-border-hover)]";

  const Tag: any = href ? motion.a : motion.button;

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className="inline-block">
      <Tag
        href={href}
        onClick={onClick}
        style={{ x, y }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-colors duration-300",
          styles,
          className
        )}
      >
        <motion.span style={{ x: tx, y: ty }} className="inline-flex items-center gap-2">
          {children}
        </motion.span>
      </Tag>
    </div>
  );
}
