import type { Metadata } from "next";
import { ProjectPoster } from "@/components/site/ProjectPoster";
import { Reveal } from "@/components/site/Reveal";
import {
  getProject,
  getProjects,
  type ProjectDetail,
} from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "Every project from Unhuman Stud — written, designed, generated, graded and cut by one person.",
  path: "/work",
});

export default async function WorkPage() {
  const summaries = await getProjects();

  // The poster lives in each project's gallery, so the wall needs the detail
  // record for every project. Static build — one round of parallel reads.
  const projects = (
    await Promise.all(summaries.map((p) => getProject(p.slug)))
  ).filter((p): p is ProjectDetail => p !== null);

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">01 — Selected work</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Projects &amp; <em className="italic text-crimson-br">worlds</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Open any project for the film, the frames and the character sheets.
        </p>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 60} className="h-full">
            <ProjectPoster project={project} priority={i === 0} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
