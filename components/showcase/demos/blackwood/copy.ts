"use client";

import { useLocale } from "@/components/i18n/LanguageProvider";
import { typeset } from "@/lib/i18n/typography";

/* ————————————————————————————————————————————————————————————————
 * BLACKWOOD — DEMO COPY, EN + PL  (CP4_62: full rewrite)
 *
 * Same pattern as demos/wisniowa/copy.ts: this does NOT belong in
 * lib/i18n/dictionaries.ts (that ships to every homepage visitor). `en` is the
 * typed source of truth and `pl` is declared `typeof en`, so a key added to
 * one language and not the other FAILS THE BUILD.
 *
 * THE LABEL IS THE SOURCE OF TRUTH. The bottle label is baked into the 3D
 * asset (label_basecolor in blackwood_bottle.glb); words are cheaper to move
 * than textures, so every fact here must agree with it:
 *   Speyside · Est. 1887 · Single Malt Scotch Whisky · 18 years old
 *   first-fill European oak, then 9 months in charred virgin oak from the
 *   distillery's own coopers · Cask No. 0447 · Bottle 0186 / 1200
 *   non chill-filtered · natural colour · 40% ALC/VOL · 700 ml
 *   Nose: dried fig, heather honey, cedar smoke
 *   Palate: toffee, clove, Seville orange peel
 *   Finish: long, drying, faintly saline
 * DO NOT write "natural strength" / "cask strength" (the label says 40%), DO
 * NOT write "single cask" (1,200 × 700 ml is more than one cask yields), and
 * DO NOT mention peat (the smoke is the char, the label never says peat).
 *
 * VOICE RULES: facts carry the emotion — numbers, names, places. One aphorism
 * per page, and it is the hero headline. No "patience", "craft", "passion",
 * "tradition", "we believe". Morag Innes and Warehouse No. 4 are invented,
 * like the brand; the footer says so.
 *
 * PL is written as Polish copy, not translated line by line. Kept in English:
 * "BLACKWOOD", "Speyside", "Spey", "single malt", "dunnage" (Polish whisky
 * writing keeps these). PL numbers follow Polish typography (1200, 40%).
 * Hero slogan (CP4_64): "Quietly exceptional", PL "Po cichu wyjątkowa" —
 * feminine, agreeing with the implied "whisky". Split over two lines; the
 * second is set in italic by BlackwoodSite.
 * ———————————————————————————————————————————————————————————————— */

export const en = {
  announce: "Speyside · Est. 1887 · Distilled, matured and bottled at the distillery",
  navCta: "Find a bottle",
  /** Rail: "Section 3 of 6" — the only string with interpolation. */
  railSection: (n: number, total: number) => `Section ${n} of ${total}`,

  hero: {
    titleA: "Quietly",
    titleB: "exceptional",
    lead: "An eighteen-year-old single malt from a warehouse by the Spey that has never been heated. 1,200 numbered bottles, and no second batch.",
    link: "Read about the cask",
    scroll: "Scroll down into Warehouse No. 4",
  },

  cask: {
    eyebrow: "The cask",
    /** The label's "18", set large: the page's one oversized piece of type.
     *  It replaces the "Age" row of the spec sheet rather than repeating it. */
    age: { figure: "18", unit: "Years old" },
    heading: "Eighteen years in old oak. Nine months in new.",
    spec: [
      { label: "Matured in", value: "First-fill European oak" },
      { label: "Finished in", value: "9 months, charred virgin oak" },
      { label: "Cask", value: "No. 0447" },
      { label: "Strength", value: "40% ABV · 700 ml" },
      { label: "Release", value: "1,200 bottles" },
    ],
    body: "No colouring, no chill-filtering. The European oak gives the fig and the dark honey. The new, charred oak adds cedar and clove, and gets nine months rather than a year so it doesn’t bury them.",
  },

  distillery: {
    eyebrow: "The distillery",
    heading: "The casks are made fifty yards from the stills.",
    body: "Blackwood has malted, distilled, coopered and bottled on the same bend of the Spey since 1887. Nothing leaves the site until it is in a bottle.",
    items: [
      {
        label: "The floor maltings",
        copy: "Barley is steeped, spread on a stone floor and turned by hand for six days before the kiln.",
      },
      {
        label: "Two copper stills",
        copy: "Onion-necked and run slowly, which keeps the spirit light enough to take eighteen years of wood.",
      },
      {
        label: "The cooperage",
        copy: "Our coopers raise, toast and char every finishing cask in the yard behind the stillhouse.",
      },
      {
        label: "Warehouse No. 4",
        copy: "Dunnage: brick walls, a timber floor, casks racked two high. Cold in winter, damp all year, never heated.",
      },
    ],
  },

  tasting: {
    eyebrow: "Tasting",
    heading: "Add a drop of water. Then wait a minute.",
    items: [
      {
        stage: "Nose",
        notes: "Dried fig, heather honey, cedar smoke.",
        comment: "The fig and honey are the European oak. The smoke is the char, not peat.",
      },
      {
        stage: "Palate",
        notes: "Toffee, clove, Seville orange peel.",
        comment: "Fuller than the nose suggests. The orange arrives late, and bitter.",
      },
      {
        stage: "Finish",
        notes: "Long, drying, faintly saline.",
        comment: "The cedar stays longest. Where the salt comes from, nobody at the distillery quite agrees.",
      },
    ],
  },

  voice: {
    eyebrow: "In the warehouse",
    quote:
      "“People ask what we do to it for eighteen years. Mostly, we leave it alone. We check the casks, we keep the doors shut in winter, and we don’t let anyone talk us into bottling it early.”",
    name: "Morag Innes",
    role: "Distillery manager, fourth generation at Blackwood",
  },

  find: {
    eyebrow: "Find a bottle",
    heading: "1,200 bottles. No second batch.",
    body: "Sold through a handful of specialist whisky shops and at the distillery door. Every bottle is numbered.",
    cta: "Find a stockist",
    ctaClose: "Hide stockists",
    storesNote: "Allocations are small — call ahead to reserve a numbered bottle.",
    stores: [
      { name: "Dramfield & Co.", place: "Edinburgh" },
      { name: "The Cooper’s Shelf", place: "Aberdeen" },
      { name: "North Pour Fine Spirits", place: "Glasgow" },
      { name: "Blackwood Distillery Shop", place: "Craigellachie, Speyside" },
    ],
    disclaimer:
      "Blackwood is a fictional brand, built by Webcraft to demonstrate a concept site. Please drink responsibly.",
  },
};

export const pl: typeof en = {
  announce: "Speyside · Zał. 1887 · Destylowana, leżakowana i butelkowana w destylarni",
  navCta: "Gdzie kupić",
  railSection: (n: number, total: number) => `Sekcja ${n} z ${total}`,

  hero: {
    titleA: "Po cichu",
    titleB: "wyjątkowa",
    lead: "Osiemnastoletnia whisky single malt z magazynu nad rzeką Spey, którego nigdy nie ogrzewano. 1200 numerowanych butelek i żadnej drugiej partii.",
    link: "Poznaj beczkę",
    scroll: "Przewiń w dół, do magazynu nr 4",
  },

  cask: {
    eyebrow: "Beczka",
    age: { figure: "18", unit: "Lat" },
    heading: "Osiemnaście lat w starym dębie. Dziewięć miesięcy w nowym.",
    spec: [
      { label: "Leżakowanie", value: "Dąb europejski, pierwsze napełnienie" },
      { label: "Finisz", value: "9 miesięcy, wypalany dąb dziewiczy" },
      { label: "Beczka", value: "Nr 0447" },
      { label: "Moc", value: "40% obj. · 700 ml" },
      { label: "Wydanie", value: "1200 butelek" },
    ],
    body: "Bez barwienia, bez filtracji na zimno. Europejski dąb daje figę i ciemny miód. Nowy, wypalany dąb dokłada cedr i goździk. Dostaje dziewięć miesięcy, a nie rok, żeby ich nie przykryć.",
  },

  distillery: {
    eyebrow: "Destylarnia",
    heading: "Beczki powstają pięćdziesiąt metrów od alembików.",
    body: "Od 1887 roku słodujemy, destylujemy, robimy beczki i butelkujemy w tym samym zakolu Spey. Nic nie opuszcza destylarni, zanim nie trafi do butelki.",
    items: [
      {
        label: "Słodownia klepiskowa",
        copy: "Jęczmień namaczamy, rozkładamy na kamiennej posadzce i przez sześć dni przerzucamy ręcznie, zanim trafi do suszarni.",
      },
      {
        label: "Dwa miedziane alembiki",
        copy: "O cebulastych szyjkach, prowadzone powoli. Dzięki temu destylat jest dość lekki, by wytrzymać osiemnaście lat w drewnie.",
      },
      {
        label: "Bednarnia",
        copy: "Nasi bednarze składają, opalają i wypalają każdą beczkę do finiszu na podwórzu za budynkiem destylacji.",
      },
      {
        label: "Magazyn nr 4",
        copy: "Dunnage: ceglane mury, drewniana podłoga, beczki w dwóch rzędach. Zimą chłodno, przez cały rok wilgotno, nigdy nie był ogrzewany.",
      },
    ],
  },

  tasting: {
    eyebrow: "Degustacja",
    heading: "Dodaj kroplę wody. Odczekaj minutę.",
    items: [
      {
        stage: "Nos",
        notes: "Suszona figa, miód wrzosowy, cedrowy dym.",
        comment: "Figa i miód to europejski dąb. Dym pochodzi z wypalonej beczki, nie z torfu.",
      },
      {
        stage: "Smak",
        notes: "Toffi, goździk, skórka gorzkiej pomarańczy.",
        comment: "Pełniejszy, niż zapowiada nos. Pomarańcza pojawia się późno i jest gorzka.",
      },
      {
        stage: "Finisz",
        notes: "Długi, wytrawny, lekko słony.",
        comment: "Najdłużej zostaje cedr. Skąd sól? W destylarni nikt nie jest do końca pewien.",
      },
    ],
  },

  voice: {
    eyebrow: "W magazynie",
    quote:
      "„Ludzie pytają, co z nią robimy przez osiemnaście lat. Głównie zostawiamy ją w spokoju. Sprawdzamy beczki, zimą trzymamy drzwi zamknięte i nie dajemy się nikomu namówić, żeby butelkować wcześniej.”",
    name: "Morag Innes",
    role: "Kierowniczka destylarni, czwarte pokolenie w Blackwood",
  },

  find: {
    eyebrow: "Gdzie kupić",
    heading: "1200 butelek. Drugiej partii nie będzie.",
    body: "W sprzedaży w kilku specjalistycznych sklepach z whisky i w sklepie przy destylarni. Każda butelka jest numerowana.",
    cta: "Znajdź sklep",
    ctaClose: "Zwiń listę",
    storesNote: "Pula jest niewielka — zadzwoń, aby zarezerwować numerowaną butelkę.",
    stores: [
      { name: "Dramfield & Co.", place: "Edynburg" },
      { name: "The Cooper’s Shelf", place: "Aberdeen" },
      { name: "North Pour Fine Spirits", place: "Glasgow" },
      { name: "Sklep przy destylarni Blackwood", place: "Craigellachie, Speyside" },
    ],
    disclaimer:
      "Blackwood to fikcyjna marka, stworzona przez Webcraft jako projekt koncepcyjny. Pij odpowiedzialnie.",
  },
};

/**
 * The demo follows the SITE-WIDE locale rather than holding its own, so a
 * visitor reading the studio page in English does not get a Polish distillery
 * demo on top of it. Requires LanguageProvider above it in the tree.
 */
export function useBlackwoodCopy() {
  const [locale] = useLocale();
  return locale === "en" ? EN_SET : PL_SET;
}

/* No-break spaces (lib/i18n/typography.ts): keeps "1200 butelek", "40% obj."
 * and Polish one-letter words ("z", "i", "w") off the ends of lines. */
const EN_SET = typeset(en, "en");
const PL_SET = typeset(pl, "pl");
