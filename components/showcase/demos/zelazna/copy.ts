"use client";

import { useLocale } from "@/components/i18n/LanguageProvider";

/* ————————————————————————————————————————————————————————————————
 * ŻELAZNA — DEMO COPY, PL + EN
 *
 * Same pattern as demos/wisniowa/copy.ts and demos/blackwood/copy.ts: this is
 * NOT in lib/i18n/dictionaries.ts because that file ships to every homepage
 * visitor, and this demo is a lazy chunk. `pl` is the typed source of truth
 * (the demo was written in Polish) and `en` is declared `typeof pl`, so a key
 * added to one and not the other fails the build.
 *
 * DAY IDS ARE NOT TRANSLATED. `DAYS` below is a list of stable ids used as
 * React state for the timetable filter; the visible label is looked up per
 * locale. Translating the ids would reset the selected day the moment anyone
 * flipped the language switch — the same rule the Wiśniowa booking scopes
 * follow.
 *
 * NOT TRANSLATED, DELIBERATELY:
 *  · "ŻELAZNA" — a brand name.
 *  · Coach names. The club is in Warsaw; Marta Rutka stays Marta Rutka.
 *  · The street. `ul.` is left as-is — it is what is written on the building.
 *  · Prices stay in złoty: "35 zł" in Polish, "PLN 35" in English. NEVER
 *    converted — a converted number is false the moment the rate moves, and
 *    the member pays złoty either way.
 * ———————————————————————————————————————————————————————————————— */

/** Stable ids for the timetable filter. Order = display order. */
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Day = (typeof DAYS)[number];

/** Stable ids for the class names used in SCHEDULE below. */
export type ClassId =
  | "basics"
  | "squatDeadlift"
  | "openFloor"
  | "mobility"
  | "benchTechnique"
  | "kettlebell"
  | "level2"
  | "longSaturday"
  | "intro";

/** The timetable itself is DATA (day / time / coach / spots) — only the class
 *  NAME is language-dependent, and that is looked up by id. */
export const SCHEDULE: {
  day: Day;
  time: string;
  classId: ClassId;
  coach: string | null;
  spots: number;
}[] = [
  { day: "mon", time: "06:30", classId: "basics", coach: "M. Rutka", spots: 4 },
  { day: "mon", time: "17:00", classId: "squatDeadlift", coach: "M. Rutka", spots: 2 },
  { day: "mon", time: "19:30", classId: "openFloor", coach: null, spots: 12 },
  { day: "tue", time: "07:00", classId: "mobility", coach: "A. Bielas", spots: 6 },
  { day: "tue", time: "18:00", classId: "benchTechnique", coach: "P. Sowiński", spots: 3 },
  { day: "wed", time: "06:30", classId: "basics", coach: "M. Rutka", spots: 5 },
  { day: "wed", time: "17:00", classId: "kettlebell", coach: "A. Bielas", spots: 8 },
  { day: "wed", time: "19:30", classId: "openFloor", coach: null, spots: 12 },
  { day: "thu", time: "07:00", classId: "mobility", coach: "A. Bielas", spots: 7 },
  { day: "thu", time: "18:00", classId: "level2", coach: "P. Sowiński", spots: 1 },
  { day: "fri", time: "17:00", classId: "squatDeadlift", coach: "M. Rutka", spots: 4 },
  { day: "fri", time: "19:00", classId: "openFloor", coach: null, spots: 12 },
  { day: "sat", time: "09:00", classId: "longSaturday", coach: "P. Sowiński", spots: 9 },
  { day: "sat", time: "11:00", classId: "intro", coach: "M. Rutka", spots: 6 },
];

/** Stat numerals and roster years are data; only their labels translate. */
export const STAT_VALUES = ["412", "6", "21", "2014"];
export const ROSTER_PEOPLE = [
  { n: "01", name: "Marta Rutka", years: 11 },
  { n: "02", name: "Piotr Sowiński", years: 8 },
  { n: "03", name: "Anna Bielas", years: 6 },
];

export const pl = {
  bar: {
    address: "ul. Kotlarska 8 · Warszawa",
    hours: "Pon–Pt 06:00–22:00 · Sob 08:00–15:00",
    phone: "+48 22 000 00 00",
  },
  nav: ["Klub", "Grafik", "Trenerzy", "Cennik"],
  navCta: "Pierwszy trening",

  hero: {
    eyebrow: "Klub siłowy · od 2014",
    titleA: "Siła nie jest",
    titleAccent: "dodatkiem",
    titleMid: " do",
    titleB: "reszty życia.",
    lead: "Prowadzimy jedną salę i sześć osób na zajęciach. Bez lustrzanych ścian, bez muzyki, którą trzeba przekrzykiwać. Uczymy trzech ruchów porządnie i zostawiamy Ci resztę czasu na trening.",
    linkSchedule: "Zobacz grafik",
    linkPrices: "Cennik",
  },

  stats: [
    "m² hali treningowej",
    "osób maksymalnie w grupie",
    "stanowisk do podnoszenia",
    "rok otwarcia klubu",
  ],

  schedule: {
    eyebrow: "Grafik",
    heading: "Tydzień w klubie",
    note: "Zapis na zajęcia otwiera się siedem dni wcześniej",
    dayLabels: {
      mon: "PON",
      tue: "WT",
      wed: "ŚR",
      thu: "CZW",
      fri: "PT",
      sat: "SOB",
    } as Record<Day, string>,
    classNames: {
      basics: "Trening siłowy — podstawy",
      squatDeadlift: "Przysiad i martwy ciąg",
      openFloor: "Otwarta sala",
      mobility: "Mobilność i przygotowanie",
      benchTechnique: "Wyciskanie — technika",
      kettlebell: "Kettlebell",
      level2: "Trening siłowy — poziom 2",
      longSaturday: "Sobotni trening długi",
      intro: "Wprowadzenie dla nowych",
    } as Record<ClassId, string>,
    noCoach: "bez prowadzącego",
    /** "ostatnie 2" when two or fewer places remain. */
    lastSpots: (n: number) => `ostatnie ${n}`,
    spots: (n: number) => `${n} miejsc`,
  },

  roster: {
    eyebrow: "Prowadzący",
    specialties: [
      "Trójbój siłowy · technika podstawowa",
      "Trening siłowy · powrót po kontuzji",
      "Mobilność · przygotowanie motoryczne",
    ],
    years: (n: number) => `${n} lat`,
  },

  prices: {
    eyebrow: "Cennik",
    heading: "Trzy sposoby, żeby wejść",
    items: [
      {
        name: "Wejście jednorazowe",
        price: "35 zł",
        note: "Bez zapisu. Sala otwarta w godzinach klubu.",
        tag: "",
      },
      {
        name: "Karnet miesięczny",
        price: "179 zł",
        note: "Pełny dostęp do sali i zajęć grupowych.",
        tag: "Najczęściej wybierany",
      },
      {
        name: "Prowadzenie indywidualne",
        price: "od 420 zł",
        note: "Cztery spotkania w miesiącu, własny plan.",
        tag: "",
      },
    ],
    note: "Karnet bez umowy terminowej · rezygnacja na koniec opłaconego miesiąca",
  },

  cta: {
    eyebrow: "Pierwszy raz",
    heading: "Wprowadzenie w sobotę, 0 zł",
    body: "Godzina we dwoje z prowadzącym: sprawdzamy, jak się ruszasz, i pokazujemy trzy ruchy, na których stoi cały plan. Bez zapisu na karnet.",
    button: "Zapisz się na sobotę",
    orCall: "lub zadzwoń · +48 22 000 00 00",
  },

  footer: {
    addressLine1: "ul. Kotlarska 8",
    addressLine2: "00-000 Warszawa",
    hours: ["Pon–Pt 06:00–22:00", "Sob 08:00–15:00", "Niedziela nieczynne"],
    email: "kontakt@zelazna.example",
    phone: "+48 22 000 00 00",
    disclaimer:
      "Żelazna jest marką fikcyjną, stworzoną przez Webcraft jako projekt koncepcyjny. Klub, ceny, grafik i osoby nie istnieją.",
  },
};

export const en: typeof pl = {
  bar: {
    address: "ul. Kotlarska 8 · Warsaw",
    hours: "Mon–Fri 06:00–22:00 · Sat 08:00–15:00",
    phone: "+48 22 000 00 00",
  },
  nav: ["The club", "Timetable", "Coaches", "Prices"],
  navCta: "First session",

  hero: {
    eyebrow: "Strength club · since 2014",
    titleA: "Strength isn’t",
    titleAccent: "an add-on",
    titleMid: " to",
    titleB: "the rest of your life.",
    lead: "One training floor, six people to a class. No mirrored walls, no music you have to shout over. We teach three lifts properly and leave you the rest of the hour to train.",
    linkSchedule: "See the timetable",
    linkPrices: "Prices",
  },

  stats: [
    "m² of training floor",
    "people per class, maximum",
    "lifting stations",
    "the year the club opened",
  ],

  schedule: {
    eyebrow: "Timetable",
    heading: "A week at the club",
    note: "Booking opens seven days ahead",
    dayLabels: {
      mon: "MON",
      tue: "TUE",
      wed: "WED",
      thu: "THU",
      fri: "FRI",
      sat: "SAT",
    } as Record<Day, string>,
    classNames: {
      basics: "Strength training — basics",
      squatDeadlift: "Squat and deadlift",
      openFloor: "Open floor",
      mobility: "Mobility and prep",
      benchTechnique: "Bench press — technique",
      kettlebell: "Kettlebell",
      level2: "Strength training — level 2",
      longSaturday: "The long Saturday session",
      intro: "Intro session for newcomers",
    } as Record<ClassId, string>,
    noCoach: "unsupervised",
    lastSpots: (n: number) => `last ${n}`,
    spots: (n: number) => `${n} places`,
  },

  roster: {
    eyebrow: "Coaches",
    specialties: [
      "Powerlifting · fundamental technique",
      "Strength training · return from injury",
      "Mobility · athletic preparation",
    ],
    years: (n: number) => `${n} years`,
  },

  prices: {
    eyebrow: "Prices",
    heading: "Three ways in",
    items: [
      {
        name: "Drop-in session",
        price: "PLN 35",
        note: "No booking. Open floor during club hours.",
        tag: "",
      },
      {
        name: "Monthly pass",
        price: "PLN 179",
        note: "Full access to the floor and to group classes.",
        tag: "Most popular",
      },
      {
        name: "One-to-one coaching",
        price: "from PLN 420",
        note: "Four sessions a month, on a plan of your own.",
        tag: "",
      },
    ],
    note: "No fixed-term contract · cancel at the end of the month you have paid for",
  },

  cta: {
    eyebrow: "First time",
    heading: "Saturday intro session, free",
    body: "An hour one-to-one with a coach: we look at how you move and show you the three lifts the whole plan is built on. No pass required.",
    button: "Book a Saturday",
    orCall: "or call · +48 22 000 00 00",
  },

  footer: {
    addressLine1: "ul. Kotlarska 8",
    addressLine2: "00-000 Warsaw",
    hours: ["Mon–Fri 06:00–22:00", "Sat 08:00–15:00", "Closed on Sunday"],
    email: "kontakt@zelazna.example",
    phone: "+48 22 000 00 00",
    disclaimer:
      "Żelazna is a fictional brand, built by Webcraft as a concept project. The club, the prices, the timetable and the people do not exist.",
  },
};

/** Follows the SITE-WIDE locale — see the note in demos/wisniowa/copy.ts. */
export function useZelaznaCopy() {
  const [locale] = useLocale();
  return locale === "en" ? en : pl;
}
