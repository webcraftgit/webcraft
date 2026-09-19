import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, hashIp } from "@/lib/security/hash";
import { parseConsent, CONSENT_COOKIE } from "@/lib/analytics/consent";
import {
  EVENT_NAMES, LOCALES, DEVICES, MAX,
  oneOf, uuid, str, int, host, utm,
} from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/events — analytics ingest (CP6-backend).
 *
 * The client is not trusted to say "I have consent". We re-read the consent
 * COOKIE server-side and drop the batch if analytics isn't granted. A tampered
 * client, or a replayed beacon from a session where consent was withdrawn,
 * writes nothing.
 *
 * Everything else is shape enforcement: event names come from a fixed set,
 * props are clamped to scalars, the referrer is reduced to a hostname, and the
 * country comes from the EDGE header — never from the payload, which the
 * client could forge.
 *
 * Always answers 204. An analytics endpoint that reports its own failures
 * gives an attacker a free oracle, and the visitor doesn't care either way.
 */

const MAX_BODY = 32 * 1024;
const MAX_EVENTS = 40;
const noContent = () => new NextResponse(null, { status: 204 });

type Incoming = { name: unknown; props?: unknown };

/** props: scalars only, ≤6 keys, short. Stops jsonb from becoming a payload store. */
function cleanProps(input: unknown): Record<string, string | number> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>).slice(0, 6)) {
    const key = str(k, 32);
    if (!key) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "string") { const s = str(v, 64); if (s) out[key] = s; }
  }
  return out;
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return noContent();

  // server-side consent gate — the client's word is not evidence
  const cookie = req.headers.get("cookie") ?? "";
  const value = cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.split("=").slice(1).join("=");
  if (!parseConsent(value)?.analytics) return noContent();

  let body: Record<string, unknown>;
  try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return noContent(); }

  const visitor_id = uuid(body.visitor_id);
  const session_id = uuid(body.session_id);
  if (!visitor_id || !session_id) return noContent();

  const db = supabaseAdmin();
  if (!db) return noContent();

  const ip = hashIp(clientIp(req)) ?? "unknown";
  if (!(await rateLimit(db, `events:ip:${ip}`, 240, 3600))) return noContent();

  const incoming = Array.isArray(body.events) ? (body.events as Incoming[]).slice(0, MAX_EVENTS) : [];

  const base = {
    visitor_id,
    session_id,
    path: str(body.path, MAX.path) || null,
    locale: oneOf(body.locale, LOCALES),
    device: oneOf(body.device, DEVICES),
    viewport_w: int(body.viewport_w, 0, 20000),
    viewport_h: int(body.viewport_h, 0, 20000),
    referrer_host: host(body.referrer),
    utm_source: utm(body.utm_source),
    utm_medium: utm(body.utm_medium),
    utm_campaign: utm(body.utm_campaign),
    // set by the edge, not by the browser. Country only — never a city.
    country: str(req.headers.get("x-vercel-ip-country"), 2).toUpperCase() || null,
  };

  const rows = incoming
    .map((e) => {
      const name = oneOf(e.name, EVENT_NAMES);
      return name ? { ...base, name, props: cleanProps(e.props) } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return noContent();

  const { error } = await db.from("events").insert(rows);
  if (error) console.error("[events] insert failed", error.code);

  return noContent();
}
