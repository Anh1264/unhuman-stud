"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";

/**
 * Copy-to-clipboard control for the prompt library — the point of the whole
 * board being that a proven prompt, or one proven part of it, can be lifted
 * whole into the next attempt.
 *
 * It is a real `<button>`, so it is keyboard-operable for free. Feedback goes
 * out twice: the visible label swaps for a moment, and a polite live region
 * announces the same thing for anyone who cannot see the swap.
 *
 * `.js-only` hides it when scripts are off — the clipboard API is the only way
 * this can work, and a button that silently does nothing is worse than no
 * button at all. The text it copies is on the page either way, selectable.
 */
export function CopyButton({
  text,
  subject,
  className,
}: {
  /** The exact text to place on the clipboard. */
  text: string;
  /** What is being copied, for the accessible name: "the full prompt". */
  subject: string;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // Say so rather than showing a success the user did not get.
      setState("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  const label =
    state === "copied"
      ? "Copied ✓"
      : state === "error"
        ? "Copy failed"
        : "Copy";

  return (
    <span className={cn("js-only inline-flex items-center", className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${subject}`}
        className={cn(
          "mono cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
          state === "copied"
            ? "border-gold text-gold"
            : state === "error"
              ? "border-crimson text-crimson-br"
              : "border-line-2 text-bone-faint hover:border-ember hover:text-ember",
        )}
      >
        {label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? `Copied ${subject} to the clipboard.`
          : state === "error"
            ? `Could not copy ${subject}. Select the text and copy it by hand.`
            : ""}
      </span>
    </span>
  );
}
