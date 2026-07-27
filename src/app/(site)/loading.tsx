import { RouteLoading } from "@/components/site/RouteLoading";

/**
 * Covers the home page, which awaits projects, films and stats. It also acts as
 * the fallback for any child segment without its own loading file.
 */
export default function Loading() {
  return <RouteLoading />;
}
