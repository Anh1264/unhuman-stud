"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/app/(site)/contact/actions";
import {
  initialContactState,
  type ContactFormState,
  type InquiryField,
} from "@/lib/contact-form";
import { cn } from "@/lib/utils";

/**
 * Contact form wired to a Server Action. `useActionState` gives pending and
 * error state when JavaScript is available; without it the form still posts to
 * the same action and the server re-renders this component with the result.
 */

const controlClass =
  "mt-2 w-full rounded-lg border bg-bg-2 px-4 py-3 text-[15px] font-light text-bone " +
  "placeholder:text-bone-faint transition-colors duration-200 hover:border-line-2";

type FieldProps = {
  name: InquiryField;
  label: string;
  state: ContactFormState;
  required?: boolean;
  type?: "text" | "email";
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
};

function Field({
  name,
  label,
  state,
  required = false,
  type = "text",
  autoComplete,
  placeholder,
  hint,
  rows,
  className,
}: FieldProps) {
  const id = `contact-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = `${id}-error`;
  const error = state.fieldErrors[name]?.[0];

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  const shared = {
    id,
    name,
    required,
    defaultValue: state.values[name],
    placeholder,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    className: cn(
      controlClass,
      error
        ? "border-crimson focus-visible:border-crimson-br"
        : "border-line focus-visible:border-ember",
    ),
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="klabel block">
        {label}
        {required ? (
          <span className="text-crimson-br" aria-hidden="true">
            {" *"}
          </span>
        ) : (
          <span className="text-bone-faint"> (optional)</span>
        )}
      </label>

      {rows ? (
        <textarea {...shared} rows={rows} autoComplete={autoComplete} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} />
      )}

      {hint ? (
        <p id={hintId} className="mt-2 text-[13px] text-bone-faint">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          className="mono mt-2 text-[11.5px] tracking-[0.06em] text-crimson-br"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialContactState,
  );

  return (
    <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
      <span className="klabel">Project brief</span>
      <h2 className="mt-3 text-[clamp(22px,3.2vw,32px)]">
        Tell me the <em className="italic text-crimson-br">shape</em> of it.
      </h2>
      <p className="mt-3 max-w-[56ch] text-[15px] text-bone-dim">
        Scope, timeline and a few references are enough to start. Everything
        here is stored privately and only ever read by me.
      </p>

      <div role="status" aria-live="polite">
        {state.status !== "idle" && state.message ? (
          <p
            className={cn(
              "mt-6 rounded-lg border px-4 py-3 text-[14.5px]",
              state.status === "success"
                ? "border-gold/40 bg-panel-2 text-gold"
                : "border-crimson bg-panel-2 text-crimson-br",
            )}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      {/* Remounting on a new submission id clears the inputs after a success. */}
      <form
        key={state.submissionId ?? "contact-form"}
        action={formAction}
        className="mt-7 grid gap-5 sm:grid-cols-2"
      >
        <Field name="name" label="Name" state={state} required autoComplete="name" placeholder="Your name" />
        <Field
          name="email"
          label="Email"
          state={state}
          required
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
        />
        <Field
          name="scope"
          label="Scope"
          state={state}
          placeholder="Short film, brand campaign, key art…"
        />
        <Field
          name="timelineNote"
          label="Timeline"
          state={state}
          placeholder="Delivery window or key dates"
        />
        <Field
          name="referenceLinks"
          label="References"
          state={state}
          className="sm:col-span-2"
          placeholder="Links to moodboards, films or decks"
        />
        <Field
          name="message"
          label="Message"
          state={state}
          required
          rows={6}
          className="sm:col-span-2"
          hint="Twenty characters or more — the world, the mood, the constraints."
          placeholder="What are we building?"
        />

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send brief →"}
          </button>
          <span className="mono text-[11px] uppercase tracking-[0.2em] text-bone-faint">
            Reply in 24–48h
          </span>
        </div>
      </form>
    </div>
  );
}
