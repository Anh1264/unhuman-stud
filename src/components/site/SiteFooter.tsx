import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line py-10">
      <div className="mono mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 text-[12px] tracking-wider text-bone-faint sm:px-8">
        <span>© {new Date().getFullYear()} Unhuman Stud · Aiden Vu</span>
        <div className="flex items-center gap-5">
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link href="/work" className="hover:text-ember">
              Work
            </Link>
            <Link href="/contact" className="hover:text-ember">
              Contact
            </Link>
          </nav>
          <span className="hidden sm:inline">Solo studio · Directed by one</span>
        </div>
      </div>
    </footer>
  );
}
