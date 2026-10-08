/**
 * Accept-header negotiation for the Markdown mirror (agent readiness pass,
 * 2026-10-08).
 *
 * An agent that sends `Accept: text/markdown` gets the same page as Markdown
 * instead of a WebGL-heavy HTML shell (see acceptmarkdown.com). Browsers never
 * ask for text/markdown, so they never take this path.
 *
 * The rule, kept deliberately boring:
 *  - text/markdown must be listed explicitly with q > 0. A bare *\/* is NOT a
 *    request for Markdown — every browser sends one.
 *  - it wins only if its q is higher than text/html's, or equal and listed
 *    first. Wildcards are ignored on both sides, so the tie-break is decided
 *    by what the client actually named.
 */
type Range = { type: string; q: number; index: number };

function parse(accept: string): Range[] {
  return accept
    .split(",")
    .map((part, index) => {
      const [type, ...params] = part.trim().split(";");
      let q = 1;
      for (const p of params) {
        const [k, v] = p.trim().split("=");
        if (k?.trim().toLowerCase() === "q") {
          const n = Number(v);
          q = Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0;
        }
      }
      return { type: type.trim().toLowerCase(), q, index };
    })
    .filter((r) => r.type);
}

export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const ranges = parse(accept);
  const md = ranges.find((r) => r.type === "text/markdown");
  if (!md || md.q === 0) return false;
  const html = ranges.find((r) => r.type === "text/html");
  if (!html) return true;
  return md.q > html.q || (md.q === html.q && md.index < html.index);
}
