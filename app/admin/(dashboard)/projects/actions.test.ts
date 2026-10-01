import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  client: null as unknown,
  calls: [] as { table: string; op: string; arg?: unknown; eq?: [string, unknown][] }[],
  files: [] as { storage_path: string }[],
  removed: [] as string[],
  removeError: null as unknown,
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: () => h.client }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => {} }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    storage: {
      from: () => ({
        remove: async (paths: string[]) => (h.removed.push(...paths), { error: h.removeError }),
      }),
    },
  }),
}));

import {
  closeCheckpoint, createProject, deleteProject, replaceLink, sendCheckpoint, setProjectStatus, setWaitingOn, startClock,
} from "./actions";

const ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

/** Records every write; answers reads of admin_users and project_files. */
function makeClient({ isAdmin = true } = {}) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (table: string) => {
      if (table === "admin_users") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: isAdmin ? { user_id: "u1" } : null }) }) }) };
      }
      const call: (typeof h.calls)[number] = { table, op: "", eq: [] };
      const b = {
        insert: (arg: unknown) => ((call.op = "insert"), (call.arg = arg), h.calls.push(call), b),
        update: (arg: unknown) => ((call.op = "update"), (call.arg = arg), h.calls.push(call), b),
        delete: () => ((call.op = "delete"), h.calls.push(call), b),
        select: () => b,
        eq: (k: string, v: unknown) => (call.eq!.push([k, v]), b),
        single: async () => ({ data: { id: ID }, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        then: (res: (v: unknown) => unknown) =>
          res(table === "project_files" && !call.op ? { data: h.files, error: null } : { error: null }),
      };
      return b;
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
  h.client = makeClient();
  h.calls = [];
  h.files = [];
  h.removed = [];
  h.removeError = null;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("project admin actions", () => {
  it("refuse a non-admin session, every one of them", async () => {
    h.client = makeClient({ isAdmin: false });
    await expect(createProject(form({ client_name: "X", package: "launch", locale: "pl" }))).rejects.toThrow("forbidden");
    await expect(replaceLink(form({ id: ID }))).rejects.toThrow("forbidden");
    await expect(setProjectStatus(form({ id: ID, status: "active" }))).rejects.toThrow("forbidden");
    await expect(deleteProject(form({ id: ID }))).rejects.toThrow("forbidden");
    await expect(startClock(form({ id: ID }))).rejects.toThrow("forbidden");
    await expect(setWaitingOn(form({ id: ID, waiting_on: "photos" }))).rejects.toThrow("forbidden");
    await expect(
      sendCheckpoint(form({ id: ID, stage: "1", preview_url: "https://x.vercel.app" }))
    ).rejects.toThrow("forbidden");
    await expect(
      closeCheckpoint(form({ id: ID, checkpoint_id: ID, status: "approved" }))
    ).rejects.toThrow("forbidden");
    expect(h.calls).toEqual([]);
  });

  it("createProject validates, stores a fresh 43-char token and redirects to the new row", async () => {
    await expect(createProject(form({ client_name: "", package: "launch", locale: "pl" }))).rejects.toThrow("bad_request");
    await expect(createProject(form({ client_name: "X", package: "enterprise", locale: "pl" }))).rejects.toThrow("bad_request");

    await expect(createProject(form({ client_name: " Dentica ", package: "business", locale: "en" }))).rejects.toThrow(
      `REDIRECT /admin/projects?new=${ID}`
    );
    const row = h.calls.at(-1)!.arg as Record<string, string>;
    expect(row).toMatchObject({ client_name: "Dentica", package: "business", locale: "en" });
    expect(row.access_token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("replaceLink writes a different token each time", async () => {
    await replaceLink(form({ id: ID }));
    await replaceLink(form({ id: ID }));
    const [a, b] = h.calls.map((c) => (c.arg as { access_token: string }).access_token);
    expect(a).not.toBe(b);
    expect(h.calls[0].eq).toEqual([["id", ID]]);
  });

  it("setProjectStatus only accepts known statuses and UUIDs", async () => {
    await expect(setProjectStatus(form({ id: ID, status: "deleted" }))).rejects.toThrow("bad_request");
    await expect(setProjectStatus(form({ id: "1 or 1=1", status: "active" }))).rejects.toThrow("bad_request");
    await setProjectStatus(form({ id: ID, status: "archived" }));
    expect(h.calls.at(-1)).toMatchObject({ op: "update", arg: { status: "archived" } });
  });

  it("sendCheckpoint rejects bad stages and non-http preview links before touching the database", async () => {
    await expect(sendCheckpoint(form({ id: ID, stage: "5", preview_url: "https://x.app" }))).rejects.toThrow("bad_request");
    await expect(sendCheckpoint(form({ id: ID, stage: "2", preview_url: "javascript:alert(1)" }))).rejects.toThrow("bad_request");
    await expect(sendCheckpoint(form({ id: "nope", stage: "2", preview_url: "https://x.app" }))).rejects.toThrow("bad_request");
    expect(h.calls).toEqual([]);
  });

  it("closeCheckpoint only approves or withdraws, and only an open one", async () => {
    await expect(closeCheckpoint(form({ id: ID, checkpoint_id: ID, status: "open" }))).rejects.toThrow("bad_request");
    await closeCheckpoint(form({ id: ID, checkpoint_id: ID, status: "withdrawn" }));
    const c = h.calls.find((x) => x.table === "project_checkpoints")!;
    expect(c.op).toBe("update");
    expect(c.arg).toMatchObject({ status: "withdrawn" });
    expect(c.eq).toContainEqual(["status", "open"]);
  });

  it("deleteProject removes this project's files, then the project", async () => {
    h.files = [{ storage_path: `${ID}/logo/a.svg` }, { storage_path: "someone-else/photo/b.jpg" }];
    await deleteProject(form({ id: ID }));
    expect(h.removed).toEqual([`${ID}/logo/a.svg`]);
    expect(h.calls.at(-1)).toMatchObject({ table: "projects", op: "delete", eq: [["id", ID]] });
  });

  it("deleteProject keeps the project if storage removal fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    h.files = [{ storage_path: `${ID}/photo/a.jpg` }];
    h.removeError = { message: "storage down" };
    await expect(deleteProject(form({ id: ID }))).rejects.toThrow("delete_failed");
    expect(h.calls.some((c) => c.op === "delete")).toBe(false);
  });
});
