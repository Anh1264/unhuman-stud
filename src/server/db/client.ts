import "server-only";

import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * PGlite is a real Postgres compiled to WASM that runs in-process against a
 * local data directory — no server to install or run. Because it speaks actual
 * Postgres, the schema and queries here are the same ones that will run against
 * a hosted Postgres (Neon) in production: switching is a connection change, not
 * a rewrite.
 *
 * The instance is cached on globalThis so Turbopack's hot-reload doesn't open a
 * second handle on the same data directory and deadlock.
 */

/**
 * Kept as a static literal rather than a computed path: a dynamic
 * path.resolve() here makes Turbopack trace the entire project into the build
 * output. The parent directory is created eagerly because PGlite does not
 * create intermediate directories for its data dir.
 */
const DATA_DIR = ".data/pglite";
const DATA_PARENT = ".data";

type DbClient = ReturnType<typeof createClient>;

function createClient() {
  mkdirSync(DATA_PARENT, { recursive: true });
  const pg = new PGlite(DATA_DIR);
  return drizzle(pg, { schema });
}

const globalForDb = globalThis as unknown as {
  __unhumanDb?: DbClient;
};

export const db: DbClient = globalForDb.__unhumanDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__unhumanDb = db;
}

export { schema };
