import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NotFoundView } from "@/components/site/NotFoundView";

/**
 * The root not-found boundary handles any URL that matches no route at all.
 *
 * Next renders it under the root layout only — the `(site)` group layout is not
 * in the tree for an unmatched URL — so the chrome is repeated here. Without
 * it a mistyped address would drop the visitor onto a page with no way back
 * into the site.
 */
export default function NotFound() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-[74px]">
        <NotFoundView />
      </main>
      <SiteFooter />
    </>
  );
}
