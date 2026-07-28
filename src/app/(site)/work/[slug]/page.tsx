import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import { getProject, getProjectSlugs } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";
import { formatDuration } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

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

  // The page runs in the order the material wants to be read: key art as the
  // identity, the film as the centrepiece, then the frames it came from, then
  // the design work that came before either of them.
  const keyArt = project.gallery.filter((g) => g.section === "KEY_ART");
  const frames = project.gallery.filter((g) => g.section === "FRAME");
  const design = project.gallery.filter((g) => g.section === "DESIGN");

  const runtime = formatDuration(featured?.durationSeconds);
  const facts = [
    project.year ? { label: "Year", value: String(project.year) } : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    featured?.width && featured?.height
      ? { label: "Master", value: `${featured.width} × ${featured.height}` }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <article
      className="mx-auto max-w-site px-6 py-16 sm:px-8"
      style={{ ["--accent" as string]: project.accentColor }}
    >
      {/* ---------------- header ---------------- */}
      <Reveal>
        <Link
          href="/work"
          className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint transition-colors hover:text-ember"
        >
          ← All work
        </Link>
      </Reveal>

      <Reveal delay={60} className="mt-6 max-w-[760px]">
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="mono rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]"
              style={{
                color: project.accentColor,
                borderColor: `${project.accentColor}80`,
                background: `${project.accentColor}1f`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-[clamp(38px,7vw,76px)] leading-[0.98]">
          {project.title}
        </h1>

        {project.tagline && (
          <p
            className="serif mt-4 text-[clamp(18px,2.6vw,24px)] italic"
            style={{ color: project.accentColor }}
          >
            {project.tagline}
          </p>
        )}
      </Reveal>

      {/* ---------------- key art + the facts ---------------- */}
      <Reveal delay={120} className="mt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
          {keyArt.length > 0 && (
            <div>
              <h2 className="klabel mb-4">Key art</h2>
              {/* Portrait, shown at its own ratio — never cropped, never boxed. */}
              <GalleryGrid items={keyArt} columnsClass="" className="max-w-[420px]" />
            </div>
          )}

          {/* The key art is tall; centring the copy against it splits the
              remaining space instead of leaving a hole under the facts. */}
          <div className="lg:self-center">
            <p className="serif max-w-[46ch] text-[clamp(19px,2.4vw,26px)] leading-[1.35] text-bone">
              {project.summary}
            </p>

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
          </div>
        </div>
      </Reveal>

      {/* ---------------- the film ---------------- */}
      {featured && (
        <Reveal className="mt-16">
          <h2 className="klabel mb-5">The film</h2>
          <VideoPlayer film={featured} />
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
            <p className="serif text-[19px]">{featured.title}</p>
            {featured.description && (
              <p className="max-w-[56ch] text-[14px] text-bone-dim">
                {featured.description}
              </p>
            )}
          </div>
        </Reveal>
      )}

      {/* ---------------- body ---------------- */}
      <Reveal>
        <div className="prose-body mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-[220px_1fr]">
          <h2 className="klabel md:pt-1">About the film</h2>
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

      {/* ---------------- more cuts ---------------- */}
      {rest.length > 0 && (
        <Reveal className="mt-16">
          <h2 className="klabel mb-6">More cuts</h2>
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
      )}

      {/* ---------------- frames ---------------- */}
      {frames.length > 0 && (
        <Reveal className="mt-16">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="klabel">Frames from the film</h2>
            <span className="klabel">click to enlarge</span>
          </div>
          <GalleryGrid items={frames} columnsClass="sm:columns-2 lg:columns-3" />
        </Reveal>
      )}

      {/* ---------------- character design ---------------- */}
      {design.length > 0 && (
        <Reveal className="mt-16">
          {/*
            Sheets are documents, not frames: they sit inside a panel, keep
            their labels visible and never mix into the run of stills.
          */}
          <div className="rounded-xl border border-line bg-panel p-6 sm:p-9">
            <h2 className="klabel">Character design</h2>
            <p className="mt-3 mb-7 max-w-[56ch] text-[15px] text-bone-dim">
              The model sheets the film was built from — turnarounds,
              expressions and colour, locked before the first frame.
            </p>
            <GalleryGrid
              items={design}
              columnsClass="sm:columns-2"
              captions="below"
            />
          </div>
        </Reveal>
      )}

      <Reveal className="mt-16 border-t border-line pt-10">
        <p className="max-w-[56ch] text-[16px] text-bone-dim">
          Want something like this for your brand?{" "}
          <Link
            href="/contact"
            className="mono ml-1 border-b text-[13px] uppercase tracking-[0.06em]"
            style={{ color: project.accentColor, borderColor: project.accentColor }}
          >
            Start a project →
          </Link>
        </p>
      </Reveal>
    </article>
  );
}
