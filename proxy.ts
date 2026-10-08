import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { asSessionCookie } from "@/lib/supabase/cookie-options";
import { prefersMarkdown } from "@/lib/agent/negotiate";

/**
 * Session refresh + /admin gate (CP6-backend), plus the Accept: text/markdown
 * rewrite for agents (see the first branch below and app/api/markdown).
 *
 * Next 16 renamed the `middleware` convention to `proxy` (this file + the
 * `proxy` export). It runs on the Node.js runtime — fine here, since the only
 * work is a Supabase session read.
 *
 * This is the OUTER gate only. It answers "is there a valid session?" — it does
 * NOT answer "is this person an admin", because that requires a database read
 * and this runs on every request. The real check is `requireAdmin()` in the
 * admin layout, backed by RLS in Postgres. Defence in depth: even if this
 * file were deleted, the dashboard would return nothing.
 *
 * getUser() (not getSession()) — getSession only decodes the cookie, which the
 * client controls. getUser revalidates the JWT with Supabase.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* Markdown mirror (agent readiness pass, 2026-10-08). An agent asking for
     Accept: text/markdown gets the page as Markdown at the SAME URL — a
     rewrite, not a redirect. /api/markdown answers 404 for paths that are not
     pages. /admin, /portal and /api are never mirrored. */
  if (
    (req.method === "GET" || req.method === "HEAD") &&
    !isPrivate(pathname) &&
    prefersMarkdown(req.headers.get("accept"))
  ) {
    const url = req.nextUrl.clone();
    // path in the pathname, not ?path= — see app/api/markdown/[[...path]]
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
    url.search = "";
    const md = NextResponse.rewrite(url);
    md.headers.set("vary", "Accept");
    return md;
  }
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  let res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  /* CP4_56: with no backend configured there is no session to refresh and no
     one to gate. Pass through — /admin's own layout still refuses to render
     anything, and the login page explains why. Constructing the client with
     `undefined!` would throw on EVERY request to /admin instead. */
  if (!url || !key) return res;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          // session cookies: the login dies when the browser is closed
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, asSessionCookie(options)));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

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

const isPrivate = (p: string) => /^\/(admin|portal|api)(\/|$)/.test(p);

export const config = {
  matcher: [
    "/admin/:path*",
    /* Public pages, but ONLY when the request asks for Markdown. Gating on the
       header here means ordinary browser traffic never invokes the proxy, so
       the static home page keeps being served straight from the CDN. Paths
       with a dot (llms.txt, sitemap.xml, assets) are files, not pages. */
    {
      source: "/((?!_next/|api/|admin|portal|.*\\..*).*)",
      has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
    },
  ],
};
