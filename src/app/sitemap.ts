import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/server/services/content.service";
import { getPromptEntries } from "@/server/services/prompts.service";
import { SITE_URL } from "@/lib/site-metadata";

/** Static export writes this once at build time as `out/sitemap.xml`. */
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/work",
    "/films",
    "/gallery",
    "/lab",
    "/about",
    "/contact",
  ];

  const [projects, prompts] = await Promise.all([
    getProjectSlugs(),
    getPromptEntries(),
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...projects.map(({ slug, updatedAt }) => ({
      url: `${SITE_URL}/work/${slug}`,
      lastModified: updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    // The entry date is the day the prompt was written or run, which is also
    // the last day its text meant anything different.
    ...prompts.map(({ slug, date }) => ({
      url: `${SITE_URL}/lab/${slug}`,
      lastModified: new Date(`${date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
