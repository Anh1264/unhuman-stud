import Image from "next/image";
import Link from "next/link";
import type { ProjectDetail } from "@/server/services/content.service";
import { cn, formatDuration } from "@/lib/utils";

/**
 * One cell of the /work poster wall.
 *
 * Every project gets this exact treatment — same poster ratio, same copy, same
 * chips — so no entry reads as more important than its neighbours. The summary
 * paragraph is deliberately left out: equal-length copy is what keeps the cells
 * equal.
 */
export function ProjectPoster({
  project,
  priority = false,
  className,
}: {
  project: ProjectDetail;
  priority?: boolean;
  className?: string;
}) {
  const keyArt = project.gallery.find((g) => g.section === "KEY_ART");
  const film = project.films.find((f) => f.featured) ?? project.films[0];
  const runtime = formatDuration(film?.durationSeconds);
  const meta = [project.year ? String(project.year) : null, runtime].filter(
    (value): value is string => value !== null,
  );

  return (
    <Link
      href={`/work/${project.slug}`}
      aria-label={project.title}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel transition-all duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1",
        className,
      )}
      style={{ ["--accent" as string]: project.accentColor }}
    >
      {/* Portrait key art at its own 2:3 ratio, so the posters line up row to
          row and none of them is cropped to fit a landscape box. */}
      <div className="relative aspect-[2/3] overflow-hidden border-b border-line">
        {keyArt && (
          <Image
            src={keyArt.url}
            alt={keyArt.alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, (max-width: 1280px) 33vw, 23vw"
            placeholder={keyArt.blurDataUrl ? "blur" : "empty"}
            blurDataURL={keyArt.blurDataUrl ?? undefined}
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.04]"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-x-100"
          style={{ background: project.accentColor }}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="serif text-[22px] leading-tight transition-colors duration-300 group-hover:text-[color:var(--accent)]">
          {project.title}
        </h2>

        {project.tagline && (
          <p
            className="serif mt-1.5 text-[15px] italic"
            style={{ color: project.accentColor }}
          >
            {project.tagline}
          </p>
        )}

        {meta.length > 0 && (
          <p className="mono mt-3 text-[11px] uppercase tracking-[0.2em] text-bone-faint">
            {meta.join(" · ")}
          </p>
        )}

        {project.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
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
        )}
      </div>
    </Link>
  );
}
