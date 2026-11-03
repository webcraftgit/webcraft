"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/site";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";
import { currentAttribution, track } from "@/lib/analytics/track";
import { email as validEmail } from "@/lib/security/validation";

/**
 * Short quote form in the hero: name, email, goal. Same endpoint and payload
 * as ContactSection (POST /api/contact), same copy from the dictionary, so it
 * speaks both languages and stores leads in the same table. The optional
 * project and budget chips stay in the full contact section further down.
 *
 * It sits inside the hero copy layer, which is pointer-events-none, so the
 * wrapper turns events back on.
 */

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "sent" | "error" | "fallback";

const FIELDS: Field[] = ["name", "email", "message"];

export default function HeroQuoteForm() {
  const t = useT();
  const [locale] = useLocale();
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const read = (): Record<Field, string> => {
    const f = formRef.current!;
    const get = (n: Field) => (f.elements.namedItem(n) as HTMLInputElement).value.trim();
    return { name: get("name"), email: get("email"), message: get("message") };
  };

  function validate(v: Record<Field, string>): Errors {
    const e: Errors = {};
    if (!v.name) e.name = t.contact.errors.name;
    if (!v.email) e.email = t.contact.errors.email;
    else if (!validEmail(v.email)) e.email = t.contact.errors.emailInvalid;
    if (!v.message) e.message = t.contact.errors.message;
    else if (v.message.length < 10) e.message = t.contact.errors.messageShort;
    return e;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const values = read();
    setAttempted(true);
    const found = validate(values);
    setErrors(found);
    const first = FIELDS.find((f) => found[f]);
    if (first) {
      (formRef.current!.elements.namedItem(first) as HTMLElement).focus();
      return;
    }

    const company = (formRef.current!.elements.namedItem("company") as HTMLInputElement).value;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company, locale, ...currentAttribution() }),
      });
      if (res.ok) {
        setStatus("sent");
        // a caught bot gets the same 200; it must not count as a lead
        if (!company.trim()) track("form_submit", { value: "hero" });
        return;
      }
      const body = await res.json().catch(() => null);
      setStatus(body?.fallback ? "fallback" : "error");
    } catch {
      setStatus("error");
    }
  }

  const onInput = () => {
    if (attempted) setErrors(validate(read()));
  };

  const inputCls = (invalid: boolean) =>
    cn(
      "w-full rounded-input border bg-[rgba(5,8,15,0.7)] px-4 py-3 text-ui text-ink outline-none transition-colors focus:border-brand-400",
      invalid ? "border-red-400/80" : "border-[var(--glass-border)]"
    );

  const field = (f: Field, id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="min-w-0 text-left">
      <label htmlFor={id} className="mb-1.5 block text-small text-ink-soft">
        {label}
        <span className="text-brand-300" aria-hidden>
          {" "}*
        </span>
        <span className="sr-only"> ({t.contact.required})</span>
      </label>
      <input
        id={id}
        name={f}
        required
        aria-invalid={errors[f] ? true : undefined}
        aria-describedby={errors[f] ? `${id}-error` : undefined}
        className={inputCls(!!errors[f])}
        {...props}
      />
      {errors[f] && (
        <p id={`${id}-error`} className="mt-1.5 text-small text-red-300">
          {errors[f]}
        </p>
      )}
    </div>
  );

  const linkCls = "text-brand-300 underline underline-offset-4";

  return (
    <div className="hero-reveal pointer-events-auto mt-9 w-full max-w-[940px] [animation-delay:160ms]">
      <div className="glass glass-nav rounded-panel p-4 text-left md:p-5">
        {status === "sent" ? (
          <div className="py-4 text-center" role="status">
            <p
              ref={doneRef}
              tabIndex={-1}
              className="font-display text-title font-medium text-ink outline-none"
            >
              {t.contact.sentTitle}
            </p>
            <p className="mt-2 text-ui text-ink-soft">{t.contact.replyPromise}</p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} onInput={onInput} noValidate>
            <div className="grid items-start gap-3 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
              {field("name", "h-name", t.contact.nameLabel, { autoComplete: "name", maxLength: 120 })}
              {field("email", "h-email", t.contact.emailLabel, {
                type: "email",
                inputMode: "email",
                autoComplete: "email",
                maxLength: 200,
              })}
              {field("message", "h-message", t.contact.msgLabel, { maxLength: 4000 })}

              {/* honeypot */}
              <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                <label>
                  Company
                  <input name="company" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-[48px] w-full items-center justify-center whitespace-nowrap rounded-full bg-brand-400 px-7 py-3 text-ui font-semibold text-[#05080F] transition-colors hover:bg-brand-300 disabled:opacity-60 lg:mt-[1.65rem] lg:w-auto"
              >
                {status === "sending" ? t.contact.sending : t.hero.formSubmit}
              </button>
            </div>

            <p className="mt-3 text-small text-ink-soft">
              {t.contact.replyPromise} {t.contact.privacyPre}
              <a href="/privacy" className={linkCls}>
                {t.contact.privacyLink}
              </a>
              {t.contact.privacyPost}
            </p>

            {(status === "error" || status === "fallback") && (
              <p role="alert" className="mt-3 text-ui text-red-300">
                {status === "fallback" ? t.contact.fallbackPre : t.contact.errorPre}
                <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                {status === "fallback" ? t.contact.fallbackPost : t.contact.errorPost}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
