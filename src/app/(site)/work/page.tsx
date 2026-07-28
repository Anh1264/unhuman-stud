import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/ProjectCard";
import { ProjectFeature } from "@/components/site/ProjectFeature";
import { Reveal } from "@/components/site/Reveal";
import { getProject, getProjects } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "NU & TIB: CEASEFIRE — the first long-form film from Unhuman Stud, written, designed, generated, graded and cut by one person.",
  path: "/work",
});

export default async function WorkPage() {
  const projects = await getProjects();

  // The lead project is presented in full rather than as a card: with a single
  // film on the site, a one-item grid reads as a page that failed to load.
  const [lead, ...rest] = projects;
  const leadDetail = lead ? await getProject(lead.slug) : null;

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">01 — Selected work</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Projects &amp; <em className="italic text-crimson-br">worlds</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Written, designed, generated, graded and cut by one person. Open the
          project for the film, the frames and the character sheets.
        </p>
      </Reveal>

      {leadDetail && (
        <Reveal>
          <ProjectFeature project={leadDetail} headingLevel="h2" priority />
        </Reveal>
      )}

      {rest.length > 0 && (
        <>
          <Reveal className="mt-20 mb-6">
            <h2 className="klabel">More projects</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {rest.map((project, i) => (
              <Reveal key={project.slug} delay={i * 60}>
                <ProjectCard
                  project={project}
                  headingLevel="h3"
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
