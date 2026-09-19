"use client";

import { type ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export type Service = {
  title: string;
  body: string;
  /** Shorter body used inside the disc on mobile — see the note below. */
  bodyShort: string;
  outcome: string;
  icon: ReactNode;
};

const SPRING = { stiffness: 300, damping: 24 }; // spring-ui token
const TILT = 2; // deg (CP5.5: was 4 — client asked for a calmer disc)
const PULL = 5; // px of magnetic travel (CP5.5: was 10)

type Props = {
  service: Service;
  /** the focused disc — text visible, float + magnetic tilt enabled */
  active: boolean;
  index: number;
};

/**
 * Circular metallic service disc (CP2.9).
 * Position / blur / dim / scale on the wheel are owned by the rotary
 * carousel in ServicesSection. This component owns only:
 *   float wrapper -> idle bob (y, slow loop, active disc only)
 *   surface       -> magnetic pull + tilt (x/y springs, rotateX/Y)
 *   text          -> fades in on the focused disc only
 *
 * MOBILE KEEPS THE COPY INSIDE THE DISC (client direction), which is only
 * possible because the copy gets shorter rather than the type getting smaller.
 *
 * A circle is a hostile text container: the usable width collapses toward the
 * top and the bottom. The cyan outcome line sits lowest, so it was the first
 * thing to punch through the rim — and in Polish it is the longest of the
 * three strings ("Jedna marka, kazda powierzchnia"), which is why it broke on
 * SOME discs and not others.
 *
 * The fix is the WORDS, not the font size. Every text node is laid out inside
 * a centred column of 72% of the diameter — which is the square that fits in a
 * circle, so nothing can reach the rim at any height — and mobile renders
 * `bodyShort` from the dictionary instead of the full `body`. At the 340px
 * disc that column is ~245px and the stack measures ~185px, leaving real
 * slack. Shrinking the type to fit the long copy would have put the body at
 * about 10px, which is not a readable size on a phone.
 *
 * The stack is TOP-ALIGNED with a percentage inset rather than centred, so the
 * icon sits high in the disc (client direction) and the copy reads down from
 * it. Percentage, not a fixed padding, so it tracks the disc at every width.
 *
 * Desktop and tablet are untouched.
 */
export default function ServiceCard({ service, active, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const mx = useSpring(useMotionValue(0), SPRING);
  const my = useSpring(useMotionValue(0), SPRING);
  const rx = useSpring(useMotionValue(0), SPRING);
  const ry = useSpring(useMotionValue(0), SPRING);

  const onMove = (e: React.PointerEvent) => {
    if (reduced || !active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    mx.set(px * PULL * 2);
    my.set(py * PULL * 2);
    ry.set(px * 2 * TILT);
    rx.set(-py * 2 * TILT);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
    rx.set(0);
    ry.set(0);
  };

  /* Rendered EXACTLY ONCE -- inside the disc on md+, below it on mobile.
     Not duplicated behind a `hidden md:block` pair, which would put the same
     heading in the DOM twice for screen readers and for the crawler. */
  const copy = (
    <motion.div
      animate={{ opacity: active ? 1 : 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.35 }}
      /* max-w-[72%] on mobile is the inscribed square of the circle: any line
         inside it clears the rim at every height, whatever the language. */
      className="mt-3 w-full max-w-[72%] md:mt-7 md:max-w-none"
    >
      <h3 className="font-display text-[16.5px] font-medium leading-tight text-ink md:text-[clamp(1.25rem,2vw,1.7rem)]">
        {service.title}
      </h3>
      <p className="mx-auto mt-2 text-[12.5px] leading-[1.5] text-ink-soft md:mt-3 md:max-w-[34ch] md:text-[14.5px] md:leading-relaxed">
        {/* ONE node, chosen in JS — not two spans with `md:hidden`, which
            would put both versions of the copy in the DOM for screen readers
            and for the crawler. */}
        {isMobile ? service.bodyShort : service.body}
      </p>
      {/* The blue line. `items-baseline` + a `shrink-0` dot so a long Polish
          outcome wraps as a block instead of being clipped by the rim. */}
      <p className="mx-auto mt-3 inline-flex max-w-[30ch] items-baseline justify-center gap-2 text-balance text-[12.5px] font-medium text-brand-300 md:mt-4 md:text-sm">
        <span
          className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-accent-green"
          aria-hidden
        />
        <span>{service.outcome}</span>
      </p>
    </motion.div>
  );

  return (
    /* idle float -- only the disc in focus breathes */
    <motion.div
      animate={reduced || !active ? { y: 0 } : { y: [0, -8, 0] }}
      transition={
        reduced || !active
          ? { duration: 0.3 }
          : { duration: 5 + index * 0.9, repeat: Infinity, ease: "easeInOut" }
      }
      className="flex h-full w-full flex-col items-center"
    >
      {/* magnetic + tilt surface -- the metallic disc itself */}
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ x: mx, y: my, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        className={cn(
          "metal-card metal-disc relative flex aspect-square w-full flex-col items-center overflow-hidden rounded-full text-center",
          // mobile: icon high, copy reading down from it, inside the inscribed
          // column so no line can ever reach the rim
          "justify-start px-[14%] pt-[15%]",
          // md+: the original centred composition, untouched
          "md:justify-center md:px-[12%] md:pt-0"
        )}
      >
        {/* rim light -- arcs over the top of the disc */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[12%] top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(165,243,252,0.55) 50%, transparent)",
          }}
        />

        {/* BIG engraved icon -- stamped straight into the metal. Bigger on
            mobile now that it has the disc to itself. */}
        <motion.div
          whileHover={reduced || !active ? undefined : { rotate: -6 }}
          transition={SPRING}
          className="icon-engraved [&_svg]:h-[54px] [&_svg]:w-[54px] md:[&_svg]:h-24 md:[&_svg]:w-24"
        >
          {service.icon}
        </motion.div>

        {copy}
      </motion.div>
    </motion.div>
  );
}
