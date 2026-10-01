import { describe, it, expect } from "vitest";
import {
  INCLUDED_ROUNDS, clockDay, isWaiting, reminderStep, rounds, sanitizeFeedback, stageName, stageState, stagesFor,
} from "./checkpoints";

describe("checkpoint rules (mirror agency-kit checkpoints-and-revisions.md)", () => {
  it("included rounds per package match the kit table", () => {
    expect(INCLUDED_ROUNDS.launch).toEqual({ 1: 1, 2: 2, 4: null });
    expect(INCLUDED_ROUNDS.business).toEqual({ 1: 1, 2: 2, 3: 2, 4: null });
    expect(INCLUDED_ROUNDS.signature).toEqual({ 1: 2, 2: 3, 3: 2, 4: null });
  });

  it("Launch merges homepage and full site", () => {
    expect(stagesFor("launch")).toEqual([1, 2, 4]);
    expect(stagesFor("business")).toEqual([1, 2, 3, 4]);
    expect(stageName(2, "launch", "en")).toBe("Your page");
    expect(stageName(2, "business", "pl")).toBe("Strona główna");
  });

  it("counts rounds and flags the paid one", () => {
    const cps = [
      { stage: 1 as const, status: "changes" as const },
      { stage: 1 as const, status: "approved" as const },
      { stage: 2 as const, status: "changes" as const },
    ];
    expect(rounds("business", cps, 1)).toEqual({ used: 1, included: 1, extra: true });
    expect(rounds("business", cps, 2)).toEqual({ used: 1, included: 2, extra: false });
    expect(rounds("business", cps, 4)).toEqual({ used: 0, included: null, extra: false });
  });

  it("stage state: approved beats everything, withdrawn is ignored", () => {
    expect(stageState([{ stage: 1, status: "changes" }, { stage: 1, status: "auto_approved" }], 1)).toBe("approved");
    expect(stageState([{ stage: 2, status: "withdrawn" }], 2)).toBe("todo");
    expect(stageState([{ stage: 2, status: "open" }], 2)).toBe("review");
  });

  it("sanitises feedback: drops empty comments, caps lengths, defaults the device", () => {
    const out = sanitizeFeedback([
      { where: "Home", device: "mobile", text: " Too busy " },
      { where: "x", text: "" },
      { text: "y".repeat(5000), device: "tv" },
      "junk",
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ where: "Home", device: "mobile", text: "Too busy" });
    expect(out[1].device).toBe("both");
    expect(out[1].text).toHaveLength(2000);
    expect(sanitizeFeedback("nope")).toEqual([]);
    expect(sanitizeFeedback(Array.from({ length: 80 }, () => ({ text: "a" })))).toHaveLength(50);
  });

  it("reminders on day 2 and 3, approval on day 5 only after both reminders", () => {
    const sent = "2026-10-05T09:00:00Z"; // Monday
    const at = (s: string) => new Date(`${s}T10:00:00Z`);
    const cp = (remindersSent: number) => ({ status: "open" as const, createdAt: sent, remindersSent });
    expect(reminderStep(cp(0), at("2026-10-06"))).toBeNull(); // day 1
    expect(reminderStep(cp(0), at("2026-10-07"))).toEqual({ kind: "reminder", n: 1 }); // day 2
    expect(reminderStep(cp(1), at("2026-10-07"))).toBeNull();
    expect(reminderStep(cp(1), at("2026-10-08"))).toEqual({ kind: "reminder", n: 2 }); // day 3
    expect(reminderStep(cp(2), at("2026-10-09"))).toBeNull(); // day 4
    expect(reminderStep(cp(2), at("2026-10-12"))).toEqual({ kind: "auto_approve" }); // day 5 (Mon)
    // Reminders that never went out: no auto-approval, just the overdue reminder.
    expect(reminderStep(cp(0), at("2026-10-20"))).toEqual({ kind: "reminder", n: 1 });
    expect(reminderStep({ ...cp(2), status: "approved" as const }, at("2026-10-20"))).toBeNull();
  });

  it("the clock skips waiting days", () => {
    const start = "2026-10-05T08:00:00Z"; // Monday, day 1
    const now = new Date("2026-10-09T12:00:00Z"); // Friday
    expect(clockDay({ clockStartedAt: null, pausedDays: 0, waitingSince: null }, now)).toBeNull();
    expect(clockDay({ clockStartedAt: start, pausedDays: 0, waitingSince: null }, now)).toBe(5);
    expect(clockDay({ clockStartedAt: start, pausedDays: 1, waitingSince: null }, now)).toBe(4);
    // Waiting since Wednesday: Thursday and Friday don't count.
    expect(clockDay({ clockStartedAt: start, pausedDays: 0, waitingSince: "2026-10-07T10:00:00Z" }, now)).toBe(3);
  });

  it("waiting means an open checkpoint or a waiting-on note", () => {
    expect(isWaiting(null, [])).toBe(false);
    expect(isWaiting("  ", [{ status: "approved" }])).toBe(false);
    expect(isWaiting("your photos", [])).toBe(true);
    expect(isWaiting(null, [{ status: "open" }])).toBe(true);
  });
});
