import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { updateInquiry } from "./actions";

export const dynamic = "force-dynamic";

type Inquiry = {
  id: string; created_at: string;
  name: string; email: string; message: string;
  tier: string | null; budget: string | null; content_readiness: string | null;
  status: string; admin_notes: string | null; locale: string | null;
  referrer_host: string | null; utm_source: string | null;
};

const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"];

const badge: Record<string, string> = {
  new: "border-accent-green/40 bg-accent-green/15 text-accent-green",
  contacted: "border-brand-400/40 bg-brand-400/10 text-brand-300",
  quoted: "border-brand-400/40 bg-brand-400/10 text-brand-300",
  won: "border-accent-green/40 bg-accent-green/15 text-accent-green",
  lost: "border-white/10 bg-white/5 text-ink-soft",
  spam: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default async function Inquiries({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Defence in depth: the (dashboard) layout already gates non-admins, but it
  // renders concurrently with this page, so gate here too — never run the
  // inquiries query for a session that isn't an admin. RLS is the last word.
  const { db, isAdmin } = await requireAdmin();
  if (!db || !isAdmin) redirect("/admin/login");
  const status = (await searchParams).status;

  let q = db.from("inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data, error } = await q;

  const rows = (data ?? []) as Inquiry[];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink">Inquiries</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Newest first. 200 most recent.</p>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
          <a
            href="/admin/inquiries"
            className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
              !status ? "border-brand-400 bg-brand-400/15 text-brand-300" : "border-[var(--glass-border)] text-ink-soft hover:text-ink"
            }`}
          >
            All
          </a>
          {STATUSES.map((s) => (
            <a
              key={s}
              href={`/admin/inquiries?status=${s}`}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
                status === s ? "border-brand-400 bg-brand-400/15 text-brand-300" : "border-[var(--glass-border)] text-ink-soft hover:text-ink"
              }`}
            >
              {s}
            </a>
          ))}
        </nav>
      </div>

      {error && (
        <p className="glass rounded-card p-5 text-[14px] text-red-300">
          Could not read inquiries: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="glass rounded-card p-10 text-center">
          <p className="font-display text-xl text-ink">Nothing here yet.</p>
          <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-ink-soft">
            Inquiries sent through the contact form land here the moment they arrive.
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="glass rounded-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-[18px] font-medium text-ink">{r.name}</p>
                <a
                  href={`mailto:${r.email}`}
                  className="text-[13.5px] text-brand-300 underline decoration-brand-500/40 underline-offset-4"
                >
                  {r.email}
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[12px] ${badge[r.status] ?? badge.lost}`}>
                  {r.status}
                </span>
                <time className="text-[12.5px] text-ink-soft" dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleString("pl-PL")}
                </time>
              </div>
            </div>

            {/* whitespace-pre-wrap, never dangerouslySetInnerHTML — this is
                untrusted text from a public form. React escapes it; keep it that way. */}
            <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-soft">
              {r.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-ink-soft">
              {[
                ["tier", r.tier],
                ["budget", r.budget],
                ["content", r.content_readiness],
                ["lang", r.locale],
                ["from", r.referrer_host],
                ["utm", r.utm_source],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <span key={k as string} className="rounded-full border border-[var(--glass-border)] px-2.5 py-1">
                    {k}: <span className="text-ink">{v}</span>
                  </span>
                ))}
            </div>

            <form action={updateInquiry} className="mt-5 flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={r.id} />
              <div>
                <label htmlFor={`s-${r.id}`} className="mb-1 block text-[12px] text-ink-soft">
                  Status
                </label>
                <select
                  id={`s-${r.id}`}
                  name="status"
                  defaultValue={r.status}
                  className="rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-2 text-[13.5px] text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[240px] flex-1">
                <label htmlFor={`n-${r.id}`} className="mb-1 block text-[12px] text-ink-soft">
                  Notes
                </label>
                <input
                  id={`n-${r.id}`}
                  name="admin_notes"
                  defaultValue={r.admin_notes ?? ""}
                  maxLength={8000}
                  className="w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-3 py-2 text-[13.5px] text-ink"
                />
              </div>
              <button
                type="submit"
                className="min-h-[40px] rounded-full bg-brand-400 px-5 text-[13.5px] font-semibold text-[#05080F] hover:bg-brand-300"
              >
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
