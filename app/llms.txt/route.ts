import { SITE_URL_IS_PLACEHOLDER } from "@/lib/site";
import { llmsTxt } from "@/lib/agent/markdown";

/**
 * /llms.txt (CP4_17-seo). The content and its rationale live in
 * lib/agent/markdown.ts, shared with the Accept: text/markdown mirror of the
 * home page so the two cannot drift.
 *
 * IT IS GENERATED, NOT WRITTEN. Prices come from lib/pricing.ts and copy from
 * the dictionary — the same sources the page renders from. A hand-maintained
 * version of this file would be wrong within one repricing, and being
 * confidently wrong in a machine-readable summary is worse than having none.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Same reasoning as robots.ts: a half-configured deploy should not be
      // handing out a summary that points at a hostname we do not own.
      ...(SITE_URL_IS_PLACEHOLDER ? { "x-robots-tag": "noindex" } : {}),
      "cache-control": "public, max-age=3600",
    },
  });
}
