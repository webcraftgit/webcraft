"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, POLICY_VERSION, parseConsent, type Consent } from "@/lib/analytics/consent";

type Ctx = {
  consent: Consent | null;
  decided: boolean;
  decide: (analytics: boolean) => void;
  reopen: () => void;
};

const ConsentCtx = createContext<Ctx | null>(null);
export const useConsent = () => {
  const c = useContext(ConsentCtx);
  if (!c) throw new Error("useConsent outside ConsentProvider");
  return c;
};

const readCookie = (name: string) =>
  document.cookie.split("; ").find((r) => r.startsWith(name + "="))?.split("=").slice(1).join("=");

export default function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  // `decided` starts true so the banner never flashes during hydration for
  // people who already answered; the effect below reveals it if needed.
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    const existing = parseConsent(readCookie(CONSENT_COOKIE));
    setConsent(existing);
    setDecided(Boolean(existing));
  }, []);

  const decide = useCallback((analytics: boolean) => {
    const next: Consent = { v: POLICY_VERSION, analytics, id: crypto.randomUUID(), ts: Date.now() };

    // SameSite=Lax + Secure. Not HttpOnly on purpose: the client tracker has to
    // read it to decide whether to run at all.
    document.cookie =
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax${
        location.protocol === "https:" ? "; Secure" : ""
      }`;

    setConsent(next);
    setDecided(true);

    // Art. 7(1) receipt. Fire-and-forget; a failed log must not block the UI.
    void fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent_id: next.id, analytics, policy_version: POLICY_VERSION }),
      keepalive: true,
    }).catch(() => {});

    // Withdrawal must be as effective as refusal: drop the identifiers now.
    if (!analytics) {
      try {
        localStorage.removeItem("wc-vid");
        sessionStorage.removeItem("wc-sid");
      } catch {}
    }
  }, []);

  const reopen = useCallback(() => setDecided(false), []);

  return <ConsentCtx.Provider value={{ consent, decided, decide, reopen }}>{children}</ConsentCtx.Provider>;
}
