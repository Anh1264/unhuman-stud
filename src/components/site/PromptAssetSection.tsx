import { GalleryGrid } from "@/components/site/GalleryGrid";
import { Reveal } from "@/components/site/Reveal";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import type { Film, Media } from "@/server/services/content.service";
import type { PromptAsset } from "@/server/services/prompts.service";
import { cn } from "@/lib/utils";

/**
 * The pictures on either side of a prompt: what went in, and what came back.
 *
 * An asset can be recorded before its file exists — the owner writes the entry
 * the day he runs the prompt and drops the files in later. Those unbuilt
 * assets keep their note and are listed as what they are, files still to come.
 * The alternative is either a broken image or pretending the reference was
 * never part of the prompt, and both are lies about how the prompt was made.
 *
 * With nothing at all recorded the section returns null: an empty heading over
 * a rule reads as a page that failed to load.
 */
export function PromptAssetSection({
  id,
  title,
  blurb,
  assets,
  entryTitle,
}: {
  id: string;
  title: string;
  blurb: string;
  assets: PromptAsset[];
  /** Used to write real alt text for a file whose note is blank. */
  entryTitle: string;
}) {
  if (assets.length === 0) return null;

  const images: Media[] = assets
    .filter((a) => a.kind === "IMAGE" && a.url && a.width && a.height)
    .map((a) => ({
      url: a.url as string,
      width: a.width as number,
      height: a.height as number,
      blurDataUrl: a.blurDataUrl,
      alt: a.note ?? `${title} for the prompt “${entryTitle}”: ${a.file}`,
      caption: a.note,
    }));

  const videos = assets.filter((a) => a.kind === "VIDEO" && a.url);
  const pending = assets.filter((a) => !a.url);

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="mt-16 border-t border-line pt-12"
    >
      <Reveal>
        <h2 id={`${id}-heading`} className="text-[clamp(24px,3.2vw,34px)]">
          {title}
        </h2>
        <p className="mt-3 mb-8 max-w-[56ch] text-[15px] text-bone-dim">
          {blurb}
        </p>

        {images.length > 0 && (
          <GalleryGrid
            items={images}
            columnsClass="sm:columns-2 lg:columns-3"
            captions="below"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {videos.length > 0 && (
          <div
            className={cn(
              "grid gap-6 sm:grid-cols-2",
              images.length > 0 && "mt-10",
            )}
          >
            {videos.map((asset) => (
              <div key={asset.file}>
                <VideoPlayer
                  film={toFilm(asset)}
                  posterSizes="(max-width: 640px) 100vw, 50vw"
                />
                <p className="mono mt-3 break-words text-[11px] uppercase tracking-[0.14em] text-bone-faint">
                  {asset.file}
                </p>
                {asset.note && (
                  <p className="mt-1.5 max-w-[56ch] break-words text-[14px] text-bone-dim">
                    {asset.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div
            className={cn(
              (images.length > 0 || videos.length > 0) && "mt-10",
            )}
          >
            <h3 className="klabel mb-4">Files still to come</h3>
            <ul className="grid gap-4 sm:grid-cols-2">
              {pending.map((asset) => (
                <li
                  key={asset.file}
                  className="rounded-lg border border-dashed border-line-2 bg-panel p-5"
                >
                  <p className="mono break-words text-[12px] tracking-[0.08em] text-bone">
                    {asset.file}
                  </p>
                  {asset.note && (
                    // A note is published as written — the parser refuses one
                    // that carries a local path. Long words still wrap so a
                    // filename cannot run off a phone screen.
                    <p className="mt-2.5 whitespace-pre-line break-words text-[14px] leading-[1.6] text-bone-dim">
                      {asset.note.trim()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Reveal>
    </section>
  );
}

/**
 * A prompt's video has no poster and no recorded duration, so the facade
 * player shows its play control over black and downloads nothing until asked.
 */
function toFilm(asset: PromptAsset): Film {
  return {
    slug: asset.file,
    title: asset.note ?? asset.file,
    description: null,
    provider: "SELF",
    source: asset.url as string,
    poster: null,
    durationSeconds: null,
    orientation:
      asset.width && asset.height && asset.height > asset.width
        ? "VERTICAL"
        : "LANDSCAPE",
    width: asset.width,
    height: asset.height,
    featured: false,
    projectSlug: null,
    projectTitle: null,
  };
}
