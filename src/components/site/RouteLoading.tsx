/**
 * The Suspense fallback shared by every `loading.tsx` in the site.
 *
 * Deliberately almost nothing: a Space Mono label and one crimson dot. A busy
 * spinner would fight the dark editorial register, and these routes resolve
 * fast enough that a skeleton would flash more than it would reassure.
 *
 * `role="status"` makes it a polite live region, so a screen reader announces
 * the label without stealing focus from wherever the user already is. The dot's
 * pulse is a plain Tailwind animation, so the global prefers-reduced-motion
 * rule in globals.css already resolves it to a still dot.
 */
export function RouteLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-16 sm:px-8">
      <p role="status" className="klabel flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson"
        />
        {label}
      </p>
    </div>
  );
}
