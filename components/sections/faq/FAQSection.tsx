"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/i18n/LanguageProvider";
import { scrollWindowTo } from "@/lib/scroll-to";

/**
 * FAQ (CP4) — glass accordion. Open/close is pointer-driven, so Framer
 * Motion owns it (locked rule: GSAP = scroll, Framer = pointer).
 * One item open at a time; buttons carry aria-expanded/aria-controls.
 * Answers stay honest — no invented numbers, no fake guarantees.
 */

// FAQ content lives in lib/i18n/dictionaries.ts (t.faq.items).

export default function FAQSection() {
  const t = useT();
  const FAQS = t.faq.items;
  const reveal = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  /* CP4_54 — CENTRE THE ANSWER YOU JUST OPENED.
   *
   * Opening an item near the bottom of the screen pushed its answer below the
   * fold, so the reward for tapping was a scroll. Now the page moves the item
   * into the middle of the viewport.
   *
   * The catch: at the moment of the click the panel is still 0px tall and the
   * previously-open panel is still at full height, so measuring the live
   * layout would centre on geometry that is about to change. Waiting for the
   * 450ms collapse to finish instead would mean the page sits still and THEN
   * lurches. So the final geometry is PREDICTED from the two heights we
   * already know — the answer's own content height, and the height the item
   * above is about to give back — and the scroll starts on the same frame as
   * the accordion. The two animations run together and land together.
   *
   * A tall answer is top-aligned under the navbar instead of centred, because
   * centring something taller than the screen hides its first line. */
  const items = useRef<Array<HTMLDivElement | null>>([]);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const NAV_CLEARANCE = 108; // fixed navbar + a little air

  /** natural (fully open) height of panel i, measured from its content */
  const panelHeight = (i: number) => {
    const inner = panels.current[i]?.firstElementChild as HTMLElement | null;
    return inner?.offsetHeight ?? 0;
  };

  const toggle = useCallback(
    (i: number) => {
      const prev = open;
      const next = prev === i ? null : i;
      setOpen(next);
      if (next === null) return; // closing: leave the page where it is

      const el = items.current[i];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // an item ABOVE this one collapsing lifts everything below it
      const lift = prev !== null && prev < i ? panelHeight(prev) : 0;
      const top = rect.top - lift;
      const height = rect.height + panelHeight(i);

      const vh = window.innerHeight;
      const offset =
        height > vh - NAV_CLEARANCE ? NAV_CLEARANCE : (vh - height) / 2;

      scrollWindowTo(window.scrollY + top - offset);
    },
    [open]
  );

  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative">
      <div ref={reveal} className="container-x relative max-w-[880px] py-[clamp(96px,12vw,160px)]">
        <p data-reveal className="eyebrow mb-4">
          {t.faq.eyebrow}
        </p>
        <h2 data-reveal id="faq-heading" className="heading-2 max-w-[18ch]">
          {t.faq.heading}
        </h2>

        <div data-reveal className="mt-10 space-y-3 md:mt-12">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-faq-panel-${i}`;
            const btnId = `${baseId}-faq-btn-${i}`;
            return (
              <div
                key={item.q}
                ref={(node) => {
                  items.current[i] = node;
                }}
                className="glass overflow-hidden rounded-card transition-colors duration-300"
                style={{
                  borderColor: isOpen ? "var(--glass-border-hover)" : undefined,
                }}
              >
                <h3>
                  <button
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left md:px-6 md:py-5"
                  >
                    <span className="font-display text-[clamp(1.02rem,1.4vw,1.2rem)] font-medium leading-snug text-ink">
                      {item.q}
                    </span>
                    {/* plus → minus */}
                    <motion.span
                      aria-hidden
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--glass-border)]"
                    >
                      <span className="absolute h-3 w-px bg-brand-300" />
                      <span className="absolute h-px w-3 bg-brand-300" />
                    </motion.span>
                  </button>
                </h3>

                {/* CP4_17-seo: this panel used to live inside <AnimatePresence>
                  * and UNMOUNT when closed, so six of the seven answers were
                  * simply absent from the DOM at any moment. These answers are
                  * the most quotable text on the site — specific, honest, and
                  * shaped exactly like the questions people ask an answer
                  * engine — and none of them could be crawled or cited.
                  *
                  * Now every answer is always mounted and collapse is animated
                  * on height alone. That is also what Google's guidance asks
                  * for: accordion content counts when it is present and merely
                  * collapsed, not when it is conditionally rendered. Keeping it
                  * mounted is what makes the FAQPage schema in lib/seo/schema.ts
                  * an accurate description of the page rather than a claim
                  * about text that is not there.
                  *
                  * `aria-hidden` (not `visibility` or `hidden`) does the
                  * screen-reader half: a collapsed panel stays in the markup
                  * for crawlers but leaves the accessibility tree, so nothing
                  * reads out seven answers at once. Toggling `visibility`
                  * instead would flip instantly and make the text disappear
                  * before the collapse finished animating. */}
                <motion.div
                  id={panelId}
                  ref={(node) => {
                    panels.current[i] = node;
                  }}
                  role="region"
                  aria-labelledby={btnId}
                  aria-hidden={!isOpen}
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 leading-relaxed text-ink-soft md:px-6 md:pb-6">
                    {item.a}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>

        <p data-reveal className="mt-8 text-[15px] text-ink-soft">
          {t.faq.closingPre}
          <Link
            href="/#contact"
            className="font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-400"
          >
            {t.faq.closingLink}
          </Link>
          {t.faq.closingPost}
        </p>
      </div>
    </section>
  );
}
