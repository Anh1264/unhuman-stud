/**
 * Database seed.
 *
 * Applies migrations to the PGlite data directory, then loads the studio's
 * content. Image metadata is read from the media manifest produced by
 * `npm run media`, so widths, heights and blur placeholders are measured
 * values rather than hand-typed guesses.
 *
 * Idempotent: it truncates the content tables before inserting.
 *
 * Run: npm run seed
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { readFile, mkdir } from "node:fs/promises";
import { createConnection } from "node:net";
import path from "node:path";
import { sql } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import type { MediaEntry } from "./prepare-media";

const ROOT = process.cwd();
const DATA_DIR = process.env.PGLITE_DATA_DIR ?? ".data/pglite";
const L = schema.DEFAULT_LOCALE;

/* ------------------------------------------------------------------
   Content
   ------------------------------------------------------------------ */

type FilmSeed = {
  slug: string;
  video: string; // path under /public
  poster: string; // manifest name
  kind: "FEATURE" | "SHORT";
  durationSeconds: number;
  width: number;
  height: number;
  featured: boolean;
  sortOrder: number;
  title: string;
  description: string;
};

type ProjectSeed = {
  slug: string;
  kind: (typeof schema.projectKind.enumValues)[number];
  year: number;
  featured: boolean;
  sortOrder: number;
  accentColor: string;
  /**
   * Manifest name of the cover image, or `null` when the artwork for a project
   * has not been delivered yet. A null cover is a deliberate, visible gap —
   * never a stand-in image borrowed from another project.
   */
  cover: string | null;
  title: string;
  /** Secondary title, e.g. the Vietnamese title shown beside the English one. */
  titleAlt?: string;
  tagline: string;
  summary: string;
  body: string;
  tags: string[];
  gallery: string[];
  films: FilmSeed[];
};

const PROJECTS: ProjectSeed[] = [
  {
    slug: "nu",
    kind: "ORIGINAL_FILM",
    year: 2026,
    featured: true,
    sortOrder: 1,
    accentColor: "#7C8CE8",
    cover: "nu-willump",
    title: "NU",
    tagline: "A giant, a snowball, and a city that never looks up.",
    summary:
      "NU is fierce, protective, loyal, and known for rolling massive snowballs. The city below has no idea.",
    body: "NU began as a scale problem. A creature is only as big as the thing you put next to it — so the film puts a city there, and then rolls something at it.\n\nThe design work came first: a full character model sheet fixing NU's silhouette, four turnarounds, an expression range, and a six-colour palette. Locking that early is what lets the creature stay recognisably itself from a wide mountain shot down to a face in close-up.\n\nThe look is painterly matte work — flat indigo fur against packed snow, a hard horizon line, a skyline that stays hazy and indifferent in the distance. Every frame keeps two readings alive at once: the creature as a threat, and the creature as a child who has simply made the largest snowball anyone has ever made.",
    tags: ["Original Film", "Creature Design", "Painterly"],
    gallery: ["nu-willump", "nu-still", "nu-monster-face", "nu-snowball", "nu-snow"],
    films: [
      {
        slug: "nu-first-cut",
        video: "/videos/nu-original.mp4",
        poster: "nu-original-poster",
        kind: "SHORT",
        durationSeconds: 15,
        width: 1280,
        height: 720,
        featured: true,
        sortOrder: 1,
        title: "NU — First Cut",
        description: "The earlier assembly, before the final grade and sound pass.",
      },
    ],
  },
  {
    slug: "a-new-pet",
    kind: "ORIGINAL_FILM",
    year: 2026,
    featured: true,
    sortOrder: 2,
    accentColor: "#E0A46B",
    cover: "pet-dog-1",
    title: "A NEW PET",
    tagline: "Golden Age cel animation, rebuilt frame by frame.",
    summary:
      "A daughter makes her case for a dog. Her father is not saying yes yet — built in the vocabulary of 1940s hand-painted cel animation.",
    body: "A NEW PET is a character piece built inside a narrow and unforgiving vocabulary: tinted ink outlines instead of black, airbrushed shading, painted watercolour backgrounds, and the soft multiplane depth that studio animation used before cameras went digital.\n\nThe story is one negotiation. A girl wants a dog; her father, sunk into the sofa after work, has heard the argument before. She brings him candidates — the tall-eared stray at dusk, the spaniel in the grass, the terrier already behaving as though it lives there — and the film watches him run out of reasons.\n\nHolding that vocabulary consistently across a father, a child and an animal — three very different shapes, three different weights — is where the work sits. The warmth is deliberate. It is a film about a household, shot at the hour when the lamps come on.",
    tags: ["Original Film", "Cel Animation", "Character Study"],
    gallery: ["pet-dog-1", "pet-dad", "pet-daughter", "pet-dog-2", "pet-dog-3"],
    films: [
      {
        slug: "a-new-pet-test",
        video: "/videos/pet-dog.mp4",
        poster: "pet-dog-poster",
        kind: "FEATURE",
        durationSeconds: 15,
        width: 864,
        height: 496,
        featured: true,
        sortOrder: 1,
        title: "A NEW PET",
        description:
          "The painted cel look in motion, with the line quality holding steady frame to frame.",
      },
    ],
  },
  {
    slug: "the-shopkeeper",
    kind: "ORIGINAL_FILM",
    year: 2026,
    featured: true,
    sortOrder: 3,
    accentColor: "#4FA3D1",
    cover: "shiba-kiosk",
    title: "THE SHOPKEEPER",
    tagline: "The shiba runs the shop. No further questions.",
    summary:
      "A corner tobacco shop in Japan, a sliding window, and the dog who owns the place.",
    body: "One joke, told entirely through production design. The shiba is never explained and never needs to be — the film simply commits to the premise and then spends its runtime on the shop.\n\nThat is where the work actually is: the packed shelves, the hand-lettered signage, the blue rubber cash tray, the afternoon light coming off the street. The comedy only lands because the environment is played completely straight.",
    tags: ["Original Film", "Environment Design", "Anime"],
    gallery: ["shiba-kiosk"],
    films: [
      {
        slug: "the-shopkeeper-film",
        video: "/videos/shiba-kiosk.mp4",
        poster: "shiba-kiosk-poster",
        kind: "FEATURE",
        durationSeconds: 17,
        width: 1920,
        height: 1080,
        featured: true,
        sortOrder: 1,
        title: "THE SHOPKEEPER",
        description: "Open for business.",
      },
    ],
  },

  /* ------------------------------------------------------------------
     The project below is written and designed, but none of its frames,
     cuts or key art have been handed over yet. Its copy is real; its
     media is not invented.

     SWAP — it needs, from Aiden:
       • a cover image (drop the master in `assets-source/`, add it to
         `SOURCES` in `scripts/prepare-media.ts`, run `npm run media`, then
         set `cover` to the manifest name below)
       • gallery frames (same pipeline, then list the manifest names)
       • the film itself (encode to `public/videos/`, add a `films` entry)
     Until then `cover` stays null, `gallery` and `films` stay empty, and the
     card renders without artwork rather than with a placeholder standing in
     for work that does not exist.
     ------------------------------------------------------------------ */
  {
    slug: "boop",
    kind: "CLIENT_WORK",
    year: 2026,
    featured: false,
    sortOrder: 4,
    accentColor: "#e11d1d",
    cover: null, // SWAP — key visual pending
    title: "boop.",
    tagline: "Cream interiors, arched windows, a six-checkpoint journey.",
    summary:
      "A warm, soft-futurist visual world for an app client — cream interiors, arched windows onto fantasy landscapes, and a six-checkpoint journey map.",
    body: "boop. is a visual world built for an app client, in a register the brief called soft-futurist: warm rather than clinical, cream interiors instead of chrome, curves instead of edges.\n\nThe recurring device is an arched window — an interior that stays calm and domestic, opening onto a fantasy landscape that does the dreaming for it. The contrast is what makes the world feel inhabitable rather than merely rendered.\n\nOn top of that sits a six-checkpoint journey map: the product's progression drawn as places a user travels through, so the interface reads as a route rather than a menu.",
    tags: ["Client Work", "Soft-Futurist"],
    gallery: [], // SWAP — interior and journey-map frames pending
    films: [],
  },
];

const SOCIALS = [
  { label: "Instagram", handle: "@unhumanstud", url: "#" },
  { label: "TikTok", handle: "@unhumanstud", url: "#" },
  { label: "YouTube", handle: "/@unhumanstud", url: "#" },
  { label: "X / Twitter", handle: "@unhumanstud", url: "#" },
];

/* ------------------------------------------------------------------
   Seed
   ------------------------------------------------------------------ */

/**
 * PGlite permits a single writer. If the dev server is running it already holds
 * an open handle to the data directory, and seeding alongside it does not merely
 * go unnoticed — it can corrupt the database and break the next build. Detect
 * that case and refuse, rather than leaving a corrupt data directory behind.
 */
function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" })
      .on("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .on("error", () => resolve(false));
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 400);
  });
}

async function main() {
  const devPort = Number(process.env.PORT ?? 3000);
  if (await portInUse(devPort)) {
    console.error(
      `\n  Refusing to seed: something is serving on port ${devPort}.\n` +
        `  The dev server holds an exclusive handle on the database, and\n` +
        `  writing to it concurrently can corrupt the data directory.\n\n` +
        `  Stop the dev server, run this again, then restart it.\n`,
    );
    process.exit(1);
  }

  // PGlite will not create intermediate directories for its data dir.
  await mkdir(path.dirname(path.resolve(DATA_DIR)), { recursive: true });

  const client = new PGlite(DATA_DIR);
  const db = drizzle(client, { schema });

  console.log("  applying migrations…");
  await migrate(db, { migrationsFolder: path.join(ROOT, "drizzle") });

  const manifestRaw = await readFile(
    path.join(ROOT, "src/content/media-manifest.json"),
    "utf8",
  );
  const manifest: MediaEntry[] = JSON.parse(manifestRaw);

  console.log("  clearing content tables…");
  await db.execute(sql`
    TRUNCATE TABLE
      project_tags, tag_translations, tags,
      gallery_items, film_translations, films,
      project_translations, projects,
      media_asset_translations, media_assets,
      site_settings
    RESTART IDENTITY CASCADE
  `);

  // ---- media assets ------------------------------------------------
  const assetIds = new Map<string, string>();
  for (const entry of manifest) {
    const [row] = await db
      .insert(schema.mediaAssets)
      .values({
        kind: entry.name.endsWith("-poster") ? "VIDEO_POSTER" : "IMAGE",
        storageKey: entry.storageKey,
        url: entry.url,
        width: entry.width,
        height: entry.height,
        bytes: entry.bytes,
        mimeType: entry.mimeType,
        blurDataUrl: entry.blurDataUrl,
      })
      .returning({ id: schema.mediaAssets.id });

    assetIds.set(entry.name, row.id);
    await db.insert(schema.mediaAssetTranslations).values({
      assetId: row.id,
      locale: L,
      altText: entry.alt,
      caption: entry.caption ?? null,
    });
  }
  console.log(`  ${manifest.length} media assets`);

  // ---- tags --------------------------------------------------------
  const tagIds = new Map<string, string>();
  const allTags = [...new Set(PROJECTS.flatMap((p) => p.tags))];
  for (const label of allTags) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [row] = await db
      .insert(schema.tags)
      .values({ slug })
      .returning({ id: schema.tags.id });
    tagIds.set(label, row.id);
    await db
      .insert(schema.tagTranslations)
      .values({ tagId: row.id, locale: L, label });
  }
  console.log(`  ${allTags.length} tags`);

  // ---- projects ----------------------------------------------------
  const now = new Date();
  let filmCount = 0;
  let galleryCount = 0;

  for (const p of PROJECTS) {
    // A null cover is intentional (artwork not delivered yet). A named cover
    // that is absent from the manifest is a mistake, and should stop the seed.
    let coverId: string | null = null;
    if (p.cover) {
      coverId = assetIds.get(p.cover) ?? null;
      if (!coverId) throw new Error(`Missing cover asset "${p.cover}"`);
    }

    const [project] = await db
      .insert(schema.projects)
      .values({
        slug: p.slug,
        kind: p.kind,
        status: "PUBLISHED",
        year: p.year,
        featured: p.featured,
        sortOrder: p.sortOrder,
        coverAssetId: coverId,
        accentColor: p.accentColor,
        publishedAt: now,
      })
      .returning({ id: schema.projects.id });

    await db.insert(schema.projectTranslations).values({
      projectId: project.id,
      locale: L,
      title: p.title,
      titleAlt: p.titleAlt ?? null,
      tagline: p.tagline,
      summary: p.summary,
      body: p.body,
      seoTitle: `${p.title} — Unhuman Stud`,
      seoDescription: p.summary,
    });

    for (const [i, label] of p.tags.entries()) {
      await db.insert(schema.projectTags).values({
        projectId: project.id,
        tagId: tagIds.get(label)!,
        sortOrder: i,
      });
    }

    for (const [i, name] of p.gallery.entries()) {
      const assetId = assetIds.get(name);
      if (!assetId) throw new Error(`Missing gallery asset "${name}"`);
      await db.insert(schema.galleryItems).values({
        assetId,
        projectId: project.id,
        status: "PUBLISHED",
        sortOrder: p.sortOrder * 100 + i,
      });
      galleryCount++;
    }

    for (const f of p.films) {
      const [film] = await db
        .insert(schema.films)
        .values({
          slug: f.slug,
          projectId: project.id,
          kind: f.kind,
          orientation: f.width >= f.height ? "LANDSCAPE" : "VERTICAL",
          provider: "SELF",
          providerVideoId: f.video,
          durationSeconds: f.durationSeconds,
          width: f.width,
          height: f.height,
          posterAssetId: assetIds.get(f.poster) ?? null,
          status: "PUBLISHED",
          featured: f.featured,
          sortOrder: f.sortOrder,
          publishedAt: now,
        })
        .returning({ id: schema.films.id });

      await db.insert(schema.filmTranslations).values({
        filmId: film.id,
        locale: L,
        title: f.title,
        description: f.description,
      });
      filmCount++;
    }
  }
  console.log(
    `  ${PROJECTS.length} projects, ${filmCount} films, ${galleryCount} gallery items`,
  );

  // ---- site settings -----------------------------------------------
  await db.insert(schema.siteSettings).values({
    id: "singleton",
    contactEmail: "vuquocanh12052007@gmail.com",
    socials: SOCIALS,
  });

  console.log("\n  seed complete.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
