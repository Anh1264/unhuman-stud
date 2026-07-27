import { beforeEach, describe, expect, it, vi } from "vitest";

type DbModule = typeof import("@/server/db/client");

const findManyProjects = vi.fn();
const findFirstProject = vi.fn();
const findManyFilms = vi.fn();
const findManyGallery = vi.fn();
const findFirstSettings = vi.fn();

const where = vi.fn();
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));

vi.mock("@/server/db/client", () => ({
  // No PGlite: `.data/` is never opened by the test suite.
  db: {
    query: {
      projects: {
        findMany: (...a: unknown[]) => findManyProjects(...a),
        findFirst: (...a: unknown[]) => findFirstProject(...a),
      },
      films: { findMany: (...a: unknown[]) => findManyFilms(...a) },
      galleryItems: { findMany: (...a: unknown[]) => findManyGallery(...a) },
      siteSettings: { findFirst: (...a: unknown[]) => findFirstSettings(...a) },
    },
    select: (...a: unknown[]) => select(...a),
  } as unknown as DbModule["db"],
}));

const repo = await import("@/server/repositories/content.repo");
const { films, galleryItems, projects } = await import("@/server/db/schema");
const { eq } = await import("drizzle-orm");

beforeEach(() => {
  for (const fn of [
    findManyProjects,
    findFirstProject,
    findManyFilms,
    findManyGallery,
    findFirstSettings,
    where,
  ]) {
    fn.mockReset();
  }
  select.mockClear();
  from.mockClear();
});

describe("findPublishedProjects", () => {
  it("asks only for published projects, in sort order, with their relations", async () => {
    const rows = [{ slug: "ember-line" }];
    findManyProjects.mockResolvedValue(rows);

    expect(await repo.findPublishedProjects()).toBe(rows);

    const [args] = findManyProjects.mock.calls[0];
    expect(args.where).toEqual(eq(projects.status, "PUBLISHED"));
    expect(args.orderBy).toHaveLength(1);
    expect(Object.keys(args.with).sort()).toEqual([
      "cover",
      "projectTags",
      "translations",
    ]);
  });
});

describe("findProjectBySlug", () => {
  it("filters by slug and published status and loads films and gallery", async () => {
    findFirstProject.mockResolvedValue({ slug: "ember-line" });

    await repo.findProjectBySlug("ember-line");

    const [args] = findFirstProject.mock.calls[0];
    expect(Object.keys(args.with).sort()).toEqual([
      "cover",
      "films",
      "galleryItems",
      "projectTags",
      "translations",
    ]);
    expect(args.with.films.where).toEqual(eq(films.status, "PUBLISHED"));
    expect(args.with.galleryItems.where).toEqual(
      eq(galleryItems.status, "PUBLISHED"),
    );
  });

  it("returns whatever the query returns for an unknown slug", async () => {
    findFirstProject.mockResolvedValue(undefined);

    expect(await repo.findProjectBySlug("nope")).toBeUndefined();
  });
});

describe("findPublishedProjectSlugs", () => {
  it("selects just the slug and updatedAt columns", async () => {
    const rows = [{ slug: "ember-line", updatedAt: new Date(0) }];
    where.mockResolvedValue(rows);

    expect(await repo.findPublishedProjectSlugs()).toBe(rows);
    expect(select).toHaveBeenCalledWith({
      slug: projects.slug,
      updatedAt: projects.updatedAt,
    });
    expect(from).toHaveBeenCalledWith(projects);
    expect(where).toHaveBeenCalledWith(eq(projects.status, "PUBLISHED"));
  });
});

describe("findPublishedFilms and findGalleryItems", () => {
  it("returns published films with poster and project relations", async () => {
    const rows = [{ slug: "ember-teaser" }];
    findManyFilms.mockResolvedValue(rows);

    expect(await repo.findPublishedFilms()).toBe(rows);

    const [args] = findManyFilms.mock.calls[0];
    expect(args.where).toEqual(eq(films.status, "PUBLISHED"));
    expect(Object.keys(args.with).sort()).toEqual([
      "poster",
      "project",
      "translations",
    ]);
  });

  it("returns published gallery items with asset and project relations", async () => {
    const rows = [{ id: "g1" }];
    findManyGallery.mockResolvedValue(rows);

    expect(await repo.findGalleryItems()).toBe(rows);

    const [args] = findManyGallery.mock.calls[0];
    expect(args.where).toEqual(eq(galleryItems.status, "PUBLISHED"));
    expect(Object.keys(args.with).sort()).toEqual(["asset", "project"]);
  });
});

describe("findSiteSettings", () => {
  it("reads the singleton row", async () => {
    findFirstSettings.mockResolvedValue({ id: "singleton" });

    expect(await repo.findSiteSettings()).toEqual({ id: "singleton" });
    expect(findFirstSettings).toHaveBeenCalledTimes(1);
  });
});

describe("countPublished", () => {
  it("counts published projects and films", async () => {
    where
      .mockResolvedValueOnce([{ value: 4 }])
      .mockResolvedValueOnce([{ value: 9 }]);

    expect(await repo.countPublished()).toEqual({ projects: 4, films: 9 });
    expect(from).toHaveBeenNthCalledWith(1, projects);
    expect(from).toHaveBeenNthCalledWith(2, films);
  });

  it("reports zero rather than undefined when a count comes back empty", async () => {
    where.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    expect(await repo.countPublished()).toEqual({ projects: 0, films: 0 });
  });
});
