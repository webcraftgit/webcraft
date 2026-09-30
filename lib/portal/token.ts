import { randomBytes } from "node:crypto";

/**
 * The secret in a client's portal link (/portal/<token>).
 *
 * 32 random bytes → 43 base64url chars → 256 bits. Guessing one is not a
 * realistic attack, so the link itself is the credential, the same way a
 * shared Figma or Google Docs link is. What keeps that safe in practice:
 *   * the portal sends no Referer (see next.config.mjs), so the link never
 *     leaks to a site the client clicks through to;
 *   * /portal is noindex and disallowed in robots.txt;
 *   * admin can replace the token at any time, which kills the old link.
 */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const newToken = (): string => randomBytes(32).toString("base64url");

/** Shape check before any database round trip: junk never reaches Postgres. */
export const isToken = (v: unknown): v is string => typeof v === "string" && TOKEN_RE.test(v);
