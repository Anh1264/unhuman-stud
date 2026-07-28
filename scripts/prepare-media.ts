/**
 * Media pipeline.
 *
 * Turns the masters in assets-source/ into the files the site actually ships,
 * then writes a manifest containing the real dimensions, byte sizes and a
 * base64 LQIP for each one. The manifest is what the database seed reads, so
 * image metadata in the DB is always measured rather than hand-typed.
 *
 * Three kinds of image asset:
 *   LOSSLESS  the NU / Ceasefire finals — converted to *lossless* WebP, so the
 *             shipped pixels are identical to the master. Serving them
 *             untouched is why next.config.ts turns the image optimiser off.
 *   LOSSY     older Midjourney stills — resized and re-encoded as JPEG.
 *   MEASURED  assets whose master is no longer on disk (and video poster frames
 *             produced by ffmpeg). Already built in public/images; we only
 *             measure them so their manifest entries survive.
 *
 * Video: each film ships as its untouched master, losslessly remuxed so the
 * moov atom sits at the front and the file streams. No re-encode.
 *
 * Run: npm run media          (add --force to rebuild videos that are up to date)
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";

const run = promisify(execFile);

const ROOT = process.cwd();
const IMAGE_DIR = path.join(ROOT, "public/images");
const VIDEO_DIR = path.join(ROOT, "public/videos");
const MANIFEST = path.join(ROOT, "src/content/media-manifest.json");

const FORCE = process.argv.includes("--force");

const FFMPEG = ffmpegStatic;
if (!FFMPEG) throw new Error("ffmpeg-static did not resolve a binary for this platform");

/** Longest edge for the lossy JPEG set. next/image derives smaller sizes from this. */
const MAX_EDGE = 2560;
const JPEG_QUALITY = 86;

/*
 * Why there is no playback encode.
 *
 * Ceasefire is 3840x2160 at 60 fps from a ~50 Mbit/s master, about the least
 * compressible thing there is, so the usual "visually lossless" CRF numbers do
 * not apply. Measured over the full 67.5s with libx264 at preset slow:
 *
 *   crf 16 → 481 MB   crf 18 → 386 MB   crf 26 → 154 MB
 *   crf 31 →  86 MB   crf 32 →  78 MB
 *
 * crf 16 is *larger* than the 402 MB master, and everything small enough to
 * commit is visibly worse than it. So the site serves the master itself and
 * the file stays out of git. Kept here in case this ever moves to a CDN or Git
 * LFS, where a ladder would be worth building again.
 */

type ImageSource = {
  /** Output basename, also the manifest name and storage key stem. */
  name: string;
  from: string;
  alt: string;
  caption?: string;
};

/** Converted pixel-for-pixel to lossless WebP — no re-compression, ever. */
const LOSSLESS: ImageSource[] = [
  {
    name: "nu-poster",
    from: "assets-source/NU/finals/Nu-poster.png",
    alt: 'Poster for "Nu & Tib: Ceasefire" — a shaggy blue horned monster and a towering red teddy bear square off in a snowbound city at night, a small girl in a pink coat standing between them, the title set in ice-blue and ember-red lettering above.',
    caption: "Nu & Tib: Ceasefire · poster",
  },
  {
    name: "nu-character-sheet",
    from: "assets-source/NU/finals/nu-character-sheet.png",
    alt: "Character model sheet for Nu: four turnaround views of the blue horned monster, four expression studies labelled happy, angry, sad and neutral, a face detail panel, and the character's colour palette.",
    caption: "Nu · character model sheet",
  },
  {
    name: "tib-character-sheet",
    from: "assets-source/NU/finals/tib-character-sheet.png",
    alt: "Character model sheet for Tib: three-quarter, front, three-quarter and back views of the red teddy bear, four expression studies labelled happy, angry, sad and neutral, and a face detail panel.",
    caption: "Tib · character model sheet",
  },
  {
    name: "nu-first-frame",
    from: "assets-source/NU/finals/nu-first-frame.png",
    alt: "Opening frame of the film: the blue horned monster hugs an enormous snowball on a green ridge between snowy peaks, a tiny figure standing on the grass below and a distant city skyline to the right.",
    caption: "Nu & Tib: Ceasefire · opening frame",
  },
  {
    name: "nu-snow",
    from: "assets-source/NU/finals/snow.png",
    alt: "A young man in a red beanie and pale blue puffer coat crouches in deep snow in a city park, packing a snowball, while other people roll snowballs around him and towers rise behind.",
    caption: "Nu & Tib: Ceasefire · the city, before",
  },
  {
    name: "nu-snowball",
    from: "assets-source/NU/finals/snowball.png",
    alt: "A snowball the size of a building rolls down a green ridge toward a city skyline, throwing up a wave of snow.",
    caption: "Nu & Tib: Ceasefire · the snowball",
  },
];

/** Older stills — resized and re-encoded as JPEG. */
const LOSSY: ImageSource[] = [
  // ---- NU ----
  {
    name: "nu-monster-face",
    from: "assets-source/NU/monster_face.png",
    alt: "Close view of the snow creature scowling over a large packed snowball, orange eyes narrowed, city towers visible beyond the ridge.",
    caption: "NU · the snowball",
  },
  // ---- OLD FRIEND ----
  {
    name: "pet-dad",
    from: "assets-source/old-disney-pet/dad.png",
    alt: "A broad-shouldered father in a white tee and yellow shorts reclines on a green sofa holding a drink, rendered as hand-painted cel animation.",
    caption: "Old Friend · the father",
  },
  {
    name: "pet-daughter",
    from: "assets-source/old-disney-pet/daughter.png",
    alt: "A young girl with a red hair bow curls on a green sofa in a warm lamplit living room, rendered as hand-painted cel animation.",
    caption: "Old Friend · the daughter",
  },
  {
    name: "pet-dog-1",
    from: "assets-source/old-disney-pet/dog1.png",
    alt: "A scruffy tan dog with tall ears looks upward against a dusk sky streaked with pink cloud.",
    caption: "Old Friend · the dog at dusk",
  },
  {
    name: "pet-dog-2",
    from: "assets-source/old-disney-pet/dog2.png",
    alt: "A brown and cream cocker spaniel with long ears rests in grass, a soft painted landscape hazy behind her.",
    caption: "Old Friend · spaniel study",
  },
  {
    name: "pet-dog-3",
    from: "assets-source/old-disney-pet/dog3.png",
    alt: "A grey and white wire-haired terrier wearing a blue collar and gold tag lies on a patterned red rug beside a stone column and flowering shrubs.",
    caption: "Old Friend · terrier study",
  },
  // ---- THE SHOPKEEPER ----
  {
    name: "shiba-kiosk",
    from: "assets-source/shiba/quocanhvu_A_shiba_inu_leans_out_through_the_open_sliding_wind_984c5780-a0be-4b1e-8228-a668d8c44db5_3.png",
    alt: "A grinning shiba inu leans out of the sliding window of a small blue Japanese corner shop, paws on the cash tray, shelves of colourful packets around it.",
    caption: "The Shopkeeper · open for business",
  },
];

type Film = {
  /** Basename for the shipped video and its poster. */
  name: string;
  from: string;
  /** Timestamp of the poster frame, as an ffmpeg `-ss` value. */
  posterAt: string;
  alt: string;
  posterAlt: string;
  caption?: string;
};

const FILMS: Film[] = [
  {
    name: "nu-ceasefire",
    from: "assets-source/NU/finals/nu&tib_ceasefire.mp4",
    posterAt: "00:00:00.000",
    alt: 'Still from "Nu & Tib: Ceasefire".',
    posterAlt:
      "Poster frame from Nu & Tib: Ceasefire — the blue horned monster hugs an enormous snowball on a green ridge above a distant city skyline.",
    caption: "Nu & Tib: Ceasefire",
  },
];

/**
 * Already-built files we only measure. Their masters were superseded or are no
 * longer on disk, so re-deriving them is not possible — but the seed still
 * references these names, so their manifest entries have to survive.
 */
const MEASURED: { name: string; file: string; alt: string; caption?: string }[] = [
  {
    name: "nu-willump",
    file: "nu-willump.jpg",
    alt: "A colossal horned snow creature with white and indigo fur stands on a green ridge between snowbanks, a modern city skyline rising in the haze behind it.",
    caption: "NU · the creature and the city",
  },
  {
    name: "nu-still",
    file: "nu-still.jpg",
    alt: "Character model sheet for NU: four turnaround views, four expression studies labelled happy, angry, sad and neutral, a face detail panel, and the character's colour palette.",
    caption: "NU · character model sheet",
  },
  {
    name: "shiba-kiosk-poster",
    file: "shiba-kiosk-poster.jpg",
    alt: "Poster frame from The Shopkeeper.",
  },
  { name: "nu-social-poster", file: "nu-social-poster.jpg", alt: "Poster frame from NU." },
  { name: "nu-original-poster", file: "nu-original-poster.jpg", alt: "Poster frame from NU." },
  { name: "pet-dog-poster", file: "pet-dog-poster.jpg", alt: "Poster frame from Old Friend." },
];

export type MediaEntry = {
  name: string;
  url: string;
  storageKey: string;
  width: number;
  height: number;
  bytes: number;
  mimeType: string;
  blurDataUrl: string;
  alt: string;
  caption?: string;
};

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

async function blurPlaceholder(input: Buffer | string): Promise<string> {
  const buf = await sharp(input)
    .resize(16, 16, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function report(name: string, width: number, height: number, bytes: number, note = "") {
  const size =
    bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  console.log(`  ${name.padEnd(22)} ${`${width}x${height}`.padEnd(11)} ${size.padStart(9)} ${note}`);
}

/** True when `out` exists and is at least as new as `src`. */
async function isFresh(out: string, src: string): Promise<boolean> {
  if (FORCE || !existsSync(out)) return false;
  const [a, b] = await Promise.all([stat(out), stat(src)]);
  return a.mtimeMs >= b.mtimeMs;
}

async function ffmpeg(args: string[]) {
  // maxBuffer: ffmpeg is quiet at this log level, but 4K encodes run long.
  await run(FFMPEG!, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
}

async function buildFilm(film: Film): Promise<MediaEntry> {
  const src = path.join(ROOT, film.from);
  const video = path.join(VIDEO_DIR, `${film.name}.mp4`);
  const posterPng = path.join(tmpdir(), `${film.name}-poster.png`);
  const posterOut = path.join(IMAGE_DIR, `${film.name}-poster.webp`);

  // The master, remuxed for streaming. -c copy means not a single pixel or
  // sample changes; only the moov atom moves to the front of the file.
  if (!(await isFresh(video, src))) {
    console.log(`  writing ${film.name}.mp4 (remux, no re-encode)…`);
    await ffmpeg(["-i", src, "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", "-movflags", "+faststart", video]);
  }

  // Poster frame, kept lossless so it matches the stills around it. ffmpeg has
  // to land somewhere on disk first, so use a temp file outside public/.
  if (!(await isFresh(posterOut, src))) {
    await ffmpeg(["-ss", film.posterAt, "-i", src, "-frames:v", "1", posterPng]);
    await sharp(posterPng).webp({ lossless: true }).toFile(posterOut);
    await rm(posterPng, { force: true });
  }

  const { size: videoBytes } = await stat(video);
  console.log(
    `  ${path.basename(video).padEnd(30)} ${(videoBytes / 1024 / 1024).toFixed(1).padStart(7)} MB  untouched master (remuxed)`,
  );

  const meta = await sharp(posterOut).metadata();
  const { size } = await stat(posterOut);
  report(`${film.name}-poster`, meta.width ?? 0, meta.height ?? 0, size, "(video poster, lossless)");

  return {
    name: `${film.name}-poster`,
    url: `/images/${film.name}-poster.webp`,
    storageKey: `images/${film.name}-poster.webp`,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: size,
    mimeType: "image/webp",
    blurDataUrl: await blurPlaceholder(posterOut),
    alt: film.posterAlt,
  };
}

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(VIDEO_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });

  const entries: MediaEntry[] = [];

  console.log("\nlossless WebP (pixel-identical to the master)");
  for (const src of LOSSLESS) {
    const abs = path.join(ROOT, src.from);
    const outName = `${src.name}.webp`;
    const outPath = path.join(IMAGE_DIR, outName);

    const info = await sharp(abs).webp({ lossless: true, effort: 6 }).toFile(outPath);

    entries.push({
      name: src.name,
      url: `/images/${outName}`,
      storageKey: `images/${outName}`,
      width: info.width,
      height: info.height,
      bytes: info.size,
      mimeType: "image/webp",
      blurDataUrl: await blurPlaceholder(abs),
      alt: src.alt,
      caption: src.caption,
    });
    report(src.name, info.width, info.height, info.size);
  }

  console.log("\nJPEG");
  for (const src of LOSSY) {
    const abs = path.join(ROOT, src.from);
    const outName = `${src.name}.jpg`;
    const outPath = path.join(IMAGE_DIR, outName);

    const info = await sharp(abs)
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath);

    entries.push({
      name: src.name,
      url: `/images/${outName}`,
      storageKey: `images/${outName}`,
      width: info.width,
      height: info.height,
      bytes: info.size,
      mimeType: "image/jpeg",
      blurDataUrl: await blurPlaceholder(abs),
      alt: src.alt,
      caption: src.caption,
    });
    report(src.name, info.width, info.height, info.size);
  }

  console.log("\nvideo");
  for (const film of FILMS) {
    entries.push(await buildFilm(film));
  }

  console.log("\nmeasured in place (master no longer on disk)");
  for (const item of MEASURED) {
    const outPath = path.join(IMAGE_DIR, item.file);
    const meta = await sharp(outPath).metadata();
    const { size } = await stat(outPath);
    entries.push({
      name: item.name,
      url: `/images/${item.file}`,
      storageKey: `images/${item.file}`,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      bytes: size,
      mimeType: MIME[path.extname(item.file)] ?? "application/octet-stream",
      blurDataUrl: await blurPlaceholder(outPath),
      alt: item.alt,
      caption: item.caption,
    });
    report(item.name, meta.width ?? 0, meta.height ?? 0, size);
  }

  await writeFile(MANIFEST, JSON.stringify(entries, null, 2) + "\n", "utf8");
  console.log(`\n  manifest → ${path.relative(ROOT, MANIFEST)} (${entries.length} assets)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
