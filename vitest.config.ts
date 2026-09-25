import { defineConfig } from "vitest/config";

/**
 * Unit tests only, run in Node. The suites we care about first are the pure
 * security validators in lib/security — no DOM, no Next runtime needed.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
