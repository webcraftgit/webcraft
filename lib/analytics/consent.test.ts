import { describe, it, expect } from "vitest";
import { parseConsent, POLICY_VERSION } from "./consent";

const encode = (o: unknown) => encodeURIComponent(JSON.stringify(o));

const valid = {
  v: POLICY_VERSION,
  analytics: true,
  id: "receipt-123",
  ts: 1_700_000_000_000,
};

describe("parseConsent", () => {
  it("parses a well-formed, current-version cookie", () => {
    const c = parseConsent(encode(valid));
    expect(c).not.toBeNull();
    expect(c?.analytics).toBe(true);
    expect(c?.id).toBe("receipt-123");
    expect(c?.v).toBe(POLICY_VERSION);
  });

  it("preserves a false analytics decision (a refusal is still a decision)", () => {
    const c = parseConsent(encode({ ...valid, analytics: false }));
    expect(c?.analytics).toBe(false);
  });

  it("returns null for a stale policy version (banner must re-ask)", () => {
    expect(parseConsent(encode({ ...valid, v: "1999-01-01" }))).toBeNull();
  });

  it("returns null when analytics is not a boolean", () => {
    expect(parseConsent(encode({ ...valid, analytics: "yes" }))).toBeNull();
    expect(parseConsent(encode({ ...valid, analytics: 1 }))).toBeNull();
  });

  it("returns null when id is missing or not a string", () => {
    expect(parseConsent(encode({ ...valid, id: undefined }))).toBeNull();
    expect(parseConsent(encode({ ...valid, id: 42 }))).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseConsent("%7Bnot-json")).toBeNull();
    expect(parseConsent("plain text")).toBeNull();
  });

  it("returns null for empty / missing input", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
  });
});
