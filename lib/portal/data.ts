import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { isToken } from "./token";
import { missingRequired, sanitizeAnswers, type Answers, type FileCounts } from "./questions";

/**
 * Portal data layer. Every function takes the client's token, not a project
 * id: the token IS the permission check, so there's no path where code reads
 * a project it wasn't handed the secret for.
 *
 * Runs with the service role (RLS bypassed) because clients hold no Supabase
 * session. That makes this file the security boundary for the portal: each
 * query is scoped to the one project the token resolved to.
 */

export type PortalFile = { id: string; kind: "logo" | "photo"; original_name: string; size_bytes: number };

export type Portal = {
  id: string;
  clientName: string;
  package: "launch" | "business" | "signature";
  locale: "pl" | "en";
  status: "intake" | "submitted" | "active" | "launched" | "archived";
  submittedAt: string | null;
  answers: Answers;
  files: PortalFile[];
};

/** Answers are editable until the client presses "Send". */
export const isEditable = (p: Pick<Portal, "status">) => p.status === "intake";

export const fileCounts = (files: PortalFile[]): FileCounts =>
  files.reduce<FileCounts>((c, f) => ({ ...c, [f.kind]: (c[f.kind] ?? 0) + 1 }), {});

async function resolve(token: unknown): Promise<{ db: SupabaseClient; portal: Portal } | null> {
  if (!isToken(token)) return null;
  const db = supabaseAdmin();
  if (!db) return null;

  const { data: p, error } = await db
    .from("projects")
    .select("id, client_name, package, locale, status, intake_submitted_at")
    .eq("access_token", token)
    .neq("status", "archived")
    .maybeSingle();
  if (error) console.error("[portal] project lookup failed", error.code, error.message);
  if (!p) return null;

  const [answers, files] = await Promise.all([
    db.from("intake_answers").select("answers").eq("project_id", p.id).maybeSingle(),
    db
      .from("project_files")
      .select("id, kind, original_name, size_bytes")
      .eq("project_id", p.id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    db,
    portal: {
      id: p.id,
      clientName: p.client_name,
      package: p.package,
      locale: p.locale,
      status: p.status,
      submittedAt: p.intake_submitted_at,
      // Re-sanitise on the way out too: if questions.ts drops a field, stale
      // keys in the database never reach the form.
      answers: sanitizeAnswers(answers.data?.answers),
      files: (files.data ?? []) as PortalFile[],
    },
  };
}

export async function loadPortal(token: unknown): Promise<Portal | null> {
  return (await resolve(token))?.portal ?? null;
}

export type SaveResult = { ok: true } | { ok: false; reason: "not_found" | "locked" | "rate_limited" | "failed" };

/**
 * Autosave. Replaces the stored answers with the sanitised object the form
 * sends (the form always sends everything it has, so replace == merge, and a
 * cleared field really clears).
 */
export async function saveAnswers(token: unknown, raw: unknown): Promise<SaveResult> {
  const r = await resolve(token);
  if (!r) return { ok: false, reason: "not_found" };
  if (!isEditable(r.portal)) return { ok: false, reason: "locked" };

  // Autosave fires every couple of seconds while typing; this only stops a
  // stuck loop or a script from hammering the table.
  if (!(await rateLimit(r.db, `portal:save:${r.portal.id}`, 300, 600))) return { ok: false, reason: "rate_limited" };

  const { error } = await r.db
    .from("intake_answers")
    .upsert({ project_id: r.portal.id, answers: sanitizeAnswers(raw) }, { onConflict: "project_id" });
  if (error) {
    console.error("[portal] save failed", error.code, error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "locked" | "failed" }
  | { ok: false; reason: "missing"; missing: number[] };

/**
 * "Send". Saves the final answers, re-checks the required set on the server
 * (the form's check is only a convenience), then locks the intake. This is
 * the moment the project clock can start.
 */
export async function submitIntake(token: unknown, raw: unknown): Promise<SubmitResult> {
  const r = await resolve(token);
  if (!r) return { ok: false, reason: "not_found" };
  if (!isEditable(r.portal)) return { ok: false, reason: "locked" };

  const answers = sanitizeAnswers(raw);
  const missing = missingRequired(answers, fileCounts(r.portal.files)).map((q) => q.n);

  const saved = await r.db
    .from("intake_answers")
    .upsert({ project_id: r.portal.id, answers }, { onConflict: "project_id" });
  if (saved.error) {
    console.error("[portal] submit save failed", saved.error.code, saved.error.message);
    return { ok: false, reason: "failed" };
  }
  if (missing.length) return { ok: false, reason: "missing", missing };

  // `.eq("status", "intake")` makes the lock atomic: a double-click can't
  // submit twice or reopen a project admin already moved on.
  const { data, error } = await r.db
    .from("projects")
    .update({ status: "submitted", intake_submitted_at: new Date().toISOString() })
    .eq("id", r.portal.id)
    .eq("status", "intake")
    .select("id");
  if (error) {
    console.error("[portal] submit failed", error.code, error.message);
    return { ok: false, reason: "failed" };
  }
  return data?.length ? { ok: true } : { ok: false, reason: "locked" };
}
