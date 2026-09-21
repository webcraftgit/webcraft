import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped client carrying the signed-in admin's JWT. RLS applies, so
 * this can only ever read what admin_users allows — the dashboard's real
 * permission check lives in the database, not in this file.
 */
export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // CP4_56: no backend configured → no client. Callers treat that as
  // "not an admin", which lands on the login page and its notice.
  if (!url || !key) return null;

  const store = await cookies();
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          // Server Components can't set cookies; middleware refreshes the
          // session instead. Swallowing here is the documented pattern.
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

/** True only if the JWT maps to a row in admin_users. "Logged in" != "admin". */
export async function requireAdmin() {
  const db = await supabaseServer();
  if (!db) return { db: null, user: null, isAdmin: false as const };

  const { data: { user } } = await db.auth.getUser();
  if (!user) return { db, user: null, isAdmin: false as const };

  const { data } = await db.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { db, user, isAdmin: Boolean(data) };
}
