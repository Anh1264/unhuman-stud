import { NotFoundView } from "@/components/site/NotFoundView";

/**
 * Catches `notFound()` thrown anywhere inside the site group — most often an
 * unknown `/work/[slug]`. The header, footer and skip link come from the group
 * layout, so only the body is needed here.
 */
export default function SiteNotFound() {
  return <NotFoundView />;
}
