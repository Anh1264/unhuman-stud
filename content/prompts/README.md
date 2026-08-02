# The prompt library

This folder is your prompt notebook. One file per prompt: the exact text you
sent to the model, the reference pictures you fed it, whatever it gave back, and
what you thought of the result.

Everything here is written by hand, on your Mac, in plain text. Nothing is
edited through a website and nothing is uploaded anywhere. When you push to
GitHub, the site rebuilds and the library goes live, read-only.

**Your prompt text is never touched.** The site stores it exactly as you typed
it — same line breaks, same spacing, same wording. A prompt that has been tidied
up is no longer the prompt that produced the result, so nothing tidies it.

---

## Adding a new prompt — the whole routine

1. **Make the file.** In `content/prompts/`, create a file named with the date
   and a short name, ending in `.md`:

   ```
   content/prompts/2026-08-14-shiba-city-run.md
   ```

   The date at the front is just for keeping the folder in order. The rest of
   the name (`shiba-city-run`) becomes the entry's address on the site.

2. **Write the file.** Copy the example below, replace the parts you need, and
   paste your prompt underneath the second `---`.

3. **Drop the pictures in.** Make a folder named after the entry (the filename
   without the date) inside `assets-source/prompts/`, and put the reference
   images and results in it:

   ```
   assets-source/prompts/shiba-city-run/setting.png
   assets-source/prompts/shiba-city-run/take-01.mp4
   ```

   The names of those files are what you write in the `references:` and
   `outputs:` lists. Anything goes for a name, as long as the two match.

4. **Build and load.** In Terminal, from the project folder:

   ```bash
   npm run media    # turns the pictures into web-sized copies
   npm run seed     # loads the markdown files into the site's database
   ```

   If `npm run dev` is running, stop it before `npm run seed` and start it again
   afterwards.

5. **Publish.**

   ```bash
   git add -A
   git commit -m "Add the shiba city run prompt"
   git push
   ```

You can do step 2 on its own. An entry with no pictures yet is perfectly valid —
the seed prints a reminder for each file it cannot find, and the entry fills in
the moment you drop the file in and run `npm run media` again.

---

## A complete example

```markdown
---
title: "Shiba in the neon city — night run"
date: 2026-08-14
slug: shiba-city-run
status: tested
tool: Midjourney video, --ar 16:9
derivedFrom: samurai-vs-robot-fight
tags:
  - animal
  - night
  - camera-movement
blocks:
  - label: Camera
    text: |
      starts with a super wide, smooth, stable flycam-like camera movement over
      the rooftops, then drops to street level and tracks alongside
  - label: Lighting
    text: wet neon reflections, everything lit from below
references:
  - file: setting.png
    note: The street, the look I was after
  - file: shiba-turnaround.png
    note: The dog, front and side
outputs:
  - file: take-01.mp4
    note: First run — the ending is wrong but the run cycle is right
outcome:
  rating: 4
  worked: The flycam opening, exactly as described. Neon reflections held up.
  failed: It ignored "no people". Ending drifts into slow motion.
---

A shiba inu sprints through a rain-soaked neon city at night.

It starts with a super wide, smooth, stable flycam-like camera movement over the
rooftops, then drops to street level and tracks alongside the dog.

Highly cinematic animation style. No people on the street.
```

---

## What each field means

Only **title**, **date** and the prompt text below the second `---` are
required. Leave anything else out, or write the name with nothing after the
colon — both mean "not written yet", and the site simply doesn't show it.

| Field | What to write |
| --- | --- |
| `title` | What you'd call this prompt out loud. In quotes. |
| `date` | The day you wrote or ran it: `2026-08-14`. |
| `slug` | Its address on the site. Leave it out and the filename is used, minus the date. |
| `status` | One of `draft`, `tested`, `proven`, `abandoned`. Left out, it's `draft`. |
| `tool` | The model and settings, in your own words. |
| `derivedFrom` | The `slug` of the prompt this one grew out of, if any. Links the two together. |
| `tags` | A list of your own filing words. |
| `blocks` | The reusable parts — see below. |
| `references` | The pictures you fed the model. |
| `outputs` | What it gave back — images or video. |
| `outcome` | Your verdict: `rating` 1–5, `worked`, `failed`. |

### Blocks — the reason this library exists

A block is a named piece of a prompt: `Camera`, `Lighting`, `Pacing`, `Ending`.
Write out the parts that did their job, and the next time you need a camera move
like that one you copy the block instead of rewriting the prompt from memory.
Each block is a `label` and a `text`:

```yaml
blocks:
  - label: Camera
    text: starts with a super wide, smooth, stable flycam-like camera movement
```

For anything longer than a line, use `|` and indent the lines under it — that
tells the file "everything indented below is the text":

```yaml
  - label: Camera
    text: |
      starts with a super wide, smooth, stable flycam-like camera movement over
      the rooftops, then drops to street level and tracks alongside
```

### References and outputs

Both are lists of a `file` and a `note`. The `file` is the name of the file
sitting in `assets-source/prompts/<slug>/`; the `note` is you, telling yourself
what it was for.

```yaml
references:
  - file: setting.png
    note: The street, the look I was after
```

Images become web-sized WebP automatically. Videos are copied through as they
are, so they need to be **.mp4**, **.m4v** or **.webm** — a `.mov` is skipped
with a message telling you to export it as mp4 first.

### Outcome

Fill this in after you've run the prompt. Any part of it can be left empty; if
all of it is, the site shows no verdict at all rather than an empty box.

```yaml
outcome:
  rating: 4
  worked: The flycam opening, exactly as described.
  failed: It ignored "no people".
```

---

## Rules the file has to follow

These are the only things that will stop `npm run seed` and tell you off:

- The file starts with a line of exactly `---`, and the fields end with another
  line of exactly `---`. The prompt goes below the second one.
- There is a `title` and a `date`, and there is prompt text under the fields.
- `status` is one of the four words; `rating` is a whole number from 1 to 5.
- Two entries cannot share the same `slug`.

If something is wrong, the message names the file and the field. Fix it and run
`npm run seed` again.

---

## Where it all ends up

| Thing | Lives in |
| --- | --- |
| What you write | `content/prompts/*.md` |
| Pictures you drop in | `assets-source/prompts/<slug>/` |
| Web-sized copies (built) | `public/prompts/<slug>/` |
| The site's copy of it all | the database, rebuilt by `npm run seed` |

The markdown files are the real thing. The database is only a copy the website
reads from, and it is rebuilt from these files every time — so if the database
is ever lost, nothing you wrote is.
