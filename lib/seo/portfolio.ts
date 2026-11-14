/**
 * /portfolio copy. No invented clients, numbers or testimonials (PROJECT_STATE.md: no fake proof).
 */
import type { Locale } from "@/lib/i18n/config";

export const PORTFOLIO_PATH = "/portfolio" as const;

/** The Efkapowa case (a real client project): the before/after with the recorded scroll of the new site. */
export type CaseCopy = {
  title: string;
  before: string;
  after: string;
  /** what the "before" panel is */
  beforeCaption: string;
  /** announced and shown once, until the visitor scrolls */
  hint: string;
  play: string;
  pause: string;
  stagesLabel: string;
  /** the Przed / Po switch on a phone */
  viewLabel: string;
  prev: string;
  next: string;
  /** shown when the frames cannot be fetched */
  loadError: string;
  /** one name per stage of the story, in order (see EFKAPOWA.stages) */
  stages: string[];
  /** read by screen readers in place of the moving picture */
  summary: string;
};

export type PortfolioCopy = {
  title: string;
  description: string;
  h1: string;
  case: CaseCopy;
  workHeading: string;
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
    h1: "Portfolio",
    case: {
      title: "Ewa Mysłowska: strona pisarki",
      before: "Przed",
      after: "Po",
      beforeCaption: "ewamyslowska.pl",
      hint: "Przewijaj stronę, żeby zobaczyć ruch",
      play: "Odtwórz",
      pause: "Zatrzymaj",
      stagesLabel: "Etapy animacji",
      viewLabel: "Widok",
      prev: "Poprzedni etap",
      next: "Następny etap",
      loadError: "Nie udało się wczytać nagrania. Odśwież stronę.",
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
        "Porównanie stron pisarki: dotychczasowa (przed) i nowa (po). Przy przewijaniu nowa strona otwiera okiennice, wchodzi przez okno do pokoju, podchodzi do biurka i kończy na liście z opisem książki.",
    },
    workHeading: "Prace",
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
    h1: "Portfolio",
    case: {
      title: "Ewa Mysłowska: an author's website",
      before: "Before",
      after: "After",
      beforeCaption: "ewamyslowska.pl",
      hint: "Scroll the page to see the motion",
      play: "Play",
      pause: "Pause",
      stagesLabel: "Animation stages",
      viewLabel: "View",
      prev: "Previous stage",
      next: "Next stage",
      loadError: "The recording could not be loaded. Reload the page.",
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
        "A comparison of the author's two websites: the existing one (before) and the new one (after). As you scroll, the new site opens its shutters, steps through the window into a room, moves to the desk and ends on a letter with the book's description.",
    },
    workHeading: "Work",
    nextHeading: "Your brand could be first.",
    nextBody:
      "Founding rates cover the first projects, and you get a quote before any work starts.",
    cta: "Get a free quote",
    secondaryCta: "See pricing",
  },
};
