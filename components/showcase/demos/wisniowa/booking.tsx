"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useWisCopy } from "./copy";
import { T } from "./tokens";

/* ————————————————————————————————————————————————————————————————
 * BOOKING — three real steps, ending in a call-back request.
 *
 * Until this rewrite the card showed step 1 of 3 and a "Next: date" button
 * that did nothing — the page's main conversion path dead-ended on its own
 * primary button. It now runs end to end: treatment → time of day → name and
 * phone → a confirmation.
 *
 * HONESTY RULE, KEPT: there are still no dates or time slots. Step 2 asks
 * for a PREFERENCE (morning / afternoon / …), which a real reception can
 * always honour, and the exact time is agreed on the call-back. Showing a
 * calendar of "free" slots for a fictional clinic would be inventing
 * availability. The confirmation says outright that nothing was sent.
 *
 * `scope` / `time` ids are state values, not copy — identical in both
 * languages, so switching language mid-flow keeps the selection.
 * ———————————————————————————————————————————————————————————————— */

type Step = 0 | 1 | 2 | 3; // 3 = done

function Option({
  name,
  value,
  checked,
  onSelect,
  title,
  meta,
  reduced,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (v: string) => void;
  title: string;
  meta: string;
  reduced: boolean;
}) {
  return (
    <label
      className="wis-opt flex min-h-[64px] cursor-pointer items-center justify-between gap-4 rounded-[14px] px-4 py-3"
      style={{
        border: `1.5px solid ${checked ? T.green : T.line}`,
        background: checked ? "rgba(46,71,55,.07)" : "#fff",
        transition: reduced ? "none" : "border-color .2s, background-color .2s",
      }}
    >
      <span>
        <span className="wis-sans block" style={{ fontSize: 15, fontWeight: checked ? 700 : 600 }}>
          {title}
        </span>
        <span className="wis-sans mt-0.5 block" style={{ fontSize: 13, color: T.muted }}>
          {meta}
        </span>
      </span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ border: `1.5px solid ${checked ? T.green : "#A9A294"}` }}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full" style={{ background: T.green }} />}
      </span>
    </label>
  );
}

function Btn({
  children,
  onClick,
  type = "button",
  ghost = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  ghost?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="wis-sans wis-btn inline-flex min-h-[50px] shrink-0 items-center justify-center rounded-full px-7 text-[15px]"
      style={
        ghost
          ? { background: "transparent", color: T.ink, fontWeight: 600, border: `1.5px solid ${T.lineStrong}` }
          : { background: T.green, color: T.cream, fontWeight: 700 }
      }
    >
      {children}
    </button>
  );
}

export default function Booking({ reduced }: { reduced: boolean }) {
  const c = useWisCopy().booking;
  const uid = useId();
  const [step, setStep] = useState<Step>(0);
  const [scope, setScope] = useState("konsultacja");
  const [time, setTime] = useState("obojetnie");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<{ name?: string; tel?: string }>({});
  const head = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const telRef = useRef<HTMLInputElement>(null);
  const moved = useRef(false);

  /* Move focus to the new step's question so keyboard and screen-reader
   * users land where the content changed. Skipped on first render — the
   * card must not steal focus while the page loads. */
  useEffect(() => {
    if (!moved.current) return;
    head.current?.focus({ preventScroll: false });
  }, [step]);

  const go = (s: Step) => {
    moved.current = true;
    setStep(s);
  };

  const scopeName = c.scopes.find((s) => s.id === scope)?.name ?? "";
  const timeName = c.times.find((t) => t.id === time)?.name ?? "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = c.errName;
    if (tel.replace(/\D/g, "").length < 9) next.tel = c.errTel;
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.tel) return telRef.current?.focus();
    go(3);
  };

  const reset = () => {
    setName("");
    setTel("");
    setMsg("");
    setErrors({});
    go(0);
  };

  const headId = `${uid}-h`;
  const headStyle = { fontSize: 17, fontWeight: 700, outline: "none" } as const;

  const field = (invalid: boolean) =>
    ({
      border: `1.5px solid ${invalid ? T.cherry : T.lineStrong}`,
      background: "#fff",
      color: T.ink,
      fontSize: 16, // 16px: below this iOS Safari zooms the page on focus
    }) as const;

  const Summary = (
    <div
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] px-4 py-3"
      style={{ background: "rgba(46,71,55,.07)" }}
    >
      <span className="wis-sans" style={{ fontSize: 13, color: T.muted }}>
        {c.choice}:
      </span>
      <span className="wis-sans" style={{ fontSize: 14, fontWeight: 700 }}>
        {scopeName}
        {step === 2 && ` · ${timeName}`}
      </span>
      <button
        type="button"
        onClick={() => go(0)}
        className="wis-sans ml-auto min-h-[32px] underline underline-offset-4"
        style={{ fontSize: 14, fontWeight: 600, color: T.green }}
      >
        {c.change}
      </button>
    </div>
  );

  return (
    <div>
      {/* Progress. The step labels are the same words as the step questions'
        * subject, so the bar and the card never disagree. */}
      <ol className="flex items-center gap-2 sm:gap-3" aria-label={c.stepsAria}>
        {c.steps.map((label, i) => {
          const done = step > i;
          const current = step === i;
          return (
            <li
              key={i}
              className="flex flex-1 items-center gap-2 sm:gap-3"
              aria-current={current ? "step" : undefined}
            >
              <span
                aria-hidden
                className="wis-sans flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: done || current ? T.green : "transparent",
                  border: done || current ? "none" : `1.5px solid ${T.lineStrong}`,
                  color: done || current ? T.cream : T.muted,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className="wis-sans whitespace-nowrap"
                style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: current || done ? T.ink : T.muted }}
              >
                {label}
              </span>
              {i < 2 && <span aria-hidden className="hidden h-px flex-1 sm:block" style={{ background: T.line }} />}
            </li>
          );
        })}
      </ol>

      {/* Empty on the confirmation: focus lands on its heading, which reads
        * it already — announcing it here too would say it twice. */}
      <p className="sr-only" aria-live="polite">
        {step < 3 ? c.stepOf(step + 1, c.steps[step]) : ""}
      </p>

      <div className="mt-7">
        {step === 0 && (
          <>
            <fieldset className="border-0 p-0" aria-labelledby={headId}>
              <h3 id={headId} ref={head} tabIndex={-1} className="wis-sans mb-4" style={headStyle}>
                {c.legend}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.scopes.map((s) => (
                  <Option
                    key={s.id}
                    name={`${uid}-scope`}
                    value={s.id}
                    checked={scope === s.id}
                    onSelect={setScope}
                    title={s.name}
                    meta={s.meta}
                    reduced={reduced}
                  />
                ))}
              </div>
            </fieldset>
            <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="wis-sans max-w-[26rem]" style={{ fontSize: 13, lineHeight: 1.55, color: T.muted }}>
                {c.note}
              </p>
              <Btn onClick={() => go(1)}>{c.next} →</Btn>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {Summary}
            <fieldset className="border-0 p-0" aria-labelledby={headId}>
              <h3 id={headId} ref={head} tabIndex={-1} className="wis-sans mb-4" style={headStyle}>
                {c.legendTime}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.times.map((t) => (
                  <Option
                    key={t.id}
                    name={`${uid}-time`}
                    value={t.id}
                    checked={time === t.id}
                    onSelect={setTime}
                    title={t.name}
                    meta={t.meta}
                    reduced={reduced}
                  />
                ))}
              </div>
            </fieldset>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Btn ghost onClick={() => go(0)}>
                ← {c.back}
              </Btn>
              <Btn onClick={() => go(2)}>{c.nextContact} →</Btn>
            </div>
          </>
        )}

        {step === 2 && (
          <form noValidate onSubmit={submit}>
            {Summary}
            <h3 id={headId} ref={head} tabIndex={-1} className="wis-sans mb-4" style={headStyle}>
              {c.legendContact}
            </h3>

            {(errors.name || errors.tel) && (
              <p
                role="alert"
                className="wis-sans mb-4 rounded-[10px] px-4 py-3"
                style={{ fontSize: 14, fontWeight: 600, color: T.cherry, background: "rgba(179,58,69,.08)" }}
              >
                {c.errSummary}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${uid}-name`} className="wis-sans block" style={{ fontSize: 14, fontWeight: 600 }}>
                  {c.name}
                </label>
                <input
                  ref={nameRef}
                  id={`${uid}-name`}
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? `${uid}-name-err` : undefined}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="wis-sans wis-field mt-2 min-h-[52px] w-full rounded-[12px] px-4"
                  style={field(!!errors.name)}
                />
                {errors.name && (
                  <p id={`${uid}-name-err`} className="wis-sans mt-2" style={{ fontSize: 13.5, color: T.cherry }}>
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`${uid}-tel`} className="wis-sans block" style={{ fontSize: 14, fontWeight: 600 }}>
                  {c.tel}
                </label>
                <input
                  ref={telRef}
                  id={`${uid}-tel`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  aria-invalid={!!errors.tel}
                  aria-describedby={`${errors.tel ? `${uid}-tel-err ` : ""}${uid}-tel-hint`}
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  className="wis-sans wis-field mt-2 min-h-[52px] w-full rounded-[12px] px-4"
                  style={field(!!errors.tel)}
                />
                {errors.tel && (
                  <p id={`${uid}-tel-err`} className="wis-sans mt-2" style={{ fontSize: 13.5, color: T.cherry }}>
                    {errors.tel}
                  </p>
                )}
                <p id={`${uid}-tel-hint`} className="wis-sans mt-2" style={{ fontSize: 13, color: T.muted }}>
                  {c.telHint}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${uid}-msg`} className="wis-sans block" style={{ fontSize: 14, fontWeight: 600 }}>
                  {c.msg} <span style={{ fontWeight: 400, color: T.muted }}>({c.msgOptional})</span>
                </label>
                <textarea
                  id={`${uid}-msg`}
                  rows={2}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder={c.msgPlaceholder}
                  className="wis-sans wis-field mt-2 w-full resize-y rounded-[12px] px-4 py-3"
                  style={field(false)}
                />
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Btn ghost onClick={() => go(1)}>
                ← {c.back}
              </Btn>
              <Btn type="submit">{c.submit}</Btn>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="py-2">
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: T.green }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke={T.cream} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3 ref={head} tabIndex={-1} className="wis-serif mt-5" style={{ fontSize: 26, lineHeight: 1.2, outline: "none" }}>
              {c.doneTitle(name.trim())}
            </h3>
            <p className="wis-sans mt-3" style={{ fontSize: 15.5, lineHeight: 1.6, color: T.body }}>
              {c.doneBody(tel.trim())}
            </p>
            <p className="wis-sans mt-2" style={{ fontSize: 15, color: T.body }}>
              <strong style={{ color: T.ink }}>{scopeName}</strong> · {timeName}
            </p>
            <p className="wis-sans mt-5" style={{ fontSize: 13, color: T.muted }}>
              {c.doneDemo}
            </p>
            <div className="mt-6">
              <Btn ghost onClick={reset}>
                {c.again}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
