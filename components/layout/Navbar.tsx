"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { lockScroll } from "@/lib/scroll-to";
import { CONTACT_PHONE, CONTACT_PHONE_E164 } from "@/lib/site";
import MagneticButton from "@/components/ui/MagneticButton";
import { useT } from "@/components/i18n/LanguageProvider";
import LangToggle from "@/components/i18n/LangToggle";

const LINKS = [
  { key: "services", href: "/#services" },
  { key: "craft", href: "/#craft" },
  { key: "showcase", href: "/#showcase" },
  { key: "portfolio", href: "/portfolio" },
  { key: "process", href: "/#process" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
] as const;

const SECTION_IDS = LINKS.filter((l) => l.href.startsWith("/#")).map((l) => l.href.replace("/#", ""));

/* The full link row needs ~1000px: logo + six links + language toggle + CTA.
 * It used to switch on at `md` (768px), where it overflowed — on an iPad the
 * CTA wrapped to two lines and ran off the right edge and the wordmark touched
 * the first link. Below `lg` the menu button is used instead. */

/** Tap-to-call. Icon only on phones and at lg; the number is written out from
 *  xl up, where the link row has room for it. */
function PhoneLink({
  label,
  showNumber = false,
  className,
}: {
  label: string;
  showNumber?: boolean;
  className?: string;
}) {
  return (
    <a
      href={`tel:${CONTACT_PHONE_E164}`}
      aria-label={`${label}: ${CONTACT_PHONE}`}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full text-ui font-medium text-ink-soft transition-colors hover:text-ink",
        showNumber ? "min-w-11 px-2 xl:px-3" : "w-11",
        className
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.66 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.23a2 2 0 0 1 2.11-.45c.83.32 1.7.54 2.6.66A2 2 0 0 1 22 16.92z" />
      </svg>
      {showNumber && <span className="hidden whitespace-nowrap tabular-nums xl:inline">{CONTACT_PHONE}</span>}
    </a>
  );
}

export default function Navbar() {
  const t = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  }, []);

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

  /* Mobile menu behaves like the modal it looks like: the page behind stops
   * scrolling, Escape closes it (focus back on the menu button), Tab stays
   * inside the header, and growing past `lg` closes it. */
  useEffect(() => {
    if (!open) return;
    lockScroll(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close(true);
        return;
      }
      if (e.key !== "Tab" || !header.current) return;
      const focusables = Array.from(
        header.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && close();

    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open, close]);

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50">
      {/* backdrop — tapping outside the menu closes it */}
      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => close()}
            className="fixed inset-0 -z-10 bg-bg/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={cn(
          "mx-auto mt-4 flex max-w-[1200px] items-center justify-between gap-6 rounded-full px-5 py-3 transition-all duration-500 ease-out-expo md:px-7",
          // denser than the shared .glass — see .glass-nav in globals.css
          scrolled || open ? "glass glass-nav mx-4 md:mx-8 xl:mx-auto" : "bg-transparent"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.nav.home}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-w.svg" alt="" className="h-7 w-auto" />
          <span
            className="text-body font-semibold tracking-[0.14em] text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            WETURN
          </span>
        </Link>

        {/* gap stays 20px at every width: with Portfolio in the row, 28px pushed the CTA out of the 1200px bar */}
        <div className="hidden items-center gap-5 lg:flex">
          {LINKS.map((l) => {
            const isActive = l.href.startsWith("/#") ? active === l.href.replace("/#", "") : pathname === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? (l.href.startsWith("/#") ? "location" : "page") : undefined}
                className={cn(
                  "relative py-2 text-ui font-medium transition-colors hover:text-ink",
                  isActive ? "text-ink" : "text-ink-soft",
                  /* the row has no room for a seventh link below ~1400px; the menu below lg and the footer carry it */
                  l.key === "portfolio" && "hidden min-[1400px]:inline-block"
                )}
              >
                {t.nav[l.key]}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-brand-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
          <PhoneLink label={t.nav.call} showNumber className="-mr-3" />
          <LangToggle />
          <MagneticButton href="/#contact" className="whitespace-nowrap px-6 py-2.5 text-ui">
            {t.nav.cta}
          </MagneticButton>
        </div>

        {/* Mobile / tablet: the phone stays one tap away, next to the menu */}
        <div className="ml-auto flex items-center lg:hidden">
          <PhoneLink label={t.nav.call} />
        </div>

        {/* Mobile / tablet toggle */}
        <button
          ref={toggle}
          type="button"
          className="-ml-4 -mr-2 flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
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
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass mx-4 mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-panel p-4 md:mx-8 lg:hidden"
          >
            <nav aria-label={t.nav.menu} className="flex flex-col">
              {LINKS.map((l) => {
                const isActive = l.href.startsWith("/#") ? active === l.href.replace("/#", "") : pathname === l.href;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => close()}
                    aria-current={isActive ? (l.href.startsWith("/#") ? "location" : "page") : undefined}
                    className={cn(
                      "flex min-h-[48px] items-center rounded-input px-3 text-body font-medium transition-colors hover:bg-brand-400/10",
                      isActive ? "text-brand-300" : "text-ink"
                    )}
                  >
                    {t.nav[l.key]}
                  </a>
                );
              })}
              <a
                href="/#contact"
                onClick={() => close()}
                className="mt-3 flex min-h-[48px] items-center justify-center rounded-full bg-brand-400 px-6 font-medium text-[#05080F]"
              >
                {t.nav.cta}
              </a>
              <LangToggle className="ml-3 mt-4 self-start" />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
