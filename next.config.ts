import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site ships as a fully static export: `next build` prerenders every
  // route into `out/`, reading content from the local PGlite database at build
  // time. Nothing needs a database (or a Node server) in production.
  //
  // The trade-off, per the static-export guide, is that server-only features
  // are unavailable — Server Actions, rewrites/redirects, and the `headers()`
  // config below among them. Those response headers are therefore declared in
  // `vercel.json` instead, which the static host applies at the edge.
  output: "export",

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
};

export default nextConfig;
