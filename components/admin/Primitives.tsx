/**
 * Dashboard primitives. Deliberately plain: this is an internal tool, and the
 * only thing it owes the reader is legibility. All the site's boldness lives on
 * the marketing page — spending it twice would make both places noisier.
 */

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-card p-5">
      <p className="text-[12.5px] uppercase tracking-[0.06em] text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-[30px] font-medium leading-none text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-[12.5px] text-ink-soft">{sub}</p>}
    </div>
  );
}

export function Panel({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="glass rounded-card p-5">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">{title}</h2>
      {note && <p className="mt-1 text-[12.5px] text-ink-soft">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Row = { k: string; c: number };

/** Horizontal bars beat a pie chart at every size, and they read at a glance. */
export function Bars({ rows, empty = "No data yet." }: { rows: Row[]; empty?: string }) {
  if (!rows?.length) return <p className="text-[13.5px] text-ink-soft">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.k}>
          <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
            <span className="truncate text-ink">{r.k}</span>
            <span className="tabular-nums text-ink-soft">{r.c}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(56,189,248,0.10)]">
            <div className="h-full rounded-full bg-brand-400" style={{ width: `${(r.c / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel: each step is drawn as a share of the FIRST step, so the shape itself
 *  carries the drop-off. Percentages are of the previous step — that's the
 *  number you act on. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value || 0;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i === 0 ? s.value : steps[i - 1]!.value;
        const rate = prev > 0 ? Math.round((s.value / prev) * 100) : 0;
        const width = first > 0 ? Math.max((s.value / first) * 100, 6) : 6;
        const last = i === steps.length - 1;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
              <span className="text-ink">{s.label}</span>
              <span className="tabular-nums text-ink-soft">
                {s.value}
                {i > 0 && <span className="ml-2 text-ink-soft/70">{rate}%</span>}
              </span>
            </div>
            <div
              className={`mt-1 h-8 rounded-input border ${
                last
                  ? "border-accent-green/40 bg-accent-green/15"
                  : "border-brand-400/30 bg-brand-400/10"
              }`}
              style={{ width: `${width}%` }}
            />
          </li>
        );
      })}
    </ol>
  );
}

/** Two series, one 30-day trend. Inline SVG — no chart library for 40 points. */
export function Spark({ daily }: { daily: { day: string; sessions: number; inquiries: number }[] }) {
  if (!daily?.length) return <p className="text-[13.5px] text-ink-soft">No data yet.</p>;
  const w = 640, h = 120, pad = 4;
  const maxS = Math.max(...daily.map((d) => d.sessions), 1);
  const maxI = Math.max(...daily.map((d) => d.inquiries), 1);
  const x = (i: number) => pad + (i / Math.max(daily.length - 1, 1)) * (w - pad * 2);
  const line = (key: "sessions" | "inquiries", max: number) =>
    daily.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${(h - pad - (d[key] / max) * (h - pad * 2)).toFixed(1)}`).join(" ");

  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Sessions and inquiries over time">
        <path d={line("sessions", maxS)} fill="none" stroke="var(--brand-400)" strokeWidth="2" />
        <path d={line("inquiries", maxI)} fill="none" stroke="var(--accent-green)" strokeWidth="2" />
      </svg>
      <div className="mt-2 flex gap-5 text-[12.5px] text-ink-soft">
        <span className="flex items-center gap-2"><i className="h-0.5 w-4 bg-brand-400" />Sessions (max {maxS})</span>
        <span className="flex items-center gap-2"><i className="h-0.5 w-4 bg-accent-green" />Inquiries (max {maxI})</span>
      </div>
    </>
  );
}
