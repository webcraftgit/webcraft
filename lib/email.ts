import "server-only";

/**
 * Plain-text email through Resend's HTTP API (no SDK: one POST is all we use).
 *
 * Env:
 *   RESEND_API_KEY  required to send anything
 *   EMAIL_FROM      e.g. "Weturn <studio@weturn.studio>". Until a domain is
 *                   verified in Resend, "Weturn <onboarding@resend.dev>" works,
 *                   but Resend then delivers ONLY to the Resend account's own
 *                   address: admin notices arrive, client emails are refused.
 *   ADMIN_EMAIL     where "client sent the form / approved" notices go
 *
 * Never throws. Returns whether Resend accepted the message, so callers can
 * act on real delivery (the reminder job only counts reminders that went out).
 * Text only, on purpose: client-typed content never becomes HTML.
 */
export type Mail = { to: string; subject: string; text: string; replyTo?: string };

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export const adminEmail = (): string | null => process.env.ADMIN_EMAIL?.trim() || null;

export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn("[email] not configured, skipped:", mail.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Status + Resend's short reason; never the recipient or the body.
      const why = await res.text().catch(() => "");
      console.error("[email] resend refused", res.status, why.slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", (e as Error).message);
    return false;
  }
}

/** Sends to ADMIN_EMAIL if set. For "something happened" notices. */
export async function notifyAdmin(subject: string, text: string): Promise<boolean> {
  const to = adminEmail();
  return to ? sendEmail({ to, subject, text }) : false;
}
