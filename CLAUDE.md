@AGENTS.md

# Unhuman Stud — Aiden Vu

Portfolio site for **Unhuman Stud**, the one-person AI film studio of Aiden Vu.
Full-stack Next.js application with a database-backed content model and an
admin CMS planned. Design language is **"Crimson Ink"** — near-black chrome so
the artwork carries all the colour.

## Commands

```bash
npm run dev      # dev server (Turbopack) → http://localhost:3000
npm run build    # production build
npm run media    # regenerate public/images + media manifest from assets-source/
npm run seed     # apply migrations and reload content into the database
npx drizzle-kit generate   # new SQL migration after editing schema.ts
npx tsc --noEmit           # typecheck
```

**Node lives at `~/.local/node`** (installed locally, not system-wide) and is on
`PATH` via `~/.zshrc`. A shell that doesn't source that profile needs
`export PATH="$HOME/.local/node/bin:$PATH"` first.

## Architecture

Strict layering — **route → service → repository → db**. Pages and Server
Actions never touch the database directly, and components never see the schema.

```
src/
  app/
    (site)/          public routes: /, /work, /work/[slug], /films,
                     /gallery, /about, /contact
    layout.tsx       fonts + global metadata
    sitemap.ts robots.ts
  server/
    db/schema.ts     Drizzle schema (14 tables)
    db/client.ts     PGlite singleton
    repositories/    data access only — no business rules
    services/        domain mapping; the only thing pages import
  components/site/   SiteHeader, VideoPlayer, GalleryGrid, ProjectCard, Reveal
  content/           media-manifest.json (generated — do not hand-edit)
  lib/utils.ts       cn(), formatDuration()
scripts/             prepare-media.ts, seed.ts
assets-source/       original Midjourney PNGs (gitignored, ~60 MB)
legacy/              the previous single-file site, kept for reference
```

### Why real routes matter here

The old site was `display:none` tab panels, so the entire portfolio lived at one
URL — nothing was linkable or indexable. Every project now has its own route,
metadata, and sitemap entry. Do not reintroduce client-side tab switching.

## Database

**PGlite** — real Postgres compiled to WASM, running in-process against
`.data/pglite`. No server to install. Because it is genuine Postgres, moving to
hosted Postgres (Neon) is a connection-string change, not a schema rewrite.

**Critical operational detail:** PGlite allows a single writer.

- Seeding while the dev server runs can **corrupt the data directory** and break
  the next build. `scripts/seed.ts` guards against this by refusing to run when
  something is serving on the dev port — do not remove that check.
- `npm run build` spawns parallel workers that each open the database, so it
  also fails while the dev server is running. Stop `dev` before building.
- If a build fails with `RuntimeError: Aborted()`, the data directory is
  corrupt: `rm -rf .data && npm run seed`.

All of this disappears when the project moves to hosted Postgres.

**Always restart the dev server after seeding** — it caches its connection.

Content lives in `scripts/seed.ts`. Editing copy today means editing that file
and reseeding — until the admin CMS lands, that is the content workflow.

### Translation readiness

Every entity with user-facing prose has a sibling `*_translations` table keyed
by `(parentId, locale)`. **v1 writes only `en`.** Adding Vietnamese is content
entry plus a locale route — no migration. Preserve this pattern when adding
tables; do not put translatable strings on the parent table.

### Derived, not stored

Home-page stats come from `countPublished()`. They must never become hardcoded
numbers again — that was the old site's bug.

## Media pipeline

`assets-source/` (masters) → `npm run media` → `public/images/` + manifest.

- **Images**: sharp resizes to 2560px max edge, mozjpeg q86, and bakes a 16px
  base64 LQIP into the manifest. Dimensions are measured, never hand-typed.
- **Videos**: re-encoded with ffmpeg (H.264 CRF 23, `+faststart`, AAC 128k).
  The originals were ~20 Mbps; the shipped files are ~2–5 Mbps. Total went
  111 MB → 26 MB. ffmpeg is not installed globally — it comes from the
  `ffmpeg-static` npm package.
- Poster frames are extracted from the videos, not authored separately.

Alt text is required and should describe what is actually in the frame. Several
were wrong on the first pass (a character model sheet described as "a frame",
three different dog breeds all called "the tan dog") — check the image before
writing the text.

## Video playback

`VideoPlayer` is a **facade**: it renders an optimised poster plus a play
button and only mounts the `<video>` element on click. A page with five films
costs five images on load, not five video streams. Keep it that way.

The `provider` column (`SELF` | `YOUTUBE` | `VIMEO` | `MUX`) means moving a film
to a streaming host later is a data change. Films are currently `SELF`, served
from `/public/videos`.

## Next.js 16 specifics

This version has breaking changes relative to older training data — see
`AGENTS.md` and `node_modules/next/dist/docs/`. The ones that bite:

- `params` and `searchParams` are **Promises**; `await` them.
- `middleware.ts` is now **`proxy.ts`**, exporting `proxy` (Node runtime only).
- `revalidateTag(tag)` needs a second cacheLife argument; `updateTag` gives
  read-your-writes inside Server Actions.
- Turbopack is default — no `--turbopack` flag.
- `next lint` is removed; run ESLint directly.
- `images.qualities` defaults to `[75]`; other values need config.
- Smooth scrolling requires `data-scroll-behavior="smooth"` on `<html>`.
- Avoid dynamic `path.resolve`/`fs` at module scope in anything the config
  imports — Turbopack traces the whole project and warns.

## Verifying visually

Chrome's headless `--window-size` does **not** set the CSS viewport, so mobile
screenshots taken that way render at desktop widths and lie. Use the CDP-based
helpers instead, which also report horizontal overflow:

```bash
node scripts/shot.mjs http://localhost:3000/ /tmp/m.png 390 1400 true
node scripts/shot-scrolled.mjs http://localhost:3000/ /tmp/d.png 1440 900
```

`shot-scrolled.mjs` walks the page first so `Reveal` elements have actually
fired — a plain full-page capture leaves everything below the fold at
`opacity: 0` and looks like a rendering bug when it isn't.

## Conventions

- Server Components by default. `"use client"` only for genuine interactivity:
  the header menu, video player, gallery lightbox, reveal animations.
- Tailwind v4 with tokens in `@theme` (`globals.css`). Use `bg-panel`,
  `text-bone-dim`, `border-line` — never raw hex in components.
- Per-project accent colours come from `projects.accentColor` and are applied
  via the `--accent` CSS variable and inline styles.
- `prefers-reduced-motion` is honoured globally; don't add animations that
  bypass it.
- `server-only` is imported in db/repository/service files to keep them off the
  client bundle.

## Content facts

- **NU** — original film. The creature is named NU: fierce, protective, loyal,
  "known for rolling massive snowballs". A full character model sheet exists
  (turnarounds, expression range, six-colour palette). Two cuts.
- **OLD FRIEND** — 1940s-era hand-painted cel animation study; a father, a
  daughter, three dogs. Public copy says "Golden Age cel animation" and
  deliberately avoids naming a studio brand the work is not affiliated with.
- **THE SHOPKEEPER** — a shiba inu running a Japanese corner tobacco shop.

All three are Aiden's own Midjourney generations (verified via embedded
`trainedAlgorithmicMedia` provenance and `Author: quocanhvu`). Titles were
chosen during this build and are easy to change in `scripts/seed.ts`.

## Still outstanding

- Admin CMS with Google OAuth + RBAC (plan Phase 3) — content is seed-file-only
  until then.
- Contact form persists nothing yet; the `inquiries` table exists and is unused.
- Social links are `#` placeholders; the résumé link is absent.
- No tests yet (Vitest + Playwright planned).
