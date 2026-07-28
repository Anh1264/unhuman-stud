# Worklog

- [7923c83] Baseline commit of agent docs + design system; verified `npm run build` and `npm run lint` both pass with no fixes needed.
- [c793713] Contact form wired end-to-end: Server Action -> inquiries service (zod) -> repository insert, with field errors, live status region and success state.
- [068b835] Added vitest (`npm test`) with 52 unit tests: inquiries/content services, both repositories (db client mocked, never opens `.data/`) and SiteFooter/ProjectCard renders.
- [40b4d96] Accessibility + SEO pass on every route: shared `pageMetadata()` builder (canonical, Open Graph, Twitter card), skip-to-content link, one h1 per page with a valid heading outline, nav/footer landmarks with `aria-current`, and reduced-motion coverage for transition delays.
- [95b4a1b] Seeded the four real projects (STILLNESS / Tĩnh Lặng, GIÁP, WAKAN AI incl. "Intent", boop.) with legacy copy; covers/gallery/films left null and SWAP-marked pending real assets.
- [17baa75] Print stylesheet in globals.css: global chrome-hiding (header/footer/skip-link/video/buttons/forms/dialogs) plus a `print-resume` hook so /about prints as a clean one-page A4 résumé in black on white.
- [e433ec9] Added app-router not-found, error boundary, global-error and loading states in Crimson Ink
- [b64936e] Reconciled globals.css + components against design-system.md: klabel .2em, real Fraunces italic, 1140px container, .btn tracking .1em, section-title clamp
- [909c9a8] Widened the site container from 1140px to 1760px via a single --container-site theme token (max-w-site), capped two full-width paragraphs at 56ch, synced design-system.md
- [4174805] Seed content trim: removed stillness/giap/wakan-ai and the NU social-post cut; renamed OLD FRIEND to "A new pet" (slug a-new-pet, film a-new-pet-test) with the daughter-and-dad-and-dog premise
- [7505221] Retitled project and film to "A NEW PET" (dropped the "— Motion Test" suffix) and reworded the body so it reads as the film, not a technique study
- [8103ec2] Removed the boop project (and its SWAP note) from scripts/seed.ts; three projects remain, sortOrder 1..3
- [32f6ec3] Ceasefire media: six finals to lossless WebP (pixel-identical), 4K crf-31 playback encode + untouched master (gitignored) as download, video poster frame, images.unoptimized so nothing is re-compressed
- [fb808c1] Ceasefire video: public/videos/nu-ceasefire.mp4 is now the untouched 402 MB master (faststart remux only), untracked + gitignored; prepare-media dropped the crf-31 encode and keeps the measured CRF ladder as a comment
- [5c945cd] Seed cut to one project — NU & TIB: CEASEFIRE on /videos/nu-ceasefire.mp4 (68s, 4K, nu-first-frame poster) with the six real images in KEY_ART/FRAME/DESIGN sections; home, /work, /work/nu, /films and /gallery restructured around the single film (poster at true 2:3, film centrepiece, frames, character sheets in their own panel)
- [16cd0bd] Characters + in-world fields as data: characters/character_translations (name, epithet, ordered traits, optional sheet) and project_world_fields/_translations (ordered bespoke label/value pairs), migration 0001, exposed on getProject; seeded NU and TIB with names + sheets only, world fields empty
- [8a61a1d] /work/nu restructured: split hero (true-2:3 poster + title/logline/in-world fields/WATCH), film, synopsis, Characters section, frames; world fields and character epithets/traits render only when written; page dropped the per-project accent colour for Crimson Ink tokens
