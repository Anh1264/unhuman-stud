import Image from "next/image";
import Link from "next/link";
import type { PromptEntrySummary } from "@/server/services/prompts.service";
import {
  formatPromptDate,
  promptExcerpt,
  STATUS_CHIP,
  STATUS_LABEL,
} from "@/lib/prompt-display";
import { cn } from "@/lib/utils";

/**
 * One entry in the prompt library, as a card.
 *
 * An entry can exist long before its pictures do — the prompt is written the
 * day it is run, the files land whenever the owner gets round to them. So the
 * card has two faces: with a built image it leads with the image, and without
 * one it leads with the prompt's own opening line set in the display italic.
 * Neither is a fallback for the other; both are finished cards.
 */
export function PromptCard({
  entry,
  headingLevel: Heading = "h3",
  priority = false,
}: {
  entry: PromptEntrySummary;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
}) {
  const preview = entry.preview;
  const showImage = Boolean(preview?.url && preview.width && preview.height);

  // Counts are worth printing only where there is something to count.
  const facts = [
    entry.blocks.length > 0
      ? `${entry.blocks.length} block${entry.blocks.length === 1 ? "" : "s"}`
      : null,
    entry.referenceCount > 0 ? `${entry.referenceCount} ref` : null,
    entry.outputCount > 0 ? `${entry.outputCount} out` : null,
  ].filter((f): f is string => f !== null);

  return (
    <Link
      href={`/lab/${entry.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel transition-all duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1 hover:border-line-2"
    >
      {showImage && preview ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
          <Image
            src={preview.url as string}
            alt={preview.note ?? `Result of the prompt “${entry.title}”`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 420px"
            placeholder={preview.blurDataUrl ? "blur" : "empty"}
            blurDataURL={preview.blurDataUrl ?? undefined}
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.05]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent"
          />
        </div>
      ) : (
        // No picture yet — so the prompt itself is the artwork. Its opening
        // words, set the way the site sets a pull quote.
        <div className="flex aspect-[16/10] items-center border-b border-line bg-panel-2 px-6 py-7">
          <p className="serif line-clamp-4 text-[clamp(17px,1.7vw,21px)] italic leading-[1.35] text-crimson-br">
            {promptExcerpt(entry.promptText, 120)}
          </p>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              "mono rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]",
              STATUS_CHIP[entry.status],
            )}
          >
            {STATUS_LABEL[entry.status]}
          </span>
          <time
            dateTime={entry.date}
            className="mono text-[11px] uppercase tracking-[0.16em] text-bone-faint"
          >
            {formatPromptDate(entry.date)}
          </time>
        </div>

        <Heading className="serif mt-4 text-[22px] leading-tight">
          {entry.title}
        </Heading>

        {entry.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
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

        <span className="mono mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-6 text-[11px] uppercase tracking-[0.12em] text-bone-faint transition-colors duration-300 group-hover:text-ember">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
          <span className="ml-auto">Open →</span>
        </span>
      </div>
    </Link>
  );
}
