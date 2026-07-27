"use server";

import {
  INQUIRY_FIELDS,
  emptyContactValues,
  type ContactFormState,
  type ContactFormValues,
} from "@/lib/contact-form";
import { submitInquiry } from "@/server/services/inquiries.service";

/**
 * Thin adapter: FormData in, `ContactFormState` out. All validation and
 * persistence happen in the service and repository below it.
 * Used with `useActionState`, so the first argument is the previous state.
 */
export async function submitContactForm(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = Object.fromEntries(
    INQUIRY_FIELDS.map((field) => [
      field,
      String(formData.get(field) ?? "").trim(),
    ]),
  ) as ContactFormValues;

  try {
    const result = await submitInquiry(values);

    if (!result.ok) {
      return {
        status: "error",
        message:
          result.formError ??
          "A couple of fields need another look before this can be sent.",
        fieldErrors: result.fieldErrors,
        values,
        submissionId: null,
      };
    }

    return {
      status: "success",
      message:
        "Thank you — your brief has landed. Expect a reply within 24–48 hours.",
      fieldErrors: {},
      values: emptyContactValues(),
      submissionId: result.id,
    };
  } catch (error) {
    console.error("[contact] failed to store inquiry", error);

    return {
      status: "error",
      message:
        "Something went wrong on my end and the message wasn't saved. Please try again, or email me directly.",
      fieldErrors: {},
      values,
      submissionId: null,
    };
  }
}
