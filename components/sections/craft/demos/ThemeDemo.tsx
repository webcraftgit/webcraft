"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LanguageProvider";

type ThemeId = "studio" | "bakery" | "clinic" | "gym";
type Theme = {
  /** display name comes from the dictionary (t.demos.theme.names[id]) */
  id: ThemeId;
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  radius: string;
};

/* four believable client brands, all driven by the same token slots */
const THEMES: Theme[] = [
  {
    id: "studio",
    bg: "#0B1120",
    surface: "#131C31",
    ink: "#E8F1FA",
    inkSoft: "#8FA3BF",
    accent: "#38BDF8",
    accentInk: "#05080F",
    radius: "14px",
  },
  {
    id: "bakery",
    bg: "#FFF9F0",
    surface: "#FFFFFF",
    ink: "#3B2A1E",
    inkSoft: "#9C8672",
    accent: "#E0762F",
    accentInk: "#FFF9F0",
    radius: "18px",
  },
  {
    id: "clinic",
    bg: "#F4F8F7",
    surface: "#FFFFFF",
    ink: "#16302B",
    inkSoft: "#6C8681",
    accent: "#0F766E",
    accentInk: "#F4F8F7",
    radius: "10px",
  },
  {
    id: "gym",
    bg: "#121212",
    surface: "#1C1C1C",
    ink: "#F5F5F4",
    inkSoft: "#8C8C8A",
    accent: "#D9F84B",
    accentInk: "#121212",
    radius: "4px",
  },
];

/**
 * One mini interface, four brands. Every color and radius below reads from
 * the selected theme object — the same way our real design tokens work —
 * so switching a swatch re-skins everything at once.
 */
export default function ThemeDemo() {
  const t = useT();
  const [theme, setTheme] = useState(THEMES[0]);
  const nameOf = (id: ThemeId) => t.demos.theme.names[id];

  return (
    <div className="flex h-full flex-col">
      {/* mini UI */}
      <div
        className="flex-1 overflow-hidden border p-4 transition-[background-color,border-color] duration-500"
        style={{
          background: theme.bg,
          borderColor: `color-mix(in srgb, ${theme.ink} 12%, transparent)`,
          borderRadius: "20px",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-display text-[14px] font-semibold transition-colors duration-500"
            style={{ color: theme.ink }}
          >
            {nameOf(theme.id)}
            {t.demos.theme.brandSuffix}
          </span>
          <span
            className="h-6 w-6 transition-[background-color,border-radius] duration-500"
            style={{ background: theme.accent, borderRadius: theme.radius }}
          />
        </div>

        <p
          className="mt-4 font-display text-[17px] font-medium leading-snug transition-colors duration-500"
          style={{ color: theme.ink }}
        >
          {t.demos.theme.headline}
        </p>
        <p className="mt-1 text-[12.5px] transition-colors duration-500" style={{ color: theme.inkSoft }}>
          {t.demos.theme.sub}
        </p>

        <div className="mt-4 flex items-center gap-2.5">
          <span
            className="px-4 py-2 text-[12px] font-semibold transition-[background-color,color,border-radius] duration-500"
            style={{ background: theme.accent, color: theme.accentInk, borderRadius: theme.radius }}
          >
            {t.demos.theme.cta}
          </span>
          <span
            className="border px-4 py-2 text-[12px] font-medium transition-[color,border-color,border-radius] duration-500"
            style={{
              color: theme.ink,
              borderColor: `color-mix(in srgb, ${theme.ink} 25%, transparent)`,
              borderRadius: theme.radius,
            }}
          >
            {t.demos.theme.secondary}
          </span>
        </div>

        <div
          className="mt-4 border p-3 transition-[background-color,border-color,border-radius] duration-500"
          style={{
            background: theme.surface,
            borderColor: `color-mix(in srgb, ${theme.ink} 10%, transparent)`,
            borderRadius: theme.radius,
          }}
        >
          <span className="block h-2 w-3/4 rounded-full transition-colors duration-500" style={{ background: `color-mix(in srgb, ${theme.ink} 55%, transparent)` }} />
          <span className="mt-2 block h-2 w-1/2 rounded-full transition-colors duration-500" style={{ background: `color-mix(in srgb, ${theme.ink} 28%, transparent)` }} />
        </div>
      </div>

      {/* swatches */}
      <div className="mt-4 flex items-center gap-2.5" role="radiogroup" aria-label={t.demos.theme.aria}>
        {THEMES.map((sw) => (
          <button
            key={sw.id}
            role="radio"
            aria-checked={sw.id === theme.id}
            aria-label={t.demos.theme.themeAria(nameOf(sw.id))}
            data-cursor={t.demos.theme.cursor}
            onClick={() => setTheme(sw)}
            className={cn(
              "relative h-9 w-9 rounded-full border transition-transform duration-300",
              sw.id === theme.id
                ? "scale-110 border-brand-300"
                : "border-brand-400/25 hover:scale-105"
            )}
            style={{ background: `linear-gradient(135deg, ${sw.bg} 48%, ${sw.accent} 52%)` }}
          >
            {sw.id === theme.id && (
              <span className="absolute -inset-1.5 rounded-full border border-brand-400/50" aria-hidden />
            )}
          </button>
        ))}
        <span className="ml-1 text-[12px] text-ink-soft">{nameOf(theme.id)}</span>
      </div>
    </div>
  );
}
