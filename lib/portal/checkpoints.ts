import { addBusinessDays, businessDaysAfter } from "./days";
import { str } from "@/lib/security/validation";

/**
 * Phase 2 of the portal: checkpoints, revision rounds and the project clock.
 * Pure rules only (no database), so they're unit-tested and shared by the
 * client page, admin and the daily reminder job.
 *
 * Source of truth for the rules: agency-kit/docs/process/checkpoints-and-revisions.md.
 * Keep the two in step (rounds per package, 5-day feedback window, reminders
 * on days 2 and 3, approval on day 5).
 */

export type Package = "launch" | "entry" | "business" | "signature";
export type Lang = "pl" | "en";
type L = Record<Lang, string>;

/** Checkpoints the client reviews. 0 (kickoff) and 5 (launch) have no review. */
export const REVIEW_STAGES = [1, 2, 3, 4] as const;
export type Stage = (typeof REVIEW_STAGES)[number];

export const CHECKPOINT_STATUSES = ["open", "changes", "approved", "auto_approved", "withdrawn"] as const;
export type CheckpointStatus = (typeof CHECKPOINT_STATUSES)[number];

export const DEVICES = ["both", "desktop", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export type FeedbackItem = { where: string; device: Device; text: string };

export type Checkpoint = {
  id: string;
  stage: Stage;
  createdAt: string;
  previewUrl: string;
  note: string;
  status: CheckpointStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  feedback: FeedbackItem[];
  remindersSent: number;
};

/** Package names as the website shows them (PL: Start / Wejście / Biznes / Premium). */
export const PACKAGE_NAME: Record<Package, L> = {
  launch: { pl: "Start", en: "Launch" },
  entry: { pl: "Wejście", en: "Essentials" },
  business: { pl: "Biznes", en: "Business" },
  signature: { pl: "Premium", en: "Signature" },
};

/** Days to delivery, as on the website and in the kit. */
export const TOTAL_DAYS: Record<Package, number> = { launch: 5, entry: 5, business: 10, signature: 10 };

/**
 * Included revision rounds. null = "fixes only" (pre-launch: bugs, not changes).
 * 0 = no round: on Essentials the client picks one direction tile as it is.
 */
export const INCLUDED_ROUNDS: Record<Package, Partial<Record<Stage, number | null>>> = {
  launch: { 1: 1, 2: 2, 4: null },
  entry: { 1: 0, 2: 1, 4: null },
  business: { 1: 1, 2: 2, 3: 2, 4: null },
  signature: { 1: 2, 2: 3, 3: 2, 4: null },
};

/** Feedback window: no reply by this business day = approved. */
export const FEEDBACK_DAYS = 5;
/** Reminder n goes out on business day REMINDER_DAYS[n]. */
export const REMINDER_DAYS = [2, 3] as const;

/** The 5-day packages (Launch: one page, Essentials: up to 4) merge the homepage and full-site checkpoints. */
export const stagesFor = (pkg: Package): Stage[] => (TOTAL_DAYS[pkg] === 5 ? [1, 2, 4] : [1, 2, 3, 4]);

export const STAGE: Record<0 | Stage | 5, { name: L; approve: L }> = {
  0: {
    name: { pl: "Start projektu", en: "Kickoff" },
    approve: { pl: "Ankieta, logo i zdjęcia są u nas, zegar ruszył.", en: "Questionnaire, logo and photos are in, and the clock has started." },
  },
  1: {
    name: { pl: "Kierunek wizualny", en: "Direction" },
    approve: {
      pl: "Wybierasz jeden kierunek: kolory, kroje pisma i nastrój. Po akceptacji to zostaje.",
      en: "You pick one direction: colours, type and mood. Once approved, that stays.",
    },
  },
  2: {
    name: { pl: "Strona główna", en: "Homepage" },
    approve: {
      pl: "Pełna strona główna z prawdziwą treścią. Po akceptacji układ, styl sekcji i animacje zostają.",
      en: "The full homepage with real content. Once approved, the layout, section styles and motion stay.",
    },
  },
  3: {
    name: { pl: "Cała strona", en: "Full site" },
    approve: {
      pl: "Wszystkie podstrony. Po akceptacji struktura i treść zostają.",
      en: "Every page. Once approved, the page structure and content stay.",
    },
  },
  4: {
    name: { pl: "Przed startem", en: "Pre-launch" },
    approve: {
      pl: "Raport jakości i ostateczny podgląd. Twoja akceptacja to zgoda na publikację.",
      en: "The QA report and the final preview. Your approval is the go-ahead to go live.",
    },
  },
  5: {
    name: { pl: "Strona online", en: "Live" },
    approve: { pl: "Strona działa, a my pilnujemy jej w okresie opieki.", en: "Your site is live, and we look after it during aftercare." },
  },
};

/** On the 5-day packages checkpoint 2 covers everything: Launch's one page, Essentials' whole site. */
export function stageName(stage: 0 | Stage | 5, pkg: Package, lang: Lang): string {
  if (stage === 2 && pkg === "launch") return lang === "pl" ? "Twoja strona" : "Your page";
  if (stage === 2 && pkg === "entry") return lang === "pl" ? "Cała strona" : "Your site";
  return STAGE[stage].name[lang];
}

// ── Feedback ────────────────────────────────────────────────────────────────

export const FEEDBACK_MAX = { items: 50, where: 200, text: 2000, name: 120 } as const;

/** Client input → clean list. Empty comments are dropped, the rest capped. */
export function sanitizeFeedback(raw: unknown): FeedbackItem[] {
  if (!Array.isArray(raw)) return [];
  const out: FeedbackItem[] = [];
  for (const r of raw.slice(0, FEEDBACK_MAX.items)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const text = str(o.text, FEEDBACK_MAX.text);
    if (!text) continue;
    const device = (DEVICES as readonly unknown[]).includes(o.device) ? (o.device as Device) : "both";
    out.push({ where: str(o.where, FEEDBACK_MAX.where), device, text });
  }
  return out;
}

// ── Rounds ──────────────────────────────────────────────────────────────────

/** One "Request changes" = one round, counted per stage. */
export const roundsUsed = (cps: Pick<Checkpoint, "stage" | "status">[], stage: Stage): number =>
  cps.filter((c) => c.stage === stage && c.status === "changes").length;

export type Rounds = { used: number; included: number | null; extra: boolean };

/** `extra` is true when the NEXT request would go past the included rounds. */
export function rounds(pkg: Package, cps: Pick<Checkpoint, "stage" | "status">[], stage: Stage): Rounds {
  const included = INCLUDED_ROUNDS[pkg][stage] ?? null;
  const used = roundsUsed(cps, stage);
  return { used, included, extra: included !== null && used >= included };
}

// ── Feedback window ─────────────────────────────────────────────────────────

/** The day a silent checkpoint counts as approved. */
export const replyBy = (sentAt: string | Date): Date => addBusinessDays(sentAt, FEEDBACK_DAYS);

export type ReminderStep = { kind: "reminder"; n: 1 | 2 } | { kind: "auto_approve" } | null;

/**
 * What the daily job should do for one open checkpoint. Auto-approval only
 * follows two reminders that were actually delivered: if email isn't working,
 * nothing gets approved behind the client's back, and admin sees it overdue.
 */
export function reminderStep(cp: Pick<Checkpoint, "status" | "createdAt" | "remindersSent">, now: Date): ReminderStep {
  if (cp.status !== "open") return null;
  const days = businessDaysAfter(cp.createdAt, now);
  if (cp.remindersSent >= 2 && days >= FEEDBACK_DAYS) return { kind: "auto_approve" };
  if (cp.remindersSent === 1 && days >= REMINDER_DAYS[1]) return { kind: "reminder", n: 2 };
  if (cp.remindersSent === 0 && days >= REMINDER_DAYS[0]) return { kind: "reminder", n: 1 };
  return null;
}

// ── Clock ───────────────────────────────────────────────────────────────────

export type ClockFields = {
  clockStartedAt: string | null;
  /** Finished client waits, in business days. */
  pausedDays: number;
  /** Start of the current client wait, if we're waiting right now. */
  waitingSince: string | null;
};

/**
 * "Day 3 of 10". Day 1 is the day the clock started; business days spent
 * waiting on the client don't count (the kit's "the clock pauses" rule).
 */
export function clockDay(c: ClockFields, now: Date): number | null {
  if (!c.clockStartedAt) return null;
  const elapsed = businessDaysAfter(c.clockStartedAt, now);
  const waiting = c.waitingSince ? businessDaysAfter(c.waitingSince, now) : 0;
  return Math.max(1, 1 + elapsed - c.pausedDays - waiting);
}

/** We're waiting on the client when a checkpoint is open or admin said so. */
export const isWaiting = (waitingOn: string | null, cps: Pick<Checkpoint, "status">[]): boolean =>
  Boolean(waitingOn?.trim()) || cps.some((c) => c.status === "open");

/** Where the project is: the highest approved stage, and what's in review. */
export function stageState(cps: Pick<Checkpoint, "stage" | "status">[], stage: Stage): "approved" | "review" | "changes" | "todo" {
  const mine = cps.filter((c) => c.stage === stage && c.status !== "withdrawn");
  if (mine.some((c) => c.status === "approved" || c.status === "auto_approved")) return "approved";
  if (mine.some((c) => c.status === "open")) return "review";
  if (mine.some((c) => c.status === "changes")) return "changes";
  return "todo";
}

// ── Rows ────────────────────────────────────────────────────────────────────

export const CHECKPOINT_COLUMNS =
  "id, created_at, stage, preview_url, note, status, decided_at, decided_by, feedback, reminders_sent";

/** Database row → Checkpoint. Feedback is re-sanitised on the way out. */
export function toCheckpoint(r: Record<string, unknown>): Checkpoint {
  return {
    id: String(r.id),
    stage: r.stage as Stage,
    createdAt: String(r.created_at),
    previewUrl: String(r.preview_url ?? ""),
    note: String(r.note ?? ""),
    status: r.status as CheckpointStatus,
    decidedAt: (r.decided_at as string | null) ?? null,
    decidedBy: (r.decided_by as string | null) ?? null,
    feedback: sanitizeFeedback(r.feedback),
    remindersSent: Number(r.reminders_sent ?? 0),
  };
}
