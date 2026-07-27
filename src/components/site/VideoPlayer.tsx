"use client";

import { useState } from "react";
import Image from "next/image";
import type { Film } from "@/server/services/content.service";
import { cn, formatDuration } from "@/lib/utils";

/**
 * Facade video player.
 *
 * Renders an optimised poster image and a play button. The actual <video>
 * element (or provider iframe) is only mounted on click, so a page with five
 * films costs five images on load instead of five video streams. The browser
 * downloads nothing from /videos until the visitor asks for it.
 */
export function VideoPlayer({
  film,
  className,
  priority = false,
}: {
  film: Film;
  className?: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(false);
  const duration = formatDuration(film.durationSeconds);

  const aspect =
    film.width && film.height ? `${film.width} / ${film.height}` : "16 / 9";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-black",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {active ? (
        film.provider === "SELF" ? (
          <video
            className="absolute inset-0 h-full w-full"
            src={film.source}
            poster={film.poster?.url}
            controls
            autoPlay
            playsInline
            aria-label={film.title}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={embedUrl(film)}
            title={film.title}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play ${film.title}`}
        >
          {film.poster && (
            <Image
              src={film.poster.url}
              alt={film.poster.alt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
              placeholder={film.poster.blurDataUrl ? "blur" : "empty"}
              blurDataURL={film.poster.blurDataUrl ?? undefined}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.03]"
            />
          )}

          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          />

          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-2 bg-black/45 backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:border-crimson group-hover:bg-crimson/25"
          >
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-bone">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>

          {duration && (
            <span className="mono absolute bottom-3 right-3 rounded-full border border-line-2 bg-black/60 px-2.5 py-1 text-[11px] text-bone-dim">
              {duration}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function embedUrl(film: Film) {
  switch (film.provider) {
    case "YOUTUBE":
      // nocookie host keeps the CSP tighter and avoids tracking before consent.
      return `https://www.youtube-nocookie.com/embed/${film.source}?autoplay=1`;
    case "VIMEO":
      return `https://player.vimeo.com/video/${film.source}?autoplay=1`;
    case "MUX":
      return `https://stream.mux.com/${film.source}`;
    default:
      return film.source;
  }
}
