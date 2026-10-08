import type { NextRequest } from "next/server";
import { SITE_URL, SITE_URL_IS_PLACEHOLDER } from "@/lib/site";
import { normalizePath, notFoundMarkdown, pageMarkdown } from "@/lib/agent/markdown";

/**
 * Markdown mirror of the public pages (agent readiness pass, 2026-10-08).
 *
 * Not linked anywhere: proxy.ts rewrites any page request that asks for
 * `Accept: text/markdown` to /api/markdown/<original path>, so the agent keeps
 * the URL it asked for (acceptmarkdown.com). Unknown paths get a real 404 with
 * a Markdown body that points at llms.txt and the sitemap.
 *
 * The path travels in the pathname, not a query string: `next start` drops a
 * query added by a proxy rewrite, which silently turned every request into
 * the home page.
 *
 * Vary: Accept tells every cache between us and the agent that this URL has
 * two representations. The canonical Link header points search engines at the
 * HTML page, so the Markdown copy never competes with it in the index.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path: segments = [] } = await ctx.params;
  const path = normalizePath(`/${segments.map(decodeURIComponent).join("/")}`);
  const md = pageMarkdown(path);

  return new Response(md ?? notFoundMarkdown(path), {
    status: md ? 200 : 404,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
      "cache-control": md ? "public, max-age=3600" : "public, max-age=300",
      ...(md ? { link: `<${SITE_URL}${path === "/" ? "" : path}>; rel="canonical"` } : {}),
      ...(SITE_URL_IS_PLACEHOLDER ? { "x-robots-tag": "noindex" } : {}),
    },
  });
}
