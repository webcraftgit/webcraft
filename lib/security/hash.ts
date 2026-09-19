import "server-only";
import { createHmac } from "node:crypto";

/**
 * Salted, DAILY-ROTATING HMAC of the client IP.
 *
 * We never store a raw IP. We do need *something* stable to rate-limit on and
 * to spot a flood of inquiries from one source. An HMAC keyed with a server
 * secret is not reversible by anyone who steals the database, and mixing the
 * UTC date into the message means yesterday's hash and today's hash for the
 * same person don't match — so the value stops being a tracking identifier
 * after 24h. That is what makes it "abuse control" rather than "personal data
 * we quietly kept".
 */
export function hashIp(ip: string | null): string | null {
  const secret = process.env.IP_HASH_SECRET;
  if (!ip || !secret) return null;
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  return createHmac("sha256", secret).update(`${day}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Trust order matters — read a header the client can spoof and the rate
 * limiter becomes a no-op. We prefer the header the *platform* stamps from the
 * real TCP connection, which a client cannot override:
 *
 *   1. x-nf-client-connection-ip — Netlify sets this from the edge connection.
 *      It is a single IP (never a list) and is not client-controllable.
 *   2. x-forwarded-for (left-most) — the platform-trusted client on Vercel and
 *      most reverse proxies. Only consulted when the Netlify header is absent,
 *      so on Netlify a spoofed XFF is ignored entirely.
 *   3. x-real-ip — last-resort fallback (some local/proxy setups).
 *
 * Each candidate is validated as an IP literal; anything else is discarded so a
 * junk header can't become a rate-limit bucket key.
 */
export function clientIp(req: Request): string | null {
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (isIp(nf)) return nf;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim() ?? "";
    if (isIp(first)) return first;
  }

  const real = req.headers.get("x-real-ip")?.trim() ?? null;
  return isIp(real) ? real : null;
}

/** Accept only IPv4 / IPv6 literals; reject empty, hostnames, and junk. */
function isIp(value: string | null): value is string {
  if (!value) return false;
  // IPv4: four 0-255 octets.
  const v4 =
    /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(value);
  if (v4) return true;
  // IPv6: hex groups and/or "::" compression, optionally zone/embedded v4.
  return /^[0-9a-fA-F:]+(:\d{1,3}(\.\d{1,3}){3})?$/.test(value) && value.includes(":");
}
