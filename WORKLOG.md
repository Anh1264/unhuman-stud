# Worklog

- [7923c83] Baseline commit of agent docs + design system; verified `npm run build` and `npm run lint` both pass with no fixes needed.
- [c793713] Contact form wired end-to-end: Server Action -> inquiries service (zod) -> repository insert, with field errors, live status region and success state.
- [068b835] Added vitest (`npm test`) with 52 unit tests: inquiries/content services, both repositories (db client mocked, never opens `.data/`) and SiteFooter/ProjectCard renders.
- [40b4d96] Accessibility + SEO pass on every route: shared `pageMetadata()` builder (canonical, Open Graph, Twitter card), skip-to-content link, one h1 per page with a valid heading outline, nav/footer landmarks with `aria-current`, and reduced-motion coverage for transition delays.
- [95b4a1b] Seeded the four real projects (STILLNESS / Tĩnh Lặng, GIÁP, WAKAN AI incl. "Intent", boop.) with legacy copy; covers/gallery/films left null and SWAP-marked pending real assets.
- [17baa75] Print stylesheet in globals.css: global chrome-hiding (header/footer/skip-link/video/buttons/forms/dialogs) plus a `print-resume` hook so /about prints as a clean one-page A4 résumé in black on white.
- [e433ec9] Added app-router not-found, error boundary, global-error and loading states in Crimson Ink
