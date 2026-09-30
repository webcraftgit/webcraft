// Creates a throwaway portal project and prints its link. For local testing
// until the admin "Projects" screen exists (docs/PORTAL_PLAN.md, step 7).
//
//   node --env-file=.env.local scripts/portal-test-project.mjs ["Client name"] [launch|business|signature] [pl|en]
//
// Uses the service role, so run it only on your own machine.
import { randomBytes } from "node:crypto";

const [name = "Test client", pkg = "business", locale = "pl"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local).");
  process.exit(1);
}

const token = randomBytes(32).toString("base64url");
const res = await fetch(`${url}/rest/v1/projects`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({
    client_name: name, package: pkg, locale,
    access_token: token, token_created_at: new Date().toISOString(),
    admin_notes: "Created by scripts/portal-test-project.mjs",
  }),
});
if (!res.ok) {
  console.error("Insert failed:", res.status, await res.text());
  process.exit(1);
}
console.log(`http://localhost:3000/portal/${token}`);
