/**
 * Consent model (CP6-backend).
 *
 * POLICY_VERSION is bumped whenever the privacy policy's *substance* changes.
 * A stored consent for an older version is not consent for the new one, so the
 * banner reappears. This is the mechanism that keeps "we asked once in 2026"
 * from silently covering a different processing purpose two years later.
 *
 * Cookie, not localStorage: the server needs to know the decision before the
 * first paint so it never streams a tracker to someone who said no.
 */
export const POLICY_VERSION = "2026-07-10";
export const CONSENT_COOKIE = "wc-consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 6 months, then ask again

export type Consent = {
  v: string;          // policy version this decision was given against
  analytics: boolean;
  id: string;         // random; the receipt id in consent_log. NOT the visitor id.
  ts: number;
};

export function parseConsent(raw: string | undefined | null): Consent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (typeof c.analytics !== "boolean" || typeof c.id !== "string") return null;
    if (c.v !== POLICY_VERSION) return null; // stale version → re-ask
    return c as Consent;
  } catch {
    return null;
  }
}
