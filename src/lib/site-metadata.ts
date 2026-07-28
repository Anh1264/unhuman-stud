import type { Metadata } from "next";

/**
 * One place for the values every route's metadata needs.
 *
 * Next merges metadata between segments *shallowly*: a page that defines
 * `openGraph` replaces the root layout's `openGraph` wholesale rather than
 * extending it. So each page has to spell out the full card, and this builder
 * keeps that from turning into six copies of the same object.
 */

/**
 * Where the site actually lives. Change this one line if the studio moves to a
 * custom domain — no environment variable, no dashboard, no redeploy settings.
 * Include the scheme and no trailing slash: `https://example.com`.
 */
const PRODUCTION_SITE_URL = "https://unhuman-stud.vercel.app";

/**
 * Absolute origin used for canonical links, og:url, `sitemap.xml` and
 * `robots.txt`. It has to be absolute — crawlers and social-card scrapers
 * resolve nothing relative.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL`, if set — the escape hatch for preview builds or
 *      a new domain you want to test before editing the constant above.
 *   2. `http://localhost:3000` while running `npm run dev`, so local pages
 *      never advertise the production URL.
 *   3. `PRODUCTION_SITE_URL` for every real build.
 *
 * Both `process.env` reads are inlined by the compiler at build time, so this
 * is a constant in the shipped output rather than a runtime lookup.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : PRODUCTION_SITE_URL)
).replace(/\/+$/, "");

export const SITE_NAME = "Unhuman Stud";

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * Default share card. Alt text is copied from `src/content/media-manifest.json`
 * so the description a crawler sees matches the one a screen reader gets.
 */
export const DEFAULT_OG_IMAGE: OgImage = {
  url: "/images/nu-first-frame.webp",
  width: 2944,
  height: 1648,
  alt: "Opening frame of the film: the blue horned monster hugs an enormous snowball on a green ridge between snowy peaks, a tiny figure standing on the grass below and a distant city skyline to the right.",
};

type PageMetadataInput = {
  /** Page title. Gets the "— Unhuman Stud" suffix unless `exactTitle` is set. */
  title: string;
  description: string;
  /** Route path, used for the canonical URL and og:url. Starts with "/". */
  path: string;
  image?: OgImage;
  /** Skip the title template — used by the home page, which is the brand. */
  exactTitle?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  exactTitle = false,
}: PageMetadataInput): Metadata {
  const socialTitle = exactTitle ? title : `${title} — ${SITE_NAME}`;

  return {
    title: exactTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
  };
}
