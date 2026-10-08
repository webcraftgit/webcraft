import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const req = (path: string, accept?: string, method = "GET") =>
  new NextRequest(`http://localhost${path}`, { method, headers: accept ? { accept } : {} });

const rewriteOf = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("proxy — Markdown negotiation", () => {
  it("rewrites a Markdown request for a page to /api/markdown, keeping the path", async () => {
    const res = await proxy(req("/", "text/markdown"));
    expect(new URL(rewriteOf(res)!).pathname).toBe("/api/markdown");
    expect(res.headers.get("vary")).toBe("Accept");
  });

  it("passes unknown paths through to the Markdown 404", async () => {
    const res = await proxy(req("/__ora-404-probe", "text/markdown"));
    expect(new URL(rewriteOf(res)!).pathname).toBe("/api/markdown/__ora-404-probe");
  });

  it("keeps nested page paths", async () => {
    const res = await proxy(req("/about", "text/markdown"));
    expect(new URL(rewriteOf(res)!).pathname).toBe("/api/markdown/about");
  });

  it("leaves browser requests alone", async () => {
    const res = await proxy(req("/", "text/html,*/*;q=0.8"));
    expect(rewriteOf(res)).toBeNull();
  });

  it("never mirrors private areas or non-GET requests", async () => {
    expect(rewriteOf(await proxy(req("/portal/abc", "text/markdown")))).toBeNull();
    expect(rewriteOf(await proxy(req("/", "text/markdown", "POST")))).toBeNull();
  });
});
