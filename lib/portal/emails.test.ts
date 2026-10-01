import { describe, it, expect } from "vitest";
import { checkpointAnsweredNotice, checkpointSentMail, reminderMail } from "./emails";

const base = {
  to: "a@b.pl", pkg: "business" as const, clientName: "Dentica", stage: 2 as const,
  sentAt: "2026-10-05T09:00:00Z", portalUrl: "https://x/portal/t",
};

describe("portal emails", () => {
  it("checkpoint email: link, stage and reply-by date, in the client's language", () => {
    const pl = checkpointSentMail({ ...base, lang: "pl", note: "Zobacz nowe zdjęcia." });
    expect(pl.subject).toContain("Strona główna");
    expect(pl.text).toContain("https://x/portal/t");
    expect(pl.text).toContain("12 października"); // Mon 5 Oct + 5 business days
    expect(pl.text).toContain("Zobacz nowe zdjęcia.");
    const en = checkpointSentMail({ ...base, lang: "en", note: "" });
    expect(en.text).toContain("12 October");
    expect(en.text).toContain("treat this stage as approved");
  });

  it("the second reminder warns about approval", () => {
    expect(reminderMail({ ...base, lang: "en", n: 1 }).subject).toMatch(/^Reminder/);
    expect(reminderMail({ ...base, lang: "en", n: 2 }).text).toContain("treat this stage as approved");
    expect(reminderMail({ ...base, lang: "pl", n: 2 }).text).toContain("uznamy ten etap za zaakceptowany");
  });

  it("the admin notice flags a paid round", () => {
    const n = checkpointAnsweredNotice({
      clientName: "Dentica", stage: 1, pkg: "business", approved: false, by: "Anna", items: 3, adminUrl: "u", extra: true,
    });
    expect(n.text).toContain("3 comments");
    expect(n.text).toContain("200 zł/h");
  });
});
