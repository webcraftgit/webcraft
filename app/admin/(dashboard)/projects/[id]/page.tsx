import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { loadProjectForAdmin, type AdminFile } from "@/lib/portal/admin";
import { answerLines } from "@/lib/portal/export";
import { QUESTIONS, SECTIONS, missingRequired, progress, type FileCounts } from "@/lib/portal/questions";
import { STATUS_LABEL } from "@/lib/portal/status";
import { formatBytes } from "@/lib/portal/uploads";
import { CopyLink } from "@/components/admin/ProjectControls";

export const dynamic = "force-dynamic";

const PACKAGE_LABEL = { launch: "Launch", business: "Business", signature: "Signature" } as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, isAdmin } = await requireAdmin();
  if (!db || !isAdmin) redirect("/admin/login");

  const p = await loadProjectForAdmin(db, (await params).id);
  if (!p) notFound();

  const counts = p.files.reduce<FileCounts>((c, f) => ({ ...c, [f.kind]: (c[f.kind] ?? 0) + 1 }), {});
  const missing = missingRequired(p.answers, counts);
  const missingIds = new Set(missing.map((q) => q.id));
  const pct = Math.round(progress(p.answers, counts) * 100);
  const url = p.access_token && p.status !== "archived" ? `${SITE_URL}/portal/${p.access_token}` : null;

  return (
    <>
      <Link href="/admin/projects" className="text-[13px] text-ink-soft hover:text-ink">← All projects</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink">{p.client_name}</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            {PACKAGE_LABEL[p.package]} · portal in {p.locale === "pl" ? "Polish" : "English"} · {STATUS_LABEL[p.status]}
          </p>
        </div>
        <a
          href={`/admin/projects/${p.id}/brief`}
          className="min-h-[40px] rounded-full bg-brand-400 px-5 py-2.5 text-[13.5px] font-semibold text-[#05080F] hover:bg-brand-300"
        >
          Download brief input (.md)
        </a>
      </div>

      {url && <div className="mt-5 max-w-[720px]"><CopyLink url={url} /></div>}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Answers ─────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">
                {i + 1}. {s.en}
              </h2>
              <div className="glass divide-y divide-[var(--glass-border)] rounded-card">
                {QUESTIONS.filter((q) => q.section === i + 1).map((q) => {
                  const lines = answerLines(q, p.answers);
                  const files = q.files ? p.files.filter((f) => f.kind === q.files!.kind) : [];
                  const empty = !lines.length && !files.length;
                  return (
                    <div key={q.id} id={q.id} className="scroll-mt-24 p-5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12.5px] tabular-nums text-ink-soft">{q.n}.</span>
                        <p className="text-[14.5px] font-medium text-ink">{q.title.en}</p>
                        {missingIds.has(q.id) && (
                          <span className="ml-auto shrink-0 rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[11.5px] text-red-300">
                            required · missing
                          </span>
                        )}
                      </div>

                      {/* Client text: rendered as text, never as HTML. */}
                      {q.files ? (
                        <FileGrid files={files} logo={q.files.kind === "logo"} fallback={!files.length && p.answers[q.files.fallbackKey] === true ? q.files.fallbackLabel.en : null} />
                      ) : empty ? (
                        <p className="mt-2 text-[14px] text-ink-soft/60">—</p>
                      ) : lines.length === 1 && !lines[0].label ? (
                        <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-soft">{lines[0].value}</p>
                      ) : (
                        <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-[14px] sm:grid-cols-[180px_1fr]">
                          {lines.map((l, k) => (
                            <div key={k} className="contents">
                              <dt className="text-ink-soft/70">{l.label ?? "Answer"}</dt>
                              <dd className="whitespace-pre-wrap text-ink-soft">{l.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="glass rounded-card p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">Clock start</h2>
            {missing.length ? (
              <>
                <p className="mt-2 text-[15px] font-medium text-ink">Not ready</p>
                <p className="mt-1 text-[13px] text-ink-soft">Still missing ({missing.length}):</p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {missing.map((q) => (
                    <li key={q.id}>
                      <a href={`#${q.id}`} className="text-brand-300 hover:underline">{q.n}. {q.title.en}</a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[15px] font-medium text-accent-green">Ready: all required answers are in.</p>
            )}
            <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-soft">
              <span className="inline-block h-1.5 flex-1 overflow-hidden rounded-full bg-white/5" aria-hidden>
                <span className="block h-full bg-brand-400" style={{ width: `${pct}%` }} />
              </span>
              <span className="tabular-nums text-ink">{pct}%</span> answered
            </div>
          </section>

          <section className="glass space-y-1.5 rounded-card p-5 text-[13px] text-ink-soft">
            <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">Timeline</h2>
            <p>Created: <span className="text-ink">{when(p.created_at)}</span></p>
            <p>Last answer saved: <span className="text-ink">{p.answersUpdatedAt ? when(p.answersUpdatedAt) : "—"}</span></p>
            <p>Questionnaire sent: <span className="text-ink">{p.intake_submitted_at ? when(p.intake_submitted_at) : "not yet"}</span></p>
            <p>Files: <span className="text-ink">{counts.logo ?? 0} logo · {counts.photo ?? 0} photos</span></p>
          </section>

          <p className="px-1 text-[12.5px] leading-relaxed text-ink-soft">
            Download links on this page last one hour. Reload the page for fresh ones.
          </p>
        </aside>
      </div>
    </>
  );
}

function FileGrid({ files, logo, fallback }: { files: AdminFile[]; logo: boolean; fallback: string | null }) {
  return (
    <div className="mt-3 space-y-3">
      {fallback && (
        <p className="text-[13.5px] text-ink-soft">
          Client chose: <span className="text-ink">{fallback}</span>
        </p>
      )}
      {files.length === 0 ? (
        !fallback && <p className="text-[14px] text-ink-soft/60">No files.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {files.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)]">
              <div className="grid aspect-[4/3] place-items-center bg-white/[0.03]">
                {f.view ? (
                  // Private file behind a short-lived signed URL: plain <img>, no optimiser cache.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.view} alt="" loading="lazy" className={`size-full ${logo ? "object-contain p-3" : "object-cover"}`} />
                ) : (
                  <span className="text-[12px] font-medium uppercase tracking-wider text-ink-soft">{f.original_name.split(".").pop()}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] text-ink" title={f.original_name}>{f.original_name}</span>
                  <span className="block text-[11.5px] text-ink-soft">{formatBytes(f.size_bytes)}</span>
                </span>
                {f.download && (
                  <a
                    href={f.download}
                    aria-label={`Download ${f.original_name}`}
                    className="shrink-0 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[12px] text-brand-300 hover:border-brand-400"
                  >
                    ↓
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
