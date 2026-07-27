# OVERNIGHT.md — autonomous mode for Unhuman Stud (Next.js app)

Read this with `CLAUDE.md`, `README.md`, and `AGENTS.md` before starting. This is the
plan and the safety net for running unattended (permissions bypassed). The project is
a **Next.js 16 + Drizzle + PGlite** app — not a static file.

## Your safety net is git, not permissions
- Work on a branch: `git checkout -b overnight` (create if missing). Commit after every
  completed task with a short message. The morning, the user reviews and can
  `git checkout main` to erase the whole night.
- Never commit `.data/`, `node_modules/`, or `assets-source/` (respect `.gitignore`).

## Hard prohibitions
- Never leave the `unhuman-stud` folder. Never `git push` / touch a remote / force-push.
- Never `rm -rf`, never delete outside the project, never touch `legacy/` or `assets-source/`.
- Never change machine/system settings or shell profiles.
- Never change the design or add ink/bleed/blob graphics. Use only the tokens.
- Never invent secrets or fake a production database, keys, or real media/URLs.
- Keep the route→service→repository→db layering. Read `node_modules/next/dist/docs/`
  before using unfamiliar Next 16 APIs — don't code Next from memory.

## Environment (Node already installed)
Node is at `~/.local/node` (on PATH via `~/.zshrc`). In a fresh shell run
`source ~/.zshrc` first. If `node_modules` is incomplete, run `npm install`. You may
install dev-only npm packages needed for the tasks below (e.g. a test runner); log each.
Don't install system software or use sudo.

## Verification (avoid the DB single-writer trap)
Verify with `npm run build` and `npm run lint` — they don't hold the DB. Only run
`npm run seed` when no `dev` server is running, and restart `dev` afterward. Don't leave
a long-lived `dev` server running while doing DB work.

## Token discipline (orchestrator is the costly seat)
- Orchestrator runs at **medium effort**, thinks and delegates, writes almost nothing.
- The **builder** writes all code AND appends its own one-line `WORKLOG.md` entry per
  task (`- [<short-sha>] <what changed>`) and makes the commit. No long logs. Don't
  regenerate this file.

## Autonomous rules
- Don't ask permission for reversible work — do it and commit.
- Report only work you can point to a diff/commit/command-output for. No fabricated status.
- If a task needs the owner (see "Blocked" below), skip it, log it, move on.
- End only when the backlog is done or everything left is blocked. Then write `MORNING.md`.
  Don't invent work beyond the backlog.

## Backlog — in order (safe, local, no external keys)
1. **Branch + baseline**: `git checkout -b overnight`, commit current state. Then get it
   green: `npm install` if needed, `npm run build` and `npm run lint` must pass — fix any
   breakage first (consult the Next 16 docs for API surprises).
2. **Working contact form (local)**: the `inquiries` table already exists. Wire the
   contact page form → a server action/route → a repository insert → DB, validated with
   `zod`, with success/error states. Local only — no email, no external service.
3. **Tests**: add a test runner (vitest), write unit tests for the services and
   repositories and a couple of component render tests. Make them pass.
4. **Accessibility + SEO pass** across all routes: correct `metadata` per page
   (title/description/OpenGraph, using the `NEXT_PUBLIC_SITE_URL` fallback), alt text from
   the media manifest, `aria-label`s, `:focus-visible`, `prefers-reduced-motion`, semantic
   landmarks, and a skip-to-content link.
5. **Content completeness** in `scripts/seed.ts` using the real projects — STILLNESS /
   Tĩnh Lặng, GIÁP, WAKAN AI (incl. "Intent"), boop. — with real copy; leave placeholders
   only where an actual asset is required. Run `seed`, restart, verify pages render.
6. **Print / résumé stylesheet**: the About/Creator page prints as a clean one-page résumé.
7. **`not-found`, `error`, and `loading`** states on brand for the app router.
8. **Token reconciliation**: confirm `src/app/globals.css` matches `design/design-system.md`.

When 1–8 are done or blocked, stop and write `MORNING.md`. That's a full, safe night.

## Blocked — needs Aiden (log these, don't attempt)
Real images/videos into `assets-source/`; real social links; a résumé PDF; a production
Postgres/Neon database + deploy; Google sign-in for the admin CMS; a custom domain.

## MORNING.md (write at the end)
Outcome first, plain sentences. What shipped (with commit shas), what's on the `overnight`
branch, how to preview (`source ~/.zshrc && npm run dev`), then the "Blocked — needs Aiden"
list. Tell them to review, then `git merge overnight` if happy.
