import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = {
  findPromptEntries: vi.fn(),
  findPromptEntryBySlug: vi.fn(),
};

vi.mock("@/server/repositories/prompts.repo", () => ({
  findPromptEntries: (...a: unknown[]) => repo.findPromptEntries(...a),
  findPromptEntryBySlug: (...a: unknown[]) => repo.findPromptEntryBySlug(...a),
}));

const service = await import("@/server/services/prompts.service");

const PROMPT_TEXT =
  "A majestic, epic fight.\n\n  Indented, and left exactly as written.";

function assetRow(overrides: Record<string, unknown> = {}) {
  return {
    role: "REFERENCE",
    kind: "IMAGE",
    file: "setting.png",
    note: "The setting",
    url: "/prompts/samurai-vs-robot-fight/setting.webp",
    width: 1600,
    height: 900,
    mimeType: "image/webp",
    blurDataUrl: "data:image/jpeg;base64,abc",
    ...overrides,
  };
}

function entryRow(overrides: Record<string, unknown> = {}) {
  return {
    slug: "samurai-vs-robot-fight",
    title: "Samurai vs Robot",
    entryDate: "2026-08-02",
    status: "DRAFT",
    promptText: PROMPT_TEXT,
    tool: null,
    outcomeRating: null,
    outcomeWorked: null,
    outcomeFailed: null,
    tags: [{ tag: "fight" }, { tag: "vfx" }],
    blocks: [{ label: "Camera", text: "a super wide flycam move" }],
    assets: [assetRow()],
    ...overrides,
  };
}

beforeEach(() => {
  repo.findPromptEntries.mockReset();
  repo.findPromptEntryBySlug.mockReset();
});

describe("getPromptEntries", () => {
  it("maps a row to the shape a card renders", async () => {
    repo.findPromptEntries.mockResolvedValue([entryRow()]);

    const [entry] = await service.getPromptEntries();

    expect(entry).toMatchObject({
      slug: "samurai-vs-robot-fight",
      title: "Samurai vs Robot",
      date: "2026-08-02",
      status: "draft",
      tool: null,
      tags: ["fight", "vfx"],
      blocks: [{ label: "Camera", text: "a super wide flycam move" }],
      outcome: null,
      referenceCount: 1,
      outputCount: 0,
    });
  });

  it("hands the prompt text through untouched", async () => {
    repo.findPromptEntries.mockResolvedValue([entryRow()]);

    const [entry] = await service.getPromptEntries();

    expect(entry.promptText).toBe(PROMPT_TEXT);
  });

  it("prefers a built output image as the preview, then a reference", async () => {
    repo.findPromptEntries.mockResolvedValue([
      entryRow({
        assets: [
          assetRow(),
          assetRow({ role: "OUTPUT", file: "take-01.png", url: "/o.webp" }),
        ],
      }),
      entryRow({ slug: "b" }),
      entryRow({
        slug: "c",
        assets: [assetRow({ url: null }), assetRow({ role: "OUTPUT", kind: "VIDEO" })],
      }),
    ]);

    const [withOutput, withReference, withNothingBuilt] =
      await service.getPromptEntries();

    expect(withOutput.preview?.url).toBe("/o.webp");
    expect(withReference.preview?.url).toBe(
      "/prompts/samurai-vs-robot-fight/setting.webp",
    );
    // A file the owner has not built yet, and a video: neither is a still.
    expect(withNothingBuilt.preview).toBeNull();
  });

  it("keeps a reference whose file has not been built, url and all", async () => {
    repo.findPromptEntries.mockResolvedValue([
      entryRow({
        assets: [assetRow({ url: null, width: null, height: null })],
      }),
    ]);

    const [entry] = await service.getPromptEntries();
    const detail = entry as unknown as { referenceCount: number };

    expect(detail.referenceCount).toBe(1);
    expect(entry.preview).toBeNull();
  });
});

describe("getPromptEntry", () => {
  it("splits the files into references and outputs and reads the lineage", async () => {
    repo.findPromptEntryBySlug.mockResolvedValue({
      ...entryRow({
        assets: [
          assetRow(),
          assetRow({
            role: "OUTPUT",
            kind: "VIDEO",
            file: "take-01.mp4",
            note: "First run",
            url: "/prompts/x/take-01.mp4",
          }),
        ],
      }),
      derivedFrom: { slug: "earlier", title: "Earlier prompt" },
      derivatives: [{ slug: "later", title: "Later prompt" }],
    });

    const entry = await service.getPromptEntry("samurai-vs-robot-fight");

    expect(entry?.references.map((r) => r.file)).toEqual(["setting.png"]);
    expect(entry?.outputs).toEqual([
      {
        file: "take-01.mp4",
        note: "First run",
        kind: "VIDEO",
        url: "/prompts/x/take-01.mp4",
        width: 1600,
        height: 900,
        mimeType: "image/webp",
        blurDataUrl: "data:image/jpeg;base64,abc",
      },
    ]);
    expect(entry?.derivedFrom).toEqual({
      slug: "earlier",
      title: "Earlier prompt",
    });
    expect(entry?.derivatives).toEqual([
      { slug: "later", title: "Later prompt" },
    ]);
  });

  it("reports an outcome the owner has written, rating or not", async () => {
    repo.findPromptEntryBySlug.mockResolvedValue({
      ...entryRow({
        status: "PROVEN",
        outcomeRating: null,
        outcomeWorked: "  The camera move  ",
        outcomeFailed: "   ",
      }),
      derivedFrom: null,
      derivatives: [],
    });

    const entry = await service.getPromptEntry("samurai-vs-robot-fight");

    expect(entry?.status).toBe("proven");
    expect(entry?.outcome).toEqual({
      rating: null,
      worked: "The camera move",
      failed: null,
    });
  });

  it("returns null for an unknown slug", async () => {
    repo.findPromptEntryBySlug.mockResolvedValue(undefined);

    expect(await service.getPromptEntry("nope")).toBeNull();
  });
});
