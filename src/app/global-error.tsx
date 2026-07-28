"use client";

import "./globals.css";

/**
 * Last resort: this replaces the root layout when the root layout itself (or
 * anything above the site error boundary) throws, so it has to supply its own
 * <html> and <body>.
 *
 * Two consequences of replacing the root layout, both handled below:
 *
 * 1. `next/font` never runs, so `--font-fraunces` / `--font-inter` /
 *    `--font-space-mono` are undefined. globals.css builds its stacks as
 *    `var(--font-inter), system-ui, sans-serif`, and an undefined variable with
 *    no fallback invalidates the whole declaration rather than falling through
 *    to `system-ui`. Defining the three variables here as their generic
 *    fallbacks keeps the type sane without a font download on a broken page.
 * 2. `metadata` cannot be exported from a Client Component, so the title is set
 *    with React's <title>.
 */
const FONT_FALLBACKS = {
  "--font-fraunces": "Georgia, serif",
  "--font-inter": "system-ui, sans-serif",
  "--font-space-mono": "ui-monospace, monospace",
} as React.CSSProperties;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en" className="h-full" style={FONT_FALLBACKS}>
      <body className="flex min-h-full flex-col">
        <title>Something went wrong — Unhuman Stud</title>

        <main className="mx-auto flex max-w-site flex-1 flex-col justify-center px-6 py-24 sm:px-8">
          <div className="max-w-[640px]">
            <span className="klabel">500 — Print destroyed</span>

            <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
              The whole reel <em className="italic text-crimson-br">burned</em>.
            </h1>

            <p className="mt-4 max-w-[56ch] text-[16px] text-bone-dim">
              Unhuman Stud failed to load. This one is on the studio, not on
              you — reloading usually brings it back.
            </p>

            {error.digest && (
              <p className="mono mt-5 text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                Reference {error.digest}
              </p>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
              >
                Try again
              </button>
              {/*
                A plain anchor, not next/link: the app shell is what failed, so
                a full document load is more likely to recover than a
                client-side navigation through the same broken tree. The lint
                rule assumes a healthy router, which is exactly what this page
                cannot assume.
              */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="rounded-full border border-line-2 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:border-ember hover:text-ember"
              >
                Back to the start
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
