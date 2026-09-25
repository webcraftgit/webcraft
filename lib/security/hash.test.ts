import { describe, it, expect, vi, afterEach } from "vitest";
import { clientIp, hashIp } from "./hash";

const reqWith = (headers: Record<string, string>) =>
  new Request("https://webcraft.test/api", { headers });

describe("clientIp", () => {
  it("prefers the platform connection header over a spoofable XFF", () => {
    const req = reqWith({
      "x-nf-client-connection-ip": "203.0.113.7",
      "x-forwarded-for": "1.1.1.1", // attacker-supplied — must be ignored
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("uses the left-most x-forwarded-for entry when the platform header is absent", () => {
    const req = reqWith({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" });
    expect(clientIp(req)).toBe("198.51.100.9");
  });

  it("falls back to x-real-ip when the XFF left-most is junk", () => {
    const req = reqWith({
      "x-forwarded-for": "bogus, 198.51.100.9",
      "x-real-ip": "192.0.2.5",
    });
    expect(clientIp(req)).toBe("192.0.2.5");
  });

  it("accepts an IPv6 literal", () => {
    expect(clientIp(reqWith({ "x-nf-client-connection-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("rejects a malformed IPv4 octet", () => {
    expect(clientIp(reqWith({ "x-nf-client-connection-ip": "256.1.1.1" }))).toBeNull();
  });

  it("returns null when every candidate is junk or missing", () => {
    expect(clientIp(reqWith({ "x-real-ip": "not-an-ip" }))).toBeNull();
    expect(clientIp(reqWith({}))).toBeNull();
  });
});

describe("hashIp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns null when the secret is not configured", () => {
    vi.stubEnv("IP_HASH_SECRET", "");
    expect(hashIp("203.0.113.7")).toBeNull();
  });

  it("returns null when the ip is null even with a secret", () => {
    vi.stubEnv("IP_HASH_SECRET", "s3cret");
    expect(hashIp(null)).toBeNull();
  });

  it("produces a stable 32-char hex hash for the same ip + day", () => {
    vi.stubEnv("IP_HASH_SECRET", "s3cret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const a = hashIp("203.0.113.7");
    const b = hashIp("203.0.113.7");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it("differs for different ips on the same day", () => {
    vi.stubEnv("IP_HASH_SECRET", "s3cret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("198.51.100.9"));
  });

  it("rotates: the same ip hashes differently on a different day", () => {
    vi.stubEnv("IP_HASH_SECRET", "s3cret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const day1 = hashIp("203.0.113.7");
    vi.setSystemTime(new Date("2026-01-02T12:00:00Z"));
    const day2 = hashIp("203.0.113.7");
    expect(day1).not.toBe(day2);
  });
});
