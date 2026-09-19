import { requireAdmin } from "@/lib/supabase/server";
import { Bars, Funnel, Panel, Spark, Stat } from "@/components/admin/Primitives";

export const dynamic = "force-dynamic";

type Row = { k: string; c: number };
type Overview = {
  since: string; days: number;
  visitors: number; sessions: number; pageviews: number;
  reached_pricing: number; form_starts: number; form_submits: number;
  inquiries: number; inquiries_new: number;
  by_status: Row[]; by_tier: Row[]; by_budget: Row[]; by_readiness: Row[];
  by_device: Row[]; by_locale: Row[]; by_country: Row[]; by_referrer: Row[]; by_utm_source: Row[];
  chip_tier: Row[]; chip_budget: Row[]; section_reach: Row[]; scroll_depth: Row[];
  daily: { day: string; sessions: number; inquiries: number }[];
};

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { db } = await requireAdmin();
  const days = Math.min(Math.max(Number((await searchParams).days ?? 30) || 30, 1), 365);

  // Aggregation happens in Postgres (admin_overview), not here. Pulling the raw
  // event stream into a server component to count it would work fine at 500
  // rows and fall over at 500,000.
  const { data, error } = await db.rpc("admin_overview", { p_days: days });

  if (error || !data) {
    return (
      <div className="glass rounded-card p-6">
        <h1 className="font-display text-xl text-ink">The dashboard could not load its data.</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {error?.message ?? "The admin_overview function returned nothing."} Check that
          supabase/schema.sql has been run against this project.
        </p>
      </div>
    );
  }

  const o = data as Overview;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink">Overview</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            Last {o.days} days. Behavioural figures count only visitors who accepted analytics.
          </p>
        </div>
        <nav className="flex gap-1.5" aria-label="Date range">
          {[7, 30, 90, 365].map((d) => (
            <a
              key={d}
              href={`/admin?days=${d}`}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                d === o.days
                  ? "border-brand-400 bg-brand-400/15 text-brand-300"
                  : "border-[var(--glass-border)] text-ink-soft hover:text-ink"
              }`}
            >
              {d}d
            </a>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Inquiries" value={o.inquiries} sub={`${o.inquiries_new} unanswered`} />
        <Stat label="Visitors" value={o.visitors} sub={`${o.sessions} sessions`} />
        <Stat
          label="Session → inquiry"
          value={pct(o.form_submits, o.sessions)}
          sub="the number that matters"
        />
        <Stat
          label="Form completion"
          value={pct(o.form_submits, o.form_starts)}
          sub={`${o.form_starts} people started typing`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Traffic and inquiries" note="Two scales — read the shape, not the crossing point.">
            <Spark daily={o.daily} />
          </Panel>
        </div>

        <Panel title="Funnel" note="Sessions, not visitors. Percentages are of the step above.">
          <Funnel
            steps={[
              { label: "Arrived", value: o.sessions },
              { label: "Reached pricing", value: o.reached_pricing },
              { label: "Started the form", value: o.form_starts },
              { label: "Sent an inquiry", value: o.form_submits },
            ]}
          />
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">Who is asking</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Tier requested">
          <Bars rows={o.by_tier} />
        </Panel>
        <Panel title="Budget band">
          <Bars rows={o.by_budget} />
        </Panel>
        <Panel title="Content readiness">
          <Bars rows={o.by_readiness} />
        </Panel>
        <Panel title="Inquiry status">
          <Bars rows={o.by_status} />
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">Where they came from</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Referrer">
          <Bars rows={o.by_referrer} />
        </Panel>
        <Panel title="Campaign source">
          <Bars rows={o.by_utm_source} />
        </Panel>
        <Panel title="Device">
          <Bars rows={o.by_device} />
        </Panel>
        <Panel title="Language">
          <Bars rows={o.by_locale} />
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">What they did</h2>
      <p className="mb-4 max-w-[70ch] text-[13.5px] text-ink-soft">
        Sections are counted once per session at 40% visible. Chip counts include people who
        never sent the form — that gap between a chosen tier and a sent inquiry is the most
        useful thing on this page.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Sections reached">
          <Bars rows={o.section_reach} />
        </Panel>
        <Panel title="Scroll depth">
          <Bars rows={o.scroll_depth.map((r) => ({ k: `${r.k}%`, c: r.c }))} />
        </Panel>
        <Panel title="Tier chip clicked">
          <Bars rows={o.chip_tier} />
        </Panel>
        <Panel title="Budget chip clicked">
          <Bars rows={o.chip_budget} />
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Countries">
          <Bars rows={o.by_country} />
        </Panel>
      </div>
    </>
  );
}
