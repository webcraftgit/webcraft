import { QUESTIONS, SECTIONS, missingRequired, type Answers, type FileCounts, type Question } from "./questions";

/**
 * Readable answers for admin: the project page shows them, and the brief
 * export hands them to the kit's /brief-to-plan skill, which maps them to
 * brief.md by question number (agency-kit/templates/intake/README.md).
 * Answer text stays exactly as the client wrote it: the skill keeps the
 * client's own words.
 */

export type AnswerLine = { label?: string; value: string };
export type ExportFile = { kind: "logo" | "photo"; original_name: string; size_bytes: number; mime: string };

/** One question's answer as label/value lines; [] when nothing is answered. */
export function answerLines(q: Question, a: Answers): AnswerLine[] {
  const lines: AnswerLine[] = [];
  for (const f of q.fields) {
    if (f.showIf && a[f.showIf.key] !== f.showIf.equals) continue;
    const v = a[f.key];
    if (v === undefined || v === "" || v === false) continue;
    let value: string;
    if (f.kind === "check") value = "yes";
    else if (f.kind === "choice") value = f.options?.find((o) => o.value === v)?.label.en ?? String(v);
    else value = String(v);
    lines.push({ label: f.label?.en, value });
  }
  return lines;
}

const PACKAGE = { launch: "Launch", business: "Business", signature: "Signature" } as const;

export function buildBriefInput(p: {
  clientName: string;
  package: keyof typeof PACKAGE;
  locale: "pl" | "en";
  submittedAt: string | null;
  answers: Answers;
  files: ExportFile[];
  exportedAt?: Date;
}): string {
  const counts = p.files.reduce<FileCounts>((c, f) => ({ ...c, [f.kind]: (c[f.kind] ?? 0) + 1 }), {});
  const missing = missingRequired(p.answers, counts);
  const out: string[] = [];
  const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

  out.push(
    `# Questionnaire answers: ${p.clientName}`,
    "",
    "> Exported from the Weturn client portal. Input for `/brief-to-plan`: map each answer to `brief.md` with the",
    "> question → brief field table in `agency-kit/templates/intake/README.md`. Answers are verbatim, in the client's language.",
    "",
    `- **Package:** ${PACKAGE[p.package]}`,
    `- **Portal language:** ${p.locale === "pl" ? "Polish" : "English"}`,
    `- **Questionnaire sent:** ${p.submittedAt ? day(p.submittedAt) : "not yet (draft answers)"}`,
    `- **Exported:** ${day(p.exportedAt ?? new Date())}`,
    "",
    "## Clock-start check",
    "",
    missing.length
      ? `**NOT READY.** Required questions still missing: ${missing.map((q) => `${q.n} (${q.title.en})`).join(", ")}.`
      : "**READY.** All required answers are in, and the logo and photos are either uploaded or covered by the fallback.",
    ""
  );

  SECTIONS.forEach((s, i) => {
    out.push(`## ${i + 1}. ${s.en}`, "");
    for (const q of QUESTIONS.filter((x) => x.section === i + 1)) {
      out.push(`### ${q.n}. ${q.title.en}${q.required ? " (required)" : ""}`, `_Brief: ${q.brief.join(", ")}_`, "");
      const lines = answerLines(q, p.answers);

      if (q.files) {
        const mine = p.files.filter((f) => f.kind === q.files!.kind);
        // Files win over a leftover "no logo / no photos" tick.
        const fallback = !mine.length && p.answers[q.files.fallbackKey] === true;
        if (mine.length) {
          out.push(`Files uploaded (${mine.length}), download them from the admin project page:`);
          for (const f of mine) out.push(`- ${f.original_name} (${f.mime}, ${Math.max(1, Math.round(f.size_bytes / 1024))} KB)`);
        } else out.push("No files uploaded.");
        if (fallback) out.push("", `Client chose the fallback: **${q.files.fallbackLabel.en}**.`);
        out.push("");
        continue;
      }

      if (!lines.length) out.push("_(no answer)_");
      else if (lines.length === 1 && !lines[0].label) out.push(fence(lines[0].value));
      else for (const l of lines) out.push(`- **${l.label ?? "Answer"}:** ${l.value.includes("\n") ? `\n${indent(l.value)}` : l.value}`);

      out.push("");
    }
  });

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Client text goes in a quote block so stray markdown in it can't restructure the file. */
const fence = (s: string) => s.split("\n").map((l) => `> ${l}`).join("\n");
const indent = (s: string) => s.split("\n").map((l) => `  > ${l}`).join("\n");
