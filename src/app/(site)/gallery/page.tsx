import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { Reveal } from "@/components/site/Reveal";
import { getGallery } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Gallery",
  description:
    "Key visuals, character frames and concept art from Unhuman Stud projects.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">03 — Stills</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">Gallery</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Key visuals, character studies and environment frames. Click any image
          to enlarge — arrow keys move between them.
        </p>
      </Reveal>

      <Reveal>
        <GalleryGrid items={items} />
      </Reveal>
    </section>
  );
}
