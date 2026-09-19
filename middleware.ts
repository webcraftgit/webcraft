import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Session refresh + /admin gate (CP6-backend).
 *
 * This is the OUTER gate only. It answers "is there a valid session?" — it does
 * NOT answer "is this person an admin", because that requires a database read
 * and middleware runs on every request. The real check is `requireAdmin()` in
 * the admin layout, backed by RLS in Postgres. Defence in depth: even if this
 * file were deleted, the dashboard would return nothing.
 *
 * getUser() (not getSession()) — getSession only decodes the cookie, which the
 * client controls. getUser revalidates the JWT with Supabase.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  const isLogin = pathname.startsWith("/admin/login");

  if (pathname.startsWith("/admin") && !isLogin && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = ""; // never carry a `next=` param — it's an open-redirect vector
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
