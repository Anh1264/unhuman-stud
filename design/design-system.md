# Design System — "Crimson Ink" (clean)

Brand source of truth for Unhuman Stud. Match these values exactly; invent nothing.
**Implementation:** these tokens live in `src/app/globals.css` (Tailwind v4 theme) and are
consumed by the React components in `src/components/`. Keep `globals.css` in sync with the
values below. (The class names in the "Layout" note are conceptual — reuse the equivalents
already defined in `globals.css`/components rather than adding new ones.)

## Color tokens (CSS variables)
```css
:root{
  --bg:#0b0708;          /* page background, near-black */
  --bg-2:#120c0d;        /* raised background (mobile menu) */
  --panel:#161010;       /* cards, blocks, mail card */
  --panel-2:#1c1414;     /* deeper panel */
  --line:rgba(244,238,230,.12);    /* hairline borders */
  --line-2:rgba(244,238,230,.2);   /* stronger borders */
  --bone:#f4eee6;        /* primary text / headings */
  --bone-dim:#bcaea6;    /* body text */
  --bone-faint:#8a7a72;  /* labels, footnotes */
  --crimson:#c1121f;     /* primary accent (buttons, chips, dots) */
  --crimson-br:#e11d1d;  /* brighter crimson, italic emphasis */
  --ember:#e0654d;       /* warm accent (eyebrows, links) */
  --gold:#e3b23c;        /* highlight (stat "+", gold chips, timeline year) */
}
```

## Type
- **Display / headings:** `Fraunces`, weight 600. Italic emphasis uses `<em>` in
  `--crimson-br`. Section titles `clamp(32px,5vw,52px)`; hero `clamp(46px,8.5vw,104px)`.
- **Body:** `Inter`, weight 300–400, color `--bone-dim`.
- **Labels / meta:** `Space Mono`, uppercase, letter-spacing `.2em`, small (11px),
  color `--bone-faint`. Eyebrows are an exception: `Fraunces` italic in `--ember`.
- Google Fonts import (keep this exact set):
  `Fraunces` (ital 400–700), `Inter` (300–600), `Space Mono` (400/700).

## Buttons
- `.btn` — pill (`border-radius:100px`), Inter, 12px, uppercase, letter-spacing `.1em`.
- `.btn.p` (primary): `background:var(--crimson)`, white text; hover `--crimson-br` + lift.
- `.btn.g` (ghost): transparent, `1px solid var(--line-2)`; hover border/text `--ember`.

## Links & chips
- `.link` — Space Mono, uppercase, `--ember`, bottom-border underline; hover → `--gold`.
- `.chip` — Space Mono 10px, pill, crimson-tinted bg + border, text `--ember`.
- `.chip.gold` — gold-tinted variant (use for "Commissioned", "Foundations").

## Motion (allowed)
Subtle only, and never ink: scroll-reveal fades (`.reveal`→`.in`), skill-bar fills,
hover lifts, tab cross-fades. Any new motion must stay in this restrained register.

## Layout
- Container `.wrap`: `max-width:1140px`, `padding:0 30px`, `width:100%`, `min-width:0`.
- Fixed blurred header; `.tab.active` underlined in crimson.
- Responsive: 860px → hamburger + single columns; 480px → gallery single column.
