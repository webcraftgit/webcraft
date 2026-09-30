import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { missingRequired, progress, sanitizeAnswers, type FileCounts } from "@/lib/portal/questions";
import { PROJECT_STATUSES, STATUS_LABEL, type ProjectStatus } from "@/lib/portal/status";
import { CopyLink, ConfirmSubmit, Submit } from "@/components/admin/ProjectControls";
import { createProject, deleteProject, replaceLink, setProjectStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string; created_at: string; client_name: string;
  package: "launch" | "business" | "signature"; locale: "pl" | "en";
  status: ProjectStatus; access_token: string | null; token_created_at: string | null;
  intake_submitted_at: string | null;
  intake_answers: { answers: unknown } | { answers: unknown }[] | null;
  project_files: { kind: "logo" | "photo" }[];
};

const PACKAGE_LABEL = { launch: "Launch", business: "Business", signature: "Signature" } as const;

const badge: Record<ProjectStatus, string> = {
  intake: "border-brand-400/40 bg-brand-400/10 text-brand-300",
  submitted: "border-accent-green/40 bg-accent-green/15 text-accent-green",
  active: "border-brand-400/40 bg-brand-400/10 text-brand-300",
  launched: "border-accent-green/40 bg-accent-green/15 text-accent-green",
  archived: "border-white/10 bg-white/5 text-ink-soft",
};

const field =
  "rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-2 text-[13.5px] text-ink";

const date = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

export default async function Projects({ searchParams }: { searchParams: Promise<{ new?: string; show?: string }> }) {
  // Same double gate as inquiries/page.tsx; RLS is the last word.
  const { db, isAdmin } = await requireAdmin();
  if (!db || !isAdmin) redirect("/admin/login");
  const { new: fresh, show } = await searchParams;
  const showArchived = show === "all";

  let q = db
    .from("projects")
    .select(
      "id, created_at, client_name, package, locale, status, access_token, token_created_at, intake_submitted_at, intake_answers(answers), project_files(kind)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showArchived) q = q.neq("status", "archived");
  const { data, error } = await q;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink">Projects</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            One private portal link per client. Send it after the contract is signed and the deposit is paid.
          </p>
        </div>
        <a
          href={showArchived ? "/admin/projects" : "/admin/projects?show=all"}
          className="rounded-full border border-[var(--glass-border)] px-3.5 py-1.5 text-[13px] text-ink-soft hover:text-ink"
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </a>
      </div>

      <form action={createProject} className="glass mb-8 flex flex-wrap items-end gap-3 rounded-card p-5">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="client_name" className="mb-1 block text-[12px] text-ink-soft">Client / business name</label>
          <input id="client_name" name="client_name" required maxLength={120} placeholder="e.g. Dentica Mokotów" className={`w-full ${field}`} />
        </div>
        <div>
          <label htmlFor="package" className="mb-1 block text-[12px] text-ink-soft">Package</label>
          <select id="package" name="package" defaultValue="business" className={field}>
            <option value="launch">Launch</option>
            <option value="business">Business</option>
            <option value="signature">Signature</option>
          </select>
        </div>
        <div>
          <label htmlFor="locale" className="mb-1 block text-[12px] text-ink-soft">Portal language</label>
          <select id="locale" name="locale" defaultValue="pl" className={field}>
            <option value="pl">Polish</option>
            <option value="en">English</option>
          </select>
        </div>
        <Submit>New project</Submit>
      </form>

      {error && (
        <p className="glass rounded-card p-5 text-[14px] text-red-300">
          Could not read projects. Has <code>supabase/portal.sql</code> been run?
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="glass rounded-card p-10 text-center">
          <p className="font-display text-xl text-ink">No projects yet.</p>
          <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-ink-soft">
            Create one above, copy its link and send it to the client with the contract.
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {rows.map((r) => {
          const ans = Array.isArray(r.intake_answers) ? r.intake_answers[0] : r.intake_answers;
          const answers = sanitizeAnswers(ans?.answers);
          const files = r.project_files.reduce<FileCounts>((c, f) => ({ ...c, [f.kind]: (c[f.kind] ?? 0) + 1 }), {});
          const pct = Math.round(progress(answers, files) * 100);
          const missing = missingRequired(answers, files).length;
          const url = r.access_token ? `${SITE_URL}/portal/${r.access_token}` : null;

          return (
            <li
              key={r.id}
              className={`glass rounded-card p-5 ${fresh === r.id ? "ring-2 ring-brand-400" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/projects/${r.id}`} className="font-display text-[18px] font-medium text-ink hover:text-brand-300">
                    {r.client_name} <span aria-hidden className="text-ink-soft">→</span>
                  </Link>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {PACKAGE_LABEL[r.package]} · portal in {r.locale === "pl" ? "Polish" : "English"} · created {date(r.created_at)}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[12px] ${badge[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-soft">
                <span className="flex items-center gap-2">
                  Questionnaire
                  <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-white/5" aria-hidden>
                    <span className="block h-full bg-brand-400" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="tabular-nums text-ink">{pct}%</span>
                </span>
                <span>
                  {missing ? <>Required missing: <span className="text-ink">{missing}</span></> : <span className="text-accent-green">All required in</span>}
                </span>
                <span>Logo files: <span className="text-ink">{files.logo ?? 0}</span></span>
                <span>Photos: <span className="text-ink">{files.photo ?? 0}</span></span>
                {r.intake_submitted_at && <span>Sent {date(r.intake_submitted_at)}</span>}
              </div>

              {fresh === r.id && (
                <p className="mt-4 text-[13.5px] text-brand-300">Project created. Copy the link below and send it to the client.</p>
              )}

              <div className="mt-4">
                {url && r.status !== "archived" ? (
                  <CopyLink url={url} />
                ) : (
                  <p className="text-[13px] text-ink-soft">Link is off while the project is archived.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--glass-border)] pt-4">
                <form action={setProjectStatus} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label htmlFor={`st-${r.id}`} className="mb-1 block text-[12px] text-ink-soft">Status</label>
                    <select id={`st-${r.id}`} name="status" defaultValue={r.status} className={field}>
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                  <Submit>Save</Submit>
                </form>

                <div className="ml-auto flex flex-wrap gap-2">
                  <form action={replaceLink}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmit confirm={`Make a new link for ${r.client_name}? The current link stops working immediately.`}>
                      New link
                    </ConfirmSubmit>
                  </form>
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmit danger confirm={`Delete ${r.client_name} for good? Answers and uploaded files are removed and can't be recovered.`}>
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
