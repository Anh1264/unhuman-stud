import type { PromptEntryStatus } from "@/lib/prompt-entry";

/**
 * Presentation helpers shared by the prompt library's server pages and its one
 * client component. Nothing here touches the database, so it is safe on both
 * sides of the boundary.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * `2026-08-02` → `2 Aug 2026`.
 *
 * Formatted by hand rather than through `Date`: the entry date is date-only,
 * and parsing it would drag in a timezone that can move it a day either way —
 * and would render differently on the build machine than in the browser, which
 * is a hydration mismatch waiting to happen.
 */
export function formatPromptDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export const STATUS_LABEL: Record<PromptEntryStatus, string> = {
  draft: "Draft",
  tested: "Tested",
  proven: "Proven",
  abandoned: "Abandoned",
};

/**
 * Chip styling per status, in Crimson Ink tokens only. Gold is the highlight,
 * so it goes to the one status that means "this works" — crimson to the one
 * that has been run, and the hairlines to the two that are still questions.
 */
export const STATUS_CHIP: Record<PromptEntryStatus, string> = {
  draft: "border-line-2 bg-panel-2 text-bone-dim",
  tested: "border-crimson/50 bg-crimson/15 text-ember",
  proven: "border-gold/50 bg-gold/15 text-gold",
  abandoned: "border-line bg-panel text-bone-faint",
};

/**
 * The opening of a prompt on one line, for card previews and meta
 * descriptions. Collapsing whitespace here is presentation only — the stored
 * prompt is never rewritten.
 */
export function promptExcerpt(text: string, max = 150): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]+$/, "")}…`;
}
