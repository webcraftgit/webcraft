import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests only, run in Node. The suites cover the pure security + consent
 * logic in lib/ — no DOM, no Next runtime needed.
 *
 * `server-only` is aliased to an empty stub: the real package throws when
 * imported outside a React Server Component bundle, so files that guard
 * themselves with `import "server-only"` (e.g. lib/security/hash.ts) could not
 * otherwise be imported by a plain Node test.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
});
