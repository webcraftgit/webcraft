"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164 } from "@/lib/site";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";
import { currentAttribution, track } from "@/lib/analytics/track";
import { email as validEmail } from "@/lib/security/validation";
import {
  TIERS,
  READINESS_IDS,
  BUDGET_IDS,
  SERVICE_IDS,
  estimate,
  fmt,
  type ContentReadiness,
  type BudgetBand,
  type ServiceKind,
  type Tier,
} from "@/lib/pricing";

/**
 * Contact (CP4.2 — CP5 pulled forward, minus Supabase env + Footer polish).
 *
 * Conversion decisions baked in:
 * - 3 required fields only (name, email, message). No phone. Nothing else
 *   mandatory — every extra field costs completions.
 * - The "3-question estimate": optional project-type + content-readiness
 *   chips that show an HONEST typical range from lib/pricing before anyone
 *   commits to anything. Chips prefill from Pricing tier CTAs (wc:prefill-tier).
 *   Video / print / other are offered too (Services sells them); they have no
 *   published price, so they get no estimate and no content question.
 * - Once a website tier is picked, the budget question steps aside — the tier
 *   already says roughly what the budget is — and the content question takes
 *   its place, so the form does not grow as it is filled in.
 * - Reply-time promise ("one business day") — a claim about our own behavior,
 *   verifiable and kept. The accent-green budget of this viewport is spent
 *   on its status dot (conversion moment).
 * - Honeypot field ("company") instead of a CAPTCHA.
 * - Validation is our own, inline, in the page's language (the browser's
 *   bubbles were unstyled and spoke the BROWSER's language). Rules mirror
 *   /api/contact so a message the form accepts is one the server accepts.
 * - Backend: POST /api/contact inserts into Supabase when env is configured;
 *   until then the API answers 503 + fallback and the form swaps to a mailto
 *   link — never a fake success.
 */

type Status = "idle" | "sending" | "sent" | "error" | "fallback";
type Project = Tier["id"] | ServiceKind;
type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

const isTier = (p: Project | null): p is Tier["id"] =>
  p !== null && TIERS.some((t) => t.id === p);

export default function ContactSection() {
  const t = useT();
  const [locale] = useLocale();
  const price = (n: number) => fmt(n, locale, t.currency);
  const reveal = useReveal<HTMLDivElement>();
  const [project, setProject] = useState<Project | null>(null);
  const [readiness, setReadiness] = useState<ContentReadiness | null>(null);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const statusRef = useRef<HTMLElement>(null);

  // Pricing tier CTAs prefill the project-type chip
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const id = (e as CustomEvent<string>).detail as Tier["id"];
      if (TIERS.some((t) => t.id === id)) setProject(id);
    };
    window.addEventListener("wc:prefill-tier", onPrefill);
    return () => window.removeEventListener("wc:prefill-tier", onPrefill);
  }, []);

  // Move focus to the outcome so keyboard and screen-reader users land on it
  // (the form they were in is replaced by the thank-you panel on success).
  useEffect(() => {
    if (status === "sent" || status === "error" || status === "fallback") {
      statusRef.current?.focus();
    }
  }, [status]);

  const tier = isTier(project) ? project : null;
  const range = estimate(tier, readiness);

  function validate(form: HTMLFormElement): Errors {
    const get = (n: Field) =>
      String((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "").trim();
    const e: Errors = {};
    if (!get("name")) e.name = t.contact.errors.name;
    const mail = get("email");
    if (!mail) e.email = t.contact.errors.email;
    else if (!validEmail(mail)) e.email = t.contact.errors.emailInvalid;
    const msg = get("message");
    if (!msg) e.message = t.contact.errors.message;
    else if (msg.length < 10) e.message = t.contact.errors.messageShort;
    return e;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;

    setAttempted(true);
    const found = validate(form);
    setErrors(found);
    const first = (["name", "email", "message"] as Field[]).find((f) => found[f]);
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tier,
          service: isTier(project) ? null : project,
          content_readiness: tier ? readiness : null,
          budget: tier ? null : budget,
          locale,
          // consent-gated; resolves to { analytics_consent:false } when refused
          ...currentAttribution(),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        track("form_submit", project ? { tier: project } : {});
        form.reset();
      } else {
        const body = await res.json().catch(() => null);
        setStatus(body?.fallback ? "fallback" : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  // after a failed submit, errors clear as the visitor fixes each field
  const onFieldInput = (e: React.FormEvent<HTMLFormElement>) => {
    if (!attempted) return;
    setErrors(validate(e.currentTarget));
  };

  const chipCls = (selected: boolean) =>
    cn(
      "min-h-[44px] rounded-full border px-4 py-1.5 text-small font-medium transition-colors",
      selected
        ? "border-brand-400 bg-brand-400/15 text-brand-300"
        : "border-[var(--glass-border)] bg-[rgba(14,24,41,0.45)] text-ink-soft hover:border-[var(--glass-border-hover)] hover:text-ink"
    );

  const inputCls = (invalid: boolean) =>
    cn(
      "w-full rounded-input border bg-[rgba(5,8,15,0.55)] px-4 py-3 text-ui text-ink placeholder:text-ink-soft outline-none transition-colors focus:border-brand-400",
      invalid ? "border-red-400/70" : "border-[var(--glass-border)]"
    );

  const fieldError = (f: Field) =>
    errors[f] ? (
      <p id={`c-${f}-error`} className="mt-1.5 text-small text-red-300">
        {errors[f]}
      </p>
    ) : null;

  const requiredMark = (
    <>
      <span className="text-brand-300" aria-hidden>
        {" "}*
      </span>
      <span className="sr-only"> ({t.contact.required})</span>
    </>
  );

  const projectLabel = (p: Project) =>
    isTier(p)
      ? t.pricing.tiers[p].name
      : p === "other"
        ? t.contact.otherProject
        : t.services.items[p].title;

  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative">
      <div className="fade-band pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_65%,rgba(7,89,133,0.22)_0%,rgba(7,89,133,0)_70%)]" />
      </div>

      <div
        ref={reveal}
        className="container-x relative grid gap-12 py-[clamp(96px,12vw,160px)] lg:grid-cols-[1fr_1.1fr] lg:gap-16"
      >
        {/* ——— pitch ——— */}
        {/* CP4_54 — MOBILE FRICTION. Arriving here from "Rozpocznij projekt",
            the whole first screen was a label + heading + a paragraph of
            supporting copy: the visitor landed on a headline with no visible
            way to act. On phones the intro is hidden (CP4_64 removed the
            section label on every breakpoint), so the
            reply promise and the email address are on the first screen with
            the heading. The intro stays in the DOM (display:none, not removed), so
            the crawler and the desktop layout are unchanged. */}
        <div>
          <h2 data-reveal id="contact-heading" className="heading-2 max-w-[16ch]">
            {t.contact.heading}
          </h2>
          <p data-reveal className="mt-5 hidden max-w-[46ch] text-body text-ink-soft md:block">
            {t.contact.intro}
          </p>

          <p data-reveal className="mt-6 flex items-center gap-2.5 text-ui font-medium text-ink md:mt-8">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-green" />
            </span>
            {t.contact.replyPromise}
          </p>

          <p data-reveal className="mt-4 text-ui text-ink-soft md:mt-6">
            {/* CP4_55: the lead-in ("Wolisz e-mail?") is the last of the small
                supporting copy the client asked to lose on phones — on mobile
                the address stands on its own. */}
            <span className="hidden md:inline">{t.contact.preferEmailPre}</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 hover:text-brand-400"
            >
              {CONTACT_EMAIL}
            </a>
          </p>

          <p data-reveal className="mt-2 text-ui text-ink-soft">
            <span className="hidden md:inline">{t.contact.preferPhonePre}</span>
            <a
              href={`tel:${CONTACT_PHONE_E164}`}
              className="font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 hover:text-brand-400"
            >
              {CONTACT_PHONE}
            </a>
          </p>
        </div>

        {/* ——— form ——— */}
        {/* Start-project CTAs scroll here (scrollToHash aims at this, not the
            section top) so the whole form lands in view. */}
        <div data-reveal data-scroll-focus className="glass relative rounded-panel p-6 md:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(165,243,252,0.5) 50%, transparent)",
            }}
          />

          {status === "sent" ? (
            <div className="py-10 text-center" role="status">
              <p
                ref={statusRef as React.RefObject<HTMLParagraphElement>}
                tabIndex={-1}
                className="font-display text-2xl font-medium text-ink outline-none"
              >
                {t.contact.sentTitle}
              </p>
              <p className="mx-auto mt-3 max-w-[38ch] text-ink-soft">
                {t.contact.sentBodyPre}{t.contact.replyPromise}{t.contact.sentBodyMid}
                <a className="text-brand-300 underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                {t.contact.sentBodyEnd}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} onInput={onFieldInput} noValidate>
              {/* the 3-question estimate — optional, zero typing */}
              <fieldset>
                <legend className="text-small text-ink-soft">
                  {t.contact.whatBuilding} <span className="text-ink-soft">{t.contact.optional}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {[...TIERS.map((x) => x.id), ...SERVICE_IDS].map((p) => (
                    <button
                      type="button"
                      key={p}
                      aria-pressed={project === p}
                      data-track="tier_select"
                      data-track-value={p}
                      onClick={() => setProject(project === p ? null : p)}
                      className={chipCls(project === p)}
                    >
                      {projectLabel(p)}
                    </button>
                  ))}
                </div>
              </fieldset>

              {tier ? (
                <fieldset className="mt-5">
                  <legend className="text-small text-ink-soft">
                    {t.contact.contentQ} <span className="text-ink-soft">{t.contact.optional}</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {READINESS_IDS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        aria-pressed={readiness === r}
                        data-track="readiness_select"
                        data-track-value={r}
                        onClick={() => setReadiness(readiness === r ? null : r)}
                        className={chipCls(readiness === r)}
                      >
                        {t.contact.readiness[r]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <fieldset className="mt-5">
                  <legend className="text-small text-ink-soft">
                    {t.contact.budgetQ} <span className="text-ink-soft">{t.contact.optional}</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {BUDGET_IDS.map((b) => (
                      <button
                        type="button"
                        key={b}
                        aria-pressed={budget === b}
                        data-track="budget_select"
                        data-track-value={b}
                        onClick={() => setBudget(budget === b ? null : b)}
                        className={chipCls(budget === b)}
                      >
                        {t.contact.budgets[b]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {range && (
                <p
                  className="mt-5 rounded-input border border-brand-400/25 bg-brand-400/8 px-4 py-3 text-ui leading-relaxed text-ink-soft"
                  role="status"
                >
                  {t.contact.estPre}
                  <span className="font-medium tabular-nums text-brand-300">
                    {price(range.low)}–{price(range.high)}
                  </span>
                  {t.contact.estOver}{t.pricing.tiers[range.tierId].weeks}
                  {range.note ? ` (${t.contact.notes[range.note]})` : ""}{t.contact.estEnd}
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-small text-ink-soft">
                    {t.contact.nameLabel}
                    {requiredMark}
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? "c-name-error" : undefined}
                    className={inputCls(!!errors.name)}
                  />
                  {fieldError("name")}
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-small text-ink-soft">
                    {t.contact.emailLabel}
                    {requiredMark}
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "c-email-error" : undefined}
                    className={inputCls(!!errors.email)}
                  />
                  {fieldError("email")}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="c-message" className="mb-1.5 block text-small text-ink-soft">
                  {t.contact.msgLabel}
                  {requiredMark}
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={4}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "c-message-error" : undefined}
                  className={cn(inputCls(!!errors.message), "resize-y")}
                />
                {fieldError("message")}
              </div>

              {/* honeypot — hidden from humans, bots fill it */}
              <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                <label>
                  Company
                  <input name="company" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex min-h-[48px] items-center rounded-full bg-brand-400 px-8 py-3 text-ui font-semibold text-[#05080F] transition-colors hover:bg-brand-300 disabled:opacity-60"
                >
                  {status === "sending" ? t.contact.sending : t.contact.submit}
                </button>
                <p className="text-small text-ink-soft">
                  {t.contact.microcopy}
                </p>
              </div>

              {/* data use, stated where the data is given (GDPR Art. 13) */}
              <p className="mt-4 text-small text-ink-soft">
                {t.contact.privacyPre}
                <Link
                  href="/privacy"
                  className="text-brand-300 underline decoration-brand-500/40 underline-offset-4 hover:text-brand-400"
                >
                  {t.contact.privacyLink}
                </Link>
                {t.contact.privacyPost}
              </p>

              {status === "fallback" && (
                <p
                  ref={statusRef as React.RefObject<HTMLParagraphElement>}
                  tabIndex={-1}
                  className="mt-4 text-ui text-ink-soft outline-none"
                  role="alert"
                >
                  {t.contact.fallbackPre}
                  <a className="text-brand-300 underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  {t.contact.fallbackPost}
                </p>
              )}
              {status === "error" && (
                <p
                  ref={statusRef as React.RefObject<HTMLParagraphElement>}
                  tabIndex={-1}
                  className="mt-4 text-ui text-red-300 outline-none"
                  role="alert"
                >
                  {t.contact.errorPre}
                  <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  {t.contact.errorPost}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
