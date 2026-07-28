"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Media } from "@/server/services/content.service";
import { cn } from "@/lib/utils";

/**
 * Masonry gallery with an accessible lightbox.
 *
 * Keyboard: Escape closes, ArrowLeft/ArrowRight move between images, and focus
 * returns to the thumbnail that opened the dialog.
 *
 * `captions` decides where the label sits. Frames are pictures and hide it
 * until hover; design sheets are documents, and a document keeps its label
 * visible — which is also the only way a touch device ever sees it.
 *
 * `sizes` defaults to the three-column masonry the grid is usually laid out
 * in. A caller that gives the images more room (a one- or two-up layout) has
 * to say so, or the browser picks a source too small and renders it soft.
 */
export function GalleryGrid({
  items,
  className,
  columnsClass = "sm:columns-2 lg:columns-3",
  captions = "hover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  items: (Media & { projectTitle?: string | null })[];
  className?: string;
  columnsClass?: string;
  captions?: "hover" | "below";
  sizes?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggersRef = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpenIndex((current) => {
      if (current !== null) triggersRef.current[current]?.focus();
      return null;
    });
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + items.length) % items.length,
      );
    },
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : items[openIndex];

  return (
    <>
      <div className={cn("gap-4", columnsClass, className)}>
        {items.map((item, i) => (
          <button
            key={`${item.url}-${i}`}
            ref={(el) => {
              triggersRef.current[i] = el;
            }}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative mb-4 block w-full cursor-pointer overflow-hidden rounded-lg border border-line bg-panel break-inside-avoid"
            aria-label={`Enlarge: ${item.alt}`}
          >
            {/* Its own clipping box, so the hover zoom cannot spill over a
                caption sitting underneath it. */}
            <span className="block overflow-hidden">
              <Image
                src={item.url}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes={sizes}
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl ?? undefined}
                className="w-full transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.04]"
              />
            </span>
            {item.caption &&
              (captions === "below" ? (
                <span className="mono block border-t border-line px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-bone-faint">
                  {item.caption}
                </span>
              ) : (
                <span className="mono pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3.5 text-left text-[11px] text-bone-dim opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.caption}
                </span>
              ))}
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/94 p-6 backdrop-blur-md sm:p-10"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="mono absolute right-5 top-5 z-10 cursor-pointer rounded-full border border-line-2 px-3 py-1.5 text-sm text-bone hover:border-ember hover:text-ember"
          >
            Close ✕
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-line-2 bg-black/50 px-3.5 py-2.5 text-bone hover:border-ember hover:text-ember sm:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-line-2 bg-black/50 px-3.5 py-2.5 text-bone hover:border-ember hover:text-ember sm:right-6"
              >
                ›
              </button>
            </>
          )}

          <figure className="max-h-full w-full max-w-6xl">
            <Image
              src={active.url}
              alt={active.alt}
              width={active.width}
              height={active.height}
              sizes="92vw"
              placeholder={active.blurDataUrl ? "blur" : "empty"}
              blurDataURL={active.blurDataUrl ?? undefined}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            {(active.caption || active.projectTitle) && (
              <figcaption className="mono mt-4 text-center text-[11px] tracking-wider text-bone-faint">
                {active.caption ?? active.projectTitle}
                {items.length > 1 && (
                  <span className="ml-3 opacity-60">
                    {(openIndex ?? 0) + 1} / {items.length}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
