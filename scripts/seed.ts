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

/**
 * Gallery images grouped the way the pages lay them out. The order of the
 * sections here is the order they appear on the project page; the order within
 * a section is the order inside it. See `gallerySortOrder` in the schema for
 * how both survive the trip through a table with no section column.
 */
type GallerySeed = { section: schema.GallerySection; items: string[] };

/**
 * A character of the film. Only `name` is required: the epithet and the trait
 * words are the owner's to write, and an unwritten one is left out rather than
 * filled with a guess. `image` is a manifest name, usually the design sheet.
 */
type CharacterSeed = {
  slug: string;
  name: string;
  epithet?: string;
  traits?: string[];
  image: string | null;
};

/**
 * In-world metadata — bespoke label/value pairs such as SETTING or TONE. Empty
 * until the owner writes them; the pages render only the fields that exist.
 */
type WorldFieldSeed = { label: string; value: string };

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
  gallery: GallerySeed[];
  characters: CharacterSeed[];
  worldFields: WorldFieldSeed[];
  films: FilmSeed[];
};

/**
 * One project. NU & TIB: CEASEFIRE is the studio's first long-form film and the
 * only work on the site — the pages are built to present it as a feature rather
 * than as one card in a grid.
 */
const PROJECTS: ProjectSeed[] = [
  {
    slug: "nu",
    kind: "ORIGINAL_FILM",
    year: 2026,
    featured: true,
    sortOrder: 1,
    accentColor: "#7C8CE8",
    // Landscape, and the cleanest master we have: it carries the project card
    // and every share card on the site.
    cover: "nu-first-frame",
    title: "NU & TIB: CEASEFIRE",
    tagline: "A monster, a bear, and a snowball the size of a building.",
    summary:
      "The studio's first long-form film. Nu rolls a snowball the size of a building down on a city that is still packing its own.",
    body: "CEASEFIRE is the studio's first long-form film, and it began as a scale problem. A creature is only as big as the thing you put next to it — so the film puts a city there, and then rolls something at it.\n\nThe design work came first. Two character sheets fix the cast before a single frame is shot: Nu, horned and blue, and Tib, red and twice a person's height. Each sheet carries a full turnaround, the same four expressions — happy, angry, sad, neutral — and a face study, with a locked colour palette for Nu. Fixing that early is what lets both characters stay recognisably themselves from a wide mountain shot down to a face in close-up.\n\nThe film moves between two scales and lives in the gap between them: the city at ground level, where people in coats crouch in the snow packing snowballs by hand, and the ridge above it, where Nu builds one the size of a building. The title is the argument the two of them are having.",
    tags: ["Original Film", "Creature Design", "Character Design"],
    gallery: [
      { section: "KEY_ART", items: ["nu-poster"] },
      { section: "FRAME", items: ["nu-first-frame", "nu-snow", "nu-snowball"] },
      { section: "DESIGN", items: ["nu-character-sheet", "tib-character-sheet"] },
    ],
    // Names and sheets only. The epithets and the trait words are the owner's
    // to write; nothing here is invented on his behalf.
    characters: [
      { slug: "nu", name: "NU", image: "nu-character-sheet" },
      { slug: "tib", name: "TIB", image: "tib-character-sheet" },
    ],
    // Awaiting the owner's in-world copy. An empty list is a valid state.
    worldFields: [],
    films: [
      {
        slug: "nu-ceasefire",
        // The 1080p encode, not the 4K master: the master is a ~402 MB local
        // archive that never leaves this machine. See scripts/prepare-media.ts.
        video: "/videos/nu-ceasefire-1080.mp4",
        // The first frame of the film, from a true master — a better poster
        // than a still pulled back out of the encode.
        poster: "nu-first-frame",
        kind: "FEATURE",
        durationSeconds: 68,
        width: 3840,
        height: 2160,
        featured: true,
        sortOrder: 1,
        title: "NU & TIB: CEASEFIRE",
        description: "The complete film, encoded from the 4K master.",
      },
    ],
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
      character_translations, characters,
      project_world_field_translations, project_world_fields,
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
  let characterCount = 0;
  let worldFieldCount = 0;

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

    for (const group of p.gallery) {
      for (const [i, name] of group.items.entries()) {
        const assetId = assetIds.get(name);
        if (!assetId) throw new Error(`Missing gallery asset "${name}"`);
        await db.insert(schema.galleryItems).values({
          assetId,
          projectId: project.id,
          status: "PUBLISHED",
          // Carries both the position and the section — see the schema.
          sortOrder: schema.gallerySortOrder(p.sortOrder, group.section, i),
        });
        galleryCount++;
      }
    }

    for (const [i, c] of p.characters.entries()) {
      // A named sheet that is not in the manifest is a mistake, the same way a
      // missing cover is; a null image is a deliberate gap.
      let imageId: string | null = null;
      if (c.image) {
        imageId = assetIds.get(c.image) ?? null;
        if (!imageId) throw new Error(`Missing character asset "${c.image}"`);
      }

      const [character] = await db
        .insert(schema.characters)
        .values({
          projectId: project.id,
          slug: c.slug,
          imageAssetId: imageId,
          sortOrder: i,
        })
        .returning({ id: schema.characters.id });

      await db.insert(schema.characterTranslations).values({
        characterId: character.id,
        locale: L,
        name: c.name,
        epithet: c.epithet ?? null,
        traits: c.traits?.length ? c.traits : null,
      });
      characterCount++;
    }

    for (const [i, w] of p.worldFields.entries()) {
      const [field] = await db
        .insert(schema.projectWorldFields)
        .values({ projectId: project.id, sortOrder: i })
        .returning({ id: schema.projectWorldFields.id });

      await db.insert(schema.projectWorldFieldTranslations).values({
        fieldId: field.id,
        locale: L,
        label: w.label,
        value: w.value,
      });
      worldFieldCount++;
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
  console.log(`  ${characterCount} characters, ${worldFieldCount} world fields`);

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
