import Link from "next/link";

/**
 * The branded 404 body, shared by the two not-found boundaries:
 *
 * - `src/app/(site)/not-found.tsx` catches `notFound()` thrown inside the site
 *   group (e.g. an unknown `/work/[slug]`) and inherits the header and footer
 *   from the group layout.
 * - `src/app/not-found.tsx` catches URLs that match no route at all. That file
 *   renders under the root layout only, so it brings its own chrome.
 *
 * Keeping the body here means both routes read identically.
 */
export function NotFoundView() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-24 sm:px-8">
      <div className="max-w-[640px]">
        <span className="klabel">404 — Off frame</span>

        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          This shot doesn&rsquo;t{" "}
          <em className="italic text-crimson-br">exist</em>.
        </h1>

        <p className="mt-4 max-w-[56ch] text-[16px] text-bone-dim">
          The page you asked for was never cut into the film — or the link that
          sent you here points at a frame that has since been trimmed.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
          >
            Back to the start
          </Link>
          <Link
            href="/work"
            className="rounded-full border border-line-2 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:border-ember hover:text-ember"
          >
            See the work
          </Link>
        </div>
      </div>
    </section>
  );
}
