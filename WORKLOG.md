# Worklog

- [7923c83] Baseline commit of agent docs + design system; verified `npm run build` and `npm run lint` both pass with no fixes needed.
- [c793713] Contact form wired end-to-end: Server Action -> inquiries service (zod) -> repository insert, with field errors, live status region and success state.
- [068b835] Added vitest (`npm test`) with 52 unit tests: inquiries/content services, both repositories (db client mocked, never opens `.data/`) and SiteFooter/ProjectCard renders.
