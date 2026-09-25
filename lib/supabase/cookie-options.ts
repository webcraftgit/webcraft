import type { CookieOptions } from "@supabase/ssr";

/**
 * Make an auth cookie a SESSION cookie — one the browser drops the moment it
 * closes — by removing its lifetime (`maxAge` / `expires`).
 *
 * Why: @supabase/ssr forces a 400-day `maxAge` when it writes the auth cookies,
 * so a login survives closing the browser. For an admin panel we'd rather the
 * session end with the window: close it, and the next visit lands on /admin/login.
 *
 * The one exception is deletion. On sign-out the library writes the cookie with
 * `maxAge: 0` to expire it immediately; strip that and the cookie would linger,
 * which is the opposite of signing out. So we pass a `maxAge: 0` straight
 * through and only sessionise real, live cookies.
 */
export function asSessionCookie(options?: CookieOptions): CookieOptions {
  if (options?.maxAge === 0) return options; // deletion — leave it alone
  const next = { ...(options ?? {}) };
  delete next.maxAge;
  delete next.expires;
  return next;
}
