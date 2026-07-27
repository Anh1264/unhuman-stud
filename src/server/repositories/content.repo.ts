import "server-only";

import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  DEFAULT_LOCALE,
  films,
  filmTranslations,
  galleryItems,
  projects,
  projectTranslations,
  siteSettings,
} from "../db/schema";

/**
 * Data access only — no business rules, no authorization, no formatting.
 * Everything above this layer talks to services, and services talk to here.
 * Swapping PGlite for hosted Postgres touches nothing outside db/client.ts.
 */

const locale = DEFAULT_LOCALE;

/** Relational shape shared by every project read. */
const projectWith = {
  translations: {
    where: eq(projectTranslations.locale, locale),
  },
  cover: {
    with: { translations: true },
  },
  projectTags: {
    with: { tag: { with: { translations: true } } },
  },
} as const;

export async function findPublishedProjects() {
  return db.query.projects.findMany({
    where: eq(projects.status, "PUBLISHED"),
    orderBy: [asc(projects.sortOrder)],
    with: projectWith,
  });
}

export async function findProjectBySlug(slug: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.status, "PUBLISHED")),
    with: {
      ...projectWith,
      films: {
        where: eq(films.status, "PUBLISHED"),
        orderBy: [asc(films.sortOrder)],
        with: {
          translations: { where: eq(filmTranslations.locale, locale) },
          poster: { with: { translations: true } },
        },
      },
      galleryItems: {
        where: eq(galleryItems.status, "PUBLISHED"),
        orderBy: [asc(galleryItems.sortOrder)],
        with: { asset: { with: { translations: true } } },
      },
    },
  });
}

export async function findPublishedProjectSlugs() {
  return db
    .select({ slug: projects.slug, updatedAt: projects.updatedAt })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"));
}

export async function findPublishedFilms() {
  return db.query.films.findMany({
    where: eq(films.status, "PUBLISHED"),
    orderBy: [asc(films.sortOrder)],
    with: {
      translations: { where: eq(filmTranslations.locale, locale) },
      poster: { with: { translations: true } },
      project: { with: { translations: { where: eq(projectTranslations.locale, locale) } } },
    },
  });
}

export async function findGalleryItems() {
  return db.query.galleryItems.findMany({
    where: eq(galleryItems.status, "PUBLISHED"),
    orderBy: [asc(galleryItems.sortOrder)],
    with: {
      asset: { with: { translations: true } },
      project: { with: { translations: { where: eq(projectTranslations.locale, locale) } } },
    },
  });
}

export async function findSiteSettings() {
  return db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, "singleton"),
  });
}

/**
 * Counts for the home page. Derived rather than stored, so the numbers can
 * never drift away from the actual content the way hardcoded ones do.
 */
export async function countPublished() {
  const [projectRow] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"));

  const [filmRow] = await db
    .select({ value: count() })
    .from(films)
    .where(eq(films.status, "PUBLISHED"));

  return { projects: projectRow?.value ?? 0, films: filmRow?.value ?? 0 };
}
