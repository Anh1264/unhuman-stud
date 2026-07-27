/**
 * Stand-in for the `server-only` marker package. The real module throws when it
 * is loaded outside a Server Component graph, which is exactly what a unit test
 * is — so tests resolve this empty module instead (see `vitest.config.ts`).
 */
export {};
