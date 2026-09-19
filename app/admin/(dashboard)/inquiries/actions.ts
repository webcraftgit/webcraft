"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";
import { oneOf, str } from "@/lib/security/validation";

const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;

/**
 * Server Actions are public HTTP endpoints with a nice syntax. Anyone who can
 * guess the action id can POST to it — so it re-checks admin, exactly like a
 * route handler would. The update also runs through the user's JWT, so the RLS
 * policy `inquiries_admin_update` is the final word.
 */
export async function updateInquiry(formData: FormData) {
  const { db, isAdmin } = await requireAdmin();
  if (!isAdmin) throw new Error("forbidden");

  const id = str(formData.get("id"), 36);
  const status = oneOf(formData.get("status"), STATUSES);
  const notes = str(formData.get("admin_notes"), 8000);
  if (!id || !status) throw new Error("bad_request");

  const { error } = await db.from("inquiries").update({ status, admin_notes: notes || null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}
