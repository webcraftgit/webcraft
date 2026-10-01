import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { EMPTY_CLOCK, type Portal } from "@/lib/portal/data";
import IntakeForm from "@/components/portal/IntakeForm";
import TabSessionGuard from "@/components/admin/TabSessionGuard";

export const dynamic = "force-dynamic";

const PACKAGES = ["launch", "business", "signature"] as const;

/**
 * The client questionnaire exactly as a client sees it, without making a
 * project. Outside the (dashboard) group so it gets the portal's full-width
 * layout, which means it repeats the dashboard's gate here. Nothing is saved:
 * IntakeForm's `preview` keeps answers and uploads in the page.
 */
export default async function PreviewQuestionnaire({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; package?: string }>;
}) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) redirect("/admin/login");
  if (!isAdmin) redirect("/admin/login?denied=1");

  const { lang, package: pkg } = await searchParams;
  const portal: Portal = {
    id: "preview",
    clientName: lang === "en" ? "Your business (preview)" : "Twoja firma (podgląd)",
    package: PACKAGES.find((p) => p === pkg) ?? "business",
    locale: lang === "en" ? "en" : "pl",
    status: "intake",
    submittedAt: null,
    answers: {},
    files: [],
    clock: EMPTY_CLOCK,
    checkpoints: [],
  };

  return (
    <TabSessionGuard>
      <IntakeForm token="preview" portal={portal} preview />
    </TabSessionGuard>
  );
}
