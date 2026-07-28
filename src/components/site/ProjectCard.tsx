import Image from "next/image";
import Link from "next/link";
import type { ProjectSummary } from "@/server/services/content.service";
import { cn } from "@/lib/utils";

export function ProjectCard({
  project,
  priority = false,
  className,
  // The card sits under a section heading on the home page but directly under
  // the page h1 on /work, so the caller decides its level rather than skipping one.
  headingLevel: Heading = "h3",
}: {
  project: ProjectSummary;
  priority?: boolean;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-all duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1",
        className,
      )}
      style={{ ["--accent" as string]: project.accentColor }}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        {project.cover && (
          <Image
            src={project.cover.url}
            alt={project.cover.alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
            placeholder={project.cover.blurDataUrl ? "blur" : "empty"}
            blurDataURL={project.cover.blurDataUrl ?? undefined}
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.05]"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-bg/85 via-transparent to-transparent"
        />
        {/* Accent hairline drawn from the artwork itself. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-x-100"
          style={{ background: project.accentColor }}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3.5 flex flex-wrap gap-2">
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

        <Heading className="serif text-[26px] leading-tight">
          {project.title}
        </Heading>

        {project.tagline && (
          <p
            className="serif mt-1.5 text-[15px] italic"
            style={{ color: project.accentColor }}
          >
            {project.tagline}
          </p>
        )}

        {project.summary && (
          <p className="mt-3 max-w-[48ch] text-[14.5px] text-bone-dim">
            {project.summary}
          </p>
        )}

        <span className="mono mt-5 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-bone-faint transition-all duration-300 group-hover:gap-3 group-hover:text-[color:var(--accent)]">
          View project →
        </span>
      </div>
    </Link>
  );
}
