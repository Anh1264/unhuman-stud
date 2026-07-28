/**
 * Shared, framework-neutral shape of the contact form. Both the client
 * component and the Server Action import this, so neither has to reach across
 * the client/server boundary for a type or a default value.
 *
 * Currently unused: the site ships as a static export, which cannot run Server
 * Actions, so the contact page collects a brief by email instead. This file and
 * the inquiries service/repository below it are kept intact so the form can be
 * restored — see "Re-enabling the contact form" in README.md.
 */

export const INQUIRY_FIELDS = [
  "name",
  "email",
  "scope",
  "timelineNote",
  "referenceLinks",
  "message",
] as const;

export type InquiryField = (typeof INQUIRY_FIELDS)[number];

export type ContactFormValues = Record<InquiryField, string>;

export type ContactFormState = {
  status: "idle" | "success" | "error";
  /** Human-readable summary announced in the form's live region. */
  message: string;
  fieldErrors: Partial<Record<InquiryField, string[]>>;
  /** Echoed back so a failed submit does not wipe what was typed. */
  values: ContactFormValues;
  /** Id of the stored inquiry — also used to remount (clear) the form. */
  submissionId: string | null;
};

export function emptyContactValues(): ContactFormValues {
  return {
    name: "",
    email: "",
    scope: "",
    timelineNote: "",
    referenceLinks: "",
    message: "",
  };
}

export const initialContactState: ContactFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: emptyContactValues(),
  submissionId: null,
};
