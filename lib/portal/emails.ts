import type { Mail } from "@/lib/email";
import { replyBy, stageName, type Lang, type Package, type Stage } from "./checkpoints";

/**
 * The portal's email texts. Pure functions (tested), plain text, in the
 * project's language. Wording follows the kit's checkpoint rules: one
 * consolidated list, reply within 5 business days, reminders on days 2 and 3.
 */

export const longDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw",
  });

type CpMail = {
  to: string;
  lang: Lang;
  pkg: Package;
  clientName: string;
  stage: Stage;
  sentAt: string;
  portalUrl: string;
};

const sign = { pl: "Weturn", en: "Weturn" };

export function checkpointSentMail(m: CpMail & { note: string }): Mail {
  const stage = stageName(m.stage, m.pkg, m.lang);
  const by = longDate(replyBy(m.sentAt), m.lang);
  const note = m.note.trim() ? `\n${m.note.trim()}\n` : "";
  return m.lang === "pl"
    ? {
        to: m.to,
        subject: `${m.clientName}: etap „${stage}” czeka na Twoją opinię`,
        text: `Dzień dobry,

etap „${stage}” jest gotowy do sprawdzenia.
${note}
Otwórz swój portal, obejrzyj podgląd i wybierz:
• „Akceptuję”, jeśli wszystko gra, albo
• „Proszę o zmiany”, z jedną zebraną listą uwag (to jedna runda poprawek).

${m.portalUrl}

Prosimy o odpowiedź do ${by}. Bez odpowiedzi do tego dnia uznajemy etap za zaakceptowany i idziemy dalej.

${sign.pl}`,
      }
    : {
        to: m.to,
        subject: `${m.clientName}: "${stage}" is ready for your review`,
        text: `Hi,

the "${stage}" stage is ready to review.
${note}
Open your portal, look at the preview and choose:
• "Approve" if it's all good, or
• "Request changes" with one combined list of comments (that's one revision round).

${m.portalUrl}

Please reply by ${by}. If we don't hear back by then, we'll treat this stage as approved and carry on.

${sign.en}`,
      };
}

export function reminderMail(m: CpMail & { n: 1 | 2 }): Mail {
  const stage = stageName(m.stage, m.pkg, m.lang);
  const by = longDate(replyBy(m.sentAt), m.lang);
  if (m.lang === "pl") {
    return {
      to: m.to,
      subject: m.n === 1 ? `Przypomnienie: etap „${stage}” czeka na Ciebie` : `Ostatnie przypomnienie: etap „${stage}”`,
      text:
        m.n === 1
          ? `Dzień dobry,\n\nprzypominamy, że etap „${stage}” czeka na Twoją opinię:\n\n${m.portalUrl}\n\nWystarczy kliknąć „Akceptuję” albo wysłać jedną listę uwag. Odpowiedź do ${by}.\n\n${sign.pl}`
          : `Dzień dobry,\n\nnie dostaliśmy jeszcze opinii o etapie „${stage}”:\n\n${m.portalUrl}\n\nJeśli nie odezwiesz się do ${by}, uznamy ten etap za zaakceptowany i będziemy kontynuować.\n\n${sign.pl}`,
    };
  }
  return {
    to: m.to,
    subject: m.n === 1 ? `Reminder: "${stage}" is waiting for you` : `Last reminder: "${stage}"`,
    text:
      m.n === 1
        ? `Hi,\n\na friendly reminder that the "${stage}" stage is waiting for your review:\n\n${m.portalUrl}\n\nJust click "Approve" or send one list of comments. Please reply by ${by}.\n\n${sign.en}`
        : `Hi,\n\nwe haven't had your feedback on the "${stage}" stage yet:\n\n${m.portalUrl}\n\nIf we don't hear back by ${by}, we'll treat this stage as approved and continue.\n\n${sign.en}`,
  };
}

// ── Admin notices (always English: they're for us) ──────────────────────────

export const intakeSubmittedNotice = (clientName: string, adminUrl: string) => ({
  subject: `${clientName} sent the questionnaire`,
  text: `${clientName} sent the questionnaire.\n\nAnswers and files: ${adminUrl}\nNext: download the brief input and run /brief-to-plan.`,
});

export function checkpointAnsweredNotice(a: {
  clientName: string; stage: Stage; pkg: Package; approved: boolean; by: string; items: number; adminUrl: string; extra: boolean;
}) {
  const stage = stageName(a.stage, a.pkg, "en");
  const who = a.by ? ` (${a.by})` : "";
  return a.approved
    ? { subject: `${a.clientName} approved "${stage}"`, text: `${a.clientName}${who} approved "${stage}". It's locked.\n\n${a.adminUrl}` }
    : {
        subject: `${a.clientName} asked for changes on "${stage}"`,
        text:
          `${a.clientName}${who} sent ${a.items} comment${a.items === 1 ? "" : "s"} on "${stage}".` +
          (a.extra ? `\nThis round is past the included rounds: quote it (200 zł/h) before starting.` : "") +
          `\nOur turnaround: 1 business day.\n\n${a.adminUrl}`,
      };
}

export const autoApprovedNotice = (clientName: string, stage: Stage, pkg: Package, adminUrl: string) => ({
  subject: `"${stageName(stage, pkg, "en")}" auto-approved for ${clientName}`,
  text: `No reply from ${clientName} after 5 business days and two reminders, so "${stageName(stage, pkg, "en")}" is now approved and locked.\n\n${adminUrl}`,
});
