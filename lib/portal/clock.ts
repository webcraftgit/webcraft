import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { businessDaysAfter } from "./days";
import { isWaiting } from "./checkpoints";

/**
 * Keeps the pause bookkeeping in step after anything that can start or end a
 * wait on the client (a checkpoint sent or answered, admin's "waiting on"
 * text). Works with either client: the portal passes the service role, admin
 * its own JWT (RLS lets admins update projects).
 *
 * Entering a wait stamps waiting_since; leaving one adds the business days it
 * lasted to paused_days. Before the clock starts there's nothing to pause.
 */
export async function syncWaiting(db: SupabaseClient, projectId: string, now = new Date()): Promise<void> {
  const [{ data: p }, { data: open }] = await Promise.all([
    db.from("projects").select("waiting_on, waiting_since, paused_days, clock_started_at").eq("id", projectId).maybeSingle(),
    db.from("project_checkpoints").select("status").eq("project_id", projectId).eq("status", "open"),
  ]);
  if (!p) return;

  const wait = isWaiting(p.waiting_on, open ?? []);
  let patch: Record<string, unknown> | null = null;
  if (wait && !p.waiting_since) patch = { waiting_since: now.toISOString() };
  if (!wait && p.waiting_since) {
    const days = p.clock_started_at ? businessDaysAfter(p.waiting_since, now) : 0;
    patch = { waiting_since: null, paused_days: Math.min(1000, (p.paused_days ?? 0) + days) };
  }
  if (!patch) return;

  const { error } = await db.from("projects").update(patch).eq("id", projectId);
  if (error) console.error("[clock] sync failed", error.code, error.message);
}
