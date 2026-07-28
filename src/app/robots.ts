import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-metadata";

/** Static export writes this once at build time as `out/robots.txt`. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
