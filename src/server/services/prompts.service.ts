import "server-only";

import * as repo from "../repositories/prompts.repo";
import type { PromptEntryStatus } from "@/lib/prompt-entry";

export type { PromptEntryStatus };

/**
 * Business layer for the prompt library. Turns rows into the shapes a page
 * renders: lowercase status, files split into references and outputs, and an
 * outcome that is absent rather than three empty strings when the owner has
 * not reported back yet.
 */

/**
 * A file attached to a prompt. `url` is null when the owner has written the
 * entry but not yet dropped the file into `assets-source/prompts/<slug>/` —
 * the note still says what it was, so the UI shows the note and a gap rather
 * than pretending the reference does not exist.
 */
export type PromptAsset = {
  file: string;
  note: string | null;
  kind: "IMAGE" | "VIDEO";
  url: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  blurDataUrl: string | null;
};

/** A named, reusable part of a prompt — the piece the next prompt borrows. */
export type PromptBlock = { label: string; text: string };

/** The owner's verdict. Only present once he has written something in it. */
export type PromptOutcome = {
  /** 1–5, or null when he rated the result in words only. */
  rating: number | null;
  worked: string | null;
  failed: string | null;
};

/** A neighbour in the lineage — what an entry grew out of, or into. */
export type PromptLink = { slug: string; title: string };

export type PromptEntrySummary = {
  slug: string;
  title: string;
  /** `YYYY-MM-DD` — date only, no time and no timezone. */
  date: string;
  status: PromptEntryStatus;
  tool: string | null;
  tags: string[];
  /** The prompt itself, exactly as authored. */
  promptText: string;
  blocks: PromptBlock[];
  outcome: PromptOutcome | null;
  referenceCount: number;
  outputCount: number;
  /** The best single image for a card: a built output, else a built reference. */
  preview: PromptAsset | null;
};

export type PromptEntryDetail = PromptEntrySummary & {
  references: PromptAsset[];
  outputs: PromptAsset[];
  derivedFrom: PromptLink | null;
  derivatives: PromptLink[];
};

/* ---------------------------------------------------------------- mappers */

type AssetRow = {
  role: "REFERENCE" | "OUTPUT";
  kind: "IMAGE" | "VIDEO";
  file: string;
  note: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  blurDataUrl: string | null;
};

type EntryRow = {
  slug: string;
  title: string;
  entryDate: string;
  status: "DRAFT" | "TESTED" | "PROVEN" | "ABANDONED";
  promptText: string;
  tool: string | null;
  outcomeRating: number | null;
  outcomeWorked: string | null;
  outcomeFailed: string | null;
  tags: { tag: string }[];
  blocks: { label: string; text: string }[];
  assets: AssetRow[];
};

function toAsset(row: AssetRow): PromptAsset {
  return {
    file: row.file,
    note: row.note,
    kind: row.kind,
    url: row.url,
    width: row.width,
    height: row.height,
    mimeType: row.mimeType,
    blurDataUrl: row.blurDataUrl,
  };
}

function toOutcome(row: EntryRow): PromptOutcome | null {
  const worked = row.outcomeWorked?.trim() || null;
  const failed = row.outcomeFailed?.trim() || null;
  if (row.outcomeRating === null && !worked && !failed) return null;
  return { rating: row.outcomeRating, worked, failed };
}

function toLink(row: { slug: string; title: string }): PromptLink {
  return { slug: row.slug, title: row.title };
}

function toSummary(row: EntryRow): PromptEntrySummary {
  const references = row.assets.filter((a) => a.role === "REFERENCE");
  const outputs = row.assets.filter((a) => a.role === "OUTPUT");
  // A card wants a picture, and the result is the more interesting one; fall
  // back to an input, then to nothing at all rather than a stand-in image.
  const preview =
    outputs.find((a) => a.url && a.kind === "IMAGE") ??
    references.find((a) => a.url && a.kind === "IMAGE") ??
    null;

  return {
    slug: row.slug,
    title: row.title,
    date: row.entryDate,
    status: row.status.toLowerCase() as PromptEntryStatus,
    tool: row.tool?.trim() || null,
    tags: row.tags.map((t) => t.tag),
    promptText: row.promptText,
    blocks: row.blocks.map((b) => ({ label: b.label, text: b.text })),
    outcome: toOutcome(row),
    referenceCount: references.length,
    outputCount: outputs.length,
    preview: preview ? toAsset(preview) : null,
  };
}

/* ---------------------------------------------------------------- reads */

/** Every entry, newest first. */
export async function getPromptEntries(): Promise<PromptEntrySummary[]> {
  const rows = await repo.findPromptEntries();
  return rows.map(toSummary);
}

export async function getPromptEntry(
  slug: string,
): Promise<PromptEntryDetail | null> {
  const row = await repo.findPromptEntryBySlug(slug);
  if (!row) return null;

  return {
    ...toSummary(row),
    references: row.assets.filter((a) => a.role === "REFERENCE").map(toAsset),
    outputs: row.assets.filter((a) => a.role === "OUTPUT").map(toAsset),
    derivedFrom: row.derivedFrom ? toLink(row.derivedFrom) : null,
    derivatives: row.derivatives.map(toLink),
  };
}
