import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { answerLines, buildBriefInput } from "./export";

const q = (n: number) => QUESTIONS[n - 1];

const COMPLETE = {
  q1: "Dentica", "q2.legal_name": "Dentica sp. z o.o.", "q2.nip": "5250000000", "q2.address": "Puławska 1",
  "q3.name": "Anna", "q3.email": "anna@dentica.pl", "q3.phone": "600", q5: "Mokotów", q6: "Umówić wizytę",
  q9: "Rodziny", q11: "Czy to boli?\nIle to kosztuje?", q13: "Spokojna stomatologia", q14: "Przegląd 200 zł",
  q15: "Otwarte do 20:00", q17: "spokojnie", q21: "a.pl", q22: "b.pl", "q24.none": true, q32: "k@dentica.pl",
} as const;

const base = {
  clientName: "Dentica", package: "business" as const, locale: "pl" as const,
  submittedAt: "2026-09-30T10:00:00Z", exportedAt: new Date("2026-10-01T08:00:00Z"),
};

describe("answerLines", () => {
  it("labels multi-field answers and turns choices into their English label", () => {
    expect(answerLines(q(3), { "q3.name": "Anna", "q3.email": "a@b.pl" })).toEqual([
      { label: "Name", value: "Anna" },
      { label: "Email", value: "a@b.pl" },
    ]);
    expect(answerLines(q(18), { q18: "pan" })).toEqual([{ label: undefined, value: "\"Pan/Pani\" (formal)" }]);
  });

  it("hides a follow-up whose trigger isn't selected", () => {
    expect(answerLines(q(29), { q29: "no", "q29.url": "https://old.link" })).toEqual([{ label: undefined, value: "No" }]);
    expect(answerLines(q(29), { q29: "link", "q29.url": "https://booksy.com/x" })).toHaveLength(2);
  });
});

describe("buildBriefInput", () => {
  it("says READY with every required answer and a photo upload", () => {
    const md = buildBriefInput({
      ...base,
      answers: COMPLETE,
      files: [{ kind: "photo", original_name: "gabinet.jpg", size_bytes: 204800, mime: "image/jpeg" }],
    });
    expect(md).toContain("# Questionnaire answers: Dentica");
    expect(md).toContain("**READY.**");
    expect(md).toContain("- **Questionnaire sent:** 2026-09-30");
    expect(md).toContain("- gabinet.jpg (image/jpeg, 200 KB)");
    expect(md).toContain("Client chose the fallback: **No logo: name set in type**.");
  });

  it("ignores a leftover fallback tick once files are uploaded", () => {
    const md = buildBriefInput({
      ...base,
      answers: { ...COMPLETE, "q25.none": true },
      files: [{ kind: "photo", original_name: "a.jpg", size_bytes: 1024, mime: "image/jpeg" }],
    });
    expect(md).not.toContain("Design without photos");
  });

  it("lists what's missing when NOT READY, by number", () => {
    const md = buildBriefInput({ ...base, submittedAt: null, answers: { q1: "Dentica" }, files: [] });
    expect(md).toContain("not yet (draft answers)");
    expect(md).toMatch(/\*\*NOT READY\.\*\* Required questions still missing: 2 \(Company details for the site\), 3 /);
  });

  it("has all 35 questions with their brief fields, answers verbatim in quote blocks", () => {
    const md = buildBriefInput({ ...base, answers: COMPLETE, files: [] });
    for (const x of QUESTIONS) expect(md).toContain(`### ${x.n}. ${x.title.en}`);
    expect(md).toContain("_Brief: client.business_name_");
    expect(md).toContain("> Czy to boli?\n> Ile to kosztuje?");
    expect(md).toContain("_(no answer)_");
  });

  it("can't be restructured by markdown in client text", () => {
    const md = buildBriefInput({ ...base, answers: { ...COMPLETE, q35: "# Fake heading\n## 11. Injected" }, files: [] });
    expect(md).toContain("> # Fake heading\n> ## 11. Injected");
    expect(md.match(/^## /gm)?.length).toBe(11); // clock-start + 10 sections
  });
});
