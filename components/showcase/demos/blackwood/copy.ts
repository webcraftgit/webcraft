"use client";

import { useLocale } from "@/components/i18n/LanguageProvider";

/* ————————————————————————————————————————————————————————————————
 * BLACKWOOD — DEMO COPY, EN + PL
 *
 * Same pattern as demos/wisniowa/copy.ts, and for the same reason: this does
 * NOT belong in lib/i18n/dictionaries.ts, because that file is imported by the
 * site shell and therefore ships to every homepage visitor. Blackwood is a
 * lazy chunk that only loads when the demo is opened; its copy rides along
 * with it.
 *
 * `en` is the typed source of truth and `pl` is declared `typeof en`, so a key
 * added to one language and not the other FAILS THE BUILD rather than silently
 * rendering undefined.
 *
 * WHAT IS NOT TRANSLATED, AND WHY
 *  · "BLACKWOOD" — a brand name, not copy.
 *  · "Speyside" — a Scotch whisky region. Polish drinks writing uses the
 *    Scottish region names as-is; "Dolina Spey" would read as a translation
 *    error to anyone who knows the category.
 *  · "Dunnage" — the term of art for a low, earth-or-timber-floored warehouse.
 *    Polish whisky writing keeps the English word.
 *  · "single malt" — likewise standard in Polish, lower-cased.
 *  · The numerals in MASH (100% / 18 / 9) and the tasting-note weights: they
 *    are data, not language.
 *
 * ONE DELIBERATE DIFFERENCE: the PL hero headline is "Wolny ogień, / długa
 * ciemność." A literal "Powolny ogień" is a syllable longer and pushes the
 * second line past the copy column at the 2.9rem floor of the clamp on a
 * phone. Shorter, and it carries the same image.
 * ———————————————————————————————————————————————————————————————— */

export const en = {
  announce: "Speyside · Est. 1887 · Distilled and bottled at the distillery",
  nav: ["The whisky", "Craft", "Our story", "Find a bottle"],
  navCta: "Find a bottle",
  /** Rail: "Section 3 of 7" — the only string with interpolation. */
  railSection: (n: number, total: number) => `Section ${n} of ${total}`,

  hero: {
    region: "Speyside",
    est: "Est. 1887",
    titleA: "Slow fire,",
    titleB: "long dark.",
    lead: "Single malt Scotch whisky, eighteen winters in the dark. Time is the only ingredient we cannot buy.",
    link: "Our story",
    scroll: "Scroll — the cellar comes to you",
  },

  whisky: {
    eyebrow: "02 — The whisky",
    heading: "One grain, and eighteen years of patience.",
    mash: [
      {
        pct: "100%",
        grain: "Malted barley",
        copy: "One grain, and nothing to hide behind. Floor-malted, peated lightly, never heavily.",
      },
      {
        pct: "18",
        grain: "Winters",
        copy: "In first-fill European oak casks, in a warehouse with a dark timber floor and no heating.",
      },
      {
        pct: "9",
        grain: "Months",
        copy: "The finish: charred virgin oak, long enough for spice, short enough to keep the fruit.",
      },
    ],
  },

  craft: {
    eyebrow: "03 — Craft",
    heading: "The casks are made here, by hand.",
    body: "Our coopers raise every cask in the yard behind the stillhouse, then toast and char it over an open flame until the staves blister. The spirit spends eighteen years inside one. Nothing about this is efficient. That is rather the point.",
    items: [
      {
        label: "Two stills",
        copy: "Copper, onion-necked, run slowly so the spirit stays light and floral.",
      },
      {
        label: "Our own coopers",
        copy: "Every cask is raised, toasted and charred on site, by hand.",
      },
      {
        label: "Dunnage",
        copy: "Casks racked two high on old timber floors, where the air is cold and damp.",
      },
      {
        label: "Eighteen years",
        copy: "Bottled at natural strength. No chill-filtering, no added colour.",
      },
    ],
  },

  notes: {
    eyebrow: "04 — Notes",
    heading: "What the glass keeps.",
    items: [
      { name: "Dried fig", note: "The European oak, first and loudest." },
      {
        name: "Heather honey",
        note: "Speyside in a sentence. Soft, floral, never cloying.",
      },
      {
        name: "Seville orange peel",
        note: "Arrives mid-palate, bitter-bright, with clove behind it.",
      },
      {
        name: "Cedar smoke",
        note: "The virgin-oak finish. What stays on the glass when it is empty.",
      },
    ],
  },

  story: {
    eyebrow: "05 — Our story",
    quote:
      "“We have never been in a hurry. The warehouse is cold in January and damp all year, and the cask breathes both. That is the whole recipe. The rest is just not interfering.”",
    attribution: "Fourth-generation distiller",
  },

  barrel: {
    eyebrow: "06 — The barrel",
    heading: "Five hundred litres of European oak, and eighteen winters.",
    body: "First-fill European oak gives the fig and the dark honey; nine months in charred virgin oak adds the cedar and clove. The spirit goes in clear. Eighteen years later it comes out the colour of the wood it lived in.",
  },

  find: {
    eyebrow: "07 — Find a bottle",
    heading: "Allocated, and worth the asking.",
    cta: "Find a bottle",
    disclaimer:
      "Blackwood is a fictional brand, built by Webcraft to demonstrate a concept site · Please drink responsibly",
  },
};

export const pl: typeof en = {
  announce: "Speyside · od 1887 · Destylowana i butelkowana w destylarni",
  nav: ["Whisky", "Rzemiosło", "Nasza historia", "Gdzie kupić"],
  navCta: "Gdzie kupić",
  railSection: (n: number, total: number) => `Sekcja ${n} z ${total}`,

  hero: {
    region: "Speyside",
    est: "od 1887",
    titleA: "Wolny ogień,",
    titleB: "długa ciemność.",
    lead: "Single malt scotch whisky, osiemnaście zim w ciemności. Czas jest jedynym składnikiem, którego nie da się kupić.",
    link: "Nasza historia",
    scroll: "Przewiń — piwnica sama do Ciebie przyjdzie",
  },

  whisky: {
    eyebrow: "02 — Whisky",
    heading: "Jedno zboże i osiemnaście lat cierpliwości.",
    mash: [
      {
        pct: "100%",
        grain: "Słodowany jęczmień",
        copy: "Jedno zboże i nic, za czym można się schować. Słodowany na klepisku, torfowany lekko, nigdy mocno.",
      },
      {
        pct: "18",
        grain: "Zim",
        copy: "W beczkach z europejskiego dębu pierwszego napełnienia, w magazynie o ciemnej drewnianej podłodze i bez ogrzewania.",
      },
      {
        pct: "9",
        grain: "Miesięcy",
        copy: "Finisz: wypalany dąb dziewiczy — dość długo na przyprawę, dość krótko, żeby zachować owoc.",
      },
    ],
  },

  craft: {
    eyebrow: "03 — Rzemiosło",
    heading: "Beczki powstają tutaj, ręcznie.",
    body: "Nasi bednarze składają każdą beczkę na podwórzu za destylarnią, a potem opalają ją i wypalają nad otwartym ogniem, aż klepki pokryją się pęcherzami. Destylat spędza w jednej z nich osiemnaście lat. Nic w tym nie jest wydajne. I o to właśnie chodzi.",
    items: [
      {
        label: "Dwa alembiki",
        copy: "Miedziane, o cebulastych szyjkach, prowadzone wolno, żeby destylat został lekki i kwiatowy.",
      },
      {
        label: "Właśni bednarze",
        copy: "Każda beczka jest tu składana, opalana i wypalana ręcznie.",
      },
      {
        label: "Dunnage",
        copy: "Beczki leżakują w dwóch poziomach na starej drewnianej podłodze, gdzie powietrze jest zimne i wilgotne.",
      },
      {
        label: "Osiemnaście lat",
        copy: "Butelkowana w naturalnej mocy. Bez filtracji na zimno, bez dodatku barwnika.",
      },
    ],
  },

  notes: {
    eyebrow: "04 — Nuty",
    heading: "To, co zostaje w kieliszku.",
    items: [
      { name: "Suszona figa", note: "Europejski dąb — pierwszy i najgłośniejszy." },
      {
        name: "Miód wrzosowy",
        note: "Speyside w jednym zdaniu. Miękki, kwiatowy, nigdy mdląco słodki.",
      },
      {
        name: "Skórka gorzkiej pomarańczy",
        note: "Wchodzi w środku, gorzko-jasna, z goździkiem w tle.",
      },
      {
        name: "Cedrowy dym",
        note: "Finisz z dębu dziewiczego. To, co zostaje w kieliszku, gdy jest już pusty.",
      },
    ],
  },

  story: {
    eyebrow: "05 — Nasza historia",
    quote:
      "„Nigdy się nie spieszyliśmy. W styczniu magazyn jest zimny, a wilgotny przez cały rok — i beczka oddycha jednym i drugim. To cała receptura. Reszta polega na tym, żeby nie przeszkadzać.”",
    attribution: "Destylator czwartego pokolenia",
  },

  barrel: {
    eyebrow: "06 — Beczka",
    heading: "Pięćset litrów europejskiego dębu i osiemnaście zim.",
    body: "Europejski dąb pierwszego napełnienia daje figę i ciemny miód; dziewięć miesięcy w wypalanym dębie dziewiczym dokłada cedr i goździk. Destylat wchodzi przezroczysty. Osiemnaście lat później wychodzi w kolorze drewna, w którym mieszkał.",
  },

  find: {
    eyebrow: "07 — Gdzie kupić",
    heading: "Rozdzielana z przydziału — i warta swojej ceny.",
    cta: "Gdzie kupić",
    disclaimer:
      "Blackwood to marka fikcyjna, stworzona przez Webcraft jako projekt koncepcyjny · Pij odpowiedzialnie",
  },
};

/**
 * The demo follows the SITE-WIDE locale rather than holding its own, so a
 * visitor reading the studio page in English does not get a Polish distillery
 * demo on top of it. Requires LanguageProvider above it in the tree;
 * app/layout.tsx wraps the whole app, so that holds for both the grid card and
 * the fullscreen player.
 */
export function useBlackwoodCopy() {
  const [locale] = useLocale();
  return locale === "en" ? en : pl;
}
