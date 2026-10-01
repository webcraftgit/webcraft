"use client";

import { useEffect, useMemo, useState } from "react";
import type { Portal } from "@/lib/portal/data";
import {
  DEVICES, FEEDBACK_MAX, PACKAGE_NAME, STAGE, TOTAL_DAYS,
  clockDay, replyBy, rounds, stageName, stageState, stagesFor,
  type Checkpoint, type Device, type FeedbackItem, type Lang,
} from "@/lib/portal/checkpoints";
import { THANK_YOU } from "@/lib/portal/questions";
import { respondCheckpointAction } from "@/app/portal/[token]/actions";

/**
 * The portal once the questionnaire is in: where the project is ("Day 3 of
 * 10 · waiting on: your feedback"), the stages, and the open checkpoint with
 * Approve / Request changes. Request changes collects ONE list of comments,
 * each with where on the page and on which screen, so clients without a
 * Vercel account can still pin feedback precisely (kit retro item #2).
 */

const T = {
  pl: {
    portal: "Portal klienta",
    yourProject: "Twój projekt",
    day: (d: number, n: number) => `Dzień ${d} z ${n}`,
    notStarted: "Zegar projektu jeszcze nie ruszył",
    live: "Strona jest online",
    clockNote: "Liczymy nasze dni robocze. Dni, w których czekamy na Ciebie, się nie wliczają.",
    waitingOn: "Czekamy na:",
    yourFeedback: (s: string) => `Twoją opinię o etapie „${s}”`,
    working: "Pracujemy. Teraz nic od Ciebie nie potrzebujemy.",
    stages: "Etapy",
    approved: "Zaakceptowany",
    inReview: "Do sprawdzenia",
    fixing: "Nanosimy poprawki",
    todo: "Wkrótce",
    done: "Gotowe",
    roundsUsed: (u: number, i: number) => `Rundy poprawek: ${u} z ${i} w pakiecie`,
    fixesOnly: "Na tym etapie tylko poprawki błędów",
    review: "Do sprawdzenia",
    openPreview: "Otwórz podgląd",
    replyBy: (d: string) => `Prosimy o odpowiedź do ${d}. Bez odpowiedzi uznamy ten etap za zaakceptowany.`,
    roundNow: (n: number, i: number) => `To będzie runda poprawek ${n} z ${i} w Twoim pakiecie.`,
    roundExtra: "Rundy w pakiecie na tym etapie są już wykorzystane. Kolejne zmiany wyceniamy (200 zł/h) i zawsze najpierw pytamy o zgodę.",
    roundFixes: "Na tym etapie poprawiamy błędy (np. literówki, coś nie działa). Nowe pomysły to osobna wycena.",
    approve: "Akceptuję",
    changes: "Proszę o zmiany",
    approveTitle: "Akceptacja etapu",
    approveConfirm: "Zaakceptować ten etap? Po akceptacji zmiany w tym, co zatwierdzasz, są wyceniane osobno.",
    approveSend: "Akceptuję ten etap",
    yourName: "Twoje imię i nazwisko",
    guideTitle: "Jak dać dobrą informację zwrotną",
    guide: [
      "Opisz, co jest nie tak, a nie tylko, co zrobić. „Za tłoczno” mówi nam więcej niż „zrób na niebiesko”.",
      "Sprawdź stronę także na telefonie.",
      "Zbierz uwagi wszystkich osób i wyślij je razem, jako jedną listę.",
    ],
    where: "Gdzie? (podstrona i miejsce)",
    wherePh: "np. Strona główna, sekcja z cennikiem",
    device: "Na jakim ekranie?",
    deviceName: { both: "Wszędzie", desktop: "Komputer", mobile: "Telefon" } as Record<Device, string>,
    comment: "Uwaga",
    commentPh: "Co jest nie tak albo co chcesz zmienić?",
    addItem: "+ Dodaj kolejną uwagę",
    remove: "Usuń",
    item: (n: number) => `Uwaga ${n}`,
    sendChanges: (n: number) => `Wyślij ${n} ${n === 1 ? "uwagę" : n < 5 ? "uwagi" : "uwag"} jako jedną rundę`,
    changesConfirm: (n: number) => `Wysłać ${n} ${n === 1 ? "uwagę" : "uwag(i)"}? To zamyka tę rundę: kolejne uwagi trafią do następnej.`,
    draftSaved: "Szkic zapisuje się w tej przeglądarce, możesz wrócić później.",
    sending: "Wysyłanie…",
    failed: "Nie udało się wysłać. Spróbuj ponownie za chwilę.",
    closed: "Ten etap został już zamknięty. Odśwież stronę.",
    empty: "Dodaj co najmniej jedną uwagę.",
    thanksApproved: "Dziękujemy! Etap zaakceptowany, ruszamy dalej.",
    thanksChanges: "Dziękujemy! Mamy Twoje uwagi. Poprawki zwykle zajmują nam jeden dzień roboczy, potem wyślemy nowy podgląd.",
    history: "Historia",
    sentOn: (d: string) => `Wysłano ${d}`,
    yourComments: "Twoje uwagi",
    approvedOn: (d: string, by: string | null) => `Zaakceptowano ${d}${by ? `, ${by}` : ""}`,
    autoApprovedOn: (d: string) => `Zaakceptowano automatycznie ${d} (brak odpowiedzi w ciągu 5 dni roboczych)`,
    changesOn: (d: string, by: string | null) => `Uwagi wysłane ${d}${by ? `, ${by}` : ""}`,
    questionnaire: "Ankieta",
    questionnaireSent: (d: string) => `Ankieta wysłana ${d}.`,
  },
  en: {
    portal: "Client portal",
    yourProject: "Your project",
    day: (d: number, n: number) => `Day ${d} of ${n}`,
    notStarted: "The project clock hasn't started yet",
    live: "Your site is live",
    clockNote: "We count our working days. Days spent waiting on you don't count.",
    waitingOn: "Waiting on:",
    yourFeedback: (s: string) => `your feedback on "${s}"`,
    working: "We're on it. Nothing needed from you right now.",
    stages: "Stages",
    approved: "Approved",
    inReview: "Ready for review",
    fixing: "Making changes",
    todo: "Coming up",
    done: "Done",
    roundsUsed: (u: number, i: number) => `Revision rounds: ${u} of ${i} included`,
    fixesOnly: "Fixes only at this stage",
    review: "Ready for review",
    openPreview: "Open preview",
    replyBy: (d: string) => `Please reply by ${d}. If we don't hear back, we'll treat this stage as approved.`,
    roundNow: (n: number, i: number) => `This will be revision round ${n} of ${i} included in your package.`,
    roundExtra: "The rounds included for this stage are used up. Further changes are quoted (200 zł/h), and we always ask before starting.",
    roundFixes: "At this stage we fix bugs (typos, something not working). New ideas are quoted separately.",
    approve: "Approve",
    changes: "Request changes",
    approveTitle: "Approve this stage",
    approveConfirm: "Approve this stage? After approval, changes to what it locks are quoted separately.",
    approveSend: "Approve this stage",
    yourName: "Your name",
    guideTitle: "How to give useful feedback",
    guide: [
      "Say what's wrong, not only what to do. \"This feels too busy\" tells us more than \"make it blue\".",
      "Check the site on your phone too.",
      "Collect everyone's comments and send them together, as one list.",
    ],
    where: "Where? (page and spot)",
    wherePh: "e.g. Homepage, pricing section",
    device: "On which screen?",
    deviceName: { both: "Everywhere", desktop: "Computer", mobile: "Phone" } as Record<Device, string>,
    comment: "Comment",
    commentPh: "What's wrong, or what would you like changed?",
    addItem: "+ Add another comment",
    remove: "Remove",
    item: (n: number) => `Comment ${n}`,
    sendChanges: (n: number) => `Send ${n} comment${n === 1 ? "" : "s"} as one round`,
    changesConfirm: (n: number) => `Send ${n} comment${n === 1 ? "" : "s"}? This closes the round: anything else goes into the next one.`,
    draftSaved: "Your draft is kept in this browser, so you can come back to it.",
    sending: "Sending…",
    failed: "Couldn't send. Please try again in a moment.",
    closed: "This stage has already been closed. Please reload the page.",
    empty: "Add at least one comment.",
    thanksApproved: "Thank you! Stage approved, and we're moving on.",
    thanksChanges: "Thank you! We have your comments. Changes usually take us one working day, then we'll send a new preview.",
    history: "History",
    sentOn: (d: string) => `Sent ${d}`,
    yourComments: "Your comments",
    approvedOn: (d: string, by: string | null) => `Approved ${d}${by ? ` by ${by}` : ""}`,
    autoApprovedOn: (d: string) => `Approved automatically ${d} (no reply within 5 working days)`,
    changesOn: (d: string, by: string | null) => `Comments sent ${d}${by ? ` by ${by}` : ""}`,
    questionnaire: "Questionnaire",
    questionnaireSent: (d: string) => `Questionnaire sent ${d}.`,
  },
} as const;

type Strings = (typeof T)[Lang];

const date = (iso: string | Date, lang: Lang, weekday = false) =>
  new Date(iso).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    ...(weekday ? { weekday: "long" as const } : {}), day: "numeric", month: "long", timeZone: "Europe/Warsaw",
  });

const inputCls =
  "w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand-400";

export default function ProjectView({ token, portal, now: nowIso }: { token: string; portal: Portal; now: string }) {
  const [lang, setLang] = useState<Lang>(portal.locale);
  const [cps, setCps] = useState<Checkpoint[]>(portal.checkpoints);
  const [thanks, setThanks] = useState<"approved" | "changes" | null>(null);
  const t = T[lang];
  const pkg = portal.package;

  // `now` comes from the server render, so server and client agree on the
  // day number and hydration can't flip it.
  const day = clockDay(portal.clock, new Date(nowIso));
  const total = TOTAL_DAYS[pkg];
  const open = cps.find((c) => c.status === "open") ?? null;
  const live = portal.status === "launched";

  return (
    <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Weturn · {t.portal}</p>
          <h1 className="mt-2 font-display text-[clamp(26px,4vw,36px)] font-medium leading-tight text-ink">{portal.clientName}</h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {t.yourProject} · {PACKAGE_NAME[pkg][lang]}
          </p>
        </div>
        <div role="group" aria-label="Język / Language" className="flex rounded-full border border-[var(--glass-border)] p-1">
          {(["pl", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                lang === l ? "bg-brand-400/20 text-brand-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* ── Status ─────────────────────────────────────────────────────── */}
      <section className="glass mt-8 rounded-panel p-6 sm:p-8" aria-label={t.yourProject}>
        <p className="font-display text-[clamp(22px,3.2vw,30px)] font-medium text-ink">
          {live ? t.live : day ? t.day(day, total) : t.notStarted}
        </p>
        {day && !live && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
            <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.min(100, (day / total) * 100)}%` }} />
          </div>
        )}
        {!live && (
          <div className="mt-4 space-y-1 text-[15px] leading-relaxed">
            {open || portal.clock.waitingOn ? (
              <p className="text-ink">
                <span className="text-ink-soft">{t.waitingOn}</span>{" "}
                {[open ? t.yourFeedback(stageName(open.stage, pkg, lang)) : null, portal.clock.waitingOn]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : (
              <p className="text-ink-soft">{t.working}</p>
            )}
            {day && <p className="text-[13px] text-ink-soft">{t.clockNote}</p>}
          </div>
        )}
      </section>

      {thanks && (
        <p role="status" className="mt-6 rounded-card border border-accent-green/40 bg-accent-green/10 px-5 py-4 text-[15px] text-ink">
          ✓ {thanks === "approved" ? t.thanksApproved : t.thanksChanges}
        </p>
      )}

      {open && (
        <ReviewCard
          key={open.id}
          t={t}
          lang={lang}
          token={token}
          portal={portal}
          cp={open}
          all={cps}
          defaultName={typeof portal.answers["q3.name"] === "string" ? portal.answers["q3.name"] : ""}
          onDone={(cp, kind) => {
            setCps((list) => list.map((c) => (c.id === cp.id ? cp : c)));
            setThanks(kind);
          }}
        />
      )}

      {/* ── Stages ─────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">{t.stages}</h2>
        <ol className="glass mt-3 divide-y divide-[var(--glass-border)] rounded-card">
          <StageRow n={0} name={stageName(0, pkg, lang)} state={day || live ? "approved" : "todo"} label={day || live ? t.done : t.todo} />
          {stagesFor(pkg).map((s) => {
            const state = stageState(cps, s);
            const r = rounds(pkg, cps, s);
            const label = { approved: t.approved, review: t.inReview, changes: t.fixing, todo: t.todo }[state];
            return (
              <StageRow
                key={s}
                n={s}
                name={stageName(s, pkg, lang)}
                state={state}
                label={label}

                detail={r.included === null ? t.fixesOnly : t.roundsUsed(r.used, r.included)}
              />
            );
          })}
          <StageRow n={5} name={stageName(5, pkg, lang)} state={live ? "approved" : "todo"} label={live ? t.done : t.todo} />
        </ol>
      </section>

      {/* ── History ────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-brand-500">{t.history}</h2>
        <ul className="mt-3 space-y-3">
          {[...cps].reverse().filter((c) => c.status !== "open").map((c) => (
            <li key={c.id} className="glass rounded-card p-5 text-[14px]">
              <p className="font-medium text-ink">{stageName(c.stage, pkg, lang)}</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">
                {t.sentOn(date(c.createdAt, lang))} ·{" "}
                {c.status === "approved" && t.approvedOn(date(c.decidedAt ?? c.createdAt, lang), c.decidedBy)}
                {c.status === "auto_approved" && t.autoApprovedOn(date(c.decidedAt ?? c.createdAt, lang))}
                {c.status === "changes" && t.changesOn(date(c.decidedAt ?? c.createdAt, lang), c.decidedBy)}
              </p>
              {c.feedback.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[13px] text-brand-300">
                    {t.yourComments} ({c.feedback.length})
                  </summary>
                  <FeedbackList items={c.feedback} t={t} />
                </details>
              )}
            </li>
          ))}
          <li className="glass rounded-card p-5 text-[14px]">
            <p className="font-medium text-ink">{t.questionnaire}</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {portal.submittedAt ? t.questionnaireSent(date(portal.submittedAt, lang)) : null}
            </p>
            {!day && <p className="mt-3 leading-relaxed text-ink-soft">{THANK_YOU[lang]}</p>}
          </li>
        </ul>
      </section>
    </main>
  );
}

function StageRow({
  n, name, state, label, detail,
}: { n: number; name: string; state: "approved" | "review" | "changes" | "todo"; label: string; detail?: string }) {
  const dot = {
    approved: "border-accent-green bg-accent-green/20 text-accent-green",
    review: "border-brand-400 bg-brand-400/20 text-brand-300",
    changes: "border-amber-300 bg-amber-300/15 text-amber-200",
    todo: "border-[var(--glass-border)] text-ink-soft",
  }[state];
  return (
    <li className="flex items-center gap-4 px-5 py-4" aria-current={state === "review" ? "step" : undefined}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-[13px] tabular-nums ${dot}`} aria-hidden>
        {state === "approved" ? "✓" : n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{name}</span>
        {detail && <span className="block text-[12.5px] text-ink-soft">{detail}</span>}
      </span>
      <span className="shrink-0 text-[12.5px] text-ink-soft">{label}</span>
    </li>
  );
}

function FeedbackList({ items, t }: { items: FeedbackItem[]; t: Strings }) {
  return (
    <ol className="mt-2 space-y-2">
      {items.map((f, i) => (
        <li key={i} className="rounded-input border border-[var(--glass-border)] p-3">
          <p className="text-[12.5px] text-ink-soft">
            {f.where || "—"} · {t.deviceName[f.device]}
          </p>
          {/* Client text: rendered as text, never as HTML. */}
          <p className="mt-1 whitespace-pre-wrap text-ink">{f.text}</p>
        </li>
      ))}
    </ol>
  );
}

type Draft = { items: FeedbackItem[]; name: string };
const blank = (): FeedbackItem => ({ where: "", device: "both", text: "" });
const draftKey = (id: string) => `weturn:feedback:${id}`;

function ReviewCard({
  t, lang, token, portal, cp, all, defaultName, onDone,
}: {
  t: Strings; lang: Lang; token: string; portal: Portal; cp: Checkpoint; all: Checkpoint[]; defaultName: string;
  onDone: (cp: Checkpoint, kind: "approved" | "changes") => void;
}) {
  const pkg = portal.package;
  const stage = stageName(cp.stage, pkg, lang);
  const r = rounds(pkg, all, cp.stage);
  const [mode, setMode] = useState<"approve" | "changes" | null>(null);
  const [draft, setDraft] = useState<Draft>({ items: [blank()], name: defaultName });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The draft survives a reload or a few days of collecting comments. Browser
  // storage can be missing (private mode), so every access is guarded. Read
  // after mount, not in useState: the server render has no localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey(cp.id));
      if (saved) {
        const d = JSON.parse(saved) as Partial<Draft>;
        if (Array.isArray(d.items) && d.items.length) {
          const items = d.items.slice(0, FEEDBACK_MAX.items).map((i) => ({
            where: typeof i?.where === "string" ? i.where : "",
            device: DEVICES.includes(i?.device) ? i.device : "both",
            text: typeof i?.text === "string" ? i.text : "",
          }));
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
          setDraft({ items, name: typeof d.name === "string" ? d.name : defaultName });
          setMode("changes");
        }
      }
    } catch {}
  }, [cp.id, defaultName]);
  useEffect(() => {
    if (mode !== "changes") return;
    try {
      localStorage.setItem(draftKey(cp.id), JSON.stringify(draft));
    } catch {}
  }, [draft, mode, cp.id]);

  const filled = useMemo(() => draft.items.filter((i) => i.text.trim()).length, [draft.items]);
  const setItem = (i: number, patch: Partial<FeedbackItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));

  async function send(action: "approve" | "changes") {
    if (action === "changes" && !filled) return setError(t.empty);
    if (!window.confirm(action === "approve" ? t.approveConfirm : t.changesConfirm(filled))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await respondCheckpointAction(token, { id: cp.id, action, items: draft.items, name: draft.name });
      if (res.ok) {
        try {
          localStorage.removeItem(draftKey(cp.id));
        } catch {}
        onDone(res.checkpoint, action === "approve" ? "approved" : "changes");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.reason === "closed" ? t.closed : res.reason === "empty" ? t.empty : t.failed);
      }
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass mt-6 rounded-panel border-brand-400/40 p-6 sm:p-8" aria-labelledby="review-title">
      <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-brand-300">{t.review}</p>
      <h2 id="review-title" className="mt-2 font-display text-[clamp(22px,3vw,28px)] font-medium text-ink">{stage}</h2>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{STAGE[cp.stage].approve[lang]}</p>
      {cp.note.trim() && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{cp.note}</p>}

      <a
        href={cp.previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-brand-400 px-6 text-[15px] font-semibold text-[#05080F] hover:bg-brand-300"
      >
        {t.openPreview} ↗
      </a>

      <p className="mt-5 text-[14px] text-ink-soft">{t.replyBy(date(replyBy(cp.createdAt), lang, true))}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {(["approve", "changes"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            aria-pressed={mode === m}
            className={`min-h-[44px] rounded-full border px-5 text-[14.5px] font-medium transition-colors ${
              mode === m ? "border-brand-400 bg-brand-400/15 text-ink" : "border-[var(--glass-border)] text-ink-soft hover:text-ink"
            }`}
          >
            {m === "approve" ? `✓ ${t.approve}` : t.changes}
          </button>
        ))}
      </div>

      {mode && (
        <div className="mt-6 border-t border-[var(--glass-border)] pt-6">
          <label className="block max-w-[420px]">
            <span className="mb-1.5 block text-[13.5px] text-ink-soft">{t.yourName}</span>
            <input
              className={inputCls}
              value={draft.name}
              maxLength={FEEDBACK_MAX.name}
              autoComplete="name"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>

          {mode === "approve" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => send("approve")}
              className="mt-6 min-h-[44px] rounded-full bg-accent-green px-6 text-[15px] font-semibold text-[#05080F] disabled:opacity-50"
            >
              {busy ? t.sending : `✓ ${t.approveSend}`}
            </button>
          ) : (
            <>
              <p className="mt-6 rounded-card border border-[var(--glass-border)] px-4 py-3 text-[13.5px] leading-relaxed text-ink-soft">
                {r.included === null ? t.roundFixes : r.extra ? t.roundExtra : t.roundNow(r.used + 1, r.included)}
              </p>
              <details className="mt-4 text-[14px] text-ink-soft">
                <summary className="cursor-pointer text-brand-300">{t.guideTitle}</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {t.guide.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </details>

              <ol className="mt-5 space-y-4">
                {draft.items.map((it, i) => (
                  <li key={i} className="rounded-card border border-[var(--glass-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-ink">{t.item(i + 1)}</span>
                      {draft.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((_, k) => k !== i) }))}
                          className="text-[12.5px] text-ink-soft underline-offset-4 hover:text-red-300 hover:underline"
                        >
                          {t.remove}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px]">
                      <label className="block">
                        <span className="mb-1.5 block text-[13px] text-ink-soft">{t.where}</span>
                        <input
                          className={inputCls}
                          value={it.where}
                          maxLength={FEEDBACK_MAX.where}
                          placeholder={t.wherePh}
                          onChange={(e) => setItem(i, { where: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[13px] text-ink-soft">{t.device}</span>
                        <select
                          className={inputCls}
                          value={it.device}
                          onChange={(e) => setItem(i, { device: e.target.value as Device })}
                        >
                          {DEVICES.map((d) => <option key={d} value={d}>{t.deviceName[d]}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-[13px] text-ink-soft">{t.comment}</span>
                      <textarea
                        className={`${inputCls} min-h-[96px] resize-y`}
                        value={it.text}
                        maxLength={FEEDBACK_MAX.text}
                        placeholder={t.commentPh}
                        onChange={(e) => setItem(i, { text: e.target.value })}
                      />
                    </label>
                  </li>
                ))}
              </ol>
              {draft.items.length < FEEDBACK_MAX.items && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, items: [...d.items, blank()] }))}
                  className="mt-3 text-[14px] font-medium text-brand-300 hover:text-ink"
                >
                  {t.addItem}
                </button>
              )}
              <p className="mt-4 text-[12.5px] text-ink-soft">{t.draftSaved}</p>
              <button
                type="button"
                disabled={busy || !filled}
                onClick={() => send("changes")}
                className="mt-4 min-h-[44px] rounded-full bg-brand-400 px-6 text-[15px] font-semibold text-[#05080F] hover:bg-brand-300 disabled:opacity-50"
              >
                {busy ? t.sending : t.sendChanges(Math.max(filled, 1))}
              </button>
            </>
          )}
          {error && <p role="alert" className="mt-3 text-[14px] text-red-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
