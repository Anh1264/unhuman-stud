import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import { getProject, getProjectSlugs } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";
import { formatDuration } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

/** The film section is both the scroll target and the focus target of WATCH. */
const FILM_ID = "the-film";

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

/**
 * Static export can only ship the slugs known at build time; anything else has
 * to fall through to the 404 page rather than being rendered on demand.
 */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Next 16: params is a Promise and must be awaited.
  const { slug } = await params;
  const project = await getProject(slug);

  // The page itself calls notFound(); keep the 404's metadata out of search.
  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: true } };
  }

  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/work/${project.slug}`,
    image: project.cover
      ? {
          url: project.cover.url,
          width: project.cover.width,
          height: project.cover.height,
          alt: project.cover.alt,
        }
      : undefined,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [featured, ...rest] = project.films;

  // The page reads in the order a film wants to be met: the poster and the
  // billing, the film itself, what it is about, who is in it, then the frames.
  const keyArt = project.gallery.find((g) => g.section === "KEY_ART");
  const frames = project.gallery.filter((g) => g.section === "FRAME");

  // Character sheets are shown by the Characters section, from the character
  // records themselves — so the DESIGN gallery is not rendered a second time.
  const characters = project.characters;

  // A label with nothing under it is not a fact. Fields the owner has not
  // filled in yet drop out here, and the whole block disappears with them.
  const worldFields = project.worldFields.filter((f) => f.value);

  const runtime = formatDuration(featured?.durationSeconds);
  const facts = [
    project.year ? { label: "Year", value: String(project.year) } : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    featured?.width && featured?.height
      ? { label: "Master", value: `${featured.width} × ${featured.height}` }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <article className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal>
        <Link
          href="/work"
          className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint transition-colors hover:text-ember"
        >
          ← All work
        </Link>
      </Reveal>

      {/* ---------------- 1. hero: the poster and the billing ---------------- */}
      <Reveal delay={60} className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-16">
          {/* Portrait key art at its true 2:3 ratio — never cropped into a
              card, never letterboxed into a landscape box. */}
          {keyArt && (
            <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-line bg-panel">
              <Image
                src={keyArt.url}
                alt={keyArt.alt}
                width={keyArt.width}
                height={keyArt.height}
                priority
                sizes="(max-width: 1024px) 92vw, 460px"
                placeholder={keyArt.blurDataUrl ? "blur" : "empty"}
                blurDataURL={keyArt.blurDataUrl ?? undefined}
                className="w-full"
              />
            </div>
          )}

          {/* The poster is tall; centring the billing against it splits the
              leftover space instead of leaving a hole under the button. */}
          <div className="max-w-[900px] lg:self-center">
            {project.tags.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="mono rounded-full border border-crimson/50 bg-crimson/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ember"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-[clamp(38px,6.5vw,76px)] leading-[0.98]">
              {project.title}
            </h1>

            {project.tagline && (
              <p className="serif mt-5 max-w-[36ch] text-[clamp(19px,2.6vw,27px)] italic leading-[1.3] text-crimson-br">
                {`“${project.tagline}”`}
              </p>
            )}

            {worldFields.length > 0 && (
              <dl className="mt-9 grid gap-x-12 gap-y-6 border-t border-line pt-7 sm:grid-cols-2">
                {worldFields.map((field) => (
                  <div key={field.label}>
                    <dt className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                      {field.label}
                    </dt>
                    <dd className="serif mt-2 max-w-[40ch] text-[18px] leading-[1.35] text-bone">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {facts.length > 0 && (
              <dl className="mt-9 flex flex-wrap gap-x-12 gap-y-5 border-t border-line pt-7">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                      {fact.label}
                    </dt>
                    <dd className="serif mt-1.5 text-[20px]">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {featured && (
              <div className="mt-10">
                {/*
                  A plain fragment link, so it works before (and without) any
                  JavaScript. The smooth scroll is the global `scroll-behavior`,
                  which globals.css already switches off under
                  prefers-reduced-motion; the film section carries tabindex="-1"
                  so the browser moves focus there as well as the viewport.
                */}
                <a
                  href={`#${FILM_ID}`}
                  className="inline-block rounded-full bg-crimson px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
                >
                  Watch the film
                </a>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ---------------- 2. the film ---------------- */}
      {featured && (
        <section
          id={FILM_ID}
          tabIndex={-1}
          aria-labelledby={`${FILM_ID}-heading`}
          className="mt-20 scroll-mt-[98px]"
        >
          <Reveal>
            <h2 id={`${FILM_ID}-heading`} className="klabel mb-5">
              The film
            </h2>
            {/*
              Facade player: the poster is an optimised image and the <video>
              only mounts on click, with preload="none". Opening this page
              downloads nothing from /videos.
            */}
            <VideoPlayer
              film={featured}
              posterSizes="(max-width: 1024px) 100vw, 1712px"
            />
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
              <p className="serif text-[19px]">{featured.title}</p>
              {featured.description && (
                <p className="max-w-[56ch] text-[14px] text-bone-dim">
                  {featured.description}
                </p>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------- 3. synopsis ---------------- */}
      <section aria-labelledby="synopsis-heading">
        <Reveal>
          <div className="prose-body mt-20 grid gap-10 border-t border-line pt-14 md:grid-cols-[220px_1fr]">
            <h2 id="synopsis-heading" className="klabel md:pt-1">
              Synopsis
            </h2>
            <div>
              {(project.body ?? project.summary)
                .split("\n\n")
                .map((paragraph, i) => (
                  <p key={i} className="text-[16px]">
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- 4. characters ---------------- */}
      {characters.length > 0 && (
        <section
          aria-labelledby="characters-heading"
          className="mt-20 border-t border-line pt-14"
        >
          <Reveal>
            <h2
              id="characters-heading"
              className="text-[clamp(30px,4.2vw,52px)]"
            >
              Characters
            </h2>
            <p className="mt-5 max-w-[68ch] text-[16px] text-bone-dim">
              The model sheets the film was built from — turnarounds,
              expressions and colour, locked before the first frame.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-14">
            {characters.map((character, i) => (
              <Reveal key={character.slug} delay={i * 80}>
                <article>
                  {character.image && (
                    <GalleryGrid
                      items={[character.image]}
                      columnsClass=""
                      sizes="(max-width: 1024px) 92vw, 860px"
                    />
                  )}
                  <div className="border-t border-line pt-6">
                    <h3 className="text-[clamp(26px,3vw,40px)] leading-[1.02]">
                      {character.name}
                    </h3>

                    {character.epithet && (
                      <p className="serif mt-3 text-[clamp(17px,1.9vw,21px)] italic text-crimson-br">
                        {character.epithet}
                      </p>
                    )}

                    {character.traits.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {character.traits.map((trait) => (
                          <li
                            key={trait}
                            className="mono rounded-full border border-crimson/50 bg-crimson/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ember"
                          >
                            {trait}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- 5. frames ---------------- */}
      {frames.length > 0 && (
        <section
          aria-labelledby="frames-heading"
          className="mt-20 border-t border-line pt-14"
        >
          <Reveal>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="frames-heading" className="klabel">
                Frames from the film
              </h2>
              <span className="klabel">click to enlarge</span>
            </div>
            <GalleryGrid items={frames} columnsClass="sm:columns-2 lg:columns-3" />
          </Reveal>
        </section>
      )}

      {/* ---------------- other cuts, when there are any ---------------- */}
      {rest.length > 0 && (
        <section aria-labelledby="more-cuts-heading" className="mt-20">
          <Reveal>
            <h2 id="more-cuts-heading" className="klabel mb-6">
              More cuts
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {rest.map((film) => (
                <div key={film.slug}>
                  <VideoPlayer film={film} />
                  <p className="serif mt-3 text-[17px]">{film.title}</p>
                  {film.description && (
                    <p className="mt-1 text-[14px] text-bone-dim">
                      {film.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      <Reveal className="mt-20 border-t border-line pt-10">
        <p className="max-w-[56ch] text-[16px] text-bone-dim">
          Want something like this for your brand?{" "}
          <Link
            href="/contact"
            className="mono ml-1 border-b border-ember text-[13px] uppercase tracking-[0.06em] text-ember transition-colors hover:border-gold hover:text-gold"
          >
            Start a project →
          </Link>
        </p>
      </Reveal>
    </article>
  );
}
