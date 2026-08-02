/**
 * The prompt library's authoring format.
 *
 * One markdown file per prompt in `content/prompts/`: a YAML frontmatter block
 * of metadata, then the full prompt as the body. This module turns that file
 * into a plain object, and it is the only place the format is defined —
 * `scripts/seed.ts` reads the files and hands each one here.
 *
 * The single rule this module exists to enforce: **the body is never
 * rewritten.** No re-wrapping, no smart quotes, no collapsing of blank lines.
 * Only the blank lines that separate the body from the frontmatter and the file
 * end are dropped, because those belong to the file, not to the prompt. A
 * prompt that has been tidied is no longer the prompt that produced the result.
 *
 * The format is documented for the owner in `content/prompts/README.md`.
 */
import yaml from "js-yaml";
import { z } from "zod";

export const PROMPT_STATUSES = [
  "draft",
  "tested",
  "proven",
  "abandoned",
] as const;

export type PromptEntryStatus = (typeof PROMPT_STATUSES)[number];

/** A named, reusable part of a prompt — "Camera", "Lighting", "Ending". */
export type ParsedPromptBlock = { label: string; text: string };

/** A file fed to the model, or one it produced. */
export type ParsedPromptAsset = { file: string; note: string | null };

/** The owner's verdict. Null until he has run the prompt and reported back. */
export type ParsedPromptOutcome = {
  rating: number | null;
  worked: string | null;
  failed: string | null;
};

export type ParsedPromptEntry = {
  slug: string;
  title: string;
  /** ISO date, `YYYY-MM-DD`. Date-only: there is no time and no timezone. */
  date: string;
  status: PromptEntryStatus;
  /** Model / version / settings, free text. Null when not recorded. */
  tool: string | null;
  tags: string[];
  blocks: ParsedPromptBlock[];
  references: ParsedPromptAsset[];
  outputs: ParsedPromptAsset[];
  /** Null when the owner has written no verdict at all. */
  outcome: ParsedPromptOutcome | null;
  /** Slug of the entry this one was composed from. */
  derivedFrom: string | null;
  /** The prompt itself, byte-for-byte as authored. */
  promptText: string;
};

/* ------------------------------------------------------------------ schema */

/** `key:` with nothing after it parses as null — that means "not written". */
const optionalText = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const text = String(v).trim();
    return text === "" ? null : text;
  });

const requiredText = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const text = String(v).trim();
  if (text === "") {
    ctx.addIssue({ code: "custom", message: "must not be empty" });
    return z.NEVER;
  }
  return text;
});

/**
 * Dates are read with the JSON schema below, so `2026-08-02` arrives as a
 * string. A `Date` is still accepted, in case a file is ever parsed with a
 * YAML schema that resolves timestamps.
 */
const isoDate = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const text = v instanceof Date ? v.toISOString().slice(0, 10) : v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    ctx.addIssue({
      code: "custom",
      message: `must be a date like 2026-08-02, not "${text}"`,
    });
    return z.NEVER;
  }
  return text;
});

/**
 * A list that may be written as a list, as a single value (`tags: fight`), or
 * left empty. Normalising before validating rather than with a union keeps the
 * error messages pointing at the exact item — `blocks.0.text`, not `blocks`.
 */
function listOf<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]),
    z.array(item),
  );
}

const blockSchema = z.object({
  label: requiredText,
  text: requiredText,
});

const assetSchema = z.object({
  file: requiredText,
  note: optionalText,
});

const outcomeSchema = z.object({
  rating: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === null || v === undefined || String(v).trim() === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        ctx.addIssue({
          code: "custom",
          message: `rating must be a whole number from 1 to 5, not "${v}"`,
        });
        return z.NEVER;
      }
      return n;
    }),
  worked: optionalText,
  failed: optionalText,
});

const statusSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v, ctx) => {
    const text = (v ?? "").toString().trim().toLowerCase();
    if (text === "") return "draft" as PromptEntryStatus;
    if (!(PROMPT_STATUSES as readonly string[]).includes(text)) {
      ctx.addIssue({
        code: "custom",
        message: `status must be one of ${PROMPT_STATUSES.join(", ")} — got "${text}"`,
      });
      return z.NEVER;
    }
    return text as PromptEntryStatus;
  });

const frontmatterSchema = z.object({
  title: requiredText,
  date: isoDate,
  slug: optionalText,
  status: statusSchema,
  tool: optionalText,
  derivedFrom: optionalText,
  tags: listOf(requiredText),
  blocks: listOf(blockSchema),
  references: listOf(assetSchema),
  outputs: listOf(assetSchema),
  // `outcome:` with nothing under it reads as an outcome with nothing in it,
  // which the parser then reports as no outcome at all. Preprocessing rather
  // than a union so a bad rating is reported as `outcome.rating`.
  outcome: z.preprocess(
    (v) => (v === null || v === undefined ? {} : v),
    outcomeSchema,
  ),
});

/* ------------------------------------------------------------------ parse */

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * `2026-08-02-samurai-vs-robot-fight.md` → `samurai-vs-robot-fight`.
 * A leading date is a filing aid, not part of the entry's identity.
 */
export function slugFromFileName(fileName: string): string {
  return fileName
    .replace(/\.md$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .trim();
}

/**
 * Splits a prompt file into its frontmatter and its body.
 *
 * The body is returned untouched apart from the blank lines that separate it
 * from the `---` above and the end of the file below.
 */
export function splitPromptFile(raw: string): { yaml: string; body: string } {
  // A byte-order mark would otherwise stop the file matching `^---`.
  const text = raw.replace(/^﻿/, "");
  const match = FRONTMATTER.exec(text);
  if (!match) {
    throw new Error(
      "no frontmatter found — the file must start with a line of exactly `---`, " +
        "then the fields, then another line of exactly `---`",
    );
  }
  const body = text
    .slice(match[0].length)
    .replace(/^(?:\r?\n)+/, "")
    .replace(/(?:\r?\n)+$/, "");

  return { yaml: match[1], body };
}

/**
 * Parses one `content/prompts/*.md` file.
 *
 * @param raw       the file's contents
 * @param fileName  its basename, used for the slug and for error messages
 */
export function parsePromptEntry(
  raw: string,
  fileName: string,
): ParsedPromptEntry {
  const fail = (message: string) =>
    new Error(`content/prompts/${fileName}: ${message}`);

  let split: { yaml: string; body: string };
  try {
    split = splitPromptFile(raw);
  } catch (err) {
    throw fail(err instanceof Error ? err.message : String(err));
  }

  let data: unknown;
  try {
    // JSON_SCHEMA keeps plain scalars as strings, so a date stays "2026-08-02"
    // and an unquoted value is never silently retyped.
    data = yaml.load(split.yaml, { schema: yaml.JSON_SCHEMA }) ?? {};
  } catch (err) {
    throw fail(
      `the frontmatter is not valid YAML — ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw fail("the frontmatter must be a list of `field: value` lines");
  }

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
    );
    throw fail(`the frontmatter has problems —\n${lines.join("\n")}`);
  }

  const fm = parsed.data;

  if (!split.body.trim()) {
    throw fail(
      "the body is empty — the full prompt text goes below the second `---`",
    );
  }

  const outcome = {
    rating: fm.outcome.rating ?? null,
    worked: fm.outcome.worked ?? null,
    failed: fm.outcome.failed ?? null,
  };

  return {
    slug: fm.slug ?? slugFromFileName(fileName),
    title: fm.title,
    date: fm.date,
    status: fm.status,
    tool: fm.tool,
    tags: fm.tags,
    blocks: fm.blocks,
    references: fm.references,
    outputs: fm.outputs,
    // An outcome with nothing written in it is no outcome at all.
    outcome:
      outcome.rating !== null || outcome.worked || outcome.failed
        ? outcome
        : null,
    derivedFrom: fm.derivedFrom,
    promptText: split.body,
  };
}
