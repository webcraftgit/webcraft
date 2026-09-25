import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => h.client,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

import { requireAdmin } from "./server";

type User = { id: string } | null;

function makeClient({ user = null as User, adminRow = null as unknown }) {
  return {
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: adminRow }) }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("requireAdmin", () => {
  it("returns not-admin with no client when the backend is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const r = await requireAdmin();
    expect(r.db).toBeNull();
    expect(r.user).toBeNull();
    expect(r.isAdmin).toBe(false);
  });

  it("returns not-admin when there is no signed-in user", async () => {
    h.client = makeClient({ user: null });
    const r = await requireAdmin();
    expect(r.user).toBeNull();
    expect(r.isAdmin).toBe(false);
  });

  it("returns not-admin when a signed-in user is not on the allow-list", async () => {
    h.client = makeClient({ user: { id: "u1" }, adminRow: null });
    const r = await requireAdmin();
    expect(r.user).toEqual({ id: "u1" });
    expect(r.isAdmin).toBe(false);
  });

  it("returns admin when the signed-in user is on the allow-list", async () => {
    h.client = makeClient({ user: { id: "u1" }, adminRow: { user_id: "u1" } });
    const r = await requireAdmin();
    expect(r.isAdmin).toBe(true);
  });
});
