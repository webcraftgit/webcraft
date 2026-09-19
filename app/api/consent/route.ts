import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, hashIp } from "@/lib/security/hash";
import { uuid, str, MAX } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/consent — the Art. 7(1) receipt.
 *
 * GDPR says the controller must be able to DEMONSTRATE that consent was given.
 * A cookie in the visitor's browser proves nothing (they can edit it; it can be
 * cleared), so we keep an independent, append-only record of the decision:
 * which version of the policy, granted or refused, when, and a coarse ip_hash +
 * UA to tie the receipt to a request without identifying anyone.
 *
 * Refusals are logged too. A log that only contains "yes" is not a consent
 * record, it's a marketing report.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 2048) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return new NextResponse(null, { status: 204 }); }

  const consent_id = uuid(body.consent_id);
  const analytics = body.analytics;
  const policy_version = str(body.policy_version, 32);
  if (!consent_id || typeof analytics !== "boolean" || !policy_version) {
    return new NextResponse(null, { status: 204 });
  }

  const db = supabaseAdmin();
  if (!db) return new NextResponse(null, { status: 204 });

  const ip = hashIp(clientIp(req)) ?? "unknown";
  if (!(await rateLimit(db, `consent:ip:${ip}`, 20, 3600))) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await db.from("consent_log").insert({
    consent_id,
    analytics,
    policy_version,
    ip_hash: ip === "unknown" ? null : ip,
    user_agent: str(req.headers.get("user-agent"), MAX.ua) || null,
  });
  if (error) console.error("[consent] insert failed", error.code);

  return new NextResponse(null, { status: 204 });
}
