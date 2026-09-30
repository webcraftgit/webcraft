"use client";
import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client — anon key only. RLS gives it nothing without a session.
 *
 * CP4_56: returns NULL when the env vars are absent, instead of constructing a
 * client with `undefined!` and throwing. That throw was happening during the
 * BUILD: `/admin/login` is a static page, Next renders it once at build time,
 * the client was created during that render, and `@supabase/ssr` threw
 * "Your project's URL and API key are required". A thrown error in a
 * prerender fails the whole `next build` — so a marketing site with no backend
 * configured could not deploy at all, which is the opposite of the intent
 * (see lib/supabase/admin.ts, which has always degraded this way).
 */
export const supabaseBrowser = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  /**
   * The login itself is written here, in the browser, so this is where the
   * "sign out when the window closes" behaviour has to start. We take over the
   * cookie read/write and simply never attach a Max-Age or Expires to a live
   * auth cookie — that makes it a *session* cookie the browser discards on
   * close. (`maxAge: 0` is the library expiring a cookie on sign-out; we keep
   * that so signing out still works.) The server side matches this in
   * proxy.ts and lib/supabase/server.ts via asSessionCookie().
   *
   * The values are base64url (cookie-safe), so no percent-encoding is needed
   * and both sides read the exact same string.
   */
  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        return document.cookie
          .split("; ")
          .filter(Boolean)
          .map((c) => {
            const eq = c.indexOf("=");
            return { name: c.slice(0, eq), value: c.slice(eq + 1) };
          });
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        if (typeof document === "undefined") return;
        for (const { name, value, options } of list) {
          const deleting = options?.maxAge === 0;
          let str = `${name}=${value}; Path=${options?.path ?? "/"}; SameSite=${options?.sameSite ?? "Lax"}`;
          if (options?.secure) str += "; Secure";
          if (deleting) str += "; Max-Age=0"; // let sign-out expire the cookie
          // otherwise: no Max-Age / Expires → dies when the browser closes
          document.cookie = str;
        }
      },
    },
  });
};
