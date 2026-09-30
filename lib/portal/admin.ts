import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uuid } from "@/lib/security/validation";
import { BUCKET } from "./data";
import { sanitizeAnswers, type Answers } from "./questions";
import { PREVIEWABLE } from "./uploads";
import type { ProjectStatus } from "./status";

/**
 * One project, as admin sees it. The rows are read with the admin's JWT
 * (`db` from requireAdmin), so RLS decides what comes back. Only the signed
 * file links need the service role, because the bucket has no policies for
 * signed-in users. They're minted solely for paths that RLS-checked query
 * returned.
 */

const LINK_TTL_S = 60 * 60;

export type AdminFile = {
  id: string; kind: "logo" | "photo"; original_name: string; size_bytes: number; mime: string; created_at: string;
  /** Opens the file (thumbnail) */ view: string | null;
  /** Downloads it under the client's original file name */ download: string | null;
};

export type AdminProject = {
  id: string; created_at: string; client_name: string;
  package: "launch" | "business" | "signature"; locale: "pl" | "en";
  status: ProjectStatus; access_token: string | null; intake_submitted_at: string | null;
  answers: Answers; answersUpdatedAt: string | null; files: AdminFile[];
};

export async function loadProjectForAdmin(
  db: SupabaseClient,
  rawId: unknown,
  { links = true } = {}
): Promise<AdminProject | null> {
  const id = uuid(rawId);
  if (!id) return null;

  const { data: p, error } = await db
    .from("projects")
    .select("id, created_at, client_name, package, locale, status, access_token, intake_submitted_at")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[admin project] read failed", error.code, error.message);
  if (!p) return null;

  const [ans, files] = await Promise.all([
    db.from("intake_answers").select("answers, updated_at").eq("project_id", id).maybeSingle(),
    db
      .from("project_files")
      .select("id, kind, original_name, size_bytes, mime, created_at, storage_path")
      .eq("project_id", id)
      .order("created_at", { ascending: true }),
  ]);

  type Row = Omit<AdminFile, "view" | "download"> & { storage_path: string };
  const rows = ((files.data ?? []) as Row[]).filter((r) => r.storage_path.startsWith(`${id}/`));

  const view = new Map<string, string>();
  const download = new Map<string, string>();
  const service = links && rows.length ? supabaseAdmin() : null;
  if (service) {
    const store = service.storage.from(BUCKET);
    const shown = rows.filter((r) => PREVIEWABLE.has(r.mime)).map((r) => r.storage_path);
    const [v, ...d] = await Promise.all([
      shown.length ? store.createSignedUrls(shown, LINK_TTL_S) : Promise.resolve({ data: [] }),
      // One call per file: the download name is per-file.
      ...rows.map((r) => store.createSignedUrl(r.storage_path, LINK_TTL_S, { download: r.original_name })),
    ]);
    for (const x of v.data ?? []) if (x.path && x.signedUrl) view.set(x.path, x.signedUrl);
    rows.forEach((r, i) => d[i].data?.signedUrl && download.set(r.storage_path, d[i].data.signedUrl));
  }

  return {
    ...(p as Omit<AdminProject, "answers" | "answersUpdatedAt" | "files">),
    answers: sanitizeAnswers(ans.data?.answers),
    answersUpdatedAt: ans.data?.updated_at ?? null,
    files: rows.map(({ storage_path, ...f }) => ({
      ...f,
      view: view.get(storage_path) ?? null,
      download: download.get(storage_path) ?? null,
    })),
  };
}
