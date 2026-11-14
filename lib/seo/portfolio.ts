/**
 * /portfolio copy (outline pass, 2026-11-03).
 *
 * The case grid is skeleton placeholders on purpose: no projects are shown
 * until there are real client projects to show. PROJECT_STATE.md binds the
 * site to "no fake proof", so there are no invented clients, numbers or
 * testimonials here either. The demo sites live in the home page showcase.
 */
import type { Locale } from "@/lib/i18n/config";

export const PORTFOLIO_PATH = "/portfolio" as const;

/** The Efkapowa case (a real client project): the before/after with the recorded scroll of the new site. */
export type CaseCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  before: string;
  after: string;
  /** what the "before" panel is */
  beforeCaption: string;
  /** announced and shown once, until the visitor scrolls */
  hint: string;
  play: string;
  pause: string;
  stagesLabel: string;
  /** one name per stage of the story, in order (see EFKAPOWA.stages) */
  stages: string[];
  /** read by screen readers in place of the moving picture */
  summary: string;
  facts: { h: string; p: string }[];
  note: string;
};

export type PortfolioCopy = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  case: CaseCopy;
  workHeading: string;
  /** read by screen readers in place of the skeleton cards */
  placeholderStatus: string;
  nextHeading: string;
  nextBody: string;
  cta: string;
  secondaryCta: string;
};

export const PORTFOLIO: Record<Locale, PortfolioCopy> = {
  pl: {
    title: "Portfolio | Weturn Studio",
    description:
      "Portfolio Weturn Studio: strona pisarki Ewy Mysłowskiej przed i po. Zobacz, jak dotychczasowa strona zmienia się w nową, i zamów wycenę.",
    eyebrow: "Portfolio",
    h1: "Pierwsza realizacja.",
    intro:
      "Dopiero zaczynamy i pokazujemy tylko prawdziwe projekty. Poniżej strona pisarki, przed i po. Strony demo obejrzysz na stronie głównej.",
    case: {
      eyebrow: "Realizacja · 2026",
      title: "Ewa Mysłowska: strona pisarki",
      intro:
        "Strona powieści „Drobne niedogodności”. Dotychczasowa działała na szablonie WordPress. Nowa jest napisana od podstaw i pokazuje ruchem to, co okładka: okno, przez które wchodzi się do historii.",
      before: "Przed",
      after: "Po",
      beforeCaption: "ewamyslowska.pl",
      hint: "Przewijaj stronę, żeby zobaczyć ruch",
      play: "Odtwórz",
      pause: "Zatrzymaj",
      stagesLabel: "Etapy animacji",
      stages: [
        "Początek",
        "Okiennice",
        "Okno",
        "Pokój",
        "Biurko",
        "Kartka",
        "List",
      ],
      summary:
        "Porównanie stron: po lewej dotychczasowa strona pisarki, po prawej nowa. Przy przewijaniu nowa strona otwiera okiennice, wchodzi przez okno do pokoju, podchodzi do biurka i kończy na liście z opisem książki.",
      facts: [
        {
          h: "Okno z okładki otwiera stronę",
          p: "Scena przewijana prowadzi od okna z okładki, przez pokój, do listu z opisem książki.",
        },
        {
          h: "Kolory ziemi zostały",
          p: "Paleta z dotychczasowej strony zostaje, a pierwszy ekran ma jedno główne działanie: kup książkę.",
        },
        {
          h: "Reszta jest prosta",
          p: "Pierwszy rozdział do przeczytania, strona o autorce i kontakt. Bez formularzy i bez zbierania danych.",
        },
      ],
      note: "Po lewej dotychczasowa strona, po prawej nagranie przewijania nowej (1440 px szerokości).",
    },
    workHeading: "Prace",
    placeholderStatus: "Kolejne realizacje pojawią się wkrótce.",
    nextHeading: "Twoja marka może być pierwsza.",
    nextBody:
      "Stawki założycielskie obejmują pierwsze projekty, a wycenę dostajesz przed startem prac.",
    cta: "Zamów darmową wycenę",
    secondaryCta: "Zobacz cennik",
  },
  en: {
    title: "Portfolio | Weturn Studio",
    description:
      "Weturn Studio portfolio: author Ewa Mysłowska's website, before and after. See how the old site turns into the new one, and get a quote.",
    eyebrow: "Portfolio",
    h1: "Our first project.",
    intro:
      "We are new and show only real projects. Below is an author's website, before and after. You can try the demo sites on the home page.",
    case: {
      eyebrow: "Project · 2026",
      title: "Ewa Mysłowska: an author's website",
      intro:
        "The website for the novel “Drobne niedogodności”. The old one ran on a WordPress theme. The new one is written from scratch and shows in motion what the cover shows: a window you step through into the story.",
      before: "Before",
      after: "After",
      beforeCaption: "ewamyslowska.pl",
      hint: "Scroll the page to see the motion",
      play: "Play",
      pause: "Pause",
      stagesLabel: "Animation stages",
      stages: [
        "Start",
        "Shutters",
        "Window",
        "Room",
        "Desk",
        "Paper",
        "Letter",
      ],
      summary:
        "A comparison of two websites: on the left the author's existing site, on the right the new one. As you scroll, the new site opens its shutters, steps through the window into a room, moves to the desk and ends on a letter with the book's description.",
      facts: [
        {
          h: "The cover's window opens the site",
          p: "A scroll scene leads from the window on the cover, through a room, to a letter with the book's description.",
        },
        {
          h: "Earth tones stayed",
          p: "The palette from the existing site stays, and the first screen has one main action: buy the book.",
        },
        {
          h: "The rest is simple",
          p: "A first chapter to read, a page about the author and contact. No forms and no data collection.",
        },
      ],
      note: "On the left the existing site, on the right a recording of the new site's scroll (1440 px wide).",
    },
    workHeading: "Work",
    placeholderStatus: "More projects are coming soon.",
    nextHeading: "Your brand could be first.",
    nextBody:
      "Founding rates cover the first projects, and you get a quote before any work starts.",
    cta: "Get a free quote",
    secondaryCta: "See pricing",
  },
};
