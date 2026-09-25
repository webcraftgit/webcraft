import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, hashIp } from "@/lib/security/hash";
import {
  TIERS, READINESS, BUDGETS, LOCALES, MAX,
  oneOf, uuid, str, email, host, utm,
} from "@/lib/security/validation";

export const runtime = "nodejs";        // node:crypto for the HMAC
export const dynamic = "force-dynamic"; // never cached, never prerendered

/**
 * POST /api/contact (CP6-backend — hardened).
 *
 * Order of operations is the security design, not an accident:
 *   1. Size cap BEFORE parsing  — a 40MB JSON body must not reach JSON.parse.
 *   2. Origin check             — cheap CSRF gate; this route is same-origin only.
 *   3. Honeypot                 — answers 200 so the bot marks it delivered and leaves.
 *   4. Rate limit               — per-IP-hash and global; fails CLOSED.
 *   5. Validate                 — allow-lists; anything unknown becomes null.
 *   6. Insert                   — service role; RLS keeps everyone else out.
 *
 * Attribution columns are only populated when the request carries analytics
 * consent. Without it, an inquiry is a name, an email and a message: exactly
 * what the person chose to hand over, nothing inferred behind their back.
 *
 * Env missing → 503 + { fallback:true } → the form shows a mailto.
 * We never fake a success.
 */

const MAX_BODY = 16 * 1024; // 16KB; the form's own limits sum to ~4.5KB

/**
 * Same-origin CSRF gate, tolerant of the www/apex split.
 *
 * A visitor on https://www.example.com and one on https://example.com are on
 * the same site, but their Origin headers differ by four characters. A strict
 * `origin !== site` string compare would 403 every real submission from
 * whichever host isn't the one set in NEXT_PUBLIC_SITE_URL. We compare
 * scheme + host + port, ignoring a leading "www.", so both hosts pass while a
 * genuinely different site is still rejected. Unparseable input falls back to
 * an exact match — fail closed, never open.
 */
function sameSite(origin: string, site: string): boolean {
  try {
    const a = new URL(origin);
    const b = new URL(site);
    const strip = (h: string) => h.replace(/^www\./, "");
    return (
      a.protocol === b.protocol && strip(a.host) === strip(b.host)
    );
  } catch {
    return origin === site;
  }
}

export async function POST(req: Request) {
  // 1. body size — Content-Length can lie, so re-check after reading
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  // 2. same-origin only. Browsers always send Origin on cross-site POSTs.
  //    www.example.com and example.com count as the same site (see sameSite).
  const origin = req.headers.get("origin");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin && site && !sameSite(origin, site)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // 3. honeypot — humans never see the field. Lie to the bot.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, fallback: true }, { status: 503 });

  // 4. rate limit. Two buckets: one stops a single sender hammering us, the
  //    other caps the blast radius of a distributed flood on our inbox.
  const ip = hashIp(clientIp(req)) ?? "unknown";
  const perIp = await rateLimit(db, `contact:ip:${ip}`, 5, 3600);      // 5/hour
  const global = await rateLimit(db, "contact:global", 100, 3600);     // 100/hour
  if (!perIp || !global) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // 5. validate
  const name = str(body.name, MAX.name);
  const mail = email(body.email);
  const message = str(body.message, MAX.message);

  if (!name || !mail || message.length < 10) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const consented = body.analytics_consent === true;

  const row = {
    name,
    email: mail,
    message,
    tier: oneOf(body.tier, TIERS),
    content_readiness: oneOf(body.content_readiness, READINESS),
    budget: oneOf(body.budget, BUDGETS),
    locale: oneOf(body.locale, LOCALES),
    status: "new" as const,

    // attribution: consent-gated, every field independently validated
    visitor_id: consented ? uuid(body.visitor_id) : null,
    session_id: consented ? uuid(body.session_id) : null,
    referrer_host: consented ? host(body.referrer) : null,
    utm_source: consented ? utm(body.utm_source) : null,
    utm_medium: consented ? utm(body.utm_medium) : null,
    utm_campaign: consented ? utm(body.utm_campaign) : null,

    // security metadata, always — legitimate interest in preventing abuse
    ip_hash: ip === "unknown" ? null : ip,
    user_agent: str(req.headers.get("user-agent"), MAX.ua) || null,
  };

  // 6. insert
  const { error } = await db.from("inquiries").insert(row);
  if (error) {
    // log the code, never the row — the row is someone's personal data
    console.error("[contact] insert failed", error.code, error.message);
    return NextResponse.json({ ok: false, error: "storage" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
