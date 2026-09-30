"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CLOCK_NOTE, INTRO, QUESTIONS, SECTIONS, THANK_YOU,
  missingRequired, progress, type Answers, type Field, type Question,
} from "@/lib/portal/questions";
import type { Portal, PortalFile } from "@/lib/portal/data";
import FileUpload from "./FileUpload";
import { saveIntakeAction, submitIntakeAction } from "@/app/portal/[token]/actions";

type Lang = "pl" | "en";
type SaveState = "idle" | "saving" | "saved" | "error" | "locked";

const PACKAGE: Record<Portal["package"], { pl: string; en: string }> = {
  launch: { pl: "Start", en: "Launch" },
  business: { pl: "Biznes", en: "Business" },
  signature: { pl: "Premium", en: "Signature" },
};

const T = {
  pl: {
    portal: "Portal klienta",
    questionnaire: "Ankieta projektowa",
    progress: "Ukończono",
    saving: "Zapisywanie…",
    saved: "Zapisano",
    error: "Nie zapisano. Sprawdź internet, spróbujemy ponownie.",
    locked: "Ankieta została już wysłana.",
    required: "wymagane",
    back: "Wstecz",
    next: "Dalej",
    review: "Sprawdź i wyślij",
    reviewTitle: "Sprawdź i wyślij",
    reviewReady: "Wszystkie wymagane odpowiedzi są gotowe. Po wysłaniu ankieta zostanie zablokowana, a my zaczniemy przygotowania do rozmowy startowej.",
    reviewMissing: "Brakuje jeszcze odpowiedzi na te pytania:",
    goTo: "Przejdź",
    send: "Wyślij ankietę",
    sending: "Wysyłanie…",
    sendFailed: "Nie udało się wysłać. Spróbuj ponownie za chwilę.",
    sections: "Sekcje",
    step: (i: number, n: number) => `Krok ${i} z ${n}`,
    sentOn: (d: string) => `Wysłano ${d}.`,
    change: "Chcesz coś zmienić? Odpisz na naszego maila, a poprawimy to razem na rozmowie startowej.",
    chooseOne: "Wybierz jedną opcję",
    unsaved: "Masz niezapisane zmiany.",
  },
  en: {
    portal: "Client portal",
    questionnaire: "Project questionnaire",
    progress: "Complete",
    saving: "Saving…",
    saved: "Saved",
    error: "Not saved. Check your connection, we'll try again.",
    locked: "This questionnaire has already been sent.",
    required: "required",
    back: "Back",
    next: "Next",
    review: "Review and send",
    reviewTitle: "Review and send",
    reviewReady: "All required answers are in. Once you send it, the questionnaire locks and we start preparing for the kickoff call.",
    reviewMissing: "These questions still need an answer:",
    goTo: "Go to",
    send: "Send questionnaire",
    sending: "Sending…",
    sendFailed: "Couldn't send. Please try again in a moment.",
    sections: "Sections",
    step: (i: number, n: number) => `Step ${i} of ${n}`,
    sentOn: (d: string) => `Sent on ${d}.`,
    change: "Need to change something? Reply to our email and we'll sort it out together on the kickoff call.",
    chooseOne: "Choose one option",
    unsaved: "You have unsaved changes.",
  },
} as const;

const SAVE_DELAY_MS = 1200;
const REVIEW = SECTIONS.length; // index of the review step, after the 10 sections

const inputCls =
  "w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand-400";

export default function IntakeForm({ token, portal }: { token: string; portal: Portal }) {
  const [lang, setLang] = useState<Lang>(portal.locale);
  const [answers, setAnswers] = useState<Answers>(portal.answers);
  const [step, setStep] = useState(0);
  const [save, setSave] = useState<SaveState>(portal.status === "intake" ? "idle" : "locked");
  const [submitted, setSubmitted] = useState(portal.status !== "intake");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const t = T[lang];
  const [uploaded, setUploaded] = useState<PortalFile[]>(portal.files);
  const files = useMemo(
    () => uploaded.reduce<Record<string, number>>((c, f) => ({ ...c, [f.kind]: (c[f.kind] ?? 0) + 1 }), {}),
    [uploaded]
  );
  const missing = useMemo(() => missingRequired(answers, files), [answers, files]);
  const pct = Math.round(progress(answers, files) * 100);

  // ── Autosave ────────────────────────────────────────────────────────────
  // `dirty` holds the latest unsaved answers; one timer, one request in flight.
  const dirty = useRef<Answers | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  // flush reschedules itself on retry; the timer calls it through this ref
  // so it always runs the current version.
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const schedule = useCallback((ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), ms);
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || !dirty.current) return;
    const payload = dirty.current;
    dirty.current = null;
    inFlight.current = true;
    setSave("saving");
    try {
      const r = await saveIntakeAction(token, payload);
      if (r.ok) setSave(dirty.current ? "saving" : "saved");
      else if (r.reason === "locked") {
        dirty.current = null; // nothing more will ever save
        setSave("locked");
      } else {
        dirty.current ??= payload; // keep it for the retry
        setSave("error");
      }
    } catch {
      dirty.current ??= payload;
      setSave("error");
    } finally {
      inFlight.current = false;
    }
    // Typed more while the request was out, or it failed: go again.
    if (dirty.current) schedule(SAVE_DELAY_MS * 2);
  }, [token, schedule]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const update = useCallback(
    (key: string, value: string | boolean) => {
      setAnswers((prev) => {
        const next = { ...prev };
        if (value === "" || value === false) delete next[key];
        else next[key] = value;
        dirty.current = next;
        return next;
      });
      schedule(SAVE_DELAY_MS);
    },
    [schedule]
  );

  // Save straight away when the tab is hidden or closed, and warn if a save
  // can't finish in time.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") void flush(); };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current || inFlight.current) {
        void flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const top = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    void flush();
    setStep(i);
    top.current?.scrollIntoView({ block: "start" });
    top.current?.focus({ preventScroll: true });
  };

  async function send() {
    if (timer.current) clearTimeout(timer.current);
    setSending(true);
    setSendError(false);
    try {
      const r = await submitIntakeAction(token, answers);
      if (r.ok || r.reason === "locked") {
        dirty.current = null;
        setSubmitted(true);
        setSave("locked");
      } else setSendError(true); // "missing" only if the client and server checks disagree
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  // ── Views ───────────────────────────────────────────────────────────────
  const header = (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="eyebrow">Weturn · {t.portal}</p>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,36px)] font-medium leading-tight text-ink">
          {portal.clientName}
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          {t.questionnaire} · {PACKAGE[portal.package][lang]}
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
  );

  if (submitted) {
    const when = portal.submittedAt ? new Date(portal.submittedAt) : new Date();
    const date = when.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-16">
        {header}
        <section className="glass mt-8 rounded-panel p-6 sm:p-10">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent-green">✓ {t.sentOn(date)}</p>
          <p className="mt-4 text-[17px] leading-relaxed text-ink">{THANK_YOU[lang]}</p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-soft">{t.change}</p>
        </section>
      </main>
    );
  }

  const sectionQs = (i: number) => QUESTIONS.filter((q) => q.section === i + 1);
  const sectionMissing = (i: number) => missing.filter((q) => q.section === i + 1).length;
  const saveText = { idle: "", saving: t.saving, saved: t.saved, error: t.error, locked: t.locked }[save];

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14">
      {header}

      <p className="mt-6 max-w-[680px] text-[15px] leading-relaxed text-ink-soft">{INTRO[lang]}</p>
      <p className="mt-2 max-w-[680px] text-[15px] font-medium leading-relaxed text-ink">{CLOCK_NOTE[lang]}</p>

      {/* Progress + save status: sticky so the client always sees it saved. */}
      <div className="sticky top-0 z-10 -mx-4 mt-8 border-b border-[var(--glass-border)] bg-[rgba(5,8,15,0.88)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-4 text-[13px]">
          <span className="text-ink-soft">
            {t.progress}: <span className="font-medium text-ink">{pct}%</span>
          </span>
          <span
            role="status"
            aria-live="polite"
            className={save === "error" ? "text-red-300" : save === "saved" ? "text-accent-green" : "text-ink-soft"}
          >
            {saveText}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
          <div className="h-full rounded-full bg-brand-400 transition-[width] duration-500 ease-out-expo" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Section list. On phones it's a compact select instead. */}
        <nav aria-label={t.sections} className="hidden lg:block">
          <ol className="sticky top-24 space-y-1">
            {SECTIONS.map((s, i) => {
              const miss = sectionMissing(i);
              const touched = sectionQs(i).some((q) => q.fields.some((f) => answers[f.key] !== undefined));
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={step === i ? "step" : undefined}
                    className={`flex w-full items-center gap-3 rounded-input px-3 py-2 text-left text-[14px] transition-colors ${
                      step === i ? "bg-brand-400/15 text-ink" : "text-ink-soft hover:bg-white/5 hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                        touched && !miss ? "border-accent-green/60 bg-accent-green/15 text-accent-green" : "border-[var(--glass-border)]"
                      }`}
                    >
                      {touched && !miss ? "✓" : i + 1}
                    </span>
                    {s[lang]}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => go(REVIEW)}
                aria-current={step === REVIEW ? "step" : undefined}
                className={`mt-2 flex w-full items-center gap-3 rounded-input border px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                  step === REVIEW ? "border-brand-400 bg-brand-400/15 text-ink" : "border-[var(--glass-border)] text-brand-300 hover:border-brand-400"
                }`}
              >
                {t.review}
              </button>
            </li>
          </ol>
        </nav>

        <div ref={top} tabIndex={-1} className="scroll-mt-24 outline-none focus-visible:outline-none">
          <label className="mb-6 block lg:hidden">
            <span className="mb-1.5 block text-[13px] text-ink-soft">{t.step(step + 1, REVIEW + 1)}</span>
            <select value={step} onChange={(e) => go(Number(e.target.value))} className={inputCls}>
              {SECTIONS.map((s, i) => (
                <option key={i} value={i}>{`${i + 1}. ${s[lang]}`}</option>
              ))}
              <option value={REVIEW}>{t.review}</option>
            </select>
          </label>

          {step < REVIEW ? (
            <section aria-labelledby="section-title">
              <h2 id="section-title" className="font-display text-[24px] font-medium text-ink">
                <span className="mr-2 text-ink-soft">{step + 1}.</span>
                {SECTIONS[step][lang]}
              </h2>
              <div className="mt-6 space-y-5">
                {sectionQs(step).map((q) => (
                  <QuestionCard
                    key={q.id} q={q} lang={lang} answers={answers} update={update}
                    token={token} files={uploaded} setFiles={setUploaded}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={step === 0}
                  className="rounded-full border border-[var(--glass-border)] px-5 py-2.5 text-[14px] text-ink-soft transition-colors hover:text-ink disabled:invisible"
                >
                  ← {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  className="rounded-full bg-brand-400 px-6 py-2.5 text-[14px] font-medium text-bg transition-colors hover:bg-brand-300"
                >
                  {step + 1 === REVIEW ? t.review : t.next} →
                </button>
              </div>
            </section>
          ) : (
            <Review
              lang={lang}
              missing={missing}
              go={go}
              send={send}
              sending={sending}
              sendError={sendError}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function QuestionCard({
  q, lang, answers, update, token, files, setFiles,
}: {
  q: Question; lang: Lang; answers: Answers; update: (k: string, v: string | boolean) => void;
  token: string; files: PortalFile[]; setFiles: (u: (prev: PortalFile[]) => PortalFile[]) => void;
}) {
  const t = T[lang];
  const hintId = `${q.id}-hint`;
  const single = q.fields.length === 1 && !q.fields[0].label && q.fields[0].kind !== "choice";

  return (
    <fieldset id={q.id} className="glass scroll-mt-28 rounded-card p-5 sm:p-6">
      <legend className="sr-only">{`${q.n}. ${q.title[lang]}`}</legend>
      <div aria-hidden className="flex items-baseline gap-2">
        <span className="text-[13px] tabular-nums text-ink-soft">{q.n}.</span>
        <span id={`${q.id}-title`} className="text-[16px] font-medium leading-snug text-ink">{q.title[lang]}</span>
        {q.required && <span className="ml-auto shrink-0 text-[12px] text-brand-300">{t.required}</span>}
      </div>
      {q.hint && <p id={hintId} className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{q.hint[lang]}</p>}

      {q.files && (
        <div className="mt-4">
          <FileUpload
            token={token} kind={q.files.kind} lang={lang}
            files={files}
            onChange={(u) => {
              setFiles(u);
              // An upload replaces the fallback; untick it so the brief isn't contradictory.
              if (answers[q.files!.fallbackKey] === true) update(q.files!.fallbackKey, false);
            }}
            labelledBy={`${q.id}-title`}
          />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {q.fields.map((f) =>
          (f.showIf && answers[f.showIf.key] !== f.showIf.equals) ||
          // "No logo / no photos" makes no sense once files are in.
          (q.files && f.key === q.files.fallbackKey && files.some((x) => x.kind === q.files!.kind)) ? null : (
            <FieldInput
              key={f.key}
              f={f}
              lang={lang}
              value={answers[f.key]}
              update={update}
              label={single ? `${q.n}. ${q.title[lang]}` : f.label?.[lang] ?? q.title[lang]}
              hideLabel={single || (f.kind === "choice" && !f.label)}
              describedBy={q.hint ? hintId : undefined}
            />
          )
        )}
      </div>
    </fieldset>
  );
}

function FieldInput({
  f, lang, value, update, label, hideLabel, describedBy,
}: {
  f: Field; lang: Lang; value: string | boolean | undefined;
  update: (k: string, v: string | boolean) => void;
  label: string; hideLabel: boolean; describedBy?: string;
}) {
  const id = `f-${f.key.replace(".", "-")}`;
  const str = typeof value === "string" ? value : "";

  if (f.kind === "check") {
    return (
      <label className="flex cursor-pointer items-start gap-3 text-[14.5px] text-ink">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => update(f.key, e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[#38BDF8]"
        />
        {f.label?.[lang]}
      </label>
    );
  }

  if (f.kind === "choice") {
    return (
      <div role="radiogroup" aria-label={hideLabel ? T[lang].chooseOne : label} aria-describedby={describedBy} className="flex flex-wrap gap-2">
        {f.options!.map((o) => {
          const on = str === o.value;
          return (
            <label
              key={o.value}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[14px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-400 ${
                on ? "border-brand-400 bg-brand-400/15 text-ink" : "border-[var(--glass-border)] text-ink-soft hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={f.key}
                value={o.value}
                checked={on}
                onChange={() => update(f.key, o.value)}
                onClick={() => on && update(f.key, "")}
                className="sr-only"
              />
              {o.label[lang]}
            </label>
          );
        })}
      </div>
    );
  }

  const common = {
    id,
    value: str,
    maxLength: f.max,
    required: f.required,
    "aria-describedby": describedBy,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(f.key, e.target.value),
    className: inputCls,
  };

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-[13.5px] text-ink-soft"}>
        {label}
        {!hideLabel && f.required && <span aria-hidden className="text-brand-300"> *</span>}
      </label>
      {f.kind === "textarea" ? (
        <textarea {...common} rows={f.max > 2000 ? 6 : 4} className={`${inputCls} resize-y leading-relaxed`} />
      ) : (
        <input
          {...common}
          type={f.kind}
          inputMode={f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : f.kind === "url" ? "url" : undefined}
          autoComplete={f.key === "q3.name" ? "name" : f.key === "q3.email" ? "email" : f.key === "q3.phone" ? "tel" : "off"}
          placeholder={f.kind === "url" ? "https://" : undefined}
        />
      )}
    </div>
  );
}

function Review({
  lang, missing, go, send, sending, sendError,
}: {
  lang: Lang; missing: Question[]; go: (i: number) => void;
  send: () => void; sending: boolean; sendError: boolean;
}) {
  const t = T[lang];
  const jump = (q: Question) => {
    go(q.section - 1);
    // After the section renders, bring the exact question into view.
    requestAnimationFrame(() => document.getElementById(q.id)?.scrollIntoView({ block: "center" }));
  };

  return (
    <section aria-labelledby="review-title">
      <h2 id="review-title" className="font-display text-[24px] font-medium text-ink">{t.reviewTitle}</h2>
      {missing.length ? (
        <div className="glass mt-6 rounded-card p-5 sm:p-6">
          <p className="text-[15px] text-ink">{t.reviewMissing}</p>
          <ul className="mt-4 divide-y divide-[var(--glass-border)]">
            {missing.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-[14.5px] text-ink-soft">
                  <span className="tabular-nums">{q.n}.</span> {q.title[lang]}
                </span>
                <button
                  type="button"
                  onClick={() => jump(q)}
                  className="shrink-0 rounded-full border border-[var(--glass-border)] px-3.5 py-1.5 text-[13px] text-brand-300 hover:border-brand-400"
                >
                  {t.goTo} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="glass mt-6 rounded-card p-5 text-[15px] leading-relaxed text-ink sm:p-6">{t.reviewReady}</p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={send}
          disabled={sending || missing.length > 0}
          className="rounded-full bg-brand-400 px-7 py-3 text-[15px] font-medium text-bg transition-colors hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? t.sending : t.send}
        </button>
        {sendError && <p role="alert" className="text-[14px] text-red-300">{t.sendFailed}</p>}
      </div>
    </section>
  );
}
