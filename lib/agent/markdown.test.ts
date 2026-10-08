import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";
import { ABOUT } from "@/lib/seo/about";
import { TIERS } from "@/lib/pricing";
import { llmsTxt, normalizePath, notFoundMarkdown, pageMarkdown } from "./markdown";

const pathOf = (url: string) => url.slice(SITE_URL.length) || "/";

describe("pageMarkdown", () => {
  it("renders every sitemap URL", () => {
    for (const { url } of sitemap()) {
      const md = pageMarkdown(pathOf(url));
      expect(md, url).toBeTruthy();
      expect(md!.startsWith("# "), url).toBe(true);
    }
  });

  it("returns null for unknown paths and private areas", () => {
    expect(pageMarkdown("/__ora-404-probe")).toBeNull();
    expect(pageMarkdown("/admin")).toBeNull();
    expect(pageMarkdown("/portal/abc")).toBeNull();
  });

  it("normalises trailing slashes and queries", () => {
    expect(normalizePath("/about/")).toBe("/about");
    expect(normalizePath("/about?x=1")).toBe("/about");
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
    expect(pageMarkdown("/about/")).toBe(pageMarkdown("/about"));
  });

  it("renders the home page from the same source as llms.txt", () => {
    expect(pageMarkdown("/")).toBe(llmsTxt());
  });

  it("renders /about with the founder and the honesty caveats", () => {
    const md = pageMarkdown("/about")!;
    expect(md).toContain(ABOUT.pl.h1);
    expect(md).toContain("Krzysztof Powierża");
    expect(md).toContain("fikcyjnych marek");
  });

  it("renders /privacy with every section heading", () => {
    const md = pageMarkdown("/privacy")!;
    expect(md).toContain("# Polityka prywatności");
    expect(md).toContain("## Kto odpowiada");
  });
});

describe("/about copy", () => {
  it("is substantial in both languages (trust-page threshold: 500 chars)", () => {
    for (const c of Object.values(ABOUT)) {
      const text = [c.intro, ...c.sections.flatMap((s) => [...(s.p ?? []), ...(s.list ?? [])])].join(" ");
      expect(text.length).toBeGreaterThan(500);
    }
  });
});

describe("llmsTxt", () => {
  const txt = llmsTxt();

  it("follows the llms.txt shape: H1, then a blockquote summary", () => {
    const [h1, , quote] = txt.split("\n");
    expect(h1).toMatch(/^# \S/);
    expect(quote).toMatch(/^> \S/);
  });

  it("has when-to-use guidance with a hand-off path for agents", () => {
    expect(txt).toMatch(/^## When to use /m);
    expect(txt).toContain(`${SITE_URL}/#contact`);
    expect(txt).toContain("Accept: text/markdown");
  });

  it("quotes the lowest published price", () => {
    const min = Math.min(...TIERS.map((t) => t.from));
    expect(txt).toContain(new Intl.NumberFormat("pl-PL", { useGrouping: "always" }).format(min));
  });

  it("links the about page", () => {
    expect(txt).toContain(`${SITE_URL}/about`);
  });
});

describe("notFoundMarkdown", () => {
  it("explains the error and links llms.txt and the sitemap", () => {
    const md = notFoundMarkdown("/nope");
    expect(md.length).toBeGreaterThan(20);
    expect(md).toContain("`/nope`");
    expect(md).toContain(`${SITE_URL}/llms.txt`);
    expect(md).toContain(`${SITE_URL}/sitemap.xml`);
  });
});
