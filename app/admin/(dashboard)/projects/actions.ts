"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LOCALES, TIERS, oneOf, str, uuid } from "@/lib/security/validation";
import { newToken } from "@/lib/portal/token";
import { BUCKET } from "@/lib/portal/data";
import { PROJECT_STATUSES } from "@/lib/portal/status";

/**
 * Same rules as inquiries/actions.ts: every action re-checks admin (Server
 * Actions are public endpoints), writes go through the admin's JWT so the
 * RLS policies in supabase/portal.sql have the final word, and database
 * errors are logged, never shown.
 */
async function admin() {
  const { db, isAdmin } = await requireAdmin();
  if (!isAdmin || !db) throw new Error("forbidden");
  return db;
}

function done() {
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

export async function createProject(formData: FormData) {
  const db = await admin();
  const clientName = str(formData.get("client_name"), 120);
  const pkg = oneOf(formData.get("package"), TIERS);
  const locale = oneOf(formData.get("locale"), LOCALES);
  if (!clientName || !pkg || !locale) throw new Error("bad_request");

  const { data, error } = await db
    .from("projects")
    .insert({ client_name: clientName, package: pkg, locale, access_token: newToken(), token_created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[createProject] insert failed", error?.code, error?.message);
    throw new Error("create_failed");
  }
  done();
  // ?new= highlights the row so the link can be copied straight away.
  redirect(`/admin/projects?new=${data.id}`);
}

/** Issues a fresh link. The old one stops working immediately. */
export async function replaceLink(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  if (!id) throw new Error("bad_request");

  const { error } = await db
    .from("projects")
    .update({ access_token: newToken(), token_created_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[replaceLink] update failed", error.code, error.message);
    throw new Error("update_failed");
  }
  done();
}

/**
 * Moving a project back to "intake" reopens the questionnaire so the client
 * can edit it again; the first submission time is kept for the record.
 */
export async function setProjectStatus(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  const status = oneOf(formData.get("status"), PROJECT_STATUSES);
  if (!id || !status) throw new Error("bad_request");

  const { error } = await db.from("projects").update({ status }).eq("id", id);
  if (error) {
    console.error("[setProjectStatus] update failed", error.code, error.message);
    throw new Error("update_failed");
  }
  done();
}

/**
 * Deletes the project, its answers and file rows (cascade), and its files in
 * storage. The storage bucket has no policies for signed-in users, so the
 * file removal uses the service role, but only after the admin check above
 * and only for paths the admin's own (RLS-checked) query returned.
 */
export async function deleteProject(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  if (!id) throw new Error("bad_request");

  const { data: files, error: readErr } = await db.from("project_files").select("storage_path").eq("project_id", id);
  if (readErr) {
    console.error("[deleteProject] file list failed", readErr.code, readErr.message);
    throw new Error("delete_failed");
  }

  const paths = (files ?? []).map((f) => f.storage_path as string).filter((p) => p.startsWith(`${id}/`));
  if (paths.length) {
    const service = supabaseAdmin();
    const { error } = (await service?.storage.from(BUCKET).remove(paths)) ?? { error: { message: "no service client" } };
    if (error) {
      // Stop before deleting rows: orphaned files we can't see are worse than
      // a project that's still listed.
      console.error("[deleteProject] storage remove failed", error.message);
      throw new Error("delete_failed");
    }
  }

  const { error } = await db.from("projects").delete().eq("id", id);
  if (error) {
    console.error("[deleteProject] delete failed", error.code, error.message);
    throw new Error("delete_failed");
  }
  done();
}
