import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Postgres-backed rate limiter. In-memory counters are useless on serverless:
 * every cold start gets a fresh Map, so an attacker just needs concurrency.
 * check_rate_limit() does the check-and-increment inside one transaction with
 * `for update`, so it holds under parallel lambdas.
 *
 * Fails CLOSED. If the database is unreachable we deny the write rather than
 * wave everything through — the form falls back to mailto, which is a fine
 * outcome, whereas an open flood is not.
 */
export async function rateLimit(
  db: SupabaseClient,
  bucket: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] rpc failed", error.message);
    return false;
  }
  return data === true;
}
