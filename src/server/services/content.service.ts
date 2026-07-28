import "server-only";

import * as repo from "../repositories/content.repo";
import { gallerySection, type GallerySection } from "../db/schema";

export type { GallerySection };

/**
 * Business layer. Turns database rows into the shapes the UI actually renders,
 * so components never learn the schema and never deal with translation joins.
 */

export type Media = {
  url: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  alt: string;
  caption: string | null;
};

export type Film = {
  slug: string;
  title: string;
  description: string | null;
  provider: "SELF" | "YOUTUBE" | "VIMEO" | "MUX";
  /** For SELF this is a path under /public; otherwise a provider video id. */
  source: string;
  poster: Media | null;
  durationSeconds: number | null;
  orientation: "LANDSCAPE" | "VERTICAL";
  width: number | null;
  height: number | null;
  featured: boolean;
  projectSlug: string | null;
  projectTitle: string | null;
};

export type ProjectSummary = {
  slug: string;
  title: string;
  tagline: string | null;
  summary: string;
  year: number | null;
  accentColor: string;
  cover: Media | null;
  tags: string[];
};

/**
 * A gallery image and the role it plays: key art, a frame from the film, or a
 * design document. The pages lay each section out differently, so the grouping
 * travels with the image rather than being re-guessed in the UI.
 */
export type GalleryImage = Media & { section: GallerySection };

export type ProjectDetail = ProjectSummary & {
  body: string | null;
  films: Film[];
  gallery: GalleryImage[];
};

export type GalleryEntry = GalleryImage & {
  projectSlug: string | null;
  projectTitle: string | null;
};

const FALLBACK_ACCENT = "#c1121f";

/* ---------------------------------------------------------------- mappers */

type AssetRow = {
  url: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  translations: { altText: string; caption: string | null }[];
} | null;

function toMedia(asset: AssetRow): Media | null {
  if (!asset) return null;
  const t = asset.translations[0];
  return {
    url: asset.url,
    width: asset.width,
    height: asset.height,
    blurDataUrl: asset.blurDataUrl,
    alt: t?.altText ?? "",
    caption: t?.caption ?? null,
  };
}

/* ---------------------------------------------------------------- reads */

export async function getProjects(): Promise<ProjectSummary[]> {
  const rows = await repo.findPublishedProjects();

  return rows.map((row) => {
    const t = row.translations[0];
    return {
      slug: row.slug,
      title: t?.title ?? row.slug,
      tagline: t?.tagline ?? null,
      summary: t?.summary ?? "",
      year: row.year,
      accentColor: row.accentColor ?? FALLBACK_ACCENT,
      cover: toMedia(row.cover),
      tags: row.projectTags
        .map((pt) => pt.tag.translations[0]?.label)
        .filter((label): label is string => Boolean(label)),
    };
  });
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  const row = await repo.findProjectBySlug(slug);
  if (!row) return null;

  const t = row.translations[0];

  return {
    slug: row.slug,
    title: t?.title ?? row.slug,
    tagline: t?.tagline ?? null,
    summary: t?.summary ?? "",
    body: t?.body ?? null,
    year: row.year,
    accentColor: row.accentColor ?? FALLBACK_ACCENT,
    cover: toMedia(row.cover),
    tags: row.projectTags
      .map((pt) => pt.tag.translations[0]?.label)
      .filter((label): label is string => Boolean(label)),
    films: row.films.map((f) => ({
      slug: f.slug,
      title: f.translations[0]?.title ?? f.slug,
      description: f.translations[0]?.description ?? null,
      provider: f.provider,
      source: f.providerVideoId,
      poster: toMedia(f.poster),
      durationSeconds: f.durationSeconds,
      orientation: f.orientation,
      width: f.width,
      height: f.height,
      featured: f.featured,
      projectSlug: row.slug,
      projectTitle: t?.title ?? null,
    })),
    gallery: row.galleryItems
      .map((g) => {
        const media = toMedia(g.asset);
        return media && { ...media, section: gallerySection(g.sortOrder) };
      })
      .filter((m): m is GalleryImage => Boolean(m)),
  };
}

export async function getProjectSlugs() {
  return repo.findPublishedProjectSlugs();
}

export async function getFilms(): Promise<Film[]> {
  const rows = await repo.findPublishedFilms();

  return rows.map((f) => ({
    slug: f.slug,
    title: f.translations[0]?.title ?? f.slug,
    description: f.translations[0]?.description ?? null,
    provider: f.provider,
    source: f.providerVideoId,
    poster: toMedia(f.poster),
    durationSeconds: f.durationSeconds,
    orientation: f.orientation,
    width: f.width,
    height: f.height,
    featured: f.featured,
    projectSlug: f.project?.slug ?? null,
    projectTitle: f.project?.translations[0]?.title ?? null,
  }));
}

export async function getGallery(): Promise<GalleryEntry[]> {
  const rows = await repo.findGalleryItems();

  return rows
    .map((g) => {
      const media = toMedia(g.asset);
      if (!media) return null;
      return {
        ...media,
        section: gallerySection(g.sortOrder),
        projectSlug: g.project?.slug ?? null,
        projectTitle: g.project?.translations[0]?.title ?? null,
      };
    })
    .filter((g): g is GalleryEntry => g !== null);
}

export async function getSiteSettings() {
  const row = await repo.findSiteSettings();
  return {
    contactEmail: row?.contactEmail ?? "vuquocanh12052007@gmail.com",
    socials: row?.socials ?? [],
    resumeUrl: row?.resumeUrl ?? null,
  };
}

export type Stat = { value: string; suffix?: string; label: string };

/**
 * Home-page counters. Projects and films are counted from the database rather
 * than stored, so they cannot drift out of date the way hardcoded numbers do.
 * `suffix` is explicit — an exact count should not claim to be "3+", and a
 * count of one should not read "1 Projects".
 */
export async function getStudioStats(): Promise<Stat[]> {
  const { projects, films } = await repo.countPublished();
  return [
    { value: String(projects), label: projects === 1 ? "Project" : "Projects" },
    { value: String(films), label: films === 1 ? "Film" : "Films & Cuts" },
    { value: "6", suffix: "+", label: "AI Tools" },
    { value: "1", label: "Person" },
  ];
}
