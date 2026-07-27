"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/films", label: "Films" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "Creator" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-lg transition-colors duration-500",
        "bg-gradient-to-b from-bg/90 to-bg/40",
        scrolled ? "border-line" : "border-transparent",
      )}
    >
      <nav className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Unhuman Stud — home">
          <span className="serif grid h-[30px] w-[30px] place-items-center rounded-full bg-crimson text-[15px] font-semibold text-white">
            U
          </span>
          <span className="serif text-[19px]">
            <span className="font-semibold">Unhuman</span>{" "}
            <span className="text-bone-faint">Stud</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative py-1 text-[13px] font-medium transition-colors",
                isActive(item.href)
                  ? "text-bone"
                  : "text-bone-dim hover:text-bone",
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-crimson" />
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/contact"
          className="hidden rounded-full border border-line-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:border-ember hover:text-ember md:inline-block"
        >
          Contact
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex cursor-pointer flex-col gap-[5px] p-2 md:hidden"
        >
          <span className="block h-0.5 w-[22px] bg-bone" />
          <span className="block h-0.5 w-[22px] bg-bone" />
          <span className="block h-0.5 w-[22px] bg-bone" />
        </button>
      </nav>

      {open && (
        <div className="flex flex-col border-t border-line bg-bg-2 px-6 pb-6 md:hidden">
          {[...NAV, { href: "/contact", label: "Contact" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-line py-4 text-base text-bone-dim"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
