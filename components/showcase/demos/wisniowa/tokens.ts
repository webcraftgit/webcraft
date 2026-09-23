/* Shared by WisniowaSite.tsx and booking.tsx. */

export const T = {
  bg: "#F4EDE1",
  card: "#FDFAF3",
  ink: "#221A14",
  dark: "#1C140F",
  cream: "#F6EFE3",
  creamDim: "rgba(246,239,227,.74)",
  green: "#2E4737",
  greenDeep: "#263B2E",
  soft: "#DFE5DC",
  cherry: "#B33A45",
  /* Decorative amber (arrows, rules). NOT for text on cream: #BE8746 is 2.7:1
   * there. Text uses `amberText` (5.4:1 on bg) or `amberOnDark`. */
  amber: "#BE8746",
  amberText: "#8A5A22",
  amberOnDark: "#E2B577",
  /* Was #8B8377 (3.3:1 on bg) and carried 10–12px text — below AA. */
  muted: "#6B6357",
  body: "#4E463B",
  line: "rgba(34, 26, 20, 0.12)",
  lineStrong: "rgba(34, 26, 20, 0.28)",
  lineOnDark: "rgba(246,239,227,.15)",
};

export const PHONE = "22 000 00 00";
export const PHONE_HREF = "tel:+48220000000";
export const MAIL = "recepcja@wisniowa-demo.pl";

/* Opening hours as numbers, for the "open now" line. Must agree with the
 * `hours` strings in copy.ts — both are on screen at once, so a mismatch is
 * visible. Index = Date#getDay() (0 = Sunday); null = closed. */
const OPEN: ([number, number] | null)[] = [
  null,
  [8, 20],
  [8, 20],
  [8, 20],
  [8, 20],
  [8, 20],
  [9, 14],
];

export type OpenStatus =
  | { open: true; until: string }
  | { open: false; when: "today" | "tomorrow" | "monday"; at: string };

const hh = (h: number) => `${h}:00`;

/** Status in Warsaw time, whatever the visitor's own timezone. */
export function openStatus(now = new Date()): OpenStatus {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const h = Number(get("hour")) + Number(get("minute")) / 60;

  const today = OPEN[day];
  if (today && h >= today[0] && h < today[1]) return { open: true, until: hh(today[1]) };
  if (today && h < today[0]) return { open: false, when: "today", at: hh(today[0]) };

  const next = (day + 1) % 7;
  if (OPEN[next]) return { open: false, when: "tomorrow", at: hh(OPEN[next]![0]) };
  /* Only Saturday evening lands here: Sunday is closed, so it's Monday. */
  return { open: false, when: "monday", at: hh(OPEN[1]![0]) };
}
