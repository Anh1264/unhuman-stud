import type { Metadata } from "next";
import Link from "next/link";
import { VideoPlayer } from "@/components/site/VideoPlayer";
import { Reveal } from "@/components/site/Reveal";
import { getFilms } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Films",
  description:
    "Original short films and cuts from Unhuman Stud — AI-generated motion written, directed and edited by Aiden Vu.",
  path: "/films",
});

export default async function FilmsPage() {
  const films = await getFilms();
  const [hero, ...rest] = films;

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">02 — Motion</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Films &amp; <em className="italic text-crimson-br">cuts</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Nothing streams until you press play — each film loads only when you
          ask for it.
        </p>
      </Reveal>

      {hero && (
        <Reveal>
          <VideoPlayer film={hero} priority />
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="serif text-[27px]">{hero.title}</h2>
              {hero.description && (
                <p className="mt-1.5 max-w-[70ch] text-[15px] text-bone-dim">
                  {hero.description}
                </p>
              )}
            </div>
            {hero.projectSlug && (
              <Link
                href={`/work/${hero.projectSlug}`}
                className="mono border-b border-ember pb-0.5 text-[12px] uppercase tracking-[0.06em] text-ember hover:border-gold hover:text-gold"
              >
                Project →
              </Link>
            )}
          </div>
        </Reveal>
      )}

      {rest.length > 0 && (
        <>
          <div className="mt-16 mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="serif text-[22px]">More films</h2>
            <span className="klabel">tap to play</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((film, i) => (
              <Reveal key={film.slug} delay={i * 60}>
                <VideoPlayer film={film} />
                <h3 className="serif mt-3 text-[18px]">{film.title}</h3>
                {film.projectTitle && (
                  <p className="mono mt-1 text-[11px] uppercase tracking-[0.14em] text-bone-faint">
                    {film.projectTitle}
                  </p>
                )}
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
