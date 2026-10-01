import type { AdminProject } from "@/lib/portal/admin";
import {
  INCLUDED_ROUNDS, STAGE, TOTAL_DAYS,
  clockDay, replyBy, rounds, stageName, stageState, stagesFor,
  type Checkpoint, type CheckpointStatus,
} from "@/lib/portal/checkpoints";
import { closeCheckpoint, sendCheckpoint, setWaitingOn, startClock } from "@/app/admin/(dashboard)/projects/actions";
import { ConfirmSubmit, Submit } from "./ProjectControls";

/**
 * Admin side of portal phase 2: the clock, "waiting on", revision rounds and
 * the checkpoints sent to the client. Server-rendered forms on Server Actions,
 * like the rest of /admin.
 */

const when = (iso: string | Date) =>
  new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
const day = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

const STATUS: Record<CheckpointStatus, { label: string; cls: string }> = {
  open: { label: "Waiting for client", cls: "border-brand-400/40 bg-brand-400/10 text-brand-300" },
  changes: { label: "Changes requested", cls: "border-amber-300/40 bg-amber-300/10 text-amber-200" },
  approved: { label: "Approved", cls: "border-accent-green/40 bg-accent-green/10 text-accent-green" },
  auto_approved: { label: "Auto-approved (day 5)", cls: "border-accent-green/40 bg-accent-green/10 text-accent-green" },
  withdrawn: { label: "Withdrawn", cls: "border-[var(--glass-border)] text-ink-soft" },
};

const MAIL: Record<string, { text: string; ok: boolean }> = {
  sent: { text: "Email sent to the client with the portal link.", ok: true },
  failed: { text: "Email NOT sent: Resend refused it or isn't set up. Send the client the portal link yourself.", ok: false },
  none: { text: "No contact email in the questionnaire, so no email went out. Send the portal link yourself.", ok: false },
};

const field =
  "w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-2 text-[14px] text-ink outline-none focus:border-brand-400";

export default function CheckpointsPanel({ p, mail }: { p: AdminProject; mail?: string }) {
  const now = new Date();
  const clock = { clockStartedAt: p.clock_started_at, pausedDays: p.paused_days, waitingSince: p.waiting_since };
  const d = clockDay(clock, now);
  const total = TOTAL_DAYS[p.package];
  const visible = p.checkpoints.filter((c) => c.status !== "withdrawn");
  const open = p.checkpoints.find((c) => c.status === "open");
  const notice = mail ? MAIL[mail] : undefined;

  return (
    <section id="checkpoints" className="mt-8 scroll-mt-24 space-y-4">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">Clock and checkpoints</h2>

      {notice && (
        <p
          role="status"
          className={`rounded-card border px-4 py-3 text-[13.5px] ${
            notice.ok ? "border-accent-green/40 bg-accent-green/10 text-ink" : "border-amber-400/40 bg-amber-400/10 text-ink"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Clock ───────────────────────────────────────────────────── */}
        <div className="glass rounded-card p-5 text-[13.5px] text-ink-soft">
          <p className="font-display text-[22px] font-medium text-ink">
            {p.status === "launched" ? "Live" : d ? `Day ${d} of ${total}` : "Clock not started"}
          </p>
          {d ? (
            <p className="mt-1">
              Started {when(p.clock_started_at!)} · {p.paused_days} business day{p.paused_days === 1 ? "" : "s"} paused
              {p.waiting_since ? ` · waiting on the client since ${when(p.waiting_since)} (not counted)` : ""}
            </p>
          ) : (
            <p className="mt-1">Start it once the questionnaire, logo and photos are in (checkpoint 0).</p>
          )}
          <form action={startClock} className="mt-3">
            <input type="hidden" name="id" value={p.id} />
            {d ? (
              <ConfirmSubmit confirm="Restart the clock from today? Day count and paused days reset.">Restart clock</ConfirmSubmit>
            ) : (
              <Submit>Start the clock</Submit>
            )}
          </form>

          <form action={setWaitingOn} className="mt-5 border-t border-[var(--glass-border)] pt-4">
            <input type="hidden" name="id" value={p.id} />
            <label className="block">
              <span className="mb-1.5 block text-ink">Waiting on the client for…</span>
              <input
                name="waiting_on"
                defaultValue={p.waiting_on ?? ""}
                maxLength={200}
                placeholder={p.locale === "pl" ? "np. Twoje zdjęcia" : "e.g. your photos"}
                className={field}
              />
            </label>
            <p className="mt-1.5 text-[12.5px]">
              The client sees it after &quot;{p.locale === "pl" ? "Czekamy na:" : "Waiting on:"}&quot;, so write it in{" "}
              {p.locale === "pl" ? "Polish" : "English"}. Set means the clock pauses; empty to clear.
            </p>
            <div className="mt-3"><Submit>Save</Submit></div>
          </form>
        </div>

        {/* ── Rounds ──────────────────────────────────────────────────── */}
        <div className="glass rounded-card p-5">
          <p className="text-[13px] text-ink-soft">Stages and revision rounds ({p.package})</p>
          <ul className="mt-3 space-y-2 text-[13.5px]">
            {stagesFor(p.package).map((s) => {
              const r = rounds(p.package, p.checkpoints, s);
              const state = stageState(p.checkpoints, s);
              return (
                <li key={s} className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{s}. {stageName(s, p.package, "en")}</span>
                  <span className="text-right text-ink-soft">
                    {state === "todo" ? "not sent" : state === "review" ? "in review" : state === "changes" ? "changes" : "approved"}
                    {" · "}
                    {INCLUDED_ROUNDS[p.package][s] === null ? "fixes only" : (
                      <span className={r.extra ? "text-amber-200" : ""}>
                        {r.used}/{r.included} rounds{r.extra ? " (next is paid)" : ""}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Send ──────────────────────────────────────────────────────── */}
      <form action={sendCheckpoint} className="glass space-y-3 rounded-card p-5">
        <input type="hidden" name="id" value={p.id} />
        <p className="text-[14.5px] font-medium text-ink">Send a preview for review</p>
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <label className="block text-[13px] text-ink-soft">
            <span className="mb-1.5 block">Checkpoint</span>
            <select name="stage" className={field} defaultValue={String(nextStage(p))}>
              {stagesFor(p.package).map((s) => (
                <option key={s} value={s}>{s}. {stageName(s, p.package, "en")}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-ink-soft">
            <span className="mb-1.5 block">Preview link</span>
            <input name="preview_url" type="url" required maxLength={500} placeholder="https://…vercel.app" className={field} />
          </label>
        </div>
        <label className="block text-[13px] text-ink-soft">
          <span className="mb-1.5 block">Note to the client ({p.locale === "pl" ? "Polish" : "English"}, optional)</span>
          <textarea name="note" maxLength={4000} rows={3} className={`${field} resize-y`} />
        </label>
        <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
          <input type="checkbox" name="email" defaultChecked className="size-4 accent-[var(--brand-400)]" />
          Email the client the portal link
        </label>
        <p className="text-[12.5px] text-ink-soft">
          The client gets 5 business days. Reminders go out on days 2 and 3, and day 5 approves it, but only if both reminders were
          delivered.{open ? " Sending replaces the checkpoint that's open now." : ""}
        </p>
        <Submit>Send for review</Submit>
      </form>

      {/* ── History ───────────────────────────────────────────────────── */}
      {p.checkpoints.length > 0 && (
        <ul className="space-y-3">
          {[...p.checkpoints].reverse().map((c) => <CheckpointRow key={c.id} c={c} p={p} />)}
        </ul>
      )}
      {!visible.length && <p className="text-[13px] text-ink-soft">No checkpoints sent yet.</p>}
    </section>
  );
}

/** First stage that isn't approved yet. */
function nextStage(p: AdminProject) {
  return stagesFor(p.package).find((s) => stageState(p.checkpoints, s) !== "approved") ?? 4;
}

function CheckpointRow({ c, p }: { c: Checkpoint; p: AdminProject }) {
  const s = STATUS[c.status];
  return (
    <li className="glass rounded-card p-5 text-[13.5px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">{c.stage}. {stageName(c.stage, p.package, "en")}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[11.5px] ${s.cls}`}>{s.label}</span>
        <span className="ml-auto text-ink-soft">sent {when(c.createdAt)}</span>
      </div>
      <p className="mt-1 truncate">
        <a href={c.previewUrl} target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">{c.previewUrl}</a>
      </p>
      {c.status === "open" && (
        <p className="mt-1 text-ink-soft">
          Reply by {day(replyBy(c.createdAt))} · reminders sent: {c.remindersSent}/2
        </p>
      )}
      {c.decidedAt && c.status !== "open" && c.status !== "withdrawn" && (
        <p className="mt-1 text-ink-soft">
          {when(c.decidedAt)}{c.decidedBy ? ` · ${c.decidedBy}` : ""}
        </p>
      )}
      {c.note && <p className="mt-2 whitespace-pre-wrap text-ink-soft">Our note: {c.note}</p>}
      {c.feedback.length > 0 && (
        <ol className="mt-3 space-y-2">
          {c.feedback.map((f, i) => (
            <li key={i} className="rounded-input border border-[var(--glass-border)] p-3">
              <p className="text-[12px] text-ink-soft">
                {i + 1}. {f.where || "(no place given)"} · {f.device === "both" ? "all screens" : f.device}
              </p>
              {/* Client text: rendered as text, never as HTML. */}
              <p className="mt-1 whitespace-pre-wrap text-ink">{f.text}</p>
            </li>
          ))}
        </ol>
      )}
      {c.status === "open" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={closeCheckpoint}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="checkpoint_id" value={c.id} />
            <input type="hidden" name="status" value="approved" />
            <ConfirmSubmit confirm={`Mark "${STAGE[c.stage].name.en}" approved? Use this when the client approved by phone or email.`}>
              Mark approved
            </ConfirmSubmit>
          </form>
          <form action={closeCheckpoint}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="checkpoint_id" value={c.id} />
            <input type="hidden" name="status" value="withdrawn" />
            <ConfirmSubmit confirm="Withdraw this checkpoint? The client won't be able to answer it." danger>
              Withdraw
            </ConfirmSubmit>
          </form>
        </div>
      )}
    </li>
  );
}
