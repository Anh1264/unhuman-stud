import { beforeEach, describe, expect, it, vi } from "vitest";

type DbModule = typeof import("@/server/db/client");

const returning = vi.fn();
const values = vi.fn(() => ({ returning }));
const insert = vi.fn(() => ({ values }));

vi.mock("@/server/db/client", () => ({
  // The real client opens PGlite against `.data/`; tests never do.
  db: { insert: (...args: unknown[]) => insert(...args) } as unknown as DbModule["db"],
}));

const repo = await import("@/server/repositories/inquiries.repo");
const { inquiries } = await import("@/server/db/schema");

const payload = {
  name: "Aiden Vu",
  email: "aiden@example.com",
  message: "A cinematic teaser for a product launch.",
  scope: null,
  timelineNote: null,
  referenceLinks: null,
};

beforeEach(() => {
  insert.mockClear();
  values.mockClear();
  returning.mockReset();
});

describe("insertInquiry", () => {
  it("inserts into the inquiries table and returns the new id", async () => {
    returning.mockResolvedValue([{ id: "inq_42" }]);

    const row = await repo.insertInquiry(payload);

    expect(row).toEqual({ id: "inq_42" });
    expect(insert).toHaveBeenCalledWith(inquiries);
    expect(values).toHaveBeenCalledWith(payload);
    expect(returning).toHaveBeenCalledWith({ id: inquiries.id });
  });

  it("returns null when the insert wrote no row", async () => {
    returning.mockResolvedValue([]);

    expect(await repo.insertInquiry(payload)).toBeNull();
  });

  it("returns only the first row if the driver hands back several", async () => {
    returning.mockResolvedValue([{ id: "first" }, { id: "second" }]);

    expect(await repo.insertInquiry(payload)).toEqual({ id: "first" });
  });

  it("lets a database error surface instead of swallowing it", async () => {
    returning.mockRejectedValue(new Error("unique violation"));

    await expect(repo.insertInquiry(payload)).rejects.toThrow("unique violation");
  });
});
