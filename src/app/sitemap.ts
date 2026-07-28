import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/server/services/content.service";
import { SITE_URL } from "@/lib/site-metadata";

/** Static export writes this once at build time as `out/sitemap.xml`. */
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/work", "/films", "/gallery", "/about", "/contact"];

  const projects = await getProjectSlugs();

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
  ];
}
