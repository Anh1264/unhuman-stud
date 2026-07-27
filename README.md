# Unhuman Stud

Portfolio site for **Unhuman Stud** — the one-person AI film studio of Aiden Vu.

Next.js 16 · TypeScript · Drizzle ORM · Postgres (PGlite) · Tailwind v4

---

## Getting started

Node.js is installed at `~/.local/node` and added to your `PATH` in `~/.zshrc`.
Open a new terminal (or run `source ~/.zshrc`), then:

```bash
npm install
npm run media   # build web images from assets-source/
npm run seed    # create the database and load content
npm run dev     # http://localhost:3000
```

## Everyday tasks

| I want to… | Do this |
| --- | --- |
| Change a project title, tagline or description | Edit `scripts/seed.ts`, run `npm run seed`, **restart `npm run dev`** |
| Add new images | Drop files in `assets-source/`, add an entry to `SOURCES` in `scripts/prepare-media.ts`, run `npm run media` then `npm run seed` |
| Add a new video | Encode it (see below), put it in `public/videos/`, add a film entry in `scripts/seed.ts` |
| Change colours or type | `src/app/globals.css` |
| Change page layout | `src/app/(site)/` |

> **Restart the dev server after `npm run seed`.** The database allows one
> writer at a time; the running server holds a handle and will keep serving the
> old content until it restarts.

## Encoding a new video

ffmpeg comes from the `ffmpeg-static` npm package rather than a system install:

```bash
FF=$(node -e "console.log(require('ffmpeg-static'))")

# web-ready encode
"$FF" -i input.mp4 -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
      -movflags +faststart -c:a aac -b:a 128k public/videos/name.mp4

# poster frame at 3 seconds
"$FF" -ss 3 -i input.mp4 -frames:v 1 -q:v 3 public/images/name-poster.jpg
```

CRF 23 is the quality knob — lower is better and larger, higher is smaller and
softer. `+faststart` lets playback begin before the file finishes downloading.

## Project layout

```
src/app/(site)/     public pages
src/server/         db schema, repositories, services
src/components/     UI components
scripts/            media pipeline + database seed
assets-source/      original masters (not in git — back these up separately)
public/             shipped images and videos
legacy/             the previous single-file site
drizzle/            SQL migrations
```

Data flows **route → service → repository → database**. Pages never query the
database directly, which is what lets the storage layer change without touching
the UI.

## Deploying

The database is currently embedded (PGlite, `.data/`), which suits local
development but not a serverless host. To go live:

1. Create a Postgres database (Neon has a free tier).
2. Point `src/server/db/client.ts` at it — the schema is already standard
   Postgres, so no migration rewriting is needed.
3. Set `NEXT_PUBLIC_SITE_URL` to the real domain so metadata, Open Graph tags
   and `sitemap.xml` use absolute URLs.
4. Deploy to Vercel and run migrations in CI.

## Not built yet

- Admin CMS (Google sign-in, edit content without touching code)
- Working contact form — the `inquiries` table exists but nothing writes to it
- Real social links and a résumé download
- Tests
