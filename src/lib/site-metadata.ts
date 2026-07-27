import type { Metadata } from "next";

/**
 * One place for the values every route's metadata needs.
 *
 * Next merges metadata between segments *shallowly*: a page that defines
 * `openGraph` replaces the root layout's `openGraph` wholesale rather than
 * extending it. So each page has to spell out the full card, and this builder
 * keeps that from turning into six copies of the same object.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  url: "/images/nu-willump.jpg",
  width: 2560,
  height: 1433,
  alt: "A colossal horned snow creature with white and indigo fur stands on a green ridge between snowbanks, a modern city skyline rising in the haze behind it.",
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
