"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Sticky mobile CTA (CP4.2, conversion idea #6). Mobile-only pill fixed to
 * the bottom edge. Logic: show only AFTER the visitor has scrolled past the
 * Craft section — by then they've seen the proof, so the ask has earned its
 * place — and hide again while the Contact section (the thing it links to)
 * is on screen. Two IntersectionObservers, no scroll listeners.
 */
export default function StickyCta() {
  const t = useT();
  const [pastCraft, setPastCraft] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const craft = document.getElementById("craft");
    const contact = document.getElementById("contact");
    if (!craft || !contact) return;

    const craftIO = new IntersectionObserver(
      ([e]) => setPastCraft(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    const contactIO = new IntersectionObserver(
      ([e]) => setContactVisible(e.isIntersecting),
      { threshold: 0.15 }
    );
    craftIO.observe(craft);
    contactIO.observe(contact);
    return () => {
      craftIO.disconnect();
      contactIO.disconnect();
    };
  }, []);

  const show = pastCraft && !contactVisible;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 72, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 72, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-6 md:hidden"
        >
          <a
            href="#contact"
            className="glass flex min-h-[48px] w-full max-w-[420px] items-center justify-center gap-2 rounded-full border-brand-400/40 px-6 py-3 text-[15px] font-semibold text-ink shadow-[0_12px_40px_-12px_rgba(56,189,248,0.5)]"
          >
            {t.sticky.cta}
            <span className="text-brand-300" aria-hidden>
              →
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
