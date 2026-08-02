"use client";

import { useMemo, useState } from "react";
import { PromptCard } from "@/components/site/PromptCard";
import { Reveal } from "@/components/site/Reveal";
import type { PromptEntrySummary } from "@/server/services/prompts.service";
import type { PromptEntryStatus } from "@/lib/prompt-entry";
import { STATUS_CHIP, STATUS_LABEL } from "@/lib/prompt-display";
import { cn } from "@/lib/utils";

const ALL = "all" as const;
type Choice<T extends string> = T | typeof ALL;

/**
 * The prompt board: every entry, newest first, with a filter over the top.
 *
 * The filtering is deliberately client-only — the site is a static export, so
 * there is no server to ask, and a URL per tag combination would be a hundred
 * near-identical pages in the sitemap. Because a client component is still
 * pre-rendered into the HTML at build time, the no-JavaScript view is this
 * component's initial state: every entry, unfiltered. The filter bar carries
 * `.js-only` and is hidden in that case, so nothing on the page is a control
 * that cannot work.
 *
 * A group of choices only appears when there is a choice to make — one status
 * across the whole library is a fact, not a filter.
 */
export function PromptLibrary({ entries }: { entries: PromptEntrySummary[] }) {
  const statuses = useMemo(() => {
    const order: PromptEntryStatus[] = [
      "proven",
      "tested",
      "draft",
      "abandoned",
    ];
    const present = new Set(entries.map((e) => e.status));
    return order.filter((s) => present.has(s));
  }, [entries]);

  const tags = useMemo(
    () =>
      [...new Set(entries.flatMap((e) => e.tags))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [entries],
  );

  const [status, setStatus] = useState<Choice<PromptEntryStatus>>(ALL);
  const [tag, setTag] = useState<Choice<string>>(ALL);

  const visible = entries.filter(
    (entry) =>
      (status === ALL || entry.status === status) &&
      (tag === ALL || entry.tags.includes(tag)),
  );

  const showStatusFilter = statuses.length > 1;
  const showTagFilter = tags.length > 1;
  const showFilters = showStatusFilter || showTagFilter;

  const reset = () => {
    setStatus(ALL);
    setTag(ALL);
  };

  return (
    <>
      {showFilters && (
        <Reveal className="js-only mb-10 border-y border-line py-6">
          <div className="flex flex-col gap-5">
            {showStatusFilter && (
              <FilterRow label="Status">
                <FilterButton
                  active={status === ALL}
                  onClick={() => setStatus(ALL)}
                >
                  All
                </FilterButton>
                {statuses.map((value) => (
                  <FilterButton
                    key={value}
                    active={status === value}
                    activeClassName={STATUS_CHIP[value]}
                    onClick={() => setStatus(value)}
                  >
                    {STATUS_LABEL[value]}
                  </FilterButton>
                ))}
              </FilterRow>
            )}

            {showTagFilter && (
              <FilterRow label="Tag">
                <FilterButton active={tag === ALL} onClick={() => setTag(ALL)}>
                  All
                </FilterButton>
                {tags.map((value) => (
                  <FilterButton
                    key={value}
                    active={tag === value}
                    onClick={() => setTag(value)}
                  >
                    {value}
                  </FilterButton>
                ))}
              </FilterRow>
            )}
          </div>

          <p role="status" aria-live="polite" className="klabel mt-5">
            {visible.length === entries.length
              ? `${entries.length} prompt${entries.length === 1 ? "" : "s"}`
              : `${visible.length} of ${entries.length} prompts`}
          </p>
        </Reveal>
      )}

      {visible.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((entry, i) => (
            <Reveal as="li" key={entry.slug} delay={Math.min(i, 6) * 60}>
              {/* The cards sit directly under the page h1, with no section
                  heading between, so their titles are the h2 level. */}
              <PromptCard entry={entry} headingLevel="h2" priority={i === 0} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-panel px-7 py-12 text-center">
          <p className="serif text-[20px] italic text-bone-dim">
            Nothing filed under that combination yet.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mono mt-5 cursor-pointer rounded-full border border-line-2 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-bone-faint transition-colors hover:border-ember hover:text-ember"
          >
            Show every prompt
          </button>
        </div>
      )}
    </>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="klabel sm:w-[70px] sm:shrink-0 sm:pt-1.5">{label}</span>
      <div
        role="group"
        aria-label={`Filter by ${label.toLowerCase()}`}
        className="flex flex-wrap gap-2"
      >
        {children}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  activeClassName = "border-crimson bg-crimson/20 text-ember",
  onClick,
  children,
}: {
  active: boolean;
  activeClassName?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mono cursor-pointer rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors duration-300",
        active
          ? activeClassName
          : "border-line bg-panel text-bone-faint hover:border-ember hover:text-ember",
      )}
    >
      {children}
    </button>
  );
}
