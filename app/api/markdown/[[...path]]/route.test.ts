import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const call = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  return GET(new NextRequest(`http://localhost/api/markdown${path}`), {
    params: Promise.resolve({ path: segments.length ? segments : undefined }),
  });
};

describe("GET /api/markdown/[[...path]]", () => {
  it("serves the home page as Markdown with Vary: Accept", async () => {
    const res = await call("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("vary")).toBe("Accept");
    expect(res.headers.get("link")).toMatch(/rel="canonical"/);
    expect((await res.text()).length).toBeGreaterThan(100);
  });

  it("serves the page that was asked for, not the home page", async () => {
    const res = await call("/about");
    expect(res.status).toBe(200);
    expect(res.headers.get("link")).toMatch(/\/about>; rel="canonical"/);
    expect(await res.text()).toMatch(/^# Weturn Studio: kto stoi/);
  });

  it("answers an unknown path with a 404 Markdown body", async () => {
    const res = await call("/__ora-404-probe-x");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("vary")).toBe("Accept");
    const body = await res.text();
    expect(body).toContain("`/__ora-404-probe-x`");
    expect(body).toContain("/llms.txt");
  });
});
