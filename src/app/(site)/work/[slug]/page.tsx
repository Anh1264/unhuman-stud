import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import { getProject, getProjectSlugs } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

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
          {project.year && (
            <span className="mono rounded-full border border-line-2 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-bone-faint">
              {project.year}
            </span>
          )}
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

      {/* ---------------- featured film ---------------- */}
      {featured && (
        <Reveal delay={120} className="mt-12">
          <VideoPlayer film={featured} priority />
        </Reveal>
      )}

      {/* ---------------- body ---------------- */}
      <Reveal delay={160}>
        <div className="prose-body mt-14 grid gap-10 border-t border-line pt-12 md:grid-cols-[220px_1fr]">
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
      {project.gallery.length > 0 && (
        <Reveal className="mt-16">
          <h2 className="klabel mb-6">Frames &amp; key art</h2>
          <GalleryGrid items={project.gallery} columnsClass="sm:columns-2" />
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
