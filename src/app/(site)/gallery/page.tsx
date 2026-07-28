import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { Reveal } from "@/components/site/Reveal";
import {
  getGallery,
  type GalleryEntry,
  type GallerySection,
} from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Gallery",
  description:
    "Key art, frames and character model sheets from NU & TIB: CEASEFIRE — the first long-form film from Unhuman Stud.",
  path: "/gallery",
});

/**
 * The gallery is read in the order the work was made: the key art that fixes
 * the identity, the frames the film is cut from, and the design sheets both
 * came out of. Sheets are documents rather than pictures, so they sit in their
 * own panel with their labels showing.
 */
const SECTIONS: {
  key: GallerySection;
  title: string;
  blurb: string;
  columns: string;
  captions?: "hover" | "below";
  panel?: boolean;
}[] = [
  {
    key: "KEY_ART",
    title: "Key art",
    blurb:
      "The poster — the one image that has to carry the whole film — at its own portrait ratio.",
    columns: "",
  },
  {
    key: "FRAME",
    title: "Frames from the film",
    blurb:
      "Shots from the film — the city at ground level, and the ridge above it.",
    columns: "sm:columns-2 lg:columns-3",
  },
  {
    key: "DESIGN",
    title: "Character design",
    blurb:
      "Model sheets: turnarounds, expressions and colour, locked before the first frame.",
    columns: "sm:columns-2",
    captions: "below",
    panel: true,
  },
];

export default async function GalleryPage() {
  const items = await getGallery();

  const groups = SECTIONS.map((section) => ({
    ...section,
    items: items.filter((item: GalleryEntry) => item.section === section.key),
  })).filter((section) => section.items.length > 0);

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">03 — Stills</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">Gallery</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Key art, frames and character sheets. Click any image to enlarge —
          arrow keys move between the images in that group.
        </p>
      </Reveal>

      {groups.map((group, i) => (
        <Reveal key={group.key} className={i > 0 ? "mt-16" : undefined}>
          <div
            className={
              group.panel
                ? "rounded-xl border border-line bg-panel p-6 sm:p-9"
                : undefined
            }
          >
            <h2 className="klabel">{group.title}</h2>
            <p className="mt-3 mb-7 max-w-[56ch] text-[15px] text-bone-dim">
              {group.blurb}
            </p>
            <GalleryGrid
              items={group.items}
              columnsClass={group.columns}
              captions={group.captions}
              className={group.key === "KEY_ART" ? "max-w-[420px]" : undefined}
            />
          </div>
        </Reveal>
      ))}
    </section>
  );
}
