import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        First focusable element on every page: a keyboard user can jump the
        fixed header and its nav in one Tab. Hidden until focused.
      */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      {/* tabIndex -1 lets the skip link move focus here, not just the scroll. */}
      <main id="main-content" tabIndex={-1} className="flex-1 pt-[74px]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
