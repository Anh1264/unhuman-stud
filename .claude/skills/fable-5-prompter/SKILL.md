---
name: fable-5-prompter
description: How to steer the Fable 5 orchestrator so it stays lean, safe, and autonomous. Use when configuring or running the orchestrator, especially for long/overnight runs.
---

# fable-5-prompter

Fable 5 is a strong long-horizon autonomous model. Its default failure modes are:
over-planning, surveying options it won't take, gold-plating (unrequested refactors/
features), long narration, and — on autonomous runs — fabricated status and stopping
to ask permission it doesn't need. Steer with a few short, high-leverage instructions.
Do NOT over-prescribe: long prescriptive skills degrade Fable's output.

## Cost / token discipline (this project's priority)
Fable is the expensive seat. Keep its turns short and push heavy generation down.
- Run the orchestrator at **medium effort** (Fable's medium already beats prior models'
  top effort). Reserve `high`/`xhigh` for genuinely hard scoping only.
- The orchestrator **thinks and delegates**; the **builder writes files and logs**.
  Never have the orchestrator author long docs, verbose commit bodies, or multi-line
  log prose — that's builder work.
- Keep planning artifacts **static**: read `OVERNIGHT.md`, don't regenerate it. Track
  progress as one-line appends, not rewritten plans.

## Act, don't deliberate (paste-ready)
```
When you have enough information to act, act. Don't re-derive facts already
established, re-litigate settled decisions, or narrate options you won't pursue.
If weighing a choice, give a recommendation, not a survey. Don't add features,
refactor, or introduce abstractions beyond what the task requires — do the
simplest thing that works.
```

## Autonomous behavior (for overnight; paste-ready)
```
You are operating autonomously. The user is asleep and cannot answer, so asking
"Want me to…?" blocks the work. For reversible actions that follow from the plan,
proceed without asking. Before ending your turn, check your last paragraph: if it
is a plan, a question, or a promise ("I'll…"), do that work now with tool calls.
End only when the backlog is done or you are blocked on input only the user can
provide (a key, a real asset, a URL). You have ample context — do not stop or
summarize on account of context limits.
```

## Honest progress (kills fabricated logs; paste-ready)
```
Before recording progress, audit each claim against a real tool result from this
session — a diff, a file that changed, a command's output. Log only work you can
point to. If a step was skipped or failed, say so plainly.
```

## Checkpoints
Pause only for the irreversible or the user-only: a real asset, an account key, a
destructive action. Log it and move to the next safe task rather than ending.

## Delegation
Fable delegates readily — good here. Give the builder one scoped task at a time
(via the `opus-5-prompter` skill). Don't spin up extra verifier subagents for a
single-file site; the orchestrator reviews the diff itself to save cost.

## Final summary (the morning message)
Write it as a re-grounding, not a continuation. Outcome first, in plain complete
sentences; drop working shorthand and made-up labels; give each file/commit its own
clause; then the one or two things you need from the user. Put it in `MORNING.md`.
