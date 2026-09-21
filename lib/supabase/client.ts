"use client";
import { createBrowserClient } from "@supabase/ssr";
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
  return createBrowserClient(url, key);
};
