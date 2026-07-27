import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests only — no dev server, no PGlite. The `.data/` database is never
 * opened: every test that would reach the database mocks `@/server/db/client`
 * (repositories) or the repository module itself (services).
 *
 * `server-only` is aliased to a stub because the real package throws outside a
 * React Server Component graph; production code keeps its import untouched.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // One worker, no watcher: keeps memory small and the run deterministic.
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
