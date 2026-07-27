import "server-only";

import { db } from "../db/client";
import { inquiries } from "../db/schema";

/**
 * Data access only — validation and normalisation happen in the service above.
 * This is the single place the contact form touches the database.
 */

export type NewInquiry = {
  name: string;
  email: string;
  message: string;
  scope: string | null;
  timelineNote: string | null;
  referenceLinks: string | null;
};

export async function insertInquiry(values: NewInquiry) {
  const [row] = await db
    .insert(inquiries)
    .values(values)
    .returning({ id: inquiries.id });

  return row ?? null;
}
