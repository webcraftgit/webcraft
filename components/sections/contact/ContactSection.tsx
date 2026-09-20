"use client";

import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/site";
import { useT, useLocale } from "@/components/i18n/LanguageProvider";
import { currentAttribution, track } from "@/lib/analytics/track";
import {
  TIERS,
  READINESS_IDS,
  BUDGET_IDS,
  estimate,
  fmt,
  type ContentReadiness,
  type BudgetBand,
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
 * - Reply-time promise ("one business day") — a claim about our own behavior,
 *   verifiable and kept. The accent-green budget of this viewport is spent
 *   on its status dot (conversion moment).
 * - Honeypot field ("company") instead of a CAPTCHA.
 * - Backend: POST /api/contact inserts into Supabase when env is configured;
 *   until then the API answers 503 + fallback and the form swaps to a mailto
 *   link — never a fake success.
 */

type Status = "idle" | "sending" | "sent" | "error" | "fallback";

export default function ContactSection() {
  const t = useT();
  const [locale] = useLocale();
  const price = (n: number) => fmt(n, locale, t.currency);
  const reveal = useReveal<HTMLDivElement>();
  const [tier, setTier] = useState<Tier["id"] | null>(null);
  const [readiness, setReadiness] = useState<ContentReadiness | null>(null);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // Pricing tier CTAs prefill the project-type chip
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const id = (e as CustomEvent<string>).detail as Tier["id"];
      if (TIERS.some((t) => t.id === id)) setTier(id);
    };
    window.addEventListener("wc:prefill-tier", onPrefill);
    return () => window.removeEventListener("wc:prefill-tier", onPrefill);
  }, []);

  const range = estimate(tier, readiness);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tier,
          content_readiness: readiness,
          budget,
          locale,
          // consent-gated; resolves to { analytics_consent:false } when refused
          ...currentAttribution(),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        track("form_submit", tier ? { tier } : {});
        form.reset();
      } else {
        const body = await res.json().catch(() => null);
        setStatus(body?.fallback ? "fallback" : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  const chipCls = (selected: boolean) =>
    cn(
      "min-h-[40px] rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-colors",
      selected
        ? "border-brand-400 bg-brand-400/15 text-brand-300"
        : "border-[var(--glass-border)] bg-[rgba(14,24,41,0.45)] text-ink-soft hover:border-[var(--glass-border-hover)] hover:text-ink"
    );

  const inputCls =
    "w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/60 outline-none transition-colors focus:border-brand-400";

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
            the whole first screen was the eyebrow + heading + a paragraph of
            supporting copy: the visitor landed on a headline with no visible
            way to act. On phones the eyebrow and the intro are hidden, so the
            reply promise and the email address are on the first screen with
            the heading. Both stay in the DOM (display:none, not removed), so
            the crawler and the desktop layout are unchanged. */}
        <div>
          <p data-reveal className="eyebrow mb-4 hidden md:block">
            {t.contact.eyebrow}
          </p>
          <h2 data-reveal id="contact-heading" className="heading-2 max-w-[16ch]">
            {t.contact.heading}
          </h2>
          <p data-reveal className="mt-5 hidden max-w-[46ch] text-lg text-ink-soft md:block">
            {t.contact.intro}
          </p>

          <p data-reveal className="mt-6 flex items-center gap-2.5 text-[15px] font-medium text-ink md:mt-8">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-green" />
            </span>
            {t.contact.replyPromise}
          </p>

          <p data-reveal className="mt-4 text-[14px] text-ink-soft md:mt-6">
            {t.contact.preferEmailPre}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 hover:text-brand-400"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {/* ——— form ——— */}
        <div data-reveal className="glass relative rounded-panel p-6 md:p-8">
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
              <p className="font-display text-2xl font-medium text-ink">{t.contact.sentTitle}</p>
              <p className="mx-auto mt-3 max-w-[38ch] text-ink-soft">
                {t.contact.sentBodyPre}{t.contact.replyPromise}{t.contact.sentBodyMid}
                <a className="text-brand-300 underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                {t.contact.sentBodyEnd}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate={false}>
              {/* the 3-question estimate — optional, zero typing */}
              <fieldset>
                <legend className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-soft">
                  {t.contact.whatBuilding} <span className="normal-case">{t.contact.optional}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {TIERS.map((projectTier) => (
                    <button
                      type="button"
                      key={projectTier.id}
                      aria-pressed={tier === projectTier.id}
                      data-track="tier_select"
                      data-track-value={projectTier.id}
                      onClick={() => setTier(tier === projectTier.id ? null : projectTier.id)}
                      className={chipCls(tier === projectTier.id)}
                    >
                      {t.pricing.tiers[projectTier.id].name}
                    </button>
                  ))}
                </div>
              </fieldset>

              {tier && (
                <fieldset className="mt-5">
                  <legend className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-soft">
                    {t.contact.contentQ}
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
              )}

              <fieldset className="mt-5">
                <legend className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-soft">
                  {t.contact.budgetQ} <span className="normal-case">{t.contact.optional}</span>
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

              {range && (
                <p
                  className="mt-5 rounded-input border border-brand-400/25 bg-brand-400/8 px-4 py-3 text-[14px] leading-relaxed text-ink-soft"
                  role="status"
                >
                  {t.contact.estPre}
                  <span className="font-medium text-brand-300">
                    {price(range.low)}–{price(range.high)}
                  </span>
                  {t.contact.estOver}{t.pricing.tiers[range.tierId].weeks}
                  {range.note ? ` — ${t.contact.notes[range.note]}` : ""}{t.contact.estEnd}
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-[13.5px] text-ink-soft">
                    {t.contact.nameLabel}
                  </label>
                  <input id="c-name" name="name" required maxLength={120} autoComplete="name" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-[13.5px] text-ink-soft">
                    {t.contact.emailLabel}
                  </label>
                  <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputCls} />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="c-msg" className="mb-1.5 block text-[13.5px] text-ink-soft">
                  {t.contact.msgLabel}
                </label>
                <textarea id="c-msg" name="message" required minLength={10} maxLength={4000} rows={4} className={cn(inputCls, "resize-y")} />
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
                  className="inline-flex min-h-[48px] items-center rounded-full bg-brand-400 px-8 py-3 text-[15px] font-semibold text-[#05080F] transition-colors hover:bg-brand-300 disabled:opacity-60"
                >
                  {status === "sending" ? t.contact.sending : t.contact.submit}
                </button>
                <p className="text-[12.5px] text-ink-soft/80">
                  {t.contact.microcopy}
                </p>
              </div>

              {status === "fallback" && (
                <p className="mt-4 text-[14px] text-ink-soft" role="alert">
                  {t.contact.fallbackPre}
                  <a className="text-brand-300 underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  {t.contact.fallbackPost}
                </p>
              )}
              {status === "error" && (
                <p className="mt-4 text-[14px] text-red-300" role="alert">
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
