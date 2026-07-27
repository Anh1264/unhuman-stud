import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { getProjects } from "@/server/services/content.service";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Original AI films, creature design and character work from Unhuman Stud.",
};

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">01 — Selected work</span>
        <h2 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Projects &amp; <em className="italic text-crimson-br">worlds</em>
        </h2>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Every project here was written, designed, generated, graded and cut by
          one person. Open any of them for the full frames.
        </p>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 60}>
            <ProjectCard project={project} priority={i < 2} className="h-full" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
