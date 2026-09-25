import { redirect } from "next/navigation";
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

  // retention
  visitors_new: number; visitors_returning: number; multi_day_visitors: number;
  cohorts: { k: string; size: number; ret: number }[];
  visits_before_inquiry: Row[];
  // marketing / attribution
  inq_by_source: Row[]; inq_by_channel: Row[]; by_channel: Row[];
  by_utm_medium: Row[]; by_utm_campaign: Row[]; landing_pages: Row[];
  // engagement / site quality
  sessions_with_pv: number; bounced_sessions: number; avg_session_seconds: number;
  section_funnel: Row[];
};

/** Seconds → "2m 40s" / "45s". Session length is rough by nature (it can't see
 *  the final page's dwell time), so we don't pretend to sub-second precision. */
const dur = (s: number) => {
  const t = Math.round(s || 0);
  return t >= 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t}s`;
};

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { db } = await requireAdmin();
  if (!db) redirect("/admin/login"); // no backend configured on this deployment
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

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">Do they come back</h2>
      <p className="mb-4 max-w-[70ch] text-[13.5px] text-ink-soft">
        A visitor is “new” the first time we ever see them and “returning” once they come back on a
        later day. People rarely commission a site on their first visit — this is where you see the
        trust build.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New visitors" value={o.visitors_new} sub="first time we’ve seen them" />
        <Stat label="Returning" value={o.visitors_returning} sub="had visited before this range" />
        <Stat
          label="Came back"
          value={o.multi_day_visitors}
          sub={`${pct(o.multi_day_visitors, o.visitors)} visited on 2+ days`}
        />
        <Stat
          label="Return rate"
          value={pct(o.visitors_returning, o.visitors)}
          sub="share who are returning"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Visits before an inquiry" note="How many separate visits a lead made before sending the form.">
          <Bars rows={o.visits_before_inquiry} empty="No inquiries with analytics consent yet." />
        </Panel>
        <Panel title="Weekly cohorts" note="Of the visitors first seen that week, how many ever came back.">
          {(o.cohorts ?? []).length ? (
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-ink-soft">
                  <th className="pb-2 text-left font-normal">Week of</th>
                  <th className="pb-2 text-right font-normal">New</th>
                  <th className="pb-2 text-right font-normal">Returned</th>
                  <th className="pb-2 text-right font-normal">Rate</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {(o.cohorts ?? []).map((c) => (
                  <tr key={c.k} className="border-t border-[var(--glass-border)]">
                    <td className="py-1.5 text-ink">{c.k}</td>
                    <td className="py-1.5 text-right text-ink-soft">{c.size}</td>
                    <td className="py-1.5 text-right text-ink-soft">{c.ret}</td>
                    <td className="py-1.5 text-right text-ink">{pct(c.ret, c.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13.5px] text-ink-soft">No data yet.</p>
          )}
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">Which marketing works</h2>
      <p className="mb-4 max-w-[70ch] text-[13.5px] text-ink-soft">
        The first two panels count actual inquiries, not clicks. A channel that sends a lot of
        traffic but few of these is a channel to rethink.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Inquiries by source">
          <Bars rows={o.inq_by_source} empty="No inquiries with attribution yet." />
        </Panel>
        <Panel title="Inquiries by channel">
          <Bars rows={o.inq_by_channel} empty="No inquiries with attribution yet." />
        </Panel>
        <Panel title="All traffic by channel">
          <Bars rows={o.by_channel} />
        </Panel>
        <Panel title="Landing pages">
          <Bars rows={o.landing_pages} />
        </Panel>
        <Panel title="Campaign medium">
          <Bars rows={o.by_utm_medium} />
        </Panel>
        <Panel title="Campaign name">
          <Bars rows={o.by_utm_campaign} />
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 font-display text-[20px] font-medium text-ink">Site quality</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Bounce rate"
          value={pct(o.bounced_sessions, o.sessions_with_pv)}
          sub="left after a single page"
        />
        <Stat label="Avg time on site" value={dur(o.avg_session_seconds)} sub="per session" />
        <Stat
          label="Pages / session"
          value={o.sessions > 0 ? (o.pageviews / o.sessions).toFixed(1) : "—"}
          sub={`${o.pageviews} page views`}
        />
        <Stat
          label="Engaged sessions"
          value={pct(o.sessions_with_pv - o.bounced_sessions, o.sessions_with_pv)}
          sub="saw more than one page"
        />
      </div>
      <div className="mt-4">
        <Panel title="Where attention falls off" note="Sections in page order. Each is counted once per session at 40% visible.">
          <Funnel steps={(o.section_funnel ?? []).map((s) => ({ label: s.k, value: s.c }))} />
        </Panel>
      </div>
    </>
  );
}
