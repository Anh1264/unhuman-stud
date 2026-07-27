# CLAUDE.md — Unhuman Stud

Read this first, together with `README.md` and `AGENTS.md`, every session.

## What this is
Portfolio + résumé website for **Unhuman Stud** — Aiden Vu's one-person cinematic
AI studio. It doubles as an art showcase and an online résumé.

## Stack — this is a real app, not a static file
**Next.js 16 · TypeScript · Drizzle ORM · Postgres (PGlite, embedded in `.data/`) · Tailwind v4.**
- `AGENTS.md` is correct: **Next.js 16 has breaking changes vs. your training data.**
  Before using an unfamiliar Next API, read the relevant guide in
  `node_modules/next/dist/docs/`. Do not write Next code from memory.
- **Architecture: route → service → repository → database.** Pages never query the DB
  directly: `src/app/(site)/` → `src/server/services/` → `src/server/repositories/` →
  `src/server/db/`. Keep this layering.
- Content lives in the DB, seeded from `scripts/seed.ts`. Images come through the
  pipeline in `scripts/prepare-media.ts` (`content/media-manifest.json`).
- Design tokens live in `src/app/globals.css`; the brand source of truth is
  `design/design-system.md`. Keep them in sync.
- The old single-file site is archived in `legacy/` — reference only. Never ship it
  or revert to it.

## Commands (Node is at `~/.local/node`; run `source ~/.zshrc` first in a new shell)
- `npm run dev` (http://localhost:3000) · `npm run build` · `npm run lint`
- `npm run seed` — loads content into the DB, then **restart `dev`**.
- `npm run media` — build web images from `assets-source/`.
- The DB allows **one writer at a time**: don't `seed` while a `dev` server holds it;
  restart `dev` after seeding. Prefer `build`/`lint`/tests for verification.

## Design language — "Crimson Ink"
Dark editorial: cream serif (Fraunces) with italic-crimson emphasis on near-black,
one crimson accent, a gold highlight, Inter body, Space Mono labels. **Never add
ink/paint/blob artwork or "bleed" effects** — the owner rejected them. Values in
`design/design-system.md`; the implementation is `src/app/globals.css`.

## Rules
1. Respect the route→service→repository→db layering; pages don't touch the DB.
2. Read `node_modules/next/dist/docs/` before using unfamiliar Next 16 APIs.
3. Use only the Crimson Ink tokens; no new colors/fonts; no ink/bleed/blobs.
4. Keep everything accessible and responsive.
5. Anything that needs the owner — real images/videos, social URLs, a résumé PDF, a
   production Postgres (Neon) key, Google sign-in — is **blocked**. Don't fake it; log and skip.
6. `legacy/` is archive only. Never commit `.data/`, `node_modules/`, or `assets-source/` masters.

## How work runs (multi-agent)
- **orchestrator** (`.claude/agents/orchestrator.md`, `fable`) — plans, delegates, reviews.
- **builder** (`.claude/agents/builder.md`, `opus`) — implements one scoped task, reports back.
- Skills: **opus-5-prompter** (writing builder tasks), **fable-5-prompter** (running lean/overnight).
