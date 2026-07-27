"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * Error boundary for the site group. It wraps the pages but not the group
 * layout, so the header and footer survive an error and the visitor keeps a
 * way out.
 *
 * Next 16.2 passes `unstable_retry`, which re-fetches and re-renders the
 * segment. The older `reset` only clears the boundary without re-fetching,
 * which would usually just fail again on a server error — so retry is the
 * recovery this button offers.
 */
export default function SiteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Errors forwarded from Server Components carry only a digest in
    // production; the console keeps it matchable against the server logs.
    console.error(error);
  }, [error]);

  useEffect(() => {
    // The page content was replaced without a navigation, so nothing moved
    // focus. Send it to the heading: a screen reader announces what happened
    // and the next Tab lands on the retry button.
    headingRef.current?.focus();
  }, []);

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-24 sm:px-8">
      <div className="max-w-[640px]">
        <span className="klabel">500 — Bad take</span>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 text-[clamp(32px,5vw,52px)]"
        >
          The reel <em className="italic text-crimson-br">jammed</em>.
        </h1>

        <p className="mt-4 max-w-[56ch] text-[16px] text-bone-dim">
          Something went wrong while this page was rendering. It is usually
          momentary — running the take again is the quickest fix.
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
          <Link
            href="/"
            className="rounded-full border border-line-2 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:border-ember hover:text-ember"
          >
            Back to the start
          </Link>
        </div>
      </div>
    </section>
  );
}
