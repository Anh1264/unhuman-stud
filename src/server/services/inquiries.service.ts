import "server-only";

import { z } from "zod";
import * as repo from "../repositories/inquiries.repo";

/**
 * Business layer for the contact form: validation lives here, so the Server
 * Action stays a thin adapter between FormData and the domain, and the
 * repository only ever receives values that are already known to be good.
 */

export const inquirySchema = z.object({
  name: z
    .string()
    .min(2, "Please tell me your name.")
    .max(120, "That name is longer than 120 characters."),
  email: z
    .email("That email address doesn't look right.")
    .max(200, "That email address is longer than 200 characters."),
  scope: z.string().max(200, "Keep the scope under 200 characters."),
  timelineNote: z.string().max(200, "Keep the timeline under 200 characters."),
  referenceLinks: z
    .string()
    .max(1000, "Keep the references under 1000 characters."),
  message: z
    .string()
    .min(20, "A little more detail, please — at least 20 characters.")
    .max(5000, "Please keep the message under 5000 characters."),
});

export type InquiryInput = z.input<typeof inquirySchema>;

export type InquiryResult =
  | { ok: true; id: string }
  | {
      ok: false;
      fieldErrors: Partial<Record<keyof InquiryInput, string[]>>;
      formError?: string;
    };

/** Optional columns are stored as NULL rather than an empty string. */
function orNull(value: string) {
  return value.length > 0 ? value : null;
}

export async function submitInquiry(raw: unknown): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;

  const row = await repo.insertInquiry({
    name: data.name,
    email: data.email,
    message: data.message,
    scope: orNull(data.scope),
    timelineNote: orNull(data.timelineNote),
    referenceLinks: orNull(data.referenceLinks),
  });

  if (!row) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "The message could not be saved. Please try again.",
    };
  }

  return { ok: true, id: row.id };
}
