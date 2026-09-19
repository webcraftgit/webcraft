import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — so it exists ONLY behind API routes.
 *
 * The `import "server-only"` line above is load-bearing: if anyone ever
 * imports this from a client component the BUILD fails, rather than shipping
 * the service key to the browser. That has happened to enough teams to be
 * worth the one-line dependency.
 *
 * Returns null when env is absent, so /api/contact can answer 503 + fallback
 * instead of throwing — the form then shows a mailto and we never fake a send.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "webcraft-server" } },
  });
}
