import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import {
  getFilms,
  getGallery,
  type Film,
  type GalleryEntry,
} from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Films",
  description:
    "Every film from Unhuman Stud — NU & TIB: CEASEFIRE and THE UNBOTHERED CYCLOPS — written, directed, generated and cut by Aiden Vu.",
  path: "/films",
});

/** Runtime and master resolution, skipping whatever the film has not recorded. */
function factsFor(film: Film) {
  const runtime = formatDuration(film.durationSeconds);
  return [
    runtime ? { label: "Runtime", value: runtime } : null,
    film.width && film.height
      ? { label: "Master", value: `${film.width} × ${film.height}` }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);
}

export default async function FilmsPage() {
  const [films, gallery] = await Promise.all([getFilms(), getGallery()]);

  // Frames grouped by project once, so each film can show the stills it came
  // from without re-scanning the whole gallery per film.
  const framesByProject = new Map<string, GalleryEntry[]>();
  for (const item of gallery) {
    if (item.section !== "FRAME" || !item.projectSlug) continue;
    const existing = framesByProject.get(item.projectSlug);
    if (existing) existing.push(item);
    else framesByProject.set(item.projectSlug, [item]);
  }

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">02 — Motion</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Films &amp; <em className="italic text-crimson-br">cuts</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Nothing streams until you press play — each film loads only when you
          ask for it.
        </p>
      </Reveal>

      {films.map((film, i) => {
        const facts = factsFor(film);
        const frames = film.projectSlug
          ? (framesByProject.get(film.projectSlug) ?? [])
          : [];
        // The project name is only worth printing when it is not simply the
        // film's own title repeated back.
        const projectName =
          film.projectTitle && film.projectTitle !== film.title
            ? film.projectTitle
            : null;
        const headingId = `film-${film.slug}`;

        return (
          <article
            key={film.slug}
            aria-labelledby={headingId}
            className={i > 0 ? "mt-16 border-t border-line pt-16" : undefined}
          >
            <Reveal>
              {/* Only the first poster is preloaded; the rest wait their turn
                  rather than competing for bandwidth above the fold. */}
              <VideoPlayer film={film} priority={i === 0} />

              <div className="mt-6 grid gap-8 border-t border-line pt-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
                <div>
                  <h2
                    id={headingId}
                    className="serif text-[clamp(24px,3.4vw,34px)]"
                  >
                    {film.title}
                  </h2>
                  {projectName && (
                    <p className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-bone-faint">
                      {projectName}
                    </p>
                  )}
                  {film.description && (
                    <p className="mt-2.5 max-w-[56ch] text-[15px] text-bone-dim">
                      {film.description}
                    </p>
                  )}
                  {film.projectSlug && (
                    <Link
                      href={`/work/${film.projectSlug}`}
                      className="mono mt-5 inline-block border-b border-ember pb-0.5 text-[12px] uppercase tracking-[0.06em] text-ember hover:border-gold hover:text-gold"
                    >
                      Open the project →
                    </Link>
                  )}
                </div>

                {facts.length > 0 && (
                  <dl className="flex flex-wrap gap-x-12 gap-y-5">
                    {facts.map((fact) => (
                      <div key={fact.label}>
                        <dt className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                          {fact.label}
                        </dt>
                        <dd className="serif mt-1.5 text-[20px]">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </Reveal>

            {frames.length > 0 && (
              <Reveal className="mt-12">
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="klabel">Frames from the film</h3>
                  <Link
                    href="/gallery"
                    className="mono border-b border-ember pb-0.5 text-[12px] uppercase tracking-[0.06em] text-ember hover:border-gold hover:text-gold"
                  >
                    Full gallery →
                  </Link>
                </div>
                <GalleryGrid
                  items={frames}
                  layout="grid"
                  aspect="video"
                  columnsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, 31vw"
                />
              </Reveal>
            )}
          </article>
        );
      })}
    </section>
  );
}
