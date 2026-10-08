"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LOCALES, PACKAGES, oneOf, str, uuid } from "@/lib/security/validation";
import { newToken } from "@/lib/portal/token";
import { BUCKET } from "@/lib/portal/data";
import { PROJECT_STATUSES } from "@/lib/portal/status";
import { REVIEW_STAGES, isWaiting, type Stage } from "@/lib/portal/checkpoints";
import { syncWaiting } from "@/lib/portal/clock";
import { loadProjectForAdmin } from "@/lib/portal/admin";
import { portalOrigin } from "@/lib/portal/origin";
import { checkpointSentMail } from "@/lib/portal/emails";
import { sendEmail } from "@/lib/email";

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
  const pkg = oneOf(formData.get("package"), PACKAGES);
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

// ── Phase 2: clock and checkpoints ──────────────────────────────────────────

function doneProject(id: string) {
  done();
  revalidatePath(`/admin/projects/${id}`);
}

/**
 * Checkpoint 0: the clock starts. Restarting resets the count (the start was
 * wrong, not paused). A project still at "Questionnaire sent" becomes active.
 */
export async function startClock(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  if (!id) throw new Error("bad_request");

  const { data: p } = await db.from("projects").select("status, waiting_on").eq("id", id).maybeSingle();
  const { data: open } = await db.from("project_checkpoints").select("status").eq("project_id", id).eq("status", "open");
  const now = new Date().toISOString();
  const { error } = await db
    .from("projects")
    .update({
      clock_started_at: now,
      paused_days: 0,
      waiting_since: isWaiting(p?.waiting_on ?? null, open ?? []) ? now : null,
      ...(p?.status === "submitted" ? { status: "active" } : {}),
    })
    .eq("id", id);
  if (error) {
    console.error("[startClock] update failed", error.code, error.message);
    throw new Error("update_failed");
  }
  doneProject(id);
}

/** "Waiting on: your photos". Empty clears it. Shown to the client as typed. */
export async function setWaitingOn(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  if (!id) throw new Error("bad_request");
  const text = str(formData.get("waiting_on"), 200) || null;

  const { error } = await db.from("projects").update({ waiting_on: text }).eq("id", id);
  if (error) {
    console.error("[setWaitingOn] update failed", error.code, error.message);
    throw new Error("update_failed");
  }
  await syncWaiting(db, id);
  doneProject(id);
}

/**
 * Sends a preview for review. Any checkpoint still open is withdrawn first
 * (a wrong link gets replaced, not stacked). Optionally emails the client
 * the portal link; the result shows up as ?mail= on the project page.
 */
export async function sendCheckpoint(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  const stage = Number(formData.get("stage"));
  const previewUrl = str(formData.get("preview_url"), 500);
  const note = str(formData.get("note"), 4000);
  if (!id || !(REVIEW_STAGES as readonly number[]).includes(stage) || !/^https?:\/\/\S+$/.test(previewUrl)) {
    throw new Error("bad_request");
  }

  const p = await loadProjectForAdmin(db, id, { links: false });
  if (!p) throw new Error("not_found");

  const { error: wErr } = await db
    .from("project_checkpoints")
    .update({ status: "withdrawn", decided_at: new Date().toISOString() })
    .eq("project_id", id)
    .eq("status", "open");
  if (wErr) {
    console.error("[sendCheckpoint] withdraw failed", wErr.code, wErr.message);
    throw new Error("update_failed");
  }

  const { data: cp, error } = await db
    .from("project_checkpoints")
    .insert({ project_id: id, stage, preview_url: previewUrl, note })
    .select("created_at")
    .single();
  if (error || !cp) {
    console.error("[sendCheckpoint] insert failed", error?.code, error?.message);
    throw new Error("create_failed");
  }
  await syncWaiting(db, id);

  let mail = "off";
  if (formData.get("email") === "on") {
    const to = typeof p.answers["q3.email"] === "string" ? p.answers["q3.email"] : "";
    mail = "none";
    if (to && p.access_token) {
      const sent = await sendEmail(
        checkpointSentMail({
          to, lang: p.locale, pkg: p.package, clientName: p.client_name, stage: stage as Stage,
          sentAt: cp.created_at, note, portalUrl: `${await portalOrigin()}/portal/${p.access_token}`,
        })
      );
      mail = sent ? "sent" : "failed";
    }
  }
  doneProject(id);
  redirect(`/admin/projects/${id}?mail=${mail}#checkpoints`);
}

/**
 * Closes an open checkpoint from our side: "approved" when the client said
 * yes by phone or email, "withdrawn" when the preview shouldn't be reviewed.
 */
export async function closeCheckpoint(formData: FormData) {
  const db = await admin();
  const id = uuid(formData.get("id"));
  const cpId = uuid(formData.get("checkpoint_id"));
  const status = oneOf(formData.get("status"), ["approved", "withdrawn"] as const);
  if (!id || !cpId || !status) throw new Error("bad_request");

  const { error } = await db
    .from("project_checkpoints")
    .update({
      status,
      decided_at: new Date().toISOString(),
      ...(status === "approved" ? { decided_by: str(formData.get("decided_by"), 120) || "Weturn (by phone/email)" } : {}),
    })
    .eq("id", cpId)
    .eq("project_id", id)
    .eq("status", "open");
  if (error) {
    console.error("[closeCheckpoint] update failed", error.code, error.message);
    throw new Error("update_failed");
  }
  await syncWaiting(db, id);
  doneProject(id);
}
