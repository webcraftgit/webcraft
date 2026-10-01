import "server-only";
import { headers } from "next/headers";
import { SITE_URL, SITE_URL_IS_PLACEHOLDER } from "@/lib/site";

/**
 * Origin for the client portal links shown in admin.
 *
 * SITE_URL is right once the real domain is configured. Until then it is a
 * sentinel (https://example.invalid) or localhost, and a link built from it
 * would be dead on arrival. In that case use the host admin is being viewed
 * on: whoever copies the link is on a working deployment of this site.
 * Admin-only, so a spoofed Host header can only mislead the admin themself.
 */
export async function portalOrigin(): Promise<string> {
  if (!SITE_URL_IS_PLACEHOLDER) return SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return SITE_URL;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto === "http" ? "http" : "https"}://${host}`;
}

/**
 * Origin for links in emails sent without an admin request behind them (the
 * client's own actions, the daily reminder job). Never trusts a Host header.
 * Until the real domain is set, Vercel's production URL stands in for it.
 */
export function publicOrigin(): string {
  if (!SITE_URL_IS_PLACEHOLDER) return SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : SITE_URL;
}
