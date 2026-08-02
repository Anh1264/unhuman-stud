import { beforeEach, describe, expect, it, vi } from "vitest";

type DbModule = typeof import("@/server/db/client");

const findManyEntries = vi.fn();
const findFirstEntry = vi.fn();

vi.mock("@/server/db/client", () => ({
  // No PGlite: `.data/` is never opened by the test suite.
  db: {
    query: {
      promptEntries: {
        findMany: (...a: unknown[]) => findManyEntries(...a),
        findFirst: (...a: unknown[]) => findFirstEntry(...a),
      },
    },
  } as unknown as DbModule["db"],
}));

const repo = await import("@/server/repositories/prompts.repo");
const { promptEntries } = await import("@/server/db/schema");
const { desc, eq } = await import("drizzle-orm");

beforeEach(() => {
  findManyEntries.mockReset();
  findFirstEntry.mockReset();
});

describe("findPromptEntries", () => {
  it("returns every entry, newest first, with tags, files and blocks", async () => {
    const rows = [{ slug: "samurai-vs-robot-fight" }];
    findManyEntries.mockResolvedValue(rows);

    expect(await repo.findPromptEntries()).toBe(rows);

    const [args] = findManyEntries.mock.calls[0];
    expect(args.orderBy).toEqual([
      desc(promptEntries.entryDate),
      desc(promptEntries.createdAt),
    ]);
    expect(Object.keys(args.with).sort()).toEqual(["assets", "blocks", "tags"]);
    // No status filter: the library shows drafts and abandoned prompts too —
    // a prompt that failed is the point of keeping the note.
    expect(args.where).toBeUndefined();
  });
});

describe("findPromptEntryBySlug", () => {
  it("filters by slug and loads the lineage in both directions", async () => {
    findFirstEntry.mockResolvedValue({ slug: "samurai-vs-robot-fight" });

    await repo.findPromptEntryBySlug("samurai-vs-robot-fight");

    const [args] = findFirstEntry.mock.calls[0];
    expect(args.where).toEqual(
      eq(promptEntries.slug, "samurai-vs-robot-fight"),
    );
    expect(Object.keys(args.with).sort()).toEqual([
      "assets",
      "blocks",
      "derivatives",
      "derivedFrom",
      "tags",
    ]);
  });

  it("returns whatever the query returns for an unknown slug", async () => {
    findFirstEntry.mockResolvedValue(undefined);

    expect(await repo.findPromptEntryBySlug("nope")).toBeUndefined();
  });
});
