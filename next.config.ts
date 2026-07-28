import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The NU / Ceasefire stills ship as *lossless* WebP, pixel-identical to the
    // masters. Routing them through the optimiser would re-encode them lossily
    // and throw that away, and `unoptimized` is the only config-level switch
    // that serves the source bytes untouched — `localPatterns` is an allowlist
    // that rejects non-matching paths rather than passing them through, and a
    // custom `loaderFile` would disable the optimiser wholesale anyway.
    //
    // Everything we ship is already pre-sized by `npm run media` (JPEGs capped
    // at 2560px), so the only thing given up is per-breakpoint srcset. Keep
    // width/height and `sizes` on every <Image> so layout is still reserved.
    unoptimized: true,
  },

  // PGlite ships a WASM build of Postgres that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        // Hashed media is immutable; let the CDN and browser keep it.
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
