import { beforeEach, describe, expect, it, vi } from "vitest";
import { newToken } from "./token";

/**
 * A tiny in-memory stand-in for the supabase-js query builder: just the
 * chain shapes data.ts uses (select/eq/neq/order/maybeSingle, upsert,
 * update…select, rpc). Enough to test the portal's rules without a database.
 */
type Row = Record<string, unknown>;
const h = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, rpcAllow: true, calls: [] as string[] }));

function table(name: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let op: { kind: "select" } | { kind: "update"; patch: Row } = { kind: "select" };
  const rows = () => (h.tables[name] ??= []).filter((r) => filters.every((f) => f(r)));
  const run = () => {
    if (op.kind === "update") {
      const hit = rows();
      hit.forEach((r) => Object.assign(r, (op as { patch: Row }).patch));
      return hit;
    }
    return rows();
  };
  const b = {
    select: () => b,
    eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
    neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), b),
    order: () => b,
    maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
    update: (patch: Row) => ((op = { kind: "update", patch }), h.calls.push(`update:${name}`), b),
    upsert: async (row: Row) => {
      h.calls.push(`upsert:${name}`);
      const t = (h.tables[name] ??= []);
      const i = t.findIndex((r) => r.project_id === row.project_id);
      if (i >= 0) t[i] = row;
      else t.push(row);
      return { error: null };
    },
    then: (res: (v: { data: Row[]; error: null }) => unknown) => res({ data: run(), error: null }),
  };
  return b;
}

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: table, rpc: async () => ({ data: h.rpcAllow, error: null }) }),
}));

const { loadPortal, saveAnswers, submitIntake } = await import("./data");

const TOKEN = newToken();
const REQUIRED: Record<string, string | boolean> = {
  q1: "Dentica", "q2.legal_name": "Dentica sp. z o.o.", "q2.nip": "5250000000", "q2.address": "Puławska 1",
  "q3.name": "Anna", "q3.email": "anna@dentica.pl", "q3.phone": "600000000", q5: "Mokotów", q6: "Book",
  q9: "Families", q11: "Does it hurt?", q13: "Calm", q14: "Check-up", q15: "Open late", q17: "calm",
  q21: "a.pl", q22: "b.pl", "q24.none": true, "q25.none": true, q32: "kontakt@dentica.pl",
};

beforeEach(() => {
  h.rpcAllow = true;
  h.calls = [];
  h.tables = {
    projects: [{
      id: "p1", client_name: "Dentica", package: "business", locale: "pl",
      status: "intake", intake_submitted_at: null, access_token: TOKEN,
    }],
    intake_answers: [{ project_id: "p1", answers: { q1: "Dentica", junk: "dropped" } }],
    project_files: [],
  };
});

describe("loadPortal", () => {
  it("resolves a valid token and strips unknown answer keys", async () => {
    const p = await loadPortal(TOKEN);
    expect(p?.clientName).toBe("Dentica");
    expect(p?.answers).toEqual({ q1: "Dentica" });
  });

  it("returns null for a malformed or unknown token without querying", async () => {
    expect(await loadPortal("short")).toBeNull();
    expect(await loadPortal(newToken())).toBeNull();
  });

  it("hides archived projects", async () => {
    h.tables.projects[0].status = "archived";
    expect(await loadPortal(TOKEN)).toBeNull();
  });
});

describe("saveAnswers", () => {
  it("stores the sanitised answers", async () => {
    expect(await saveAnswers(TOKEN, { q1: "New name", evil: "<script>" })).toEqual({ ok: true });
    expect(h.tables.intake_answers[0].answers).toEqual({ q1: "New name" });
  });

  it("refuses once the intake has been sent", async () => {
    h.tables.projects[0].status = "submitted";
    expect(await saveAnswers(TOKEN, { q1: "x" })).toEqual({ ok: false, reason: "locked" });
    expect(h.calls).not.toContain("upsert:intake_answers");
  });

  it("refuses when rate limited", async () => {
    h.rpcAllow = false;
    expect(await saveAnswers(TOKEN, { q1: "x" })).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("refuses an unknown token", async () => {
    expect(await saveAnswers(newToken(), { q1: "x" })).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("submitIntake", () => {
  it("saves but does not lock when required answers are missing", async () => {
    const r = await submitIntake(TOKEN, { q1: "Dentica" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason === "missing" && r.missing).toContain(32);
    expect(h.tables.projects[0].status).toBe("intake");
    expect(h.tables.intake_answers[0].answers).toEqual({ q1: "Dentica" });
  });

  it("counts uploaded files towards the logo and photo questions", async () => {
    const { "q24.none": _l, "q25.none": _p, ...noFallbacks } = REQUIRED;
    h.tables.project_files = [
      { id: "f1", kind: "logo", original_name: "logo.svg", size_bytes: 10, project_id: "p1" },
      { id: "f2", kind: "photo", original_name: "a.jpg", size_bytes: 10, project_id: "p1" },
    ];
    expect(await submitIntake(TOKEN, noFallbacks)).toEqual({ ok: true });
  });

  it("locks the project and stamps the time when complete", async () => {
    expect(await submitIntake(TOKEN, REQUIRED)).toEqual({ ok: true });
    expect(h.tables.projects[0].status).toBe("submitted");
    expect(h.tables.projects[0].intake_submitted_at).toBeTruthy();
    expect(await submitIntake(TOKEN, REQUIRED)).toEqual({ ok: false, reason: "locked" });
  });
});
