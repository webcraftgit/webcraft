import type { CookieOptions } from "@supabase/ssr";

/**
 * How long an admin stays signed in without visiting /admin. Every admin
 * visit refreshes the session (proxy.ts), which rewrites the cookies with a
 * fresh lifetime, so this is "30 days since you last used it", not since
 * login. Closing the browser no longer signs you out; "Sign out" still does.
 */
export const ADMIN_SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Give a live auth cookie the admin lifetime.
 *
 * Why: @supabase/ssr writes the auth cookies with a 400-day `maxAge`. That's
 * far longer than an admin panel should stay open on a forgotten laptop, so
 * we cap it at ADMIN_SESSION_MAX_AGE_S.
 *
 * The one exception is deletion. On sign-out the library writes the cookie with
 * `maxAge: 0` to expire it immediately; replace that and the cookie would
 * linger, which is the opposite of signing out. So `maxAge: 0` passes through.
 */
export function asAdminCookie(options?: CookieOptions): CookieOptions {
  if (options?.maxAge === 0) return options; // deletion — leave it alone
  const next = { ...(options ?? {}) };
  delete next.expires;
  next.maxAge = ADMIN_SESSION_MAX_AGE_S;
  return next;
}
