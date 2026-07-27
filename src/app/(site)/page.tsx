import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/site-metadata";
import { ProjectCard } from "@/components/site/ProjectCard";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import {
  getFilms,
  getProjects,
  getStudioStats,
} from "@/server/services/content.service";

export const metadata: Metadata = pageMetadata({
  title: "Unhuman Stud — Aiden Vu",
  exactTitle: true,
  description:
    "Unhuman Stud is the studio of Aiden Vu — cinematic AI films, creature design, and campaign visuals. Written, directed, scored and edited by one person.",
  path: "/",
});

export default async function HomePage() {
  const [projects, films, stats] = await Promise.all([
    getProjects(),
    getFilms(),
    getStudioStats(),
  ]);

  const hero = films.find((f) => f.featured) ?? films[0];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-16 sm:px-8 lg:pt-24">
        <Reveal>
          <span className="eyebrow text-[17px]">A studio of one — Est. 2026</span>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-5 text-[clamp(46px,8.5vw,104px)] font-semibold leading-[0.98] tracking-[-0.02em]">
            Worlds, made
            <br />
            by <em className="italic text-crimson-br">one</em> hand.
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-7 max-w-[56ch] text-[clamp(16px,2vw,19px)] text-bone-dim">
            <strong className="font-medium text-bone">Unhuman Stud</strong> is the
            studio of Aiden Vu — original AI films, creature design, and campaign
            visuals.{" "}
            <strong className="font-medium text-bone">
              Written, directed, scored and edited by one person.
            </strong>
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link
              href="/work"
              className="rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
            >
              View the work
            </Link>
            <Link
              href="/films"
              className="rounded-full border border-line-2 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:border-ember hover:text-ember"
            >
              Watch films
            </Link>
          </div>
        </Reveal>

        {hero && (
          <Reveal delay={240}>
            <div className="mt-14">
              <VideoPlayer film={hero} priority />
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                  Featured — {hero.projectTitle ?? hero.title}
                </p>
                {hero.description && (
                  <p className="max-w-[56ch] text-[14px] text-bone-dim">
                    {hero.description}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={300}>
          <dl className="mt-16 flex flex-wrap gap-x-14 gap-y-8 border-t border-line pt-8">
            {/*
              A definition list needs its <dt> before its <dd>; the design shows
              the number first, so the pair is reversed visually, not in the DOM.
            */}
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-bone-faint">
                  {stat.label}
                </dt>
                <dd className="serif text-[40px] font-semibold leading-none">
                  {stat.value}
                  {stat.suffix && <span className="text-gold">{stat.suffix}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ---------------- SELECTED WORK ---------------- */}
      <section className="mx-auto max-w-[1180px] px-6 py-20 sm:px-8">
        <Reveal className="mb-12 max-w-[640px]">
          <span className="klabel">01 — Selected work</span>
          <h2 className="mt-3 text-[clamp(32px,5vw,52px)]">
            Projects &amp; <em className="italic text-crimson-br">worlds</em>
          </h2>
          <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
            Original films and character work — each one built end to end by a
            single operator.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 60}>
              <ProjectCard
                project={project}
                priority={i === 0}
                className="h-full"
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
