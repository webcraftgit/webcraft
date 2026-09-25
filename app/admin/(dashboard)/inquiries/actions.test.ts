import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => h.client,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateInquiry } from "./actions";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

type User = { id: string } | null;

function makeClient({
  user = { id: "u1" } as User,
  isAdmin = true,
  updateError = null as unknown,
}) {
  return {
    auth: { getUser: async () => ({ data: { user } }) },
    from: (table: string) => {
      if (table === "admin_users") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: isAdmin ? { user_id: user?.id } : null }),
            }),
          }),
        };
      }
      return { update: () => ({ eq: async () => ({ error: updateError }) }) };
    },
  };
}

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("updateInquiry", () => {
  it("refuses a non-admin session", async () => {
    h.client = makeClient({ isAdmin: false });
    await expect(updateInquiry(form({ id: UUID, status: "new" }))).rejects.toThrow("forbidden");
  });

  it("rejects an id that is not a UUID", async () => {
    h.client = makeClient({ isAdmin: true });
    await expect(updateInquiry(form({ id: "123", status: "new" }))).rejects.toThrow("bad_request");
  });

  it("rejects a status outside the allowed set", async () => {
    h.client = makeClient({ isAdmin: true });
    await expect(updateInquiry(form({ id: UUID, status: "archived" }))).rejects.toThrow("bad_request");
  });

  it("updates when admin, uuid and status are all valid", async () => {
    h.client = makeClient({ isAdmin: true, updateError: null });
    await expect(updateInquiry(form({ id: UUID, status: "contacted", admin_notes: "called" }))).resolves.toBeUndefined();
  });

  it("throws a generic error (no raw db message) when the update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    h.client = makeClient({ isAdmin: true, updateError: { code: "23505", message: "secret detail" } });
    await expect(updateInquiry(form({ id: UUID, status: "new" }))).rejects.toThrow("update_failed");
  });
});
