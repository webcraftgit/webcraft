import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CHECKPOINT_COLUMNS, reminderStep, toCheckpoint, type Stage } from "@/lib/portal/checkpoints";
import { syncWaiting } from "@/lib/portal/clock";
import { publicOrigin } from "@/lib/portal/origin";
import { autoApprovedNotice, reminderMail } from "@/lib/portal/emails";
import { notifyAdmin, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily checkpoint job (vercel.json → crons, weekday mornings). For every
 * open checkpoint: reminder 1 on business day 2, reminder 2 on day 3, and on
 * day 5 the checkpoint counts as approved (the kit's feedback window).
 *
 * A reminder only counts when Resend accepted it, and auto-approval needs
 * both: if email is broken nothing gets approved behind the client's back.
 *
 * Vercel calls this with `Authorization: Bearer $CRON_SECRET`. Without the
 * secret configured the route refuses everyone (fails closed).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data, error } = await db
    .from("project_checkpoints")
    .select(`${CHECKPOINT_COLUMNS}, project_id, projects!inner(client_name, package, locale, status, access_token)`)
    .eq("status", "open")
    .limit(500);
  if (error) {
    console.error("[cron/portal] read failed", error.code, error.message);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const now = new Date();
  const origin = publicOrigin();
  const report = { open: data?.length ?? 0, reminders: 0, failed: 0, autoApproved: 0 };

  for (const row of data ?? []) {
    const cp = toCheckpoint(row as Record<string, unknown>);
    const proj = (row as unknown as { projects: { client_name: string; package: "launch" | "entry" | "business" | "signature"; locale: "pl" | "en"; status: string; access_token: string | null } }).projects;
    const projectId = (row as { project_id: string }).project_id;
    if (proj.status === "archived") continue;

    const step = reminderStep(cp, now);
    if (!step) continue;

    if (step.kind === "auto_approve") {
      const { data: done } = await db
        .from("project_checkpoints")
        .update({ status: "auto_approved", decided_at: now.toISOString() })
        .eq("id", cp.id)
        .eq("status", "open")
        .select("id");
      if (done?.length) {
        report.autoApproved++;
        await syncWaiting(db, projectId, now);
        const n = autoApprovedNotice(proj.client_name, cp.stage as Stage, proj.package, `${origin}/admin/projects/${projectId}`);
        await notifyAdmin(n.subject, n.text);
      }
      continue;
    }

    // Reminder: to the decision-maker from the questionnaire.
    const { data: ans } = await db.from("intake_answers").select("answers").eq("project_id", projectId).maybeSingle();
    const to = (ans?.answers as Record<string, unknown> | undefined)?.["q3.email"];
    if (typeof to !== "string" || !to || !proj.access_token) {
      report.failed++;
      continue;
    }
    const sent = await sendEmail(
      reminderMail({
        to, n: step.n, lang: proj.locale, pkg: proj.package, clientName: proj.client_name,
        stage: cp.stage, sentAt: cp.createdAt, portalUrl: `${origin}/portal/${proj.access_token}`,
      })
    );
    if (!sent) {
      report.failed++;
      continue;
    }
    report.reminders++;
    await db
      .from("project_checkpoints")
      .update({ reminders_sent: step.n, last_reminder_at: now.toISOString() })
      .eq("id", cp.id)
      .eq("status", "open");
  }

  console.log("[cron/portal]", JSON.stringify(report));
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
