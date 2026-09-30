import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { isToken } from "./token";
import { missingRequired, sanitizeAnswers, type Answers, type FileCounts } from "./questions";
import { MIME_EXT, PREVIEWABLE, checkUpload, cleanName, type UploadError, type UploadKind } from "./uploads";

export const BUCKET = "portal-uploads";
/** Thumbnail links in the portal live this long; a reload makes new ones. */
const PREVIEW_TTL_S = 60 * 60;

/**
 * Portal data layer. Every function takes the client's token, not a project
 * id: the token IS the permission check, so there's no path where code reads
 * a project it wasn't handed the secret for.
 *
 * Runs with the service role (RLS bypassed) because clients hold no Supabase
 * session. That makes this file the security boundary for the portal: each
 * query is scoped to the one project the token resolved to.
 */

export type PortalFile = {
  id: string;
  kind: UploadKind;
  original_name: string;
  size_bytes: number;
  mime: string;
  /** Short-lived signed link for an <img> thumbnail; null for PDF, HEIC, TIFF. */
  preview: string | null;
};
type FileRow = Omit<PortalFile, "preview"> & { storage_path: string };

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

type Resolved = { db: SupabaseClient; portal: Portal; rows: FileRow[] };

async function resolve(token: unknown): Promise<Resolved | null> {
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
      .select("id, kind, original_name, size_bytes, mime, storage_path")
      .eq("project_id", p.id)
      .order("created_at", { ascending: true }),
  ]);

  const rows = (files.data ?? []) as FileRow[];
  return {
    db,
    rows,
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
      files: rows.map((r) => toFile(r, null)),
    },
  };
}

const toFile = ({ storage_path: _, ...f }: FileRow, preview: string | null): PortalFile => ({ ...f, preview });

/** Adds thumbnail links. Only the page load needs them, so resolve() skips it. */
async function withPreviews(db: SupabaseClient, rows: FileRow[]): Promise<PortalFile[]> {
  const shown = rows.filter((r) => PREVIEWABLE.has(r.mime));
  if (!shown.length) return rows.map((r) => toFile(r, null));
  const { data } = await db.storage.from(BUCKET).createSignedUrls(shown.map((r) => r.storage_path), PREVIEW_TTL_S);
  const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => toFile(r, url.get(r.storage_path) ?? null));
}

export async function loadPortal(token: unknown): Promise<Portal | null> {
  const r = await resolve(token);
  if (!r) return null;
  return { ...r.portal, files: await withPreviews(r.db, r.rows) };
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

// ── Uploads ─────────────────────────────────────────────────────────────────
// Two steps so large files never pass through our server (Vercel caps request
// bodies at 4.5 MB): 1) we check the request and mint a one-time signed
// upload URL, the browser PUTs the file straight to storage; 2) the browser
// confirms, we read back what storage actually stored, check it again and
// only then record the file.

type UploadFail = { ok: false; reason: "not_found" | "locked" | "rate_limited" | "failed" | UploadError };

export async function requestUpload(
  token: unknown,
  meta: { kind: unknown; mime: unknown; size: unknown }
): Promise<{ ok: true; path: string; url: string } | UploadFail> {
  const r = await resolve(token);
  if (!r) return { ok: false, reason: "not_found" };
  if (!isEditable(r.portal)) return { ok: false, reason: "locked" };

  const kind = meta.kind as UploadKind;
  const bad = checkUpload(meta, r.rows.filter((f) => f.kind === kind).length);
  if (bad) return { ok: false, reason: bad };
  if (!(await rateLimit(r.db, `portal:upload:${r.portal.id}`, 200, 3600))) return { ok: false, reason: "rate_limited" };

  const path = `${r.portal.id}/${kind}/${randomUUID()}.${MIME_EXT[meta.mime as string]}`;
  const { data, error } = await r.db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[portal] signed upload url failed", error?.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true, path, url: data.signedUrl };
}

const UPLOAD_PATH_RE = /^([0-9a-f-]{36})\/(logo|photo)\/[0-9a-f-]{36}\.([a-z]{3,4})$/;

export async function confirmUpload(
  token: unknown,
  body: { path: unknown; name: unknown }
): Promise<{ ok: true; file: PortalFile } | UploadFail> {
  const r = await resolve(token);
  if (!r) return { ok: false, reason: "not_found" };

  const m = typeof body.path === "string" ? UPLOAD_PATH_RE.exec(body.path) : null;
  // The path must be one we could have issued for THIS project.
  if (!m || m[1] !== r.portal.id) return { ok: false, reason: "failed" };
  const path = body.path as string;
  const kind = m[2] as UploadKind;
  const store = r.db.storage.from(BUCKET);

  if (!isEditable(r.portal)) {
    await store.remove([path]);
    return { ok: false, reason: "locked" };
  }

  const { data: info, error } = await store.info(path);
  if (error || !info) return { ok: false, reason: "failed" };

  // Judge the file by what storage recorded, not by what the browser said.
  const mime = info.contentType ?? "";
  const size = info.size ?? 0;
  const bad = checkUpload({ kind, mime, size }, r.rows.filter((f) => f.kind === kind).length);
  if (bad || MIME_EXT[mime] !== m[3]) {
    await store.remove([path]);
    return { ok: false, reason: bad ?? "bad_type" };
  }

  const { data: row, error: insErr } = await r.db
    .from("project_files")
    .insert({ project_id: r.portal.id, kind, storage_path: path, original_name: cleanName(body.name), mime, size_bytes: size })
    .select("id, kind, original_name, size_bytes, mime, storage_path")
    .single();
  if (insErr || !row) {
    console.error("[portal] file row insert failed", insErr?.code, insErr?.message);
    return { ok: false, reason: "failed" };
  }
  const [file] = await withPreviews(r.db, [row as FileRow]);
  return { ok: true, file };
}

export async function removeUpload(token: unknown, fileId: unknown): Promise<{ ok: true } | UploadFail> {
  const r = await resolve(token);
  if (!r) return { ok: false, reason: "not_found" };
  if (!isEditable(r.portal)) return { ok: false, reason: "locked" };

  const row = r.rows.find((f) => f.id === fileId);
  if (!row) return { ok: false, reason: "failed" };

  const { error } = await r.db.storage.from(BUCKET).remove([row.storage_path]);
  if (error) {
    console.error("[portal] storage remove failed", error.message);
    return { ok: false, reason: "failed" };
  }
  await r.db.from("project_files").delete().eq("id", row.id).eq("project_id", r.portal.id);
  return { ok: true };
}
