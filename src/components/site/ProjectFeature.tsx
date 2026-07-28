import Image from "next/image";
import Link from "next/link";
import type { ProjectDetail } from "@/server/services/content.service";
import { cn, formatDuration } from "@/lib/utils";

/**
 * The lead project, presented as a feature rather than as a card.
 *
 * A studio with one film has nothing to put in a grid — a lone card in a
 * two-column layout reads as a page that failed to load. This gives the work
 * the room it deserves instead: the portrait key art at its true ratio beside
 * the copy, the facts of the film, and a strip of frames underneath.
 */
export function ProjectFeature({
  project,
  className,
  priority = false,
  // Sits under a section heading on the home page and directly under the page
  // h1 on /work, so the caller picks the level rather than skipping one.
  headingLevel: Heading = "h2",
}: {
  project: ProjectDetail;
  className?: string;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const keyArt = project.gallery.find((g) => g.section === "KEY_ART");
  const frames = project.gallery.filter((g) => g.section === "FRAME");
  const film = project.films.find((f) => f.featured) ?? project.films[0];

  const runtime = formatDuration(film?.durationSeconds);
  const facts = [
    project.year ? { label: "Year", value: String(project.year) } : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    film?.width && film?.height
      ? { label: "Master", value: `${film.width} × ${film.height}` }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14",
        className,
      )}
      style={{ ["--accent" as string]: project.accentColor }}
    >
      {/* Key art. Portrait, and shown at its own ratio — never cropped to fit
          a card and never letterboxed into a landscape box. */}
      {keyArt && (
        <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-line bg-panel">
          <Image
            src={keyArt.url}
            alt={keyArt.alt}
            width={keyArt.width}
            height={keyArt.height}
            priority={priority}
            sizes="(max-width: 1024px) 92vw, 420px"
            placeholder={keyArt.blurDataUrl ? "blur" : "empty"}
            blurDataURL={keyArt.blurDataUrl ?? undefined}
            className="w-full"
          />
        </div>
      )}

      <div className="flex flex-col">
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

        <Heading className="text-[clamp(30px,4.4vw,50px)] leading-[1.02]">
          <Link
            href={`/work/${project.slug}`}
            className="transition-colors duration-300 hover:text-[color:var(--accent)]"
          >
            {project.title}
          </Link>
        </Heading>

        {project.tagline && (
          <p
            className="serif mt-3 text-[clamp(17px,2.2vw,22px)] italic"
            style={{ color: project.accentColor }}
          >
            {project.tagline}
          </p>
        )}

        {project.summary && (
          <p className="mt-5 max-w-[56ch] text-[16px] text-bone-dim">
            {project.summary}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-12 gap-y-5 border-t border-line pt-6">
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

        <div className="mt-8">
          <Link
            href={`/work/${project.slug}`}
            className="inline-block rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
          >
            Open the project
          </Link>
        </div>

        {frames.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
            {frames.map((frame) => (
              <div
                key={frame.url}
                className="overflow-hidden rounded-lg border border-line bg-panel"
              >
                <Image
                  src={frame.url}
                  alt={frame.alt}
                  width={frame.width}
                  height={frame.height}
                  sizes="(max-width: 1024px) 30vw, 380px"
                  placeholder={frame.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={frame.blurDataUrl ?? undefined}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
