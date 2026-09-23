"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  caption: string;
  /** claim chip in the card footer — the outcome the demo proves */
  proof: string;
  children: ReactNode;
  className?: string;
};

/**
 * Craft demo tile. Deliberately generic — {title, caption, demo slot} — so
 * each live demo can be swapped for a portfolio case study later without
 * touching the grid (locked decision: portfolio-ready components).
 */
export default function CraftCard({ title, caption, proof, children, className }: Props) {
  return (
    <article
      className={cn(
        "glass group relative flex flex-col overflow-hidden rounded-panel p-6 md:p-7",
        "transition-colors duration-300 hover:border-[var(--glass-border-hover)]",
        className
      )}
    >
      {/* top rim-light hairline (card convention) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(165,243,252,0.5) 50%, transparent)",
        }}
      />

      <header className="mb-5">
        <h3 className="font-display text-[clamp(1.15rem,1.6vw,1.4rem)] font-medium leading-tight text-ink">
          {title}
        </h3>
        <p className="mt-1.5 max-w-[46ch] text-ui leading-relaxed text-ink-soft">
          {caption}
        </p>
      </header>

      {/* live demo slot */}
      <div className="min-h-0 flex-1">{children}</div>

      <footer className="mt-5 flex items-center gap-2 text-small font-medium text-brand-300">
        <span className="h-1 w-1 rounded-full bg-accent-green" aria-hidden />
        {proof}
      </footer>
    </article>
  );
}
