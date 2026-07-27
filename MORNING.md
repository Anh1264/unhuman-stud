# Morning report — overnight run

Good morning. The whole backlog (tasks 1–8) is done. Everything is on the `overnight`
branch, 16 commits, working tree clean. Final check: `npm run build` exit 0,
`npm run lint` exit 0, `npm test` 52/52 passing. `main` is untouched.

## What shipped

- **Baseline + green build** — `7923c83`, `1fa839e`. Agent docs and the design-system
  file committed; build and lint verified green with no fixes needed.
- **Contact form works** — `c793713`. The form posts through a Server Action → inquiries
  service (zod validation) → repository → the `inquiries` table, with per-field errors,
  a live status region and a success state. Local only; no email is sent.
- **Tests** — `068b835`. Added vitest (`npm test`): 52 unit tests covering the inquiries
  and content services, both repositories (db client mocked, so tests never open `.data/`)
  and two component renders.
- **Accessibility + SEO** — `40b4d96`. Per-page metadata via a shared `pageMetadata()`
  builder (canonical, Open Graph, Twitter card), a skip-to-content link, one h1 per page
  with a valid heading outline, nav/footer landmarks with `aria-current`, and
  `prefers-reduced-motion` coverage.
- **Real project content** — `95b4a1b`. Seeded STILLNESS / Tĩnh Lặng, GIÁP, WAKAN AI
  (including "Intent") and boop. with your copy. Reseeded; all four project routes
  prerender.
- **Print résumé** — `17baa75`. `/about` prints as a clean one-page A4 résumé in black on
  white; site chrome is hidden in print.
- **Route states** — `e433ec9`. Branded `not-found`, `error`, `global-error` and `loading`
  for the app router.
- **Token reconciliation** — `b64936e`. Checked `globals.css` against
  `design/design-system.md` and fixed the drift: real Fraunces italic instead of a
  synthetic slant, 1140px container, corrected letter-spacing and a section-title clamp.

## How to preview

    source ~/.zshrc && npm run dev     # http://localhost:3000

The database is already seeded. Only run `npm run seed` if you need to reload content, and
restart `dev` afterwards — the DB allows one writer at a time.

## Blocked — needs you

1. **Real media for the four new projects.** All four have `cover: null` and empty
   gallery/films, marked `// SWAP` in `scripts/seed.ts`: STILLNESS needs a key visual plus
   cave/surrender frames and the cut; GIÁP needs a key visual, four chapter stills, the
   4-minute cut and the teaser; WAKAN AI needs the campaign visual, editorial frames and
   the "Intent" lookbook; boop. needs a key visual, interior frames and the journey-map art.
2. **Real social URLs** — `SOCIALS` entries are all `#` — and a résumé PDF.
3. **Production Postgres/Neon + deploy**, Google sign-in for the admin CMS, custom domain.
4. **Machine issue:** `/usr/bin/git` is blocked — `xcode-select` points at Xcode.app and its
   licence is unaccepted. Fix once with `sudo xcodebuild -license`. Overnight work went
   through `export DEVELOPER_DIR=/Library/Developer/CommandLineTools`.
5. **Note:** the four new projects sort after the three that already have artwork
   (sortOrder 4–7). Reorder them in the seed once real media lands.

## Next step

Review the branch, then from `main`: `git merge overnight` if you're happy with it.
