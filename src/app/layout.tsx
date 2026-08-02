import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site-metadata";
import "./globals.css";

/**
 * Fonts are self-hosted by next/font — no request to Google at runtime, no
 * layout shift, and no third-party origin to allow through the CSP later.
 * The Vietnamese subset is loaded now so bilingual content needs no font work.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "vietnamese"],
  axes: ["opsz"],
  // The brand leans on real italic emphasis; without this the browser would
  // slant the upright face instead of using the drawn italic.
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const DESCRIPTION =
  "Unhuman Stud is the studio of Aiden Vu — cinematic AI films, creature design, and campaign visuals. Written, directed and edited by one person.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Aiden Vu`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Aiden Vu" }],
  creator: "Aiden Vu",
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: `${SITE_NAME} — Aiden Vu`,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Aiden Vu`,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0708",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Next 16 no longer overrides scroll-behavior during navigation unless
      // this attribute is present. Without it, smooth scrolling makes route
      // changes visibly glide to the top instead of jumping.
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} h-full`}
    >
      <head>
        {/*
          Reveal-on-scroll starts at opacity 0 and is un-hidden by an
          IntersectionObserver. Without JavaScript that observer never runs and
          the page would render blank, so force everything visible instead.

          `.js-only` is the opposite case: controls that can only work with
          scripts — the prompt lab's filter bar and its copy buttons. Every one
          of them is an extra way to reach content that is already on the page,
          so hiding them is a loss of convenience, never of information.
        */}
        <noscript>
          <style>
            {`.reveal{opacity:1 !important;transform:none !important}.js-only{display:none !important}`}
          </style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
