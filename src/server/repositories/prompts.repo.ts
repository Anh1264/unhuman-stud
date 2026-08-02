import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  promptAssets,
  promptBlocks,
  promptEntries,
  promptTags,
} from "../db/schema";

/**
 * Data access for the prompt library. No business rules and no formatting —
 * services turn these rows into the shapes the UI renders.
 */

/** Newest first: the library is a working log, and the last entry is the live one. */
const newestFirst = [desc(promptEntries.entryDate), desc(promptEntries.createdAt)];

/**
 * Relations every prompt read needs, each in the order the owner authored it.
 * The library is a handful of entries, so the list loads the same relations as
 * the detail read rather than paying for a second round trip per card.
 */
const entryWith = {
  tags: { orderBy: [asc(promptTags.sortOrder)] },
  assets: { orderBy: [asc(promptAssets.sortOrder)] },
  blocks: { orderBy: [asc(promptBlocks.sortOrder)] },
};

export async function findPromptEntries() {
  return db.query.promptEntries.findMany({
    orderBy: newestFirst,
    with: entryWith,
  });
}

export async function findPromptEntryBySlug(slug: string) {
  return db.query.promptEntries.findFirst({
    where: eq(promptEntries.slug, slug),
    with: {
      ...entryWith,
      // Lineage in both directions: what this prompt grew out of, and what has
      // since grown out of it.
      derivedFrom: true,
      derivatives: { orderBy: newestFirst },
    },
  });
}
