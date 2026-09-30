import { describe, expect, it } from "vitest";
import { FIELDS, QUESTIONS, SECTIONS, missingRequired, progress, sanitizeAnswers, type Answers } from "./questions";

/** "Required for the clock to start", agency-kit/templates/intake/README.md. */
const KIT_REQUIRED = [1, 2, 3, 5, 6, 9, 11, 13, 14, 15, 17, 21, 22, 24, 25, 32];

/** A fully valid set of required answers, used as the base for each case. */
const complete: Answers = {
  q1: "Dentica", "q2.legal_name": "Dentica sp. z o.o.", "q2.nip": "5250000000", "q2.address": "ul. Puławska 1, Warszawa",
  "q3.name": "Anna Nowak", "q3.email": "anna@dentica.pl", "q3.phone": "+48 600 000 000",
  q5: "Mokotów", q6: "Book a visit", q9: "Families", q11: "Does it hurt?", q13: "Calm dentistry",
  q14: "Check-up 200 zł", q15: "Open until 20:00", q17: "calm, direct, expert", q21: "a.pl, b.pl", q22: "c.pl",
  "q24.none": true, "q25.none": true, q32: "kontakt@dentica.pl",
};

describe("question list", () => {
  it("has the kit's 35 questions, numbered 1–35 in order", () => {
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
    expect(QUESTIONS.every((q) => q.id === `q${q.n}`)).toBe(true);
  });

  it("marks exactly the kit's required questions as required", () => {
    expect(QUESTIONS.filter((q) => q.required).map((q) => q.n)).toEqual(KIT_REQUIRED);
  });

  it("uses unique field keys that belong to their question", () => {
    const keys = FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const q of QUESTIONS) for (const f of q.fields) expect(f.key === q.id || f.key.startsWith(`${q.id}.`)).toBe(true);
  });

  it("puts every question in a real section and has PL + EN text everywhere", () => {
    for (const q of QUESTIONS) {
      expect(q.section).toBeGreaterThanOrEqual(1);
      expect(q.section).toBeLessThanOrEqual(SECTIONS.length);
      expect(q.title.pl && q.title.en).toBeTruthy();
      for (const f of q.fields) if (f.label) expect(f.label.pl && f.label.en).toBeTruthy();
    }
  });

  it("gives every required non-file question at least one required field", () => {
    for (const q of QUESTIONS.filter((q) => q.required && !q.files)) expect(q.fields.some((f) => f.required)).toBe(true);
  });
});

describe("sanitizeAnswers", () => {
  it("drops unknown keys, bad choices, non-booleans on checks and empty strings", () => {
    expect(
      sanitizeAnswers({ q1: "Dentica", evil: "x", q18: "maybe", "q24.none": "true", q4: "   ", q30: "both" })
    ).toEqual({ q1: "Dentica", q30: "both" });
  });

  it("caps length, strips control chars, keeps newlines in textareas", () => {
    const out = sanitizeAnswers({ q1: `A\u0000B${"x".repeat(500)}`, q9: "line one\nline two" });
    expect(out.q1).toBe(`AB${"x".repeat(118)}`);
    expect(out.q9).toBe("line one\nline two");
  });

  it("returns an empty object for junk input", () => {
    expect(sanitizeAnswers(null)).toEqual({});
    expect(sanitizeAnswers([1, 2])).toEqual({});
    expect(sanitizeAnswers("q1")).toEqual({});
  });
});

describe("missingRequired", () => {
  it("is empty for a complete set", () => {
    expect(missingRequired(complete)).toEqual([]);
  });

  it("lists every required question for an empty form", () => {
    expect(missingRequired({}).map((q) => q.n)).toEqual(KIT_REQUIRED);
  });

  it("needs every required sub-field of a multi-field question", () => {
    const { "q2.nip": _, ...rest } = complete;
    expect(missingRequired(rest).map((q) => q.n)).toEqual([2]);
  });

  it("rejects a malformed email on a required email field", () => {
    expect(missingRequired({ ...complete, q32: "kontakt@" }).map((q) => q.n)).toEqual([32]);
  });

  it("accepts an upload or the fallback for logo and photos", () => {
    const noFallbacks = { ...complete, "q24.none": false, "q25.none": false };
    expect(missingRequired(noFallbacks).map((q) => q.n)).toEqual([24, 25]);
    expect(missingRequired(noFallbacks, { logo: 1, photo: 3 })).toEqual([]);
  });
});

describe("progress", () => {
  it("goes from 0 to 1", () => {
    expect(progress({})).toBe(0);
    const all: Answers = { ...complete };
    for (const q of QUESTIONS) for (const f of q.fields) {
      if (all[f.key] !== undefined || f.showIf) continue;
      all[f.key] = f.kind === "check" ? true : f.kind === "choice" ? f.options![0].value : f.kind === "email" ? "a@b.pl" : "x";
    }
    expect(progress(all)).toBe(1);
  });

  it("ignores a follow-up field whose trigger isn't selected", () => {
    expect(progress({ "q29.url": "https://booksy.com/x" })).toBe(0);
  });
});
