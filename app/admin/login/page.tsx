"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Admin sign-in — email one-time code (CP6-backend).
 *
 * `shouldCreateUser: false` is the important line. Without it, Supabase happily
 * creates an account for ANY email that requests a code, and your login
 * page becomes a public signup form. With it, an unknown email gets the same
 * generic response as a known one — no user enumeration — and no account.
 *
 * Passing OTP still doesn't grant access: the dashboard layout re-checks
 * membership in `admin_users`, and RLS enforces it again at the row level.
 * Email is the weakest link here (a compromised inbox); the allowlist is what
 * contains it.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Created lazily and allowed to be null: with no Supabase env configured
     this page still has to RENDER (Next prerenders it at build time), it just
     cannot sign anyone in. */
  const supabase = useMemo(() => supabaseBrowser(), []);

  // Basic shape check — Supabase does the real validation, but reject the
  // obviously-wrong before the round trip.
  const normalized = email.trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  async function sendCode() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    // Deliberately vague: "no such user" and "code sent" must look identical,
    // or this page tells an attacker which emails are admins.
    if (error && !/not found|signups not allowed/i.test(error.message)) {
      setError("Could not send the code. Check the address and try again.");
      return;
    }
    setStage("code");
  }

  async function verify() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError("That code is wrong or has expired. Request a new one.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  const input =
    "w-full rounded-input border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-brand-400";

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="glass w-full max-w-[400px] rounded-panel p-8">
        <p className="eyebrow">Webcraft</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink">Sign in</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {stage === "email"
            ? "We email a one-time code to the address on file."
            : `Enter the 8-digit code sent to ${normalized}.`}
        </p>

        {!supabase && (
          /* CP4_56: no Supabase env on this deployment. Say so plainly rather
             than showing a form that silently does nothing. */
          <p className="mt-6 rounded-card border border-[var(--glass-border)] bg-[rgba(5,8,15,0.55)] p-4 text-[13.5px] leading-relaxed text-ink-soft">
            The backend is not configured on this deployment. Set
            <code className="mx-1 text-brand-300">NEXT_PUBLIC_SUPABASE_URL</code>
            and
            <code className="mx-1 text-brand-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            (see <code className="text-brand-300">docs/SETUP.md</code>) to enable sign-in.
            The public site is unaffected.
          </p>
        )}

        <div className="mt-6 space-y-4" hidden={!supabase}>
          {stage === "email" ? (
            <>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13.5px] text-ink-soft">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                />
              </div>
              <button
                type="button"
                onClick={sendCode}
                disabled={busy || !validEmail}
                className="min-h-[48px] w-full rounded-full bg-brand-400 px-6 text-[15px] font-semibold text-[#05080F] transition-colors hover:bg-brand-300 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send code"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="code" className="mb-1.5 block text-[13.5px] text-ink-soft">
                  One-time code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder="00000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${input} tracking-[0.3em]`}
                />
              </div>
              <button
                type="button"
                onClick={verify}
                disabled={busy || code.trim().length < 8}
                className="min-h-[48px] w-full rounded-full bg-brand-400 px-6 text-[15px] font-semibold text-[#05080F] transition-colors hover:bg-brand-300 disabled:opacity-50"
              >
                {busy ? "Checking…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setStage("email"); setCode(""); setError(null); }}
                className="w-full text-[13px] text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                Use a different email
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="text-[13.5px] text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
