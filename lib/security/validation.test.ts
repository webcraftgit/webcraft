import { describe, it, expect } from "vitest";
import {
  TIERS, MAX,
  oneOf, uuid, str, email, int, host, utm,
} from "./validation";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"; // valid v4-ish, passes UUID_RE

describe("oneOf", () => {
  it("returns the value when it is in the set", () => {
    expect(oneOf("business", TIERS)).toBe("business");
  });
  it("returns null for a value outside the set", () => {
    expect(oneOf("enterprise", TIERS)).toBeNull();
  });
  it("returns null for non-strings", () => {
    expect(oneOf(42, TIERS)).toBeNull();
    expect(oneOf(null, TIERS)).toBeNull();
    expect(oneOf(undefined, TIERS)).toBeNull();
  });
});

describe("uuid", () => {
  it("accepts a well-formed uuid", () => {
    expect(uuid(UUID)).toBe(UUID);
  });
  it("rejects malformed uuids", () => {
    expect(uuid("not-a-uuid")).toBeNull();
    expect(uuid("3f2504e0-4f89-41d3-9a0c")).toBeNull();
    // wrong variant nibble (must be 8/9/a/b)
    expect(uuid("3f2504e0-4f89-41d3-0a0c-0305e82c3301")).toBeNull();
  });
  it("rejects non-strings", () => {
    expect(uuid(123)).toBeNull();
    expect(uuid(null)).toBeNull();
  });
});

describe("str", () => {
  it("trims and returns strings", () => {
    expect(str("  hello  ", 50)).toBe("hello");
  });
  it("strips control characters", () => {
    expect(str("a\u0000b\u0007c\u001Fd", 50)).toBe("abcd");
  });
  it("keeps newlines and tabs (not in the stripped set)", () => {
    expect(str("line1\nline2\tend", 50)).toBe("line1\nline2\tend");
  });
  it("clamps to max length", () => {
    expect(str("abcdef", 3)).toBe("abc");
  });
  it("returns empty string for non-strings", () => {
    expect(str(99, 10)).toBe("");
    expect(str(null, 10)).toBe("");
    expect(str(undefined, 10)).toBe("");
  });
});

describe("email", () => {
  it("lowercases and accepts a plausible address", () => {
    expect(email("User@Example.COM")).toBe("user@example.com");
  });
  it("rejects obvious non-emails", () => {
    expect(email("nope")).toBe("");
    expect(email("a@b")).toBe("");         // no TLD
    expect(email("a @b.com")).toBe("");    // space
  });
  it("rejects non-strings", () => {
    expect(email(42)).toBe("");
  });
  it("respects the max length", () => {
    const long = "a".repeat(MAX.email) + "@example.com";
    expect(email(long)).toBe(""); // truncated head loses the domain → invalid
  });
});

describe("int", () => {
  it("accepts integers inside the range", () => {
    expect(int(1920, 0, 20000)).toBe(1920);
    expect(int(0, 0, 20000)).toBe(0);
  });
  it("rejects out-of-range", () => {
    expect(int(-1, 0, 20000)).toBeNull();
    expect(int(20001, 0, 20000)).toBeNull();
  });
  it("rejects non-integers and non-numbers", () => {
    expect(int(1.5, 0, 20000)).toBeNull();
    expect(int("100", 0, 20000)).toBeNull();
    expect(int(Number.NaN, 0, 20000)).toBeNull();
    expect(int(null, 0, 20000)).toBeNull();
  });
});

describe("host", () => {
  it("reduces a full URL to its lowercased hostname", () => {
    expect(host("https://Example.com/path?q=secret")).toBe("example.com");
  });
  it("returns null for non-URLs", () => {
    expect(host("just text")).toBeNull();
    expect(host("")).toBeNull();
  });
  it("returns null for non-strings", () => {
    expect(host(42)).toBeNull();
  });
});

describe("utm", () => {
  it("lowercases and accepts a boring value", () => {
    expect(utm("Google-Ads_2026")).toBe("google-ads_2026");
  });
  it("rejects values with disallowed characters", () => {
    expect(utm("<script>")).toBeNull();
    expect(utm("a/b")).toBeNull();
    expect(utm("drop;table")).toBeNull();
  });
  it("returns null for empty / non-strings", () => {
    expect(utm("")).toBeNull();
    expect(utm(null)).toBeNull();
  });
});
