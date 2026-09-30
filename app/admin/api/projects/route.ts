import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The admin's projects as JSON, for Weturn Studio. Studio calls this from
 * inside its signed-in admin view, so it rides on the same session cookie:
 * no key of its own. Same gate as the dashboard (proxy.ts + requireAdmin),
 * and RLS still decides which rows come back. Archived projects are left out.
 */
export async function GET() {
  const { db, isAdmin } = await requireAdmin();
  if (!db || !isAdmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("projects")
    .select("id, client_name, package, locale, status, created_at, intake_submitted_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  return NextResponse.json({ projects: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
