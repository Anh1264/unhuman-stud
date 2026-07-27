/**
 * Media pipeline.
 *
 * Reads the original Midjourney PNGs out of assets-source/, writes
 * web-appropriate JPEGs into public/images/, and emits a manifest containing
 * the real dimensions plus a base64 LQIP for each one.
 *
 * The manifest is what the database seed reads, so image metadata in the DB is
 * always measured rather than hand-typed.
 *
 * Run: npm run media
 */
import { writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/images");
const MANIFEST = path.join(ROOT, "src/content/media-manifest.json");

/** Longest edge we ever ship. next/image derives smaller sizes from this. */
const MAX_EDGE = 2560;
const QUALITY = 86;

type Source = {
  /** Output basename, also the storage key stem. */
  name: string;
  from: string;
  alt: string;
  caption?: string;
};

const SOURCES: Source[] = [
  // ---- NU ----
  {
    name: "nu-willump",
    from: "assets-source/NU/quocanhvu_httpss.mj.runvdKLHjGYieY_big_willump_with_a_big_sno_59f09105-cca9-4284-a836-93a6855b1c63_2.png",
    alt: "A colossal horned snow creature with white and indigo fur stands on a green ridge between snowbanks, a modern city skyline rising in the haze behind it.",
    caption: "NU · the creature and the city",
  },
  {
    name: "nu-monster-face",
    from: "assets-source/NU/monster_face.png",
    alt: "Close view of the snow creature scowling over a large packed snowball, orange eyes narrowed, city towers visible beyond the ridge.",
    caption: "NU · the snowball",
  },
  {
    name: "nu-snow",
    from: "assets-source/NU/snow.png",
    alt: "A young man in a red beanie and pale blue puffer coat crouches in deep snow in a city park, packing a snowball, while other people build snowballs around him and towers rise behind.",
    caption: "NU · the city, before",
  },
  {
    name: "nu-snowball",
    from: "assets-source/NU/snowball.png",
    alt: "The snow creature stands on a green ridge behind a large packed snowball, scowling, with city towers hazy in the distance.",
    caption: "NU · the snowball",
  },
  {
    name: "nu-still",
    from: "assets-source/NU/e240d53b-7be5-4c7f-b846-5b3aa2b07aff.png",
    alt: "Character model sheet for NU: four turnaround views, four expression studies labelled happy, angry, sad and neutral, a face detail panel, and the character's colour palette.",
    caption: "NU · character model sheet",
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

/** Video poster frames already extracted by ffmpeg — measured, not converted. */
const POSTERS = [
  {
    name: "shiba-kiosk-poster",
    alt: "Poster frame from The Shopkeeper.",
  },
  { name: "nu-social-poster", alt: "Poster frame from NU." },
  { name: "nu-original-poster", alt: "Poster frame from NU." },
  { name: "pet-dog-poster", alt: "Poster frame from Old Friend." },
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

async function blurPlaceholder(input: Buffer | string): Promise<string> {
  const buf = await sharp(input)
    .resize(16, 16, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });

  const entries: MediaEntry[] = [];

  for (const src of SOURCES) {
    const abs = path.join(ROOT, src.from);
    const outName = `${src.name}.jpg`;
    const outPath = path.join(OUT_DIR, outName);

    const pipeline = sharp(abs)
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true });

    const info = await pipeline.toFile(outPath);
    const blurDataUrl = await blurPlaceholder(abs);

    entries.push({
      name: src.name,
      url: `/images/${outName}`,
      storageKey: `images/${outName}`,
      width: info.width,
      height: info.height,
      bytes: info.size,
      mimeType: "image/jpeg",
      blurDataUrl,
      alt: src.alt,
      caption: src.caption,
    });

    console.log(
      `  ${src.name.padEnd(20)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
    );
  }

  for (const poster of POSTERS) {
    const outName = `${poster.name}.jpg`;
    const outPath = path.join(OUT_DIR, outName);
    const meta = await sharp(outPath).metadata();
    const { size } = await stat(outPath);
    entries.push({
      name: poster.name,
      url: `/images/${outName}`,
      storageKey: `images/${outName}`,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      bytes: size,
      mimeType: "image/jpeg",
      blurDataUrl: await blurPlaceholder(outPath),
      alt: poster.alt,
    });
    console.log(
      `  ${poster.name.padEnd(20)} ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB (poster)`,
    );
  }

  await writeFile(MANIFEST, JSON.stringify(entries, null, 2) + "\n", "utf8");
  console.log(`\n  manifest → ${path.relative(ROOT, MANIFEST)} (${entries.length} assets)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
