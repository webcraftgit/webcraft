import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests only, run in Node. The suites cover the pure security + consent
 * logic in lib/, the Postgres-backed rate limiter, and the admin auth gate.
 *
 * Aliases:
 *  - `server-only` → an empty stub. The real package throws when imported
 *    outside a React Server Component bundle, so files guarded with
 *    `import "server-only"` could not otherwise be imported by a Node test.
 *  - `@` → the project root, mirroring the tsconfig `@/*` path so tests can
 *    import modules the same way the app does.
 */
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/[/\\]$/, "");

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: [
      { find: "server-only", replacement: `${root}/test/server-only-stub.ts` },
      { find: /^@\/(.*)$/, replacement: `${root}/$1` },
    ],
  },
});
