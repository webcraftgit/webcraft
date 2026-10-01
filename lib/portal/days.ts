/**
 * Business days, the way the project clock counts them: Monday to Friday,
 * minus Polish public holidays, on Warsaw calendar dates. Same rules as
 * Weturn Studio (agency-kit/tools/studio/electron/holidays.mjs), so the day
 * number a client sees in the portal matches the one in Studio.
 */

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Gregorian Easter Sunday (anonymous algorithm), as a UTC date. */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const shift = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};
const key = (d: Date) => iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());

const cache = new Map<number, Set<string>>();

/** "YYYY-MM-DD" Polish public holidays for one year. */
export function plHolidays(year: number): Set<string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const e = easter(year);
  const set = new Set([
    iso(year, 1, 1), iso(year, 1, 6), iso(year, 5, 1), iso(year, 5, 3), iso(year, 8, 15),
    iso(year, 11, 1), iso(year, 11, 11),
    iso(year, 12, 24), // Christmas Eve, a public holiday since 2025
    iso(year, 12, 25), iso(year, 12, 26),
    key(shift(e, 1)), // Easter Monday
    key(shift(e, 60)), // Corpus Christi
  ]);
  cache.set(year, set);
  return set;
}

/** The Warsaw calendar date of an instant, as a UTC-midnight Date. */
export function warsawDate(at: Date | string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(at)); // en-CA formats as YYYY-MM-DD
  return new Date(`${parts}T00:00:00Z`);
}

export function isBusinessDay(d: Date): boolean {
  const wd = d.getUTCDay();
  return wd !== 0 && wd !== 6 && !plHolidays(d.getUTCFullYear()).has(key(d));
}

/**
 * Business days d with from < d <= to, on Warsaw dates. A wait that starts
 * and ends on the same day is 0; Friday to Monday is 1.
 */
export function businessDaysAfter(from: Date | string, to: Date | string): number {
  const end = warsawDate(to);
  let d = warsawDate(from);
  let n = 0;
  // Bounded: a project is never years long, and a bad date shouldn't hang us.
  for (let i = 0; i < 2000 && d < end; i++) {
    d = shift(d, 1);
    if (isBusinessDay(d)) n++;
  }
  return n;
}

/** The Warsaw date `n` business days after `from` (n >= 1). */
export function addBusinessDays(from: Date | string, n: number): Date {
  let d = warsawDate(from);
  for (let left = n; left > 0; ) {
    d = shift(d, 1);
    if (isBusinessDay(d)) left--;
  }
  return d;
}
