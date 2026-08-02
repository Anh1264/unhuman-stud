import { describe, expect, it } from "vitest";
import {
  parsePromptEntry,
  slugFromFileName,
  splitPromptFile,
} from "@/lib/prompt-entry";

/**
 * The format's contract. The load-bearing test is the first one: the body must
 * come out of the parser byte for byte as it went in, because a prompt that has
 * been reflowed is no longer the prompt that produced the result.
 */

const PROMPT_BODY = `A majestic, epic fight  between   two characters.

It starts with a super wide, smooth, stable flycam-like camera movement — then closes in.
    An indented line, two trailing spaces here:

24 different, distinct camera angles.`;

function file(frontmatter: string, body = PROMPT_BODY) {
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

const MINIMAL = `title: "A fight"\ndate: 2026-08-02`;

describe("the prompt body", () => {
  it("comes back byte for byte, including odd spacing and blank lines", () => {
    const entry = parsePromptEntry(file(MINIMAL), "2026-08-02-a-fight.md");
    expect(entry.promptText).toBe(PROMPT_BODY);
  });

  it("keeps a horizontal rule and stray dashes inside the prompt", () => {
    const body = "Shot one.\n\n---\n\nShot two -- with dashes.";
    const entry = parsePromptEntry(file(MINIMAL, body), "x.md");
    expect(entry.promptText).toBe(body);
  });

  it("drops only the blank lines between the frontmatter and the prompt", () => {
    const raw = `---\n${MINIMAL}\n---\n\n\n  Indented start.\n\n\n`;
    expect(parsePromptEntry(raw, "x.md").promptText).toBe("  Indented start.");
  });

  it("refuses a file with no frontmatter", () => {
    expect(() => parsePromptEntry("Just a prompt.\n", "x.md")).toThrow(
      /no frontmatter/,
    );
  });

  it("refuses a file with no prompt under the frontmatter", () => {
    expect(() => parsePromptEntry(`---\n${MINIMAL}\n---\n\n`, "x.md")).toThrow(
      /body is empty/,
    );
  });

  it("splits the file into frontmatter and body", () => {
    const { yaml, body } = splitPromptFile(file(MINIMAL));
    expect(yaml).toContain("title:");
    expect(body).toBe(PROMPT_BODY);
  });
});

describe("the slug", () => {
  it("comes from the filename, without a leading date", () => {
    expect(slugFromFileName("2026-08-02-samurai-vs-robot-fight.md")).toBe(
      "samurai-vs-robot-fight",
    );
    expect(slugFromFileName("no-date-here.md")).toBe("no-date-here");
  });

  it("is overridden by an explicit slug field", () => {
    const entry = parsePromptEntry(
      file(`${MINIMAL}\nslug: chosen-name`),
      "2026-08-02-a-fight.md",
    );
    expect(entry.slug).toBe("chosen-name");
  });

  it("falls back to the filename when the slug field is left empty", () => {
    const entry = parsePromptEntry(file(`${MINIMAL}\nslug:`), "2026-08-02-a-fight.md");
    expect(entry.slug).toBe("a-fight");
  });
});

describe("the optional fields", () => {
  it("reads everything as absent when the file only has a title and a date", () => {
    const entry = parsePromptEntry(file(MINIMAL), "2026-08-02-a-fight.md");

    expect(entry).toMatchObject({
      title: "A fight",
      date: "2026-08-02",
      status: "draft",
      tool: null,
      derivedFrom: null,
      tags: [],
      blocks: [],
      references: [],
      outputs: [],
      outcome: null,
    });
  });

  it("treats a field written with nothing after the colon as absent", () => {
    const entry = parsePromptEntry(
      file(`${MINIMAL}\ntool:\nderivedFrom:\ntags:\noutputs:\noutcome:`),
      "x.md",
    );
    expect(entry.tool).toBeNull();
    expect(entry.derivedFrom).toBeNull();
    expect(entry.tags).toEqual([]);
    expect(entry.outputs).toEqual([]);
    expect(entry.outcome).toBeNull();
  });

  it("reads blocks, references, outputs and lineage in order", () => {
    const entry = parsePromptEntry(
      file(
        [
          MINIMAL,
          "tool: Midjourney video, --ar 16:9",
          "derivedFrom: an-earlier-prompt",
          "tags:",
          "  - fight",
          "  - vfx",
          "blocks:",
          "  - label: Camera",
          "    text: |",
          "      starts with a super wide, smooth, stable flycam-like camera movement",
          "  - label: Pacing",
          "    text: non-stop, with a punchy ending",
          "references:",
          "  - file: setting.png",
          "    note: The setting",
          "  - file: samurai.png",
          "    note:",
          "outputs:",
          "  - file: take-01.mp4",
          "    note: First run",
        ].join("\n"),
      ),
      "x.md",
    );

    expect(entry.tool).toBe("Midjourney video, --ar 16:9");
    expect(entry.derivedFrom).toBe("an-earlier-prompt");
    expect(entry.tags).toEqual(["fight", "vfx"]);
    expect(entry.blocks).toEqual([
      {
        label: "Camera",
        text: "starts with a super wide, smooth, stable flycam-like camera movement",
      },
      { label: "Pacing", text: "non-stop, with a punchy ending" },
    ]);
    expect(entry.references).toEqual([
      { file: "setting.png", note: "The setting" },
      { file: "samurai.png", note: null },
    ]);
    expect(entry.outputs).toEqual([{ file: "take-01.mp4", note: "First run" }]);
  });

  it("accepts a single tag written without a list", () => {
    expect(parsePromptEntry(file(`${MINIMAL}\ntags: fight`), "x.md").tags).toEqual([
      "fight",
    ]);
  });
});

describe("the outcome", () => {
  it("is read when the owner has written any part of it", () => {
    const entry = parsePromptEntry(
      file(
        `${MINIMAL}\noutcome:\n  rating: 4\n  worked: The camera move\n  failed: The ending`,
      ),
      "x.md",
    );
    expect(entry.outcome).toEqual({
      rating: 4,
      worked: "The camera move",
      failed: "The ending",
    });
  });

  it("is absent when every part of it is empty", () => {
    const entry = parsePromptEntry(
      file(`${MINIMAL}\noutcome:\n  rating:\n  worked:\n  failed:`),
      "x.md",
    );
    expect(entry.outcome).toBeNull();
  });

  it("keeps a verdict written in words with no rating", () => {
    const entry = parsePromptEntry(
      file(`${MINIMAL}\noutcome:\n  worked: The aura VFX`),
      "x.md",
    );
    expect(entry.outcome).toEqual({
      rating: null,
      worked: "The aura VFX",
      failed: null,
    });
  });

  it("refuses a rating outside 1–5", () => {
    expect(() =>
      parsePromptEntry(file(`${MINIMAL}\noutcome:\n  rating: 9`), "x.md"),
    ).toThrow(/1 to 5/);
  });
});

describe("bad input", () => {
  it("names the file in every error", () => {
    expect(() => parsePromptEntry("nope", "2026-08-02-a-fight.md")).toThrow(
      /content\/prompts\/2026-08-02-a-fight\.md/,
    );
  });

  it("refuses a missing title", () => {
    expect(() => parsePromptEntry(file("date: 2026-08-02"), "x.md")).toThrow(
      /title/,
    );
  });

  it("refuses a date that is not a date", () => {
    expect(() =>
      parsePromptEntry(file(`title: A fight\ndate: last tuesday`), "x.md"),
    ).toThrow(/2026-08-02/);
  });

  it("refuses an unknown status", () => {
    expect(() =>
      parsePromptEntry(file(`${MINIMAL}\nstatus: nearly`), "x.md"),
    ).toThrow(/draft, tested, proven, abandoned/);
  });

  it("accepts the four statuses, in any case", () => {
    for (const [written, expected] of [
      ["draft", "draft"],
      ["Tested", "tested"],
      ["PROVEN", "proven"],
      ["abandoned", "abandoned"],
    ] as const) {
      const entry = parsePromptEntry(file(`${MINIMAL}\nstatus: ${written}`), "x.md");
      expect(entry.status).toBe(expected);
    }
  });

  it("refuses a block with no text", () => {
    expect(() =>
      parsePromptEntry(file(`${MINIMAL}\nblocks:\n  - label: Camera\n    text:`), "x.md"),
    ).toThrow(/blocks\.0\.text/);
  });

  it("refuses frontmatter that is not valid YAML", () => {
    expect(() =>
      parsePromptEntry(file(`title: "unclosed\ndate: 2026-08-02`), "x.md"),
    ).toThrow(/not valid YAML/);
  });
});
