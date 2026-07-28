import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = {
  findPublishedProjects: vi.fn(),
  findProjectBySlug: vi.fn(),
  findPublishedProjectSlugs: vi.fn(),
  findPublishedFilms: vi.fn(),
  findGalleryItems: vi.fn(),
  findSiteSettings: vi.fn(),
  countPublished: vi.fn(),
};

vi.mock("@/server/repositories/content.repo", () => ({
  findPublishedProjects: (...a: unknown[]) => repo.findPublishedProjects(...a),
  findProjectBySlug: (...a: unknown[]) => repo.findProjectBySlug(...a),
  findPublishedProjectSlugs: (...a: unknown[]) =>
    repo.findPublishedProjectSlugs(...a),
  findPublishedFilms: (...a: unknown[]) => repo.findPublishedFilms(...a),
  findGalleryItems: (...a: unknown[]) => repo.findGalleryItems(...a),
  findSiteSettings: (...a: unknown[]) => repo.findSiteSettings(...a),
  countPublished: (...a: unknown[]) => repo.countPublished(...a),
}));

const service = await import("@/server/services/content.service");

const FALLBACK_ACCENT = "#c1121f";

function assetRow(overrides: Record<string, unknown> = {}) {
  return {
    url: "/images/cover.webp",
    width: 1600,
    height: 900,
    blurDataUrl: "data:image/webp;base64,abc",
    translations: [{ altText: "A cover frame", caption: "Frame 12" }],
    ...overrides,
  };
}

function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    slug: "ember-line",
    year: 2025,
    accentColor: "#d4af37",
    translations: [
      {
        title: "Ember Line",
        tagline: "A study in heat",
        summary: "A short film.",
        body: "Body copy.",
      },
    ],
    cover: assetRow(),
    projectTags: [
      { tag: { translations: [{ label: "Short film" }] } },
      { tag: { translations: [{ label: "AI" }] } },
    ],
    characters: [],
    worldFields: [],
    ...overrides,
  };
}

function characterRow(overrides: Record<string, unknown> = {}) {
  return {
    slug: "ember",
    image: assetRow({ url: "/images/ember-sheet.webp" }),
    translations: [
      {
        name: "EMBER",
        epithet: "The one who waits",
        traits: ["Patient", "Burning"],
      },
    ],
    ...overrides,
  };
}

function filmRow(overrides: Record<string, unknown> = {}) {
  return {
    slug: "ember-teaser",
    translations: [{ title: "Ember Teaser", description: "30 seconds." }],
    provider: "SELF",
    providerVideoId: "/videos/ember.mp4",
    poster: assetRow({ url: "/images/poster.webp" }),
    durationSeconds: 30,
    orientation: "LANDSCAPE",
    width: 1920,
    height: 1080,
    featured: true,
    project: { slug: "ember-line", translations: [{ title: "Ember Line" }] },
    ...overrides,
  };
}

beforeEach(() => {
  for (const fn of Object.values(repo)) fn.mockReset();
});

describe("getProjects", () => {
  it("maps rows into the shape the UI renders", async () => {
    repo.findPublishedProjects.mockResolvedValue([projectRow()]);

    const [project] = await service.getProjects();

    expect(project).toEqual({
      slug: "ember-line",
      title: "Ember Line",
      tagline: "A study in heat",
      summary: "A short film.",
      year: 2025,
      accentColor: "#d4af37",
      cover: {
        url: "/images/cover.webp",
        width: 1600,
        height: 900,
        blurDataUrl: "data:image/webp;base64,abc",
        alt: "A cover frame",
        caption: "Frame 12",
      },
      tags: ["Short film", "AI"],
    });
  });

  it("falls back to the slug, the brand accent and an empty summary", async () => {
    repo.findPublishedProjects.mockResolvedValue([
      projectRow({ translations: [], accentColor: null, cover: null }),
    ]);

    const [project] = await service.getProjects();

    expect(project.title).toBe("ember-line");
    expect(project.tagline).toBeNull();
    expect(project.summary).toBe("");
    expect(project.accentColor).toBe(FALLBACK_ACCENT);
    expect(project.cover).toBeNull();
  });

  it("drops tags that have no label in the active locale", async () => {
    repo.findPublishedProjects.mockResolvedValue([
      projectRow({
        projectTags: [
          { tag: { translations: [] } },
          { tag: { translations: [{ label: "AI" }] } },
        ],
      }),
    ]);

    const [project] = await service.getProjects();

    expect(project.tags).toEqual(["AI"]);
  });

  it("returns an empty list when nothing is published", async () => {
    repo.findPublishedProjects.mockResolvedValue([]);

    expect(await service.getProjects()).toEqual([]);
  });
});

describe("getProject", () => {
  it("returns null for an unknown slug", async () => {
    repo.findProjectBySlug.mockResolvedValue(undefined);

    expect(await service.getProject("nope")).toBeNull();
    expect(repo.findProjectBySlug).toHaveBeenCalledWith("nope");
  });

  it("maps films and gallery, attributing both to the project", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [filmRow({ project: undefined })],
        galleryItems: [
          { asset: assetRow({ url: "/images/still-1.webp" }) },
          { asset: null },
        ],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project).not.toBeNull();
    expect(project?.body).toBe("Body copy.");
    expect(project?.films).toHaveLength(1);
    expect(project?.films[0]).toMatchObject({
      slug: "ember-teaser",
      title: "Ember Teaser",
      source: "/videos/ember.mp4",
      projectSlug: "ember-line",
      projectTitle: "Ember Line",
    });
    expect(project?.films[0].poster?.url).toBe("/images/poster.webp");
    // The asset-less gallery row is dropped rather than rendered as a hole.
    expect(project?.gallery).toHaveLength(1);
    expect(project?.gallery[0].url).toBe("/images/still-1.webp");
  });

  it("falls back to the film slug when the film has no translation", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        translations: [],
        films: [filmRow({ translations: [], poster: null })],
        galleryItems: [],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.films[0].title).toBe("ember-teaser");
    expect(project?.films[0].description).toBeNull();
    expect(project?.films[0].poster).toBeNull();
    expect(project?.films[0].projectTitle).toBeNull();
  });
});

describe("getProject characters", () => {
  it("maps a fully written character", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({ films: [], galleryItems: [], characters: [characterRow()] }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.characters).toEqual([
      {
        slug: "ember",
        name: "EMBER",
        epithet: "The one who waits",
        traits: ["Patient", "Burning"],
        image: {
          url: "/images/ember-sheet.webp",
          width: 1600,
          height: 900,
          blurDataUrl: "data:image/webp;base64,abc",
          alt: "A cover frame",
          caption: "Frame 12",
        },
      },
    ]);
  });

  it("treats an unwritten epithet and unwritten traits as empty, not broken", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [],
        galleryItems: [],
        characters: [
          characterRow({
            image: null,
            translations: [{ name: "TIB", epithet: null, traits: null }],
          }),
        ],
      }),
    );

    const [character] = (await service.getProject("ember-line"))!.characters;

    expect(character).toEqual({
      slug: "ember",
      name: "TIB",
      epithet: null,
      traits: [],
      image: null,
    });
  });

  it("drops blank trait words and a character with no name in this locale", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [],
        galleryItems: [],
        characters: [
          characterRow({
            translations: [{ name: "NU", epithet: "  ", traits: ["  ", "Blue"] }],
          }),
          characterRow({ slug: "ghost", translations: [] }),
        ],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.characters).toHaveLength(1);
    expect(project?.characters[0].traits).toEqual(["Blue"]);
    expect(project?.characters[0].epithet).toBeNull();
  });

  it("preserves the order the repository returned", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [],
        galleryItems: [],
        characters: [
          characterRow({ slug: "nu", translations: [{ name: "NU" }] }),
          characterRow({ slug: "tib", translations: [{ name: "TIB" }] }),
        ],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.characters.map((c) => c.slug)).toEqual(["nu", "tib"]);
  });
});

describe("getProject world fields", () => {
  it("maps ordered label/value pairs", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [],
        galleryItems: [],
        worldFields: [
          { translations: [{ label: "SETTING", value: "A city in snow" }] },
          { translations: [{ label: "TONE", value: "Quiet, then loud" }] },
        ],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.worldFields).toEqual([
      { label: "SETTING", value: "A city in snow" },
      { label: "TONE", value: "Quiet, then loud" },
    ]);
  });

  it("keeps a labelled field with no value, and drops one with no label", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({
        films: [],
        galleryItems: [],
        worldFields: [
          { translations: [{ label: "SETTING", value: null }] },
          { translations: [] },
        ],
      }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.worldFields).toEqual([{ label: "SETTING", value: null }]);
  });

  it("is an empty list when the owner has written none", async () => {
    repo.findProjectBySlug.mockResolvedValue(
      projectRow({ films: [], galleryItems: [] }),
    );

    const project = await service.getProject("ember-line");

    expect(project?.characters).toEqual([]);
    expect(project?.worldFields).toEqual([]);
  });
});

describe("getFilms", () => {
  it("carries the parent project through", async () => {
    repo.findPublishedFilms.mockResolvedValue([filmRow()]);

    const [film] = await service.getFilms();

    expect(film.projectSlug).toBe("ember-line");
    expect(film.projectTitle).toBe("Ember Line");
    expect(film.featured).toBe(true);
  });

  it("tolerates a film with no project", async () => {
    repo.findPublishedFilms.mockResolvedValue([filmRow({ project: null })]);

    const [film] = await service.getFilms();

    expect(film.projectSlug).toBeNull();
    expect(film.projectTitle).toBeNull();
  });
});

describe("getGallery", () => {
  it("flattens media with its project and skips entries without an asset", async () => {
    repo.findGalleryItems.mockResolvedValue([
      {
        asset: assetRow({ url: "/images/g1.webp" }),
        project: { slug: "ember-line", translations: [{ title: "Ember Line" }] },
      },
      { asset: null, project: null },
      { asset: assetRow({ url: "/images/g2.webp" }), project: null },
    ]);

    const gallery = await service.getGallery();

    expect(gallery).toHaveLength(2);
    expect(gallery[0]).toMatchObject({
      url: "/images/g1.webp",
      alt: "A cover frame",
      projectSlug: "ember-line",
      projectTitle: "Ember Line",
    });
    expect(gallery[1]).toMatchObject({
      url: "/images/g2.webp",
      projectSlug: null,
      projectTitle: null,
    });
  });
});

describe("getSiteSettings", () => {
  it("returns stored settings when they exist", async () => {
    repo.findSiteSettings.mockResolvedValue({
      contactEmail: "hello@unhuman.studio",
      socials: [{ label: "Instagram", url: "https://example.com" }],
      resumeUrl: "/resume.pdf",
    });

    expect(await service.getSiteSettings()).toEqual({
      contactEmail: "hello@unhuman.studio",
      socials: [{ label: "Instagram", url: "https://example.com" }],
      resumeUrl: "/resume.pdf",
    });
  });

  it("falls back to the owner's email and no socials", async () => {
    repo.findSiteSettings.mockResolvedValue(undefined);

    expect(await service.getSiteSettings()).toEqual({
      contactEmail: "vuquocanh12052007@gmail.com",
      socials: [],
      resumeUrl: null,
    });
  });
});

describe("getStudioStats", () => {
  it("derives the counters from the database", async () => {
    repo.countPublished.mockResolvedValue({ projects: 4, films: 9 });

    expect(await service.getStudioStats()).toEqual([
      { value: "4", label: "Projects" },
      { value: "9", label: "Films & Cuts" },
      { value: "6", suffix: "+", label: "AI Tools" },
      { value: "1", label: "Person" },
    ]);
  });

  it("does not claim '+' on an exact count", async () => {
    repo.countPublished.mockResolvedValue({ projects: 0, films: 0 });

    const stats = await service.getStudioStats();

    expect(stats[0]).toEqual({ value: "0", label: "Projects" });
    expect(stats[0].suffix).toBeUndefined();
  });
});

describe("getProjectSlugs", () => {
  it("passes the repository rows straight through", async () => {
    const rows = [{ slug: "ember-line", updatedAt: new Date(0) }];
    repo.findPublishedProjectSlugs.mockResolvedValue(rows);

    expect(await service.getProjectSlugs()).toBe(rows);
  });
});
