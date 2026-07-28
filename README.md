# Unhuman Stud

Portfolio site for **Unhuman Stud** — the one-person AI film studio of Aiden Vu.

**Live at <https://unhuman-stud.vercel.app>**

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

## Deploying — static export

The site is live at **<https://unhuman-stud.vercel.app>**, hosted on Vercel and
wired to the GitHub repository. **Publishing a change is one step:**

```bash
git push origin main     # Vercel rebuilds and goes live in a minute or two
```

There is nothing to click and no upload — every push to `main` triggers a fresh
build. Watch it at <https://vercel.com> → the `unhuman-stud` project.

The site ships as a **static export**: `next build` renders every route to plain
HTML in `out/`, reading the content out of the local PGlite database *at build
time*. Nothing needs a database or a Node server in production, which is what
makes free hosting possible.

```bash
npm run seed     # content into the database
npm run build    # → out/  (index.html, work/nu.html, sitemap.xml, …)
```

Two settings make this work, both in `next.config.ts`: `output: "export"` and
`images.unoptimized`. Static export cannot run server-only features, so the
response headers that used to live in `next.config.ts` now live in
`vercel.json`, and dynamic routes are pinned with `dynamicParams = false`.

On Vercel, use the `vercel-build` script (`package.json`) — it seeds the
database before building, because `.data/` is deliberately not in git.

### If you get a custom domain

The site's address is a single line near the top of `src/lib/site-metadata.ts`:

```ts
const PRODUCTION_SITE_URL = "https://unhuman-stud.vercel.app";
```

That value is what canonical links, the Open Graph / Twitter share cards,
`sitemap.xml` and `robots.txt` all point at. To move to your own domain, add it
in Vercel (Project → Settings → Domains), then edit that one line — scheme
included, **no trailing slash** — and push:

```ts
const PRODUCTION_SITE_URL = "https://unhumanstud.com";
```

`npm run dev` keeps using `http://localhost:3000` on its own, so local pages
never advertise the live address. If you ever need to override the URL for a
single build without editing code, set `NEXT_PUBLIC_SITE_URL` in Vercel
(Project → Settings → Environment Variables) — it wins over both.

`.vercelignore` keeps `.data/`, `assets-source/`, `node_modules/` and the 402 MB
4K master (`public/videos/nu-ceasefire.mp4`) out of every upload. The 84 MB
`public/videos/nu-ceasefire-1080.mp4` **is** deployed — it is the encode the NU
page plays.

> Note: a local `out/` also contains the 4K master, because it sits in
> `public/`. Only builds that respect `.vercelignore` drop it.

## Re-enabling the contact form

The contact page used to post a project brief to a Server Action, which stored
it in the `inquiries` table. Static export cannot run Server Actions, so the
page now opens the visitor's mail client with the same questions pre-written
into the email body. No data is lost and nothing is faked.

Everything below the form is still here and still tested: the `inquiries`
table (`src/server/db/schema.ts`), `src/server/repositories/inquiries.repo.ts`,
`src/server/services/inquiries.service.ts` and the shared form shape in
`src/lib/contact-form.ts`.

To bring the real form back you need three things:

1. **A hosted Postgres.** Create one (Neon has a free tier) and point
   `src/server/db/client.ts` at it. The schema is standard Postgres, so the
   existing migrations in `drizzle/` apply unchanged.
2. **A non-static build.** Remove `output: "export"` from `next.config.ts` and
   move the headers back out of `vercel.json`. The site then deploys as a
   normal Next.js app rather than a folder of HTML.
3. **The two deleted files.** `src/app/(site)/contact/actions.ts` (the
   `"use server"` adapter) and `src/components/site/ContactForm.tsx` (the form
   itself). Both are in git history — recover them with
   `git log --diff-filter=D -- src/components/site/ContactForm.tsx`, then render
   `<ContactForm />` in place of the mailto panel on the contact page.

## Not built yet

- Admin CMS (Google sign-in, edit content without touching code) — the
  `inquiries` table exists, but nothing reads or writes it right now
- Real social links and a résumé download
