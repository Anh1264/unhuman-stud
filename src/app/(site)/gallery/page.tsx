import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { Reveal } from "@/components/site/Reveal";
import { getGallery, type GalleryEntry } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Gallery",
  description:
    "Key art, frames and character model sheets from Unhuman Stud, grouped by the film each image belongs to.",
  path: "/gallery",
});

/**
 * One film's images. Pooling every project into a single masonry made a nice
 * wall and a useless index — a viewer could not tell which film a frame came
 * from. So the gallery is grouped by film first, and each film gets the same
 * two grids: the frames it was cut from, then the documents around it (key art
 * and design sheets), which are a different kind of picture and read at a
 * different size.
 */
type Block = {
  key: string;
  slug: string | null;
  title: string;
  frames: GalleryEntry[];
  documents: GalleryEntry[];
};

function groupByProject(items: GalleryEntry[]): Block[] {
  const blocks = new Map<string, Block>();

  for (const item of items) {
    const key = item.projectSlug ?? "__unassigned";
    let block = blocks.get(key);
    if (!block) {
      block = {
        key,
        slug: item.projectSlug,
        title: item.projectTitle ?? "Unfiled",
        frames: [],
        documents: [],
      };
      blocks.set(key, block);
    }
    if (item.section === "FRAME") block.frames.push(item);
    else block.documents.push(item);
  }

  return [...blocks.values()];
}

export default async function GalleryPage() {
  const blocks = groupByProject(await getGallery());

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">03 — Stills</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">Gallery</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Every still, grouped by the film it belongs to. Click any image to
          enlarge — arrow keys move between the images in that grid.
        </p>
      </Reveal>

      {blocks.map((block, i) => {
        const total = block.frames.length + block.documents.length;
        const headingId = `gallery-${block.key}`;

        return (
          <section
            key={block.key}
            aria-labelledby={headingId}
            className={i > 0 ? "mt-16 border-t border-line pt-16" : undefined}
          >
            <Reveal>
              <h2
                id={headingId}
                className="text-[clamp(24px,3.2vw,34px)] leading-[1.06]"
              >
                {block.slug ? (
                  <Link
                    href={`/work/${block.slug}`}
                    className="hover:text-crimson-br"
                  >
                    {block.title}
                  </Link>
                ) : (
                  block.title
                )}
              </h2>
              <p className="klabel mt-3 mb-7">
                {total} {total === 1 ? "image" : "images"}
              </p>

              {block.frames.length > 0 && (
                <GalleryGrid
                  items={block.frames}
                  layout="grid"
                  aspect="video"
                  columnsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, 31vw"
                />
              )}

              {block.documents.length > 0 && (
                <GalleryGrid
                  items={block.documents}
                  layout="grid"
                  captions="below"
                  columnsClass="grid-cols-2 md:grid-cols-4"
                  className={block.frames.length > 0 ? "mt-4" : undefined}
                  sizes="(max-width: 768px) 46vw, 23vw"
                />
              )}
            </Reveal>
          </section>
        );
      })}
    </section>
  );
}
