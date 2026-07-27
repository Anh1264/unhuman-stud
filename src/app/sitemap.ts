import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/server/services/content.service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
