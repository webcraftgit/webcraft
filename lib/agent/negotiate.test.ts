import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "./negotiate";

describe("prefersMarkdown", () => {
  it("is true for an explicit text/markdown request", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown; charset=utf-8")).toBe(true);
    expect(prefersMarkdown("TEXT/MARKDOWN")).toBe(true);
  });

  it("is false for browsers and for missing headers", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(
      prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8")
    ).toBe(false);
    expect(prefersMarkdown("text/html")).toBe(false);
  });

  it("compares q-values against text/html", () => {
    expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
    expect(prefersMarkdown("text/html, text/markdown;q=0.5")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });

  it("breaks ties by order", () => {
    expect(prefersMarkdown("text/markdown, text/html")).toBe(true);
    expect(prefersMarkdown("text/html, text/markdown")).toBe(false);
  });

  it("ignores wildcards when text/markdown is named", () => {
    expect(prefersMarkdown("text/markdown, */*;q=0.1")).toBe(true);
    expect(prefersMarkdown("text/*, text/markdown")).toBe(true);
  });
});
