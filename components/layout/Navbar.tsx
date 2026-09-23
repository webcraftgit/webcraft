"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MagneticButton from "@/components/ui/MagneticButton";
import { useT } from "@/components/i18n/LanguageProvider";
import LangToggle from "@/components/i18n/LangToggle";

const LINKS = [
  { key: "services", href: "/#services" },
  { key: "craft", href: "/#craft" },
  { key: "showcase", href: "/#showcase" },
  { key: "process", href: "/#process" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
] as const;

const SECTION_IDS = LINKS.map((l) => l.href.replace("/#", ""));

export default function Navbar() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Scrollspy — highlight the section currently under a thin band near the top.
  // A ~5% band biased to the upper-third means "active" flips as a section's
  // start reaches reading height, and the deepest section in the band wins.
  useEffect(() => {
    const visible = new Set<string>();
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (!els.length) return;

    const pick = () => {
      // last id in document order that's currently in the band
      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        if (visible.has(SECTION_IDS[i])) return setActive(SECTION_IDS[i]);
      }
      setActive(null); // above the first section (hero) — nothing lit
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        pick();
      },
      { rootMargin: "-38% 0px -57% 0px", threshold: 0 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={cn(
          "mx-auto mt-4 flex max-w-[1200px] items-center justify-between rounded-full px-5 py-3 transition-all duration-500 ease-out-expo md:px-7",
          scrolled ? "glass mx-4 md:mx-8 lg:mx-auto" : "bg-transparent"
        )}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label={t.nav.home}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-w.svg" alt="" className="h-7 w-auto" />
          <span
            className="text-body font-semibold tracking-[0.14em] text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            WEBCRAFT
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => {
            const isActive = active === l.href.replace("/#", "");
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative text-ui font-medium transition-colors hover:text-ink",
                  isActive ? "text-ink" : "text-ink-soft"
                )}
              >
                {t.nav[l.key]}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -bottom-1.5 left-0 right-0 mx-auto h-px w-4 rounded-full bg-brand-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
          <LangToggle />
          <MagneticButton href="/#contact" className="px-6 py-2.5 text-ui">
            {t.nav.cta}
          </MagneticButton>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={open}
        >
          <div className="relative h-3.5 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-[2px] w-full bg-ink transition-transform duration-300",
                open && "translate-y-[6px] rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-[2px] w-full bg-ink transition-transform duration-300",
                open && "-translate-y-[6px] -rotate-45"
              )}
            />
          </div>
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass mx-4 mt-2 rounded-panel p-6 md:hidden"
          >
            <div className="flex flex-col gap-5">
              {LINKS.map((l) => {
                const isActive = active === l.href.replace("/#", "");
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "text-body font-medium transition-colors",
                      isActive ? "text-brand-300" : "text-ink"
                    )}
                  >
                    {t.nav[l.key]}
                  </a>
                );
              })}
              <a
                href="/#contact"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-full bg-brand-400 px-6 py-3 text-center font-medium text-[#05080F]"
              >
                {t.nav.cta}
              </a>
              <LangToggle className="mt-1 self-start" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
