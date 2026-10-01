import { describe, it, expect } from "vitest";
import { addBusinessDays, businessDaysAfter, isBusinessDay, plHolidays, warsawDate } from "./days";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("business days (PL)", () => {
  it("knows the moving holidays", () => {
    const h = plHolidays(2026); // Easter 2026: 5 April
    expect(h.has("2026-04-06")).toBe(true); // Easter Monday
    expect(h.has("2026-06-04")).toBe(true); // Corpus Christi
    expect(h.has("2026-12-24")).toBe(true);
    expect(isBusinessDay(d("2026-11-11"))).toBe(false);
    expect(isBusinessDay(d("2026-10-03"))).toBe(false); // Saturday
    expect(isBusinessDay(d("2026-10-05"))).toBe(true);
  });

  it("uses the Warsaw date, not UTC", () => {
    // 23:30 UTC on 1 Oct is already 2 Oct in Warsaw (UTC+2 in summer)
    expect(warsawDate("2026-10-01T23:30:00Z").toISOString().slice(0, 10)).toBe("2026-10-02");
  });

  it("counts days after the start, so same day = 0 and Fri to Mon = 1", () => {
    expect(businessDaysAfter("2026-10-01T08:00:00Z", "2026-10-01T15:00:00Z")).toBe(0);
    expect(businessDaysAfter("2026-10-02T08:00:00Z", "2026-10-05T08:00:00Z")).toBe(1);
    expect(businessDaysAfter("2026-11-10T08:00:00Z", "2026-11-12T08:00:00Z")).toBe(1); // skips 11 Nov
  });

  it("adds business days over weekends and holidays", () => {
    // Thu 1 Oct + 5 = Thu 8 Oct
    expect(addBusinessDays("2026-10-01T10:00:00Z", 5).toISOString().slice(0, 10)).toBe("2026-10-08");
    // Mon 9 Nov + 2 = Thu 12 Nov (11 Nov is a holiday)
    expect(addBusinessDays("2026-11-09T10:00:00Z", 2).toISOString().slice(0, 10)).toBe("2026-11-12");
  });
});
