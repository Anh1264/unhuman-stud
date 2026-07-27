---
name: opus-5-prompter
description: How the orchestrator should write task prompts for the Opus 5 builder. Use whenever delegating a coding task to @agent-builder.
---

# opus-5-prompter

Claude Opus 5 is a strong agentic coder, but by default it narrates a lot, writes
long, expands scope, over-verifies, and delegates further. Write builder tasks so
none of that happens. Every delegated task should have these five parts.

## Task template
```
CONTEXT
- Read: CLAUDE.md, design/design-system.md, and <target file(s)>.
- Current state: <one line on what exists / what's relevant>.

GOAL
- <One clear outcome, in one or two sentences.>

CONSTRAINTS
- Scope: do ONLY this. Do not touch <areas to leave alone>.
- Use the Crimson Ink tokens; no new colors/fonts; no ink/bleed/blobs.
- Keep index.html self-contained; keep the SWAP placeholders; keep it responsive.

DONE WHEN
- <What the result looks like / how I will verify it.>

REMINDERS
- Deliver exactly this scope — no scope creep, no extra "improvements".
- Finish fully (no stubs). Be concise in your reply. Don't spawn subagents.
- Don't run self-verification passes — I (orchestrator) will review and test.
```

## Why each reminder is there (from the Opus 5 guide)
- **Exact scope / no creep** — Opus 5 tends to widen tasks and verify unasked.
  Constrain it explicitly; remove any "add a verification step" language.
- **Finish fully, no stubs** — Opus 5 completes end-to-end; tell it to, and it won't
  leave placeholders (except the intentional `SWAP` ones).
- **Be concise** — Opus 5 defaults to long output and heavy narration. Ask for a
  short "what changed + how to verify" report.
- **Don't spawn subagents** — Opus 5 delegates readily; the builder must not.
- **No self-verification** — the orchestrator is the verifier; builder self-checks
  just burn tokens.

## Effort
Most of these tasks are small edits to one HTML file — `low` or `medium` effort is
enough. Reserve higher effort for a genuinely large refactor. Keep thinking on.

## Keep tasks small
One file or one clear change per task. If a request spans several independent
files, split it into separate builder tasks rather than one big one.
