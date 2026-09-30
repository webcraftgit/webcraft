import { requireAdmin } from "@/lib/supabase/server";
import { loadProjectForAdmin } from "@/lib/portal/admin";
import { buildBriefInput } from "@/lib/portal/export";

export const dynamic = "force-dynamic";

/**
 * "Download brief input": the questionnaire as markdown for /brief-to-plan.
 * proxy.ts only proves a session exists, so the admin check is repeated
 * here; RLS on the reads is the last word.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, isAdmin } = await requireAdmin();
  if (!db || !isAdmin) return new Response("Forbidden", { status: 403 });

  const p = await loadProjectForAdmin(db, (await params).id, { links: false });
  if (!p) return new Response("Not found", { status: 404 });

  const md = buildBriefInput({
    clientName: p.client_name,
    package: p.package,
    locale: p.locale,
    submittedAt: p.intake_submitted_at,
    answers: p.answers,
    files: p.files,
  });

  const slug =
    p.client_name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l").replace(/Ł/g, "L")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "client";

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="questionnaire-${slug}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
