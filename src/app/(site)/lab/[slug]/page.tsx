import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/site/CopyButton";
import { PromptAssetSection } from "@/components/site/PromptAssetSection";
import { Reveal } from "@/components/site/Reveal";
import {
  getPromptEntries,
  getPromptEntry,
} from "@/server/services/prompts.service";
import {
  formatPromptDate,
  promptExcerpt,
  STATUS_CHIP,
  STATUS_LABEL,
} from "@/lib/prompt-display";
import { pageMetadata } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const entries = await getPromptEntries();
  return entries.map(({ slug }) => ({ slug }));
}

/**
 * Static export can only ship the slugs known at build time; anything else has
 * to fall through to the 404 page rather than being rendered on demand.
 */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Next 16: params is a Promise and must be awaited.
  const { slug } = await params;
  const entry = await getPromptEntry(slug);

  if (!entry) {
    return { title: "Prompt not found", robots: { index: false, follow: true } };
  }

  const preview = entry.preview;

  return pageMetadata({
    title: entry.title,
    description: promptExcerpt(entry.promptText, 180),
    path: `/lab/${entry.slug}`,
    image:
      preview?.url && preview.width && preview.height
        ? {
            url: preview.url,
            width: preview.width,
            height: preview.height,
            alt: preview.note ?? `Result of the prompt “${entry.title}”`,
          }
        : undefined,
  });
}

export default async function PromptEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getPromptEntry(slug);
  if (!entry) notFound();

  const { outcome, derivedFrom, derivatives } = entry;
  const hasLineage = Boolean(derivedFrom) || derivatives.length > 0;

  return (
    <article className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal>
        <Link
          href="/lab"
          className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint transition-colors hover:text-ember"
        >
          ← Prompt lab
        </Link>
      </Reveal>

      {/* ---------------- 1. what this is ---------------- */}
      <Reveal delay={60} className="mt-8 max-w-[900px]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className={cn(
              "mono rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em]",
              STATUS_CHIP[entry.status],
            )}
          >
            {STATUS_LABEL[entry.status]}
          </span>
          <time
            dateTime={entry.date}
            className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint"
          >
            {formatPromptDate(entry.date)}
          </time>
        </div>

        <h1 className="mt-5 text-[clamp(32px,5.5vw,64px)] leading-[1.02]">
          {entry.title}
        </h1>

        {entry.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="mono rounded-full border border-crimson/50 bg-crimson/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ember"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {entry.tool && (
          <dl className="mt-8 border-t border-line pt-6">
            <dt className="klabel">Tool</dt>
            <dd className="serif mt-2 max-w-[56ch] text-[18px] text-bone">
              {entry.tool}
            </dd>
          </dl>
        )}
      </Reveal>

      {/* ---------------- 2. the prompt, verbatim ---------------- */}
      <section
        aria-labelledby="prompt-heading"
        className="mt-16 border-t border-line pt-12"
      >
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="prompt-heading" className="text-[clamp(24px,3.2vw,34px)]">
              The prompt
            </h2>
            <CopyButton text={entry.promptText} subject="the full prompt" />
          </div>
          <p className="mt-3 mb-7 max-w-[56ch] text-[15px] text-bone-dim">
            Word for word as it was sent — nothing rewrapped, nothing tidied.
          </p>

          {/*
            `pre` because this is verbatim text: the line breaks and the blank
            lines between paragraphs are part of the prompt. `pre-wrap` plus
            `break-words` keeps a long unbroken run from pushing the page
            sideways on a narrow screen.
          */}
          <pre className="mono max-w-[80ch] overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-line-2 bg-panel px-6 py-7 text-[13.5px] leading-[1.85] text-bone sm:px-8 sm:py-9 sm:text-[14.5px]">
            {entry.promptText}
          </pre>
        </Reveal>
      </section>

      {/* ---------------- 3. the reusable parts ---------------- */}
      {entry.blocks.length > 0 && (
        <section
          aria-labelledby="blocks-heading"
          className="mt-16 border-t border-line pt-12"
        >
          <Reveal>
            <h2 id="blocks-heading" className="text-[clamp(24px,3.2vw,34px)]">
              Blocks
            </h2>
            <p className="mt-3 mb-8 max-w-[56ch] text-[15px] text-bone-dim">
              The parts that did their job, named so they can be lifted whole
              into the next prompt instead of rewritten from memory.
            </p>
          </Reveal>

          <ul className="grid gap-4">
            {entry.blocks.map((block, i) => (
              <Reveal as="li" key={`${block.label}-${i}`} delay={Math.min(i, 6) * 50}>
                <div className="rounded-xl border border-line bg-panel p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="klabel">{block.label}</h3>
                    <CopyButton
                      text={block.text}
                      subject={`the ${block.label} block`}
                    />
                  </div>
                  <p className="mono mt-4 max-w-[80ch] whitespace-pre-wrap break-words text-[13.5px] leading-[1.8] text-bone-dim">
                    {block.text.trim()}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------- 4. what went in, what came back ---------------- */}
      <PromptAssetSection
        id="references"
        title="References"
        blurb="The pictures the model was given alongside the text."
        assets={entry.references}
        entryTitle={entry.title}
      />

      <PromptAssetSection
        id="outputs"
        title="Results"
        blurb="What came back from this prompt."
        assets={entry.outputs}
        entryTitle={entry.title}
      />

      {/* ---------------- 5. the verdict ---------------- */}
      {outcome && (
        <section
          aria-labelledby="outcome-heading"
          className="mt-16 border-t border-line pt-12"
        >
          <Reveal>
            <h2 id="outcome-heading" className="text-[clamp(24px,3.2vw,34px)]">
              Outcome
            </h2>

            {outcome.rating !== null && (
              <p className="mt-6 flex items-center gap-2">
                <span className="sr-only">
                  Rated {outcome.rating} out of 5.
                </span>
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    aria-hidden
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      step <= (outcome.rating ?? 0)
                        ? "bg-gold"
                        : "border border-line-2",
                    )}
                  />
                ))}
                <span className="mono ml-2 text-[11px] uppercase tracking-[0.16em] text-bone-faint">
                  {outcome.rating} / 5
                </span>
              </p>
            )}

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {outcome.worked && (
                <div>
                  <h3 className="klabel">What worked</h3>
                  <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
                    {outcome.worked}
                  </p>
                </div>
              )}
              {outcome.failed && (
                <div>
                  <h3 className="klabel">What failed</h3>
                  <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
                    {outcome.failed}
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------- 6. lineage, both directions ---------------- */}
      {hasLineage && (
        <section
          aria-labelledby="lineage-heading"
          className="mt-16 border-t border-line pt-12"
        >
          <Reveal>
            <h2 id="lineage-heading" className="text-[clamp(24px,3.2vw,34px)]">
              Lineage
            </h2>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {derivedFrom && (
                <div>
                  <h3 className="klabel">Derived from</h3>
                  <Link
                    href={`/lab/${derivedFrom.slug}`}
                    className="serif mt-3 inline-block max-w-[40ch] text-[19px] text-bone transition-colors hover:text-ember"
                  >
                    {derivedFrom.title} →
                  </Link>
                </div>
              )}

              {derivatives.length > 0 && (
                <div>
                  <h3 className="klabel">Grown out of this one</h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {derivatives.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/lab/${child.slug}`}
                          className="serif inline-block max-w-[40ch] text-[19px] text-bone transition-colors hover:text-ember"
                        >
                          {child.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      <Reveal className="mt-16 border-t border-line pt-10">
        <Link
          href="/lab"
          className="mono border-b border-ember pb-0.5 text-[12px] uppercase tracking-[0.06em] text-ember transition-colors hover:border-gold hover:text-gold"
        >
          Back to every prompt →
        </Link>
      </Reveal>
    </article>
  );
}
