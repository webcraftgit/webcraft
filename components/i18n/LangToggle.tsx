"use client";

import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { useLocale } from "@/components/i18n/LanguageProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * PL / EN segmented control. Two pills in a glass track; the active one is
 * filled. Sets the locale on tap — the whole page re-renders from the swapped
 * dictionary. The pills are drawn small enough for the navbar, but each one's
 * hit area is stretched to 44px tall with a pseudo-element (the pills alone
 * were ~24px).
 */
export default function LangToggle({ className }: { className?: string }) {
  const [locale, setLocale] = useLocale();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[var(--glass-border)] bg-[rgba(5,8,15,0.4)] p-0.5",
        className
      )}
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            aria-label={LOCALE_LABELS[l]}
            className={cn(
              "relative min-w-[38px] rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold tracking-wide transition-colors",
              "after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
              active
                ? "bg-brand-400 text-[#05080F]"
                : "text-ink-soft hover:text-ink"
            )}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
