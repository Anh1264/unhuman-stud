import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { getProjects } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "Original AI films, creature design and character work from Unhuman Stud — every project written, generated, graded and cut by one person.",
  path: "/work",
});

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">01 — Selected work</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Projects &amp; <em className="italic text-crimson-br">worlds</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Every project here was written, designed, generated, graded and cut by
          one person. Open any of them for the full frames.
        </p>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 60}>
            <ProjectCard
              project={project}
              priority={i < 2}
              headingLevel="h2"
              className="h-full"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
