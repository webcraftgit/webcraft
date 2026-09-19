import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped client carrying the signed-in admin's JWT. RLS applies, so
 * this can only ever read what admin_users allows — the dashboard's real
 * permission check lives in the database, not in this file.
 */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { db, user: null, isAdmin: false as const };

  const { data } = await db.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { db, user, isAdmin: Boolean(data) };
}
