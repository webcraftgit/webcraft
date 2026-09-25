import { describe, it, expect, vi, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "./rate-limit";

const dbWith = (rpc: ReturnType<typeof vi.fn>) =>
  ({ rpc } as unknown as SupabaseClient);

afterEach(() => vi.restoreAllMocks());

describe("rateLimit", () => {
  it("allows the request when the RPC returns true", async () => {
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    expect(await rateLimit(dbWith(rpc), "contact:ip:abc", 5, 3600)).toBe(true);
  });

  it("blocks the request when the RPC returns false", async () => {
    const rpc = vi.fn(async () => ({ data: false, error: null }));
    expect(await rateLimit(dbWith(rpc), "contact:ip:abc", 5, 3600)).toBe(false);
  });

  it("fails closed (blocks) when the database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn(async () => ({ data: null, error: { message: "db down" } }));
    expect(await rateLimit(dbWith(rpc), "contact:ip:abc", 5, 3600)).toBe(false);
  });

  it("passes the bucket, max and window through to the RPC", async () => {
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    await rateLimit(dbWith(rpc), "events:ip:xyz", 240, 3600);
    expect(rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_bucket: "events:ip:xyz",
      p_max: 240,
      p_window_seconds: 3600,
    });
  });
});
